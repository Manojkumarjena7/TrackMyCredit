/**
 * lib/parsers/rbl/extractor.test.ts
 *
 * Tests for the RBL Bank credit card statement parser.
 *
 * FIXTURE STATUS:
 *   Fixture strings below are structural placeholders that match the
 *   expected text format described in patterns.ts.
 *   Replace SAMPLE_RBL_* constants with real text from:
 *     npx ts-node scripts/extract-pdf-text.ts <path-to-rbl.pdf>
 *
 * Run with:
 *   npx jest lib/parsers/rbl/extractor.test.ts
 */

import { RBLParser } from "@/lib/parsers/rbl/extractor";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Replace with actual text extracted from a real RBL credit card PDF.
 */
const SAMPLE_RBL_HEADER_TEXT = `
RBL Bank Credit Card Statement

Card Number : XXXX-XXXX-XXXX-5678
Statement Date: 01/12/2024 - 31/12/2024
Payment Due Date : 20/01/2025

Previous Balance : 3,000.00
Total Amount Due : 12,450.00
Minimum Amount Due : 622.50
`.trim();

/**
 * NEEDS_SAMPLE_PDF
 * Replace with actual transaction section text from a real RBL PDF.
 * NOTE: RBL may use a two-column Dr/Cr layout — verify with extract-pdf-text.ts.
 */
const SAMPLE_RBL_TRANSACTION_TEXT = `
RBL Bank Credit Card Statement
Statement Date: 01/12/2024 - 31/12/2024

Transaction Date  Narration  Dr Amount  Cr Amount
05/12/2024  BIGBASKET PURCHASE BANGALORE  850.00
10/12/2024  UBER INDIA SERVICES MUMBAI  320.00
15/12/2024  NEFT PAYMENT RECEIVED    8,000.00
20/12/2024  ANNUAL FEE CHARGE  999.00
25/12/2024  GST ON ANNUAL FEE  179.82

Total Amount Due  12,450.00
`.trim();

const SAMPLE_RBL_FULL_TEXT = `
${SAMPLE_RBL_HEADER_TEXT}

${SAMPLE_RBL_TRANSACTION_TEXT}
`.trim();

const NON_RBL_TEXT = `
SBI Card Statement
Card No. : XXXX XXXX XXXX 1234
Statement Period : 01 Dec 2024 to 31 Dec 2024
`.trim();

// ─── Parser instance ──────────────────────────────────────────────────────────

const parser = new RBLParser({ debug: false });

// ─── Detection tests ─────────────────────────────────────────────────────────

describe("RBLParser.detect()", () => {
  test("returns true for text containing 'RBL Bank'", () => {
    expect(parser.detect("RBL Bank Credit Card Statement")).toBe(true);
  });

  test("returns true for text containing 'Ratnakar Bank'", () => {
    expect(parser.detect("Ratnakar Bank Limited")).toBe(true);
  });

  test("returns false for non-RBL text", () => {
    expect(parser.detect(NON_RBL_TEXT)).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(parser.detect("")).toBe(false);
  });
});

// ─── Header parsing tests ─────────────────────────────────────────────────────

describe("RBLParser.parseHeader()", () => {
  /**
   * NEEDS_SAMPLE_PDF
   * Replace expected values once real PDF text is available.
   */

  test("extracts statement month and year", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.statement_month).toBe(12);
    expect(header.statement_year).toBe(2024);
  });

  test("extracts card last four digits", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.card_last_four).toBe("5678");
  });

  test("extracts opening balance", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.opening_balance).toBe(3000.0);
  });

  test("extracts minimum due", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.minimum_due).toBe(622.5);
  });

  test("extracts total amount due", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.total_amount_due).toBe(12450.0);
  });

  test("extracts payment due date in ISO format", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.payment_due_date).toBe("2025-01-20");
  });

  test("computes total debits from transactions", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    // 850 + 320 + 999 + 179.82 = 2348.82
    expect(header.total_debits).toBeCloseTo(2348.82, 2);
  });

  test("computes total credits from transactions", () => {
    const header = parser.parseHeader(SAMPLE_RBL_FULL_TEXT);
    expect(header.total_credits).toBeCloseTo(8000.0, 2);
  });

  test("throws ParseError when statement date is missing", () => {
    expect(() => parser.parseHeader("RBL Bank — no date here")).toThrow();
  });
});

// ─── Transaction parsing tests ─────────────────────────────────────────────────

describe("RBLParser.parseTransactions()", () => {
  /**
   * NEEDS_SAMPLE_PDF
   * Replace expected values once real PDF text is available.
   * NOTE: Adjust debit/credit detection logic in extractor.ts if RBL uses
   * a single column with Dr/Cr suffix rather than two separate columns.
   */

  test("extracts correct number of transactions", () => {
    const txns = parser.parseTransactions(SAMPLE_RBL_TRANSACTION_TEXT);
    expect(txns).toHaveLength(5);
  });

  test("correctly identifies debit transactions", () => {
    const txns = parser.parseTransactions(SAMPLE_RBL_TRANSACTION_TEXT);
    const debits = txns.filter((t) => t.txn_type === "debit");
    expect(debits.length).toBe(4);
  });

  test("correctly identifies credit transactions", () => {
    const txns = parser.parseTransactions(SAMPLE_RBL_TRANSACTION_TEXT);
    const credits = txns.filter((t) => t.txn_type === "credit");
    expect(credits.length).toBe(1);
    expect(credits[0].amount).toBeCloseTo(8000.0, 2);
  });

  test("parses DD/MM/YYYY transaction dates into ISO format", () => {
    const txns = parser.parseTransactions(SAMPLE_RBL_TRANSACTION_TEXT);
    expect(txns[0].txn_date).toBe("2024-12-05");
  });

  test("normalizes description whitespace", () => {
    const txns = parser.parseTransactions(SAMPLE_RBL_TRANSACTION_TEXT);
    expect(txns[0].description).toBe("BIGBASKET PURCHASE BANGALORE");
  });

  test("returns empty array for text with no transactions", () => {
    const txns = parser.parseTransactions("RBL Bank\nNo transactions this period.");
    expect(txns).toEqual([]);
  });
});
