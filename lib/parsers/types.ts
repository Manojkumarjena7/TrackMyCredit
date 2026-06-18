/**
 * lib/parsers/types.ts
 *
 * Shared types for the PDF parsing pipeline.
 * All bank parsers implement these interfaces — the analytics engine,
 * processor, and router never import bank-specific code directly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Bank identification
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedBank = "SBI" | "RBL";

export interface BankDetectionResult {
  detected: boolean;
  bank: SupportedBank | null;
  confidence: "high" | "low";
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsed header — extracted from the statement cover/summary section
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedHeader {
  /** 1–12 */
  statement_month: number;
  /** e.g. 2024 */
  statement_year: number;
  /** Last 4 digits of the card number, or null if not found */
  card_last_four: string | null;
  opening_balance: number;
  closing_balance: number;
  minimum_due: number;
  /** Total amount due as printed on the statement */
  total_amount_due: number;
  /** Payment due date in ISO format YYYY-MM-DD, or null if not found */
  payment_due_date: string | null;
  /** Sum of all debit transaction amounts — computed by parser */
  total_debits: number;
  /** Sum of all credit transaction amounts — computed by parser */
  total_credits: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw transaction — as extracted from the PDF before categorization
// ─────────────────────────────────────────────────────────────────────────────

export type RawTransactionType = "debit" | "credit";

export interface RawTransaction {
  /** Transaction date in ISO format YYYY-MM-DD */
  txn_date: string;
  /** Full description as it appears on the statement */
  description: string;
  /** Absolute value — always positive */
  amount: number;
  txn_type: RawTransactionType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full parse result returned by the router
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
  success: boolean;
  bank: SupportedBank | null;
  header: ParsedHeader | null;
  transactions: RawTransaction[];
  /** Human-readable error if success === false */
  error?: string;
  /** Raw text extracted from the PDF — preserved for debugging */
  raw_text?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser configuration — passed to BaseParser constructor
// ─────────────────────────────────────────────────────────────────────────────

export interface ParserConfig {
  /** When true, parser writes debug info to console */
  debug?: boolean;
}
