-- ═══════════════════════════════════════════════════
-- Credit Intelligence Platform — Indexes
-- Migration: 003_indexes.sql
-- ═══════════════════════════════════════════════════

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles(user_id);

-- BANK ACCOUNTS
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id
  ON public.bank_accounts(user_id) WHERE deleted_at IS NULL;

-- CARDS
CREATE INDEX IF NOT EXISTS idx_cards_user_id
  ON public.cards(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cards_bank_name
  ON public.cards(bank_name) WHERE deleted_at IS NULL;

-- LOANS
CREATE INDEX IF NOT EXISTS idx_loans_user_id
  ON public.loans(user_id) WHERE deleted_at IS NULL;

-- STATEMENTS
CREATE INDEX IF NOT EXISTS idx_statements_user_id
  ON public.statements(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_statements_card_id
  ON public.statements(card_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_statements_year_month
  ON public.statements(statement_year, statement_month) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_statements_processing_status
  ON public.statements(processing_status) WHERE deleted_at IS NULL;

-- TRANSACTIONS
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_statement_id
  ON public.transactions(statement_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_txn_date
  ON public.transactions(txn_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON public.transactions(category) WHERE deleted_at IS NULL;

-- Partial indexes for fast analytics aggregation using boolean tags
CREATE INDEX IF NOT EXISTS idx_transactions_is_interest
  ON public.transactions(user_id) WHERE is_interest = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_is_hidden_charge
  ON public.transactions(user_id) WHERE is_hidden_charge = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_is_tax
  ON public.transactions(user_id) WHERE is_tax = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_is_rent
  ON public.transactions(user_id) WHERE is_rent_payment = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_is_education
  ON public.transactions(user_id) WHERE is_education_payment = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_is_cash_withdrawal
  ON public.transactions(user_id) WHERE is_cash_withdrawal = TRUE AND deleted_at IS NULL;

-- STATEMENT ANALYTICS
CREATE INDEX IF NOT EXISTS idx_statement_analytics_user_id
  ON public.statement_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_statement_analytics_statement_id
  ON public.statement_analytics(statement_id);

-- ANALYTICS SNAPSHOTS
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_id
  ON public.analytics_snapshots(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_card_year
  ON public.analytics_snapshots(card_id, year);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_year
  ON public.analytics_snapshots(user_id, year);

-- PROCESSING JOBS
CREATE INDEX IF NOT EXISTS idx_processing_jobs_statement_id
  ON public.processing_jobs(statement_id);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status
  ON public.processing_jobs(status);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id
  ON public.processing_jobs(user_id);
