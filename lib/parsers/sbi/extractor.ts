/**
 * lib/parsers/sbi/extractor.ts
 *
 * SBI Credit Card statement parser.
 *
 * Architecture is complete and production-ready.
 * Regex patterns in sbi/patterns.ts are structural stubs (NEEDS_SAMPLE_PDF).
 * Once verified against a real SBI statement, only patterns.ts changes.
 */

import { BaseParser, ParseError } from "@/lib/parsers/base";
import type {
  ParsedHeader,
  RawTransaction,
  ParserConfig,
} from "@/lib/parsers/types";
import {
  SBI_BANK_IDENTIFIER,
  SBI_STATEMENT_PERIOD,
  SBI_CLOSING_DATE,
  SBI_CARD_NUMBER,
  SBI_OPENING_BALANCE,
  SBI_CLOSING_BALANCE,
  SBI_MINIMUM_DUE,
  SBI_TOTAL_AMOUNT_DUE,
  SBI_PAYMENT_DUE_DATE,
  SBI_TRANSACTION_ROW_GLOBAL,
  SBI_TRANSACTION_SECTION_START,
  SBI_TRANSACTION_SECTION_END,
} from "@/lib/parsers/sbi/patterns";

export class SBIParser extends BaseParser {
  readonly bank = "SBI" as const;

  constructor(config: ParserConfig = {}) {
    super(config);
  }

  // ─── Detection ─────────────────────────────────────────────────────────────

  detect(text: string): boolean {
    return SBI_BANK_IDENTIFIER.test(text);
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  parseHeader(text: string): ParsedHeader {
  this.log("Parsing header");

  console.log("===== HEADER PREVIEW =====");
  console.log(text.substring(0, 3000));
  console.log("===== END HEADER PREVIEW =====");

  // existing code...

    // ── Statement period ───────────────────────────────────────────────────
    let statementMonth: number;
    let statementYear: number;

    const periodMatch = text.match(SBI_STATEMENT_PERIOD);
    const closingMatch = text.match(SBI_CLOSING_DATE);

    const dateString = periodMatch?.[1] ?? closingMatch?.[1] ?? null;

    if (dateString) {
      const period = this.extractStatementPeriod(dateString);
      if (period) {
        statementMonth = period.month;
        statementYear = period.year;
      } else {
        throw new ParseError(
          `Could not parse statement period from: "${dateString}"`,
          "statement_period"
        );
      }
    } else {
      throw new ParseError(
        "Statement period not found. Pattern: NEEDS_SAMPLE_PDF verification.",
        "statement_period"
      );
    }

    // ── Card last four ─────────────────────────────────────────────────────
    const cardMatch = text.match(SBI_CARD_NUMBER);
    const cardLastFour = cardMatch?.[1] ?? null;
    this.log("Card last four", cardLastFour);

    // ── Balances ───────────────────────────────────────────────────────────
    const openingMatch = text.match(SBI_OPENING_BALANCE);
  const closingBalMatch = text.match(SBI_CLOSING_BALANCE);
  const minDueMatch = text.match(SBI_MINIMUM_DUE);
  const totalDueMatch = text.match(SBI_TOTAL_AMOUNT_DUE);
  const paymentDueDateMatch = text.match(SBI_PAYMENT_DUE_DATE);

  console.log("OPENING BALANCE MATCH:", openingMatch);
  console.log("CLOSING BALANCE MATCH:", closingBalMatch);
  console.log("MINIMUM DUE MATCH:", minDueMatch);
  console.log("TOTAL DUE MATCH:", totalDueMatch);
  console.log("PAYMENT DUE DATE MATCH:", paymentDueDateMatch);
    

    const openingBalance = this.parseNumeric(openingMatch?.[1]);
    const closingBalance = this.parseNumeric(closingBalMatch?.[1]);
    const minimumDue = this.parseNumeric(minDueMatch?.[1]);
    const totalAmountDue = this.parseNumeric(totalDueMatch?.[1]);

    const paymentDueDate = paymentDueDateMatch?.[1]
      ? this.parseDate(paymentDueDateMatch[1])
      : null;

    // ── Transaction totals (computed from transaction list) ────────────────
    const transactions = this.parseTransactions(text);
    let totalDebits = 0;
    let totalCredits = 0;
    for (const txn of transactions) {
      if (txn.txn_type === "debit") totalDebits += txn.amount;
      else totalCredits += txn.amount;
    }

    this.log("Header parsed", {
      statementMonth,
      statementYear,
      openingBalance,
      closingBalance,
      minimumDue,
      totalAmountDue,
      transactionCount: transactions.length,
    });

    return {
      statement_month: statementMonth,
      statement_year: statementYear,
      card_last_four: cardLastFour,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      minimum_due: minimumDue,
      total_amount_due: totalAmountDue,
      payment_due_date: paymentDueDate,
      total_debits: totalDebits,
      total_credits: totalCredits,
    };
  }

  // ─── Transactions ──────────────────────────────────────────────────────────

  parseTransactions(text: string): RawTransaction[] {
    this.log("Parsing transactions");

    // Isolate the transaction section to avoid matching table headers or
    // summary lines that happen to look like transaction rows.
    const transactionSection = this.extractTransactionSection(text);
    this.log("Transaction section length", transactionSection.length);

    const transactions: RawTransaction[] = [];
    const matches = [...transactionSection.matchAll(SBI_TRANSACTION_ROW_GLOBAL)];

console.log("TRANSACTION SECTION:");
console.log(transactionSection);

console.log("MATCH COUNT:", matches.length);

matches.slice(0, 10).forEach((m, index) => {
  console.log(`MATCH ${index + 1}:`, m);
});
    for (const match of matches) {
      const [, dateRaw, descriptionRaw, amountRaw, crFlag] = match;

      const isoDate = this.parseDate(dateRaw.trim());
      if (!isoDate) {
        this.log("Skipping row — unparseable date", dateRaw);
        continue;
      }

      const description = this.normalizeDescription(descriptionRaw);
      if (!description) {
        this.log("Skipping row — empty description after normalisation");
        continue;
      }

      const { amount, isCredit: amountHasCrSuffix } =
        this.parseAmount(amountRaw);

      console.log("DATE:", dateRaw);
      console.log("DESC:", description);
      console.log("AMOUNT RAW:", amountRaw);
      console.log("CR FLAG:", crFlag);
      console.log("AMOUNT HAS CR:", amountHasCrSuffix);

      const flag = (crFlag || "").trim().toUpperCase();

      const isCredit =
        flag === "C" || amountHasCrSuffix;

      if (amount === 0) {
        this.log("Skipping row — zero amount", match[0]);
        continue;
      }

      transactions.push({
        txn_date: isoDate,
        description,
        amount,
        txn_type: isCredit ? "credit" : "debit",
      });
    }

    this.log(`Extracted ${transactions.length} transactions`);
    return transactions;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Isolate the transaction table from the full PDF text.
   * Reduces false-positive pattern matches in non-transaction sections.
   */
  private extractTransactionSection(text: string): string {
    const startMatch = text.search(SBI_TRANSACTION_SECTION_START);
    if (startMatch === -1) {
      // Pattern not found — return full text and let transaction regex
      // do its best. Flagged in debug log.
      this.log(
        "WARN: Transaction section start not found (NEEDS_SAMPLE_PDF). " +
          "Parsing full text."
      );
      return text;
    }

    const afterStart = text.slice(startMatch);
    const endMatch = afterStart.search(SBI_TRANSACTION_SECTION_END);

    if (endMatch === -1) {
      this.log(
        "WARN: Transaction section end not found. Parsing from start marker to EOF."
      );
      return afterStart;
    }

    return afterStart.slice(0, endMatch);
  }

  /**
   * Parse a comma-formatted number string to a float.
   * Returns 0 if the string is missing or not parseable.
   */
  private parseNumeric(raw: string | undefined): number {
    if (!raw) return 0;
    const cleaned = raw.replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  /**
   * Collapse multiple whitespace characters in a description to single spaces
   * and trim leading/trailing whitespace.
   */
  private normalizeDescription(raw: string): string {
    return raw.replace(/\s+/g, " ").trim();
  }
}
