-- ═══════════════════════════════════════════════════
-- Credit Intelligence Platform — RLS Policies
-- Migration: 002_rls_policies.sql
-- ═══════════════════════════════════════════════════

-- Enable RLS on every table
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statement_analytics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs      ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────
-- PROFILES
-- ───────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- BANK ACCOUNTS
-- ───────────────────────────────────────────────────
CREATE POLICY "bank_accounts_select_own" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "bank_accounts_insert_own" ON public.bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bank_accounts_update_own" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- CARDS
-- ───────────────────────────────────────────────────
CREATE POLICY "cards_select_own" ON public.cards
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "cards_insert_own" ON public.cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cards_update_own" ON public.cards
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- LOANS
-- ───────────────────────────────────────────────────
CREATE POLICY "loans_select_own" ON public.loans
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "loans_insert_own" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "loans_update_own" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- STATEMENTS
-- ───────────────────────────────────────────────────
CREATE POLICY "statements_select_own" ON public.statements
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "statements_insert_own" ON public.statements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "statements_update_own" ON public.statements
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- TRANSACTIONS
-- ───────────────────────────────────────────────────
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- STATEMENT ANALYTICS
-- ───────────────────────────────────────────────────
CREATE POLICY "statement_analytics_select_own" ON public.statement_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "statement_analytics_insert_own" ON public.statement_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "statement_analytics_update_own" ON public.statement_analytics
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- ANALYTICS SNAPSHOTS
-- ───────────────────────────────────────────────────
CREATE POLICY "analytics_snapshots_select_own" ON public.analytics_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "analytics_snapshots_insert_own" ON public.analytics_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analytics_snapshots_update_own" ON public.analytics_snapshots
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────
-- PROCESSING JOBS
-- ───────────────────────────────────────────────────
CREATE POLICY "processing_jobs_select_own" ON public.processing_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "processing_jobs_insert_own" ON public.processing_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "processing_jobs_update_own" ON public.processing_jobs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
