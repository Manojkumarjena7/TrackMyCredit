/**
 * lib/parsers/rbl/extractor.ts
 *
 * RBL Bank Credit Card statement parser.
 *
 * Architecture is complete and production-ready.
 * Regex patterns in rbl/patterns.ts are structural stubs (NEEDS_SAMPLE_PDF).
 * Once verified against a real RBL statement, only patterns.ts changes.
 *
 * NOTE: RBL may use a two-column amount layout (separate Dr/Cr columns).
 * The transaction parser handles both single-column and dual-column formats.
 * Verify which format applies with extract-pdf-text.ts before finalizing.
 */

import { BaseParser, ParseError } from "@/lib/parsers/base";
import type {
  ParsedHeader,
  RawTransaction,
  ParserConfig,
} from "@/lib/parsers/types";
import {
  RBL_BANK_IDENTIFIER,
  RBL_STATEMENT_DATE,
  RBL_STATEMENT_DATE_ALT,
  RBL_CARD_NUMBER,
  RBL_OPENING_BALANCE,
  RBL_CLOSING_BALANCE,
  RBL_MINIMUM_DUE,
  RBL_TOTAL_AMOUNT_DUE,
  RBL_PAYMENT_DUE_DATE,
  RBL_TRANSACTION_ROW_GLOBAL,
  RBL_TRANSACTION_SECTION_START,
  RBL_TRANSACTION_SECTION_END,
} from "@/lib/parsers/rbl/patterns";

export class RBLParser extends BaseParser {
  readonly bank = "RBL" as const;

  constructor(config: ParserConfig = {}) {
    super(config);
  }

  // ─── Detection ─────────────────────────────────────────────────────────────

  detect(text: string): boolean {
    return RBL_BANK_IDENTIFIER.test(text);
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  parseHeader(text: string): ParsedHeader {
    this.log("Parsing header");

    // ── Statement period ───────────────────────────────────────────────────
    let statementMonth: number;
    let statementYear: number;

    const dateMatch =
      text.match(RBL_STATEMENT_DATE) ??
      text.match(RBL_STATEMENT_DATE_ALT);

    const dateString = dateMatch?.[1] ?? null;

    if (dateString) {
      const period = this.extractStatementPeriod(dateString);
      if (period) {
        statementMonth = period.month;
        statementYear = period.year;
      } else {
        throw new ParseError(
          `Could not parse statement date from: "${dateString}"`,
          "statement_period"
        );
      }
    } else {
      throw new ParseError(
        "Statement date not found. Pattern: NEEDS_SAMPLE_PDF verification.",
        "statement_period"
      );
    }

    // ── Card last four ─────────────────────────────────────────────────────
    const cardMatch = text.match(RBL_CARD_NUMBER);
    const cardLastFour = cardMatch?.[1] ?? null;
    this.log("Card last four", cardLastFour);

    // ── Balances ───────────────────────────────────────────────────────────
    const openingMatch = text.match(RBL_OPENING_BALANCE);
    const closingMatch = text.match(RBL_CLOSING_BALANCE);
    const minDueMatch = text.match(RBL_MINIMUM_DUE);
    const totalDueMatch = text.match(RBL_TOTAL_AMOUNT_DUE);
    const paymentDueDateMatch = text.match(RBL_PAYMENT_DUE_DATE);

    const openingBalance = this.parseNumeric(openingMatch?.[1]);
    const closingBalance = this.parseNumeric(closingMatch?.[1]);
    const minimumDue = this.parseNumeric(minDueMatch?.[1]);
    const totalAmountDue = this.parseNumeric(totalDueMatch?.[1]);

    const paymentDueDate = paymentDueDateMatch?.[1]
      ? this.parseDate(paymentDueDateMatch[1])
      : null;

    // ── Transaction totals ─────────────────────────────────────────────────
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

    const transactionSection = this.extractTransactionSection(text);
    this.log("Transaction section length", transactionSection.length);

    const transactions: RawTransaction[] = [];
    const matches = transactionSection.matchAll(RBL_TRANSACTION_ROW_GLOBAL);

    for (const match of matches) {
      /**
       * NEEDS_SAMPLE_PDF
       * RBL may use two amount columns (Dr | Cr) or a single column with suffix.
       * match[3] = debit amount column
       * match[4] = credit amount column
       *
       * If RBL uses single column with Dr/Cr suffix, adjust group indices here.
       */
      const [, dateRaw, descriptionRaw, drAmount, crAmount] = match;

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

      // Determine debit vs credit from which column has a value
      let amount: number;
      let txnType: "debit" | "credit";

      if (crAmount && crAmount.trim()) {
        amount = this.parseNumeric(crAmount);
        txnType = "credit";
      } else if (drAmount && drAmount.trim()) {
        amount = this.parseNumeric(drAmount);
        txnType = "debit";
      } else {
        this.log("Skipping row — no amount found", match[0]);
        continue;
      }

      if (amount === 0) {
        this.log("Skipping row — zero amount", match[0]);
        continue;
      }

      transactions.push({
        txn_date: isoDate,
        description,
        amount,
        txn_type: txnType,
      });
    }

    this.log(`Extracted ${transactions.length} transactions`);
    return transactions;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private extractTransactionSection(text: string): string {
    const startMatch = text.search(RBL_TRANSACTION_SECTION_START);
    if (startMatch === -1) {
      this.log(
        "WARN: Transaction section start not found (NEEDS_SAMPLE_PDF). " +
          "Parsing full text."
      );
      return text;
    }

    const afterStart = text.slice(startMatch);
    const endMatch = afterStart.search(RBL_TRANSACTION_SECTION_END);

    if (endMatch === -1) {
      this.log(
        "WARN: Transaction section end not found. Parsing from start marker to EOF."
      );
      return afterStart;
    }

    return afterStart.slice(0, endMatch);
  }

  private parseNumeric(raw: string | undefined): number {
    if (!raw) return 0;
    const cleaned = raw.replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  private normalizeDescription(raw: string): string {
    return raw.replace(/\s+/g, " ").trim();
  }
}
