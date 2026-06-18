/**
 * lib/repositories/transactions.ts
 *
 * All database operations for the transactions table.
 *
 * Phase 3/4: transactions are stored with category = "other".
 * Phase 5 (categorization engine) will update categories after insert.
 */

import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionInsert } from "@/types";
import type { RawTransaction } from "@/lib/parsers/types";

/**
 * Convert a RawTransaction (from the parser) into a TransactionInsert
 * ready to be written to the database.
 *
 * Category defaults to "other" — Phase 5 will reclassify.
 * All boolean tags default to false — Phase 5 will set them.
 */
export function buildTransactionInsert(
  raw: RawTransaction,
  statementId: string,
  userId: string
): TransactionInsert {
  return {
    statement_id: statementId,
    user_id: userId,
    txn_date: raw.txn_date,
    description: raw.description,
    amount: raw.amount,
    txn_type: raw.txn_type,
    // Phase 5 will set these:
    category: "other",
    fee_type: null,
    tax_type: null,
    gst_amount: 0,
    is_interest: false,
    is_tax: false,
    is_hidden_charge: false,
    is_rent_payment: false,
    is_education_payment: false,
    is_cash_withdrawal: false,
    deleted_at: null,
  };
}

/**
 * Bulk-insert a batch of raw transactions for a given statement.
 *
 * Uses Supabase's batch insert (single round-trip).
 * The existing schema has no unique constraint on individual transactions
 * (same merchant on the same date can appear multiple times legitimately),
 * so duplicate prevention is handled at the statement level:
 * a statement can only exist once per card/month/year, so re-processing
 * is blocked before this function is called.
 *
 * Returns the count of rows inserted.
 */
export async function bulkInsertTransactions(
  rawTransactions: RawTransaction[],
  statementId: string,
  userId: string
): Promise<number> {
  if (rawTransactions.length === 0) return 0;

  const supabase = await createClient();

  const rows: TransactionInsert[] = rawTransactions.map((raw) =>
    buildTransactionInsert(raw, statementId, userId)
  );

  const transactionsTable = supabase.from("transactions") as any;

  const { error, count } = await transactionsTable
    .insert(rows)
    .select("id", {
      count: "exact",
      head: true,
  });

  if (error) {
    throw new Error(`Failed to insert transactions: ${error.message}`);
  }

  return count ?? rows.length;
}

/**
 * Fetch all transactions for a statement, ordered by date.
 */
export async function getTransactionsByStatement(
  statementId: string,
  userId: string
): Promise<Transaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("statement_id", statementId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("txn_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return (data ?? []) as Transaction[];
}

/**
 * Count transactions for a statement.
 * Used by the processor to confirm inserts succeeded.
 */
export async function countTransactionsByStatement(
  statementId: string,
  userId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("statement_id", statementId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Failed to count transactions: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Delete all transactions for a statement.
 * Used when re-processing a statement (soft delete).
 */
export async function softDeleteTransactionsByStatement(
  statementId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

const transactionsTable = supabase.from("transactions") as any;

const { error } = await transactionsTable
  .update({ deleted_at: new Date().toISOString() })
    .eq("statement_id", statementId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(
      `Failed to soft-delete transactions for statement ${statementId}: ${error.message}`
    );
  }
}
