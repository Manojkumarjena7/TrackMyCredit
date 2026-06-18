/**
 * lib/parsers/sbi/extractor.test.ts
 *
 * Tests for the SBI credit card statement parser.
 *
 * FIXTURE STATUS:
 *   Fixture strings below are structural placeholders that match the
 *   expected text format described in patterns.ts.
 *   Replace SAMPLE_SBI_TEXT with real text from:
 *     npx ts-node scripts/extract-pdf-text.ts <path-to-sbi.pdf>
 *   Once real text is available, update fixture strings and remove
 *   the NEEDS_SAMPLE_PDF comments.
 *
 * Run with:
 *   npx jest lib/parsers/sbi/extractor.test.ts
 */

import { SBIParser } from "@/lib/parsers/sbi/extractor";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Replace with actual text extracted from a real SBI credit card PDF.
 * Use: npx ts-node scripts/extract-pdf-text.ts statement.pdf
 */
const SAMPLE_SBI_HEADER_TEXT = `
SBI Card
Statement Period : 01 Dec 2024 to 31 Dec 2024
Card No. : XXXX XXXX XXXX 1234

Opening Balance : 5,000.00
Total Amount Due : 18,500.00
Minimum Amount Due : 925.00
Payment Due Date : 20 Jan 2025
`.trim();

/**
 * NEEDS_SAMPLE_PDF
 * Replace with actual transaction section text from a real SBI PDF.
 */
const SAMPLE_SBI_TRANSACTION_TEXT = `
SBI Card
Statement Period : 01 Dec 2024 to 31 Dec 2024

Date  Description  Amount
05 Dec 24  SWIGGY TECHNOLOGIES BANGALORE  450.00
10 Dec 24  AMAZON SELLER SERVICES MUMBAI  2,350.00
15 Dec 24  PAYMENT - THANK YOU  10,000.00 Cr
20 Dec 24  FUEL SURCHARGE  50.00
25 Dec 24  GST ON FINANCE CHARGE  125.00

Total Amount Due  18,500.00
`.trim();

const SAMPLE_SBI_FULL_TEXT = `
${SAMPLE_SBI_HEADER_TEXT}

${SAMPLE_SBI_TRANSACTION_TEXT}
`.trim();

const NON_SBI_TEXT = `
HDFC Bank Credit Card Statement
Card No: XXXX XXXX XXXX 5678
Statement Date: 31 Dec 2024
`.trim();

const EMPTY_TEXT = "";

// ─── Parser instance ──────────────────────────────────────────────────────────

const parser = new SBIParser({ debug: false });

// ─── Detection tests ─────────────────────────────────────────────────────────

describe("SBIParser.detect()", () => {
  test("returns true for text containing 'SBI Card'", () => {
    expect(parser.detect("SBI Card Statement")).toBe(true);
  });

  test("returns true for text containing 'STATE BANK OF INDIA'", () => {
    expect(parser.detect("STATE BANK OF INDIA Credit Card")).toBe(true);
  });

  test("returns false for non-SBI text", () => {
    expect(parser.detect(NON_SBI_TEXT)).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(parser.detect(EMPTY_TEXT)).toBe(false);
  });
});

// ─── Header parsing tests ─────────────────────────────────────────────────────

describe("SBIParser.parseHeader()", () => {
  /**
   * NEEDS_SAMPLE_PDF
   * These tests will fail until patterns.ts is verified and
   * SAMPLE_SBI_HEADER_TEXT is replaced with real extracted text.
   */

  test("extracts statement month and year", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.statement_month).toBe(12);
    expect(header.statement_year).toBe(2024);
  });

  test("extracts card last four digits", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.card_last_four).toBe("1234");
  });

  test("extracts opening balance", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.opening_balance).toBe(5000.0);
  });

  test("extracts minimum due", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.minimum_due).toBe(925.0);
  });

  test("extracts total amount due", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.total_amount_due).toBe(18500.0);
  });

  test("extracts payment due date in ISO format", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.payment_due_date).toBe("2025-01-20");
  });

  test("computes total debits from transactions", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    // 450 + 2350 + 50 + 125 = 2975
    expect(header.total_debits).toBeCloseTo(2975.0, 2);
  });

  test("computes total credits from transactions", () => {
    const header = parser.parseHeader(SAMPLE_SBI_FULL_TEXT);
    expect(header.total_credits).toBeCloseTo(10000.0, 2);
  });

  test("throws ParseError when statement period is missing", () => {
    expect(() => parser.parseHeader("SBI Card — no date here")).toThrow();
  });
});

// ─── Transaction parsing tests ────────────────────────────────────────────────

describe("SBIParser.parseTransactions()", () => {
  /**
   * NEEDS_SAMPLE_PDF
   * Replace expected values once real PDF text is available.
   */

  test("extracts correct number of transactions", () => {
    const txns = parser.parseTransactions(SAMPLE_SBI_TRANSACTION_TEXT);
    expect(txns).toHaveLength(5);
  });

  test("correctly identifies debit transactions", () => {
    const txns = parser.parseTransactions(SAMPLE_SBI_TRANSACTION_TEXT);
    const debits = txns.filter((t) => t.txn_type === "debit");
    expect(debits.length).toBe(4);
  });

  test("correctly identifies credit transactions", () => {
    const txns = parser.parseTransactions(SAMPLE_SBI_TRANSACTION_TEXT);
    const credits = txns.filter((t) => t.txn_type === "credit");
    expect(credits.length).toBe(1);
    expect(credits[0].amount).toBe(10000.0);
  });

  test("parses transaction dates into ISO format", () => {
    const txns = parser.parseTransactions(SAMPLE_SBI_TRANSACTION_TEXT);
    expect(txns[0].txn_date).toBe("2024-12-05");
  });

  test("normalizes description whitespace", () => {
    const txns = parser.parseTransactions(SAMPLE_SBI_TRANSACTION_TEXT);
    expect(txns[0].description).toBe("SWIGGY TECHNOLOGIES BANGALORE");
  });

  test("returns empty array for text with no transactions", () => {
    const txns = parser.parseTransactions("SBI Card\nNo transactions this period.");
    expect(txns).toEqual([]);
  });

  test("skips rows with zero amounts", () => {
    const text = `
SBI Card
Date  Description  Amount
05 Dec 24  SOME ENTRY  0.00
    `.trim();
    const txns = parser.parseTransactions(text);
    expect(txns).toHaveLength(0);
  });
});

// ─── Base class utility tests (via SBIParser) ─────────────────────────────────

describe("BaseParser date utilities", () => {
  // Access protected method via cast — test-only
  const p = parser as unknown as {
    parseDate: (s: string) => string | null;
    parseAmount: (s: string) => { amount: number; isCredit: boolean };
  };

  test("parseDate handles DD MMM YYYY format", () => {
    expect(p.parseDate("15 Jan 2024")).toBe("2024-01-15");
  });

  test("parseDate handles DD/MM/YYYY format", () => {
    expect(p.parseDate("15/01/2024")).toBe("2024-01-15");
  });

  test("parseDate handles DD-MM-YYYY format", () => {
    expect(p.parseDate("15-01-2024")).toBe("2024-01-15");
  });

  test("parseDate handles DD MMM YY short year format", () => {
    expect(p.parseDate("15 Jan 24")).toBe("2024-01-15");
  });

  test("parseDate returns null for invalid input", () => {
    expect(p.parseDate("not a date")).toBeNull();
  });

  test("parseAmount handles comma-formatted numbers", () => {
    expect(p.parseAmount("12,345.67").amount).toBeCloseTo(12345.67, 2);
  });

  test("parseAmount detects Cr suffix as credit", () => {
    expect(p.parseAmount("5,000.00 Cr").isCredit).toBe(true);
  });

  test("parseAmount strips ₹ symbol", () => {
    expect(p.parseAmount("₹1,500.00").amount).toBeCloseTo(1500.0, 2);
  });

  test("parseAmount handles zero", () => {
    expect(p.parseAmount("0.00").amount).toBe(0);
  });
});
