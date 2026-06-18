/**
 * lib/parsers/base.ts
 *
 * Abstract base class for all bank-specific PDF parsers.
 *
 * To add a new bank:
 *   1. Create lib/parsers/{bank}/extractor.ts
 *   2. Extend BaseParser
 *   3. Implement detect(), parseHeader(), parseTransactions()
 *   4. Register the class in lib/parsers/router.ts
 *
 * The processor and analytics engine never import bank-specific code.
 */

import type {
  ParsedHeader,
  RawTransaction,
  ParserConfig,
  SupportedBank,
} from "@/lib/parsers/types";

export abstract class BaseParser {
  protected readonly config: ParserConfig;

  constructor(config: ParserConfig = {}) {
    this.config = config;
  }

  /**
   * The bank this parser handles.
   * Used by the router to label results.
   */
  abstract readonly bank: SupportedBank;

  /**
   * Returns true if the given raw PDF text belongs to this bank.
   * Should be cheap — just look for a few high-confidence identifiers.
   * Must not throw.
   */
  abstract detect(text: string): boolean;

  /**
   * Extract statement-level header fields from raw PDF text.
   * Throws ParseError on unrecoverable failure.
   */
  abstract parseHeader(text: string): ParsedHeader;

  /**
   * Extract all transaction rows from raw PDF text.
   * Returns an empty array if no transactions are found — does not throw.
   */
  abstract parseTransactions(text: string): RawTransaction[];

  // ─── Shared utilities available to all subclasses ────────────────────────

  /**
   * Parse a date string in any of the common Indian statement formats
   * into ISO YYYY-MM-DD. Returns null if unparseable.
   *
   * Handles:
   *   DD/MM/YYYY   DD-MM-YYYY   DD MMM YYYY   DD MMM YY
   *   MMM DD, YYYY  MMM DD YYYY
   */
  protected parseDate(raw: string): string | null {
    if (!raw) return null;
    const s = raw.trim();

    const MONTHS: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04",
      may: "05", jun: "06", jul: "07", aug: "08",
      sep: "09", oct: "10", nov: "11", dec: "12",
    };

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // DD MMM YYYY or DD MMM YY (e.g. "15 Jan 2024" or "15 Jan 24")
    const dMonY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
    if (dMonY) {
      const [, d, mon, y] = dMonY;
      const m = MONTHS[mon.toLowerCase()];
      if (!m) return null;
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${m}-${d.padStart(2, "0")}`;
    }

    // MMM DD, YYYY or MMM DD YYYY (e.g. "Jan 15, 2024")
    const monDY = s.match(/^([A-Za-z]{3})\s+(\d{1,2})[,\s]+(\d{4})$/);
    if (monDY) {
      const [, mon, d, y] = monDY;
      const m = MONTHS[mon.toLowerCase()];
      if (!m) return null;
      return `${y}-${m}-${d.padStart(2, "0")}`;
    }

    return null;
  }

  /**
   * Parse a currency string as it appears in Indian bank statements.
   * Strips currency symbols, commas, and handles CR/DR suffixes.
   * Returns the absolute numeric value and whether it is a credit.
   */
  protected parseAmount(raw: string): { amount: number; isCredit: boolean } {
    if (!raw) return { amount: 0, isCredit: false };
    const s = raw.trim().toUpperCase();

    const isCrIndicator =
      s.endsWith("CR") ||
      s.endsWith("(CR)") ||
      s.includes("CREDIT") ||
      s.startsWith("+");

    const cleaned = s
      .replace(/₹|RS\.?|INR/gi, "")
      .replace(/CR$|\(CR\)$/i, "")
      .replace(/DR$|\(DR\)$/i, "")
      .replace(/[,\s+\-]/g, "")
      .trim();

    const amount = parseFloat(cleaned);
    return {
      amount: isNaN(amount) ? 0 : Math.abs(amount),
      isCredit: isCrIndicator,
    };
  }

  /**
   * Extract the statement month and year from a date string.
   * Uses the statement period end date (closing date) if available,
   * otherwise falls back to the first transaction date.
   */
  protected extractStatementPeriod(dateStr: string): {
    month: number;
    year: number;
  } | null {
    const iso = this.parseDate(dateStr);
    if (!iso) return null;
    const d = new Date(iso);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }

  protected log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[${this.bank}Parser] ${message}`, data ?? "");
    }
  }
}

/**
 * Thrown when a required field cannot be extracted from the PDF.
 * The processor catches this and marks the job as failed.
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = "ParseError";
  }
}
