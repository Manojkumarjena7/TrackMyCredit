/**
 * app/api/process/[statementId]/route.ts
 *
 * POST /api/process/:statementId
 *
 * Triggers the full PDF processing pipeline for a statement.
 * Auth-gated — user must own the statement.
 *
 * Called by:
 *   - The upload flow (after successful PDF storage)
 *   - Future: webhook / cron for retry logic
 *
 * Returns:
 *   200  { success: true, statementId, jobId, bank, transactionsInserted }
 *   400  { success: false, error: "..." }   — validation / not found
 *   401  { success: false, error: "Unauthorized" }
 *   500  { success: false, error: "..." }   — unexpected failure
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processStatement } from "@/lib/queue/processor";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ statementId: string }> }
) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ── Validate params ────────────────────────────────────────────────────────
  const { statementId } = await params;

  if (!statementId || typeof statementId !== "string") {
    return NextResponse.json(
      { success: false, error: "statementId is required." },
      { status: 400 }
    );
  }

  // UUID format check
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(statementId)) {
    return NextResponse.json(
      { success: false, error: "Invalid statementId format." },
      { status: 400 }
    );
  }

  // ── Process ────────────────────────────────────────────────────────────────
  try {
    const result = await processStatement(statementId, user.id);
    console.log(
  "PROCESS RESULT:",
  JSON.stringify(result, null, 2)
);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(`[/api/process/${statementId}] Unexpected error:`, err);
    return NextResponse.json(
      {
        success: false,
        statementId,
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during processing.",
      },
      { status: 500 }
    );
  }
}
