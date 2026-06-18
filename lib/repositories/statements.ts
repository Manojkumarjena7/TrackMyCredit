import { createClient } from "@/lib/supabase/server";
import type { Statement, StatementInsert } from "@/types";

export interface StatementWithCard extends Statement {
  cards: {
    bank_name: string;
    card_name: string;
    card_last_four: string | null;
  };
}

/**
 * Check whether a statement already exists for this card/month/year.
 * Uses the DB unique constraint but catches it at the application layer
 * so we can return a clean user-facing error rather than a Postgres code.
 */
export async function checkDuplicateStatement(
  cardId: string,
  month: number,
  year: number
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("statements")
    .select("id")
    .eq("card_id", cardId)
    .eq("statement_month", month)
    .eq("statement_year", year)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Duplicate check failed: ${error.message}`);
  }

  return data !== null;
}

/**
 * Insert a new statement row.
 * Callers must run checkDuplicateStatement first.
 */
export async function createStatement(
  insert: StatementInsert
): Promise<Statement> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("statements") as any)
    .insert(insert)
    .select()
    .single();

  if (error) {
    // Surface the Postgres unique-violation code clearly
    if (error.code === "23505") {
      throw new Error(
        "A statement for this card, month, and year already exists."
      );
    }
    throw new Error(`Failed to create statement: ${error.message}`);
  }

  return data as Statement;
}

/**
 * Fetch all statements for the user, joined with card info, newest first.
 */
export async function getUserStatements(
  userId: string
): Promise<StatementWithCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("statements")
    .select(
      `
      *,
      cards (
        bank_name,
        card_name,
        card_last_four
      )
    `
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("statement_year", { ascending: false })
    .order("statement_month", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch statements: ${error.message}`);
  }

  return (data ?? []) as StatementWithCard[];
}

/**
 * Fetch a single statement by ID, verifying ownership.
 */
export async function getStatementById(
  statementId: string,
  userId: string
): Promise<StatementWithCard | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("statements")
    .select(
      `
      *,
      cards (
        bank_name,
        card_name,
        card_last_four
      )
    `
    )
    .eq("id", statementId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch statement: ${error.message}`);
  }

  return data as StatementWithCard;
}

/**
 * Update processing_status on a statement (used by the job processor in later phases).
 */
export async function updateStatementStatus(
statementId: string,
status: "pending" | "processing" | "complete" | "failed"
): Promise<void> {
const supabase = await createClient();

const statementsTable = supabase.from("statements") as any;

const { error } = await statementsTable
.update({ processing_status: status })
.eq("id", statementId);

if (error) {
throw new Error(`Failed to update statement status: ${error.message}`);
}
}


/**
 * Update a statement row with data extracted by the PDF parser.
 * Called by the processor after successful parsing.
 */
export async function updateStatementAfterParsing(
statementId: string,
data: {
statement_month: number;
statement_year: number;
opening_balance: number;
closing_balance: number;
minimum_due: number;
total_debits: number;
total_credits: number;
processing_status: "complete" | "failed";
}
): Promise<void> {
const supabase = await createClient();

const statementsTable = supabase.from("statements") as any;

const { error } = await statementsTable
.update(data)
.eq("id", statementId);

if (error) {
throw new Error(
`Failed to update statement ${statementId} after parsing: ${error.message}`
);
}
}

