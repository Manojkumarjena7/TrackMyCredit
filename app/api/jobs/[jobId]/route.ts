/**
 * app/api/jobs/[jobId]/route.ts
 *
 * GET /api/jobs/:jobId
 *
 * Returns the current status of a processing job.
 * Used by the UI to poll for completion after upload.
 *
 * Returns:
 *   200  { id, status, error_message, started_at, completed_at }
 *   401  Unauthorized
 *   404  Job not found
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getJobById } from "@/lib/repositories/jobs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Validate params ────────────────────────────────────────────────────────
  const { jobId } = await params;

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!jobId || !UUID_REGEX.test(jobId)) {
    return NextResponse.json(
      { error: "Invalid jobId format." },
      { status: 400 }
    );
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  try {
    const job = await getJobById(jobId, user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: job.id,
        statement_id: job.statement_id,
        status: job.status,
        error_message: job.error_message,
        started_at: job.started_at,
        completed_at: job.completed_at,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(`[/api/jobs/${jobId}] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch job status." },
      { status: 500 }
    );
  }
}
