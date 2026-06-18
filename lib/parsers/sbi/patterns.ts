/**
 * lib/parsers/sbi/patterns.ts
 *
 * Regex patterns for SBI Credit Card statement parsing.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  STATUS: STRUCTURAL STUBS — NOT VERIFIED AGAINST REAL STATEMENTS   ║
 * ║                                                                      ║
 * ║  Every pattern marked NEEDS_SAMPLE_PDF must be validated against     ║
 * ║  a real SBI credit card statement PDF before going to production.    ║
 * ║                                                                      ║
 * ║  HOW TO VERIFY:                                                      ║
 * ║    npx ts-node scripts/extract-pdf-text.ts <path-to-sbi.pdf>        ║
 * ║  Paste the output and the patterns will be finalized.               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * SBI Credit Card PDF characteristics (expected, based on SBI format docs):
 * - Header section contains "SBI Card" or "STATE BANK OF INDIA"
 * - Statement period typically printed as "Statement Period: DD MMM YYYY to DD MMM YYYY"
 * - Transactions in a table: Date | Description | Amount (Dr/Cr)
 * - Amounts use Indian number format with comma separators
 * - Credit entries may be suffixed with "Cr" or "(Cr)"
 */

// ─── Bank detection ─────────────────────────────────────────────────────────
// Used by detect() — must be fast and high-confidence.

/**
 * NEEDS_SAMPLE_PDF
 * Expected to match "SBI Card", "SBI CARD", "State Bank of India" etc.
 * in the header section of the PDF.
 */
export const SBI_BANK_IDENTIFIER = /SBI\s*Card|STATE\s*BANK\s*OF\s*INDIA/i;

// ─── Statement period ────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected to match the closing/statement date line.
 * Placeholder captures a date in DD MMM YYYY format.
 * Example target text: "Statement Period : 01 Dec 2024 to 31 Dec 2024"
 */
export const SBI_STATEMENT_PERIOD =
  /Statement\s+Period\s*[:\-]\s*\d{1,2}\s+\w{3}\s+\d{4}\s+to\s+(\d{1,2}\s+\w{3}\s+\d{4})/i;

/**
 * NEEDS_SAMPLE_PDF
 * Alternative: some SBI statements print the closing date separately.
 * Example: "Closing Date : 31 Dec 2024"
 */
export const SBI_CLOSING_DATE =
  /Closing\s+Date\s*[:\-]\s*(\d{1,2}[\s\/\-]\w{3,}[\s\/\-]\d{2,4})/i;

// ─── Card number ─────────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected to match a masked card number on the statement.
 * SBI typically prints: "XXXX XXXX XXXX 1234" or "...1234"
 */
export const SBI_CARD_NUMBER =
  /(?:Card\s+No\.?\s*[:\-]?\s*)?[Xx*]{4}\s*[Xx*]{4}\s*[Xx*]{4}\s*(\d{4})/i;

// ─── Opening balance ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Opening Balance : 12,345.67" or "Previous Balance : 12,345.67"
 */
export const SBI_OPENING_BALANCE =
  /(?:Opening|Previous)\s+Balance\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Closing balance ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Closing Balance : 23,456.78" or "Total Amount Due : 23,456.78"
 */
export const SBI_CLOSING_BALANCE =
  /(?:Closing|Total\s+Amount\s+Due)\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Minimum amount due ──────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Minimum Amount Due : 1,234.56" or "Min. Due : 1,234.56"
 */
export const SBI_MINIMUM_DUE =
  /Min(?:imum)?\.?\s+(?:Amount\s+)?Due\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Total amount due ────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Total Amount Due : 23,456.78"
 * Note: May overlap with closing balance on some SBI formats.
 */
export const SBI_TOTAL_AMOUNT_DUE =
  /Total\s+Amount\s+Due\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Payment due date ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Payment Due Date : 20 Jan 2025"
 */
export const SBI_PAYMENT_DUE_DATE =
  /Payment\s+Due\s+Date\s*[:\-]\s*(\d{1,2}[\s\/\-]\w{3,}[\s\/\-]\d{2,4})/i;

// ─── Transaction row ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * This is the most critical pattern — must match transaction table rows exactly.
 *
 * Expected SBI transaction row format (one line):
 *   DATE       DESCRIPTION                      AMOUNT
 *   15 Dec 24  SWIGGY ORDER #12345              450.00
 *   20 Dec 24  PAYMENT - THANK YOU              10000.00 Cr
 *
 * Capture groups (expected):
 *   [1] Date string  (e.g. "15 Dec 24")
 *   [2] Description  (e.g. "SWIGGY ORDER #12345")
 *   [3] Amount       (e.g. "450.00" or "10,000.00")
 *   [4] Cr indicator (e.g. "Cr" or undefined)
 *
 * IMPORTANT: pdf-parse may collapse multi-column layouts into single lines
 * or split them across lines. Verify exact whitespace behaviour with
 * extract-pdf-text.ts before finalizing this pattern.
 */
export const SBI_TRANSACTION_ROW =
  /^(\d{1,2}\s+\w{3}\s+\d{2,4})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2})\s*(Cr)?$/im;

/**
 * NEEDS_SAMPLE_PDF
 * Global version of the transaction row pattern for matchAll().
 */
export const SBI_TRANSACTION_ROW_GLOBAL =
  /^(\d{1,2}\s+\w{3}\s+\d{2,4})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2})\s*(Cr)?$/gim;

// ─── Section delimiters ──────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Used to isolate the transaction section from the rest of the statement.
 * Expected to match the transaction table header line.
 */
export const SBI_TRANSACTION_SECTION_START =
  /Date\s+Description\s+Amount/i;

/**
 * NEEDS_SAMPLE_PDF
 * Used to detect the end of the transaction section.
 */
export const SBI_TRANSACTION_SECTION_END =
  /Total\s+(?:Amount\s+Due|Debits|Credits)/i;
