-- ═══════════════════════════════════════════════════
-- Credit Intelligence Platform — Initial Schema
-- Migration: 001_initial_schema.sql
-- ═══════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────
-- PROFILES
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,

  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- ───────────────────────────────────────────────────
-- BANK ACCOUNTS
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name               TEXT NOT NULL,
  account_type            TEXT NOT NULL CHECK (account_type IN ('savings', 'current', 'loan')),
  account_number_masked   TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────
-- CARDS
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name       TEXT NOT NULL,
  card_name       TEXT NOT NULL,
  card_last_four  TEXT,
  card_type       TEXT NOT NULL DEFAULT 'credit' CHECK (card_type IN ('credit', 'debit')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────
-- LOANS
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lender_name         TEXT NOT NULL,
  loan_type           TEXT NOT NULL CHECK (loan_type IN ('personal', 'home', 'auto', 'education', 'gold', 'business', 'other')),
  original_principal  NUMERIC(15, 2) NOT NULL CHECK (original_principal >= 0),
  current_balance     NUMERIC(15, 2) NOT NULL CHECK (current_balance >= 0),
  interest_rate       NUMERIC(6, 4) NOT NULL CHECK (interest_rate >= 0),
  start_date          DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'overdue', 'written_off')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────
-- STATEMENTS
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.statements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id             UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_month     SMALLINT NOT NULL CHECK (statement_month BETWEEN 1 AND 12),
  statement_year      SMALLINT NOT NULL CHECK (statement_year BETWEEN 2000 AND 2100),
  opening_balance     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  closing_balance     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  minimum_due         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_debits        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_credits       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  storage_path        TEXT NOT NULL,
  processing_status   TEXT NOT NULL DEFAULT 'pending'
                      CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed')),
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  -- Prevent duplicate statement uploads for the same card/month/year
  CONSTRAINT statements_card_month_year_unique
    UNIQUE (card_id, statement_month, statement_year)
);

-- ───────────────────────────────────────────────────
-- TRANSACTIONS
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id          UUID NOT NULL REFERENCES public.statements(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  txn_date              DATE NOT NULL,
  description           TEXT NOT NULL,
  amount                NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  txn_type              TEXT NOT NULL CHECK (txn_type IN ('debit', 'credit')),
  category              TEXT NOT NULL DEFAULT 'other'
                        CHECK (category IN (
                          'shopping', 'grocery', 'fuel', 'utilities', 'emi',
                          'insurance', 'rent_payment', 'education_payment',
                          'cash_withdrawal', 'interest', 'gst', 'processing_fee',
                          'late_fee', 'refund', 'other'
                        )),
  fee_type              TEXT CHECK (fee_type IN (
                          'finance_charge', 'interest_charge', 'gst_on_fees',
                          'convenience_charge', 'processing_charge', 'late_fee',
                          'overlimit_fee', 'cash_advance_fee'
                        )),
  tax_type              TEXT CHECK (tax_type IN ('gst', 'cess')),
  gst_amount            NUMERIC(15, 2) NOT NULL DEFAULT 0,
  -- Boolean tags for fast analytics queries
  is_interest           BOOLEAN NOT NULL DEFAULT FALSE,
  is_tax                BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden_charge      BOOLEAN NOT NULL DEFAULT FALSE,
  is_rent_payment       BOOLEAN NOT NULL DEFAULT FALSE,
  is_education_payment  BOOLEAN NOT NULL DEFAULT FALSE,
  is_cash_withdrawal    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────
-- STATEMENT ANALYTICS
-- Pre-computed per-statement summary
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.statement_analytics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id            UUID NOT NULL REFERENCES public.statements(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_spend             NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_interest          NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_gst               NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_fees              NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_rent              NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_education         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cash_withdrawal   NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_hidden_charges    NUMERIC(15, 2) NOT NULL DEFAULT 0,
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT statement_analytics_statement_id_unique UNIQUE (statement_id)
);

-- ───────────────────────────────────────────────────
-- ANALYTICS SNAPSHOTS
-- Monthly pre-aggregated cache per card
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id                   UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  month                     SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                      SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  total_spend               NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_interest            NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_tax                 NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_hidden_charges      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_rent_charges        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_education_charges   NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_fees                NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cash_withdrawal     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT analytics_snapshots_card_month_year_unique
    UNIQUE (card_id, month, year)
);

-- ───────────────────────────────────────────────────
-- PROCESSING JOBS
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id    UUID NOT NULL REFERENCES public.statements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'bank_accounts', 'cards', 'loans',
    'statements', 'transactions', 'statement_analytics',
    'analytics_snapshots', 'processing_jobs'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ───────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
