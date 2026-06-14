export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─────────────────────────────────────────────
// Supabase Database Types
// ─────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      bank_accounts: {
        Row: BankAccount;
        Insert: BankAccountInsert;
        Update: BankAccountUpdate;
      };
      cards: {
        Row: Card;
        Insert: CardInsert;
        Update: CardUpdate;
      };
      loans: {
        Row: Loan;
        Insert: LoanInsert;
        Update: LoanUpdate;
      };
      statements: {
        Row: Statement;
        Insert: StatementInsert;
        Update: StatementUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      statement_analytics: {
        Row: StatementAnalytics;
        Insert: StatementAnalyticsInsert;
        Update: StatementAnalyticsUpdate;
      };
      analytics_snapshots: {
        Row: AnalyticsSnapshot;
        Insert: AnalyticsSnapshotInsert;
        Update: AnalyticsSnapshotUpdate;
      };
      processing_jobs: {
        Row: ProcessingJob;
        Insert: ProcessingJobInsert;
        Update: ProcessingJobUpdate;
      };
    };
  };
}

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type ProfileInsert = Omit<Profile, "id" | "created_at" | "updated_at">;
export type ProfileUpdate = Partial<ProfileInsert>;

// ─────────────────────────────────────────────
// Bank Account
// ─────────────────────────────────────────────

export type AccountType = "savings" | "current" | "loan";

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: AccountType;
  account_number_masked: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type BankAccountInsert = Omit<
  BankAccount,
  "id" | "created_at" | "updated_at"
>;
export type BankAccountUpdate = Partial<BankAccountInsert>;

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────

export type CardType = "credit" | "debit";
export type BankName = "SBI" | "RBL" | "HDFC" | "ICICI" | "Axis" | "IDFC" | "Other";

export interface Card {
  id: string;
  user_id: string;
  bank_name: BankName;
  card_name: string;
  card_last_four: string | null;
  card_type: CardType;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type CardInsert = Omit<Card, "id" | "created_at" | "updated_at">;
export type CardUpdate = Partial<CardInsert>;

// ─────────────────────────────────────────────
// Loan
// ─────────────────────────────────────────────

export type LoanType =
  | "personal"
  | "home"
  | "auto"
  | "education"
  | "gold"
  | "business"
  | "other";

export type LoanStatus = "active" | "closed" | "overdue" | "written_off";

export interface Loan {
  id: string;
  user_id: string;
  lender_name: string;
  loan_type: LoanType;
  original_principal: number;
  current_balance: number;
  interest_rate: number;
  start_date: string;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type LoanInsert = Omit<Loan, "id" | "created_at" | "updated_at">;
export type LoanUpdate = Partial<LoanInsert>;

// ─────────────────────────────────────────────
// Statement
// ─────────────────────────────────────────────

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "complete"
  | "failed";

export interface Statement {
  id: string;
  card_id: string;
  user_id: string;
  statement_month: number;
  statement_year: number;
  opening_balance: number;
  closing_balance: number;
  minimum_due: number;
  total_debits: number;
  total_credits: number;
  storage_path: string;
  processing_status: ProcessingStatus;
  uploaded_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type StatementInsert = Omit<Statement, "id" | "updated_at">;
export type StatementUpdate = Partial<StatementInsert>;

// ─────────────────────────────────────────────
// Transaction
// ─────────────────────────────────────────────

export type TransactionType = "debit" | "credit";

export type TransactionCategory =
  | "shopping"
  | "grocery"
  | "fuel"
  | "utilities"
  | "emi"
  | "insurance"
  | "rent_payment"
  | "education_payment"
  | "cash_withdrawal"
  | "interest"
  | "gst"
  | "processing_fee"
  | "late_fee"
  | "refund"
  | "other";

export type FeeType =
  | "finance_charge"
  | "interest_charge"
  | "gst_on_fees"
  | "convenience_charge"
  | "processing_charge"
  | "late_fee"
  | "overlimit_fee"
  | "cash_advance_fee"
  | null;

export type TaxType = "gst" | "cess" | null;

export interface Transaction {
  id: string;
  statement_id: string;
  user_id: string;
  txn_date: string;
  description: string;
  amount: number;
  txn_type: TransactionType;
  category: TransactionCategory;
  fee_type: FeeType;
  tax_type: TaxType;
  gst_amount: number;
  is_interest: boolean;
  is_tax: boolean;
  is_hidden_charge: boolean;
  is_rent_payment: boolean;
  is_education_payment: boolean;
  is_cash_withdrawal: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type TransactionInsert = Omit<
  Transaction,
  "id" | "created_at" | "updated_at"
>;
export type TransactionUpdate = Partial<TransactionInsert>;

// ─────────────────────────────────────────────
// Statement Analytics
// ─────────────────────────────────────────────

export interface StatementAnalytics {
  id: string;
  statement_id: string;
  user_id: string;
  total_spend: number;
  total_interest: number;
  total_gst: number;
  total_fees: number;
  total_rent: number;
  total_education: number;
  total_cash_withdrawal: number;
  total_hidden_charges: number;
  computed_at: string;
  updated_at: string;
}

export type StatementAnalyticsInsert = Omit<
  StatementAnalytics,
  "id" | "updated_at"
>;
export type StatementAnalyticsUpdate = Partial<StatementAnalyticsInsert>;

// ─────────────────────────────────────────────
// Analytics Snapshots
// ─────────────────────────────────────────────

export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  card_id: string;
  month: number;
  year: number;
  total_spend: number;
  total_interest: number;
  total_tax: number;
  total_hidden_charges: number;
  total_rent_charges: number;
  total_education_charges: number;
  total_fees: number;
  total_cash_withdrawal: number;
  created_at: string;
  updated_at: string;
}

export type AnalyticsSnapshotInsert = Omit<
  AnalyticsSnapshot,
  "id" | "created_at" | "updated_at"
>;
export type AnalyticsSnapshotUpdate = Partial<AnalyticsSnapshotInsert>;

// ─────────────────────────────────────────────
// Processing Job
// ─────────────────────────────────────────────

export type JobStatus =
  | "pending"
  | "processing"
  | "complete"
  | "failed";

export interface ProcessingJob {
  id: string;
  statement_id: string;
  user_id: string;
  status: JobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProcessingJobInsert = Omit<
  ProcessingJob,
  "id" | "created_at" | "updated_at"
>;
export type ProcessingJobUpdate = Partial<ProcessingJobInsert>;

// ─────────────────────────────────────────────
// UI / Component Types
// ─────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface FilterState {
  bank: BankName | "all";
  card_id: string | "all";
  month: number | null;
  year: number | null;
  category: TransactionCategory | "all";
  date_from: string | null;
  date_to: string | null;
}
