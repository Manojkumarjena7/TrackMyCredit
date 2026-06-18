/**
 * lib/parsers/rbl/patterns.ts
 *
 * Regex patterns for RBL Bank Credit Card statement parsing.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  STATUS: STRUCTURAL STUBS — NOT VERIFIED AGAINST REAL STATEMENTS   ║
 * ║                                                                      ║
 * ║  Every pattern marked NEEDS_SAMPLE_PDF must be validated against     ║
 * ║  a real RBL credit card statement PDF before going to production.    ║
 * ║                                                                      ║
 * ║  HOW TO VERIFY:                                                      ║
 * ║    npx ts-node scripts/extract-pdf-text.ts <path-to-rbl.pdf>        ║
 * ║  Paste the output and the patterns will be finalized.               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * RBL Bank Credit Card PDF characteristics (expected):
 * - Header section contains "RBL Bank" or "Ratnakar Bank Limited"
 * - RBL uses a different transaction table layout than SBI
 * - Transaction amounts may be in a separate Dr/Cr column format
 * - Dates may be in DD/MM/YYYY format rather than DD MMM YYYY
 */

// ─── Bank detection ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected to match "RBL Bank", "Ratnakar Bank", "RBL BANK" in the header.
 */
export const RBL_BANK_IDENTIFIER = /RBL\s*Bank|Ratnakar\s*Bank/i;

// ─── Statement period ────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * RBL may print the statement period differently from SBI.
 * Possible formats:
 *   "Statement Date: 31/12/2024"
 *   "Billing Period: 01/12/2024 - 31/12/2024"
 * Captures the end/closing date.
 */
export const RBL_STATEMENT_DATE =
  /(?:Statement|Billing|Closing)\s+(?:Date|Period)\s*[:\-]\s*(?:\d{2}\/\d{2}\/\d{4}\s*[\-–to]+\s*)?(\d{2}\/\d{2}\/\d{4})/i;

/**
 * NEEDS_SAMPLE_PDF
 * Alternative format used by some RBL statement versions.
 */
export const RBL_STATEMENT_DATE_ALT =
  /(?:Due\s+Date|Payment\s+Due)\s*[:\-]\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;

// ─── Card number ─────────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * RBL typically prints: "Card Number : XXXX-XXXX-XXXX-1234"
 */
export const RBL_CARD_NUMBER =
  /Card\s+(?:Number|No\.?)\s*[:\-]?\s*[Xx*\-]{4,}\s*(\d{4})/i;

// ─── Opening balance ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Previous Balance : 5,000.00" or "Opening Balance : 5,000.00"
 */
export const RBL_OPENING_BALANCE =
  /(?:Previous|Opening)\s+Balance\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Closing balance ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Current Balance : 18,500.00" or "Closing Balance : 18,500.00"
 */
export const RBL_CLOSING_BALANCE =
  /(?:Current|Closing)\s+Balance\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Minimum amount due ──────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Minimum Amount Due : 925.00" or "Min. Payment Due : 925.00"
 */
export const RBL_MINIMUM_DUE =
  /Min(?:imum)?\.?\s+(?:Amount\s+Due|Payment\s+Due)\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Total amount due ────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Total Amount Due : 18,500.00"
 */
export const RBL_TOTAL_AMOUNT_DUE =
  /Total\s+Amount\s+Due\s*[:\-]\s*([\d,]+\.?\d*)/i;

// ─── Payment due date ─────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Expected: "Payment Due Date : 20/01/2025"
 */
export const RBL_PAYMENT_DUE_DATE =
  /Payment\s+Due\s+Date\s*[:\-]\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;

// ─── Transaction row ──────────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * RBL transaction rows may differ significantly from SBI in layout.
 *
 * Possible RBL format (two separate amount columns for Dr and Cr):
 *   DATE         DESCRIPTION              DR AMOUNT    CR AMOUNT
 *   05/12/2024   SWIGGY ORDER             450.00
 *   15/12/2024   PAYMENT RECEIVED                      10,000.00
 *
 * OR single amount column with Dr/Cr indicator:
 *   05/12/2024   SWIGGY ORDER             450.00 Dr
 *   15/12/2024   PAYMENT RECEIVED         10,000.00 Cr
 *
 * Capture groups (expected):
 *   [1] Date string
 *   [2] Description
 *   [3] Amount (debit column) — may be empty for credits
 *   [4] Amount (credit column) — may be empty for debits
 *
 * IMPORTANT: Verify exact RBL column layout with extract-pdf-text.ts.
 */
export const RBL_TRANSACTION_ROW =
  /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?$/im;

/**
 * NEEDS_SAMPLE_PDF
 * Global version for matchAll().
 */
export const RBL_TRANSACTION_ROW_GLOBAL =
  /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s{2,}(.+?)\s{2,}([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?$/gim;

// ─── Section delimiters ──────────────────────────────────────────────────────

/**
 * NEEDS_SAMPLE_PDF
 * Used to isolate the transaction table from the rest of the statement.
 */
export const RBL_TRANSACTION_SECTION_START =
  /(?:Date|Transaction\s+Date)\s+(?:Narration|Description|Particulars)/i;

/**
 * NEEDS_SAMPLE_PDF
 * Used to detect the end of the transaction section.
 */
export const RBL_TRANSACTION_SECTION_END =
  /Total\s+(?:Amount|Debits|Credits)|Sub\s*Total/i;
