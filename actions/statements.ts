"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getUserStatements,
  getStatementById,
  type StatementWithCard,
} from "@/lib/repositories/statements";
import { getSignedUrl } from "@/lib/supabase/storage";

/**
 * Fetch all statements for the currently authenticated user.
 */
export async function fetchUserStatements(): Promise<StatementWithCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getUserStatements(user.id);
}

/**
 * Generate a signed download URL for a statement PDF.
 * Returns null if the user doesn't own the statement.
 */
export async function getStatementDownloadUrl(
  statementId: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const statement = await getStatementById(statementId, user.id);
  if (!statement) return null;

  try {
    return await getSignedUrl(statement.storage_path);
  } catch {
    return null;
  }
}
