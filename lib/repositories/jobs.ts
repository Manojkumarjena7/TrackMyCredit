
import { createClient } from "@/lib/supabase/server";
import type { ProcessingJob, ProcessingJobInsert } from "@/types";

/**
 * Create a processing job for a newly uploaded statement.
 * Always starts with status "pending".
 */
export async function createProcessingJob(
  statementId: string,
  userId: string
): Promise<ProcessingJob> {
  const supabase = await createClient();

  const insert: ProcessingJobInsert = {
    statement_id: statementId,
    user_id: userId,
    status: "pending",
    error_message: null,
    started_at: null,
    completed_at: null,
  };

  const { data, error } = await (supabase .from("processing_jobs") as any) .insert(insert) .select() .single();
  if (error) {
    throw new Error(`Failed to create processing job: ${error.message}`);
  }

  return data as ProcessingJob;
}

/**
 * Fetch the latest job for a given statement.
 * Returns null if no job exists.
 */
export async function getLatestJobForStatement(
  statementId: string,
  userId: string
): Promise<ProcessingJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("processing_jobs")
    .select("*")
    .eq("statement_id", statementId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch processing job: ${error.message}`);
  }

  return data as ProcessingJob | null;
}

/**
 * Fetch job by ID for polling from the UI.
 */
export async function getJobById(
  jobId: string,
  userId: string
): Promise<ProcessingJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("processing_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch job: ${error.message}`);
  }

  return data as ProcessingJob | null;
}

/**
 * Mark a job as started.
 */
export async function startJob(jobId: string): Promise<void> {
  const supabase = await createClient();

  
const jobsTable = supabase.from("processing_jobs") as any;

const { error } = await jobsTable
  .update({
    status: "processing",
    started_at: new Date().toISOString(),
  })
  .eq("id", jobId);


  if (error) {
    throw new Error(`Failed to start job ${jobId}: ${error.message}`);
  }
}

/**
 * Mark a job as successfully completed.
 */


export async function completeJob(jobId: string): Promise<void> {
  const supabase = await createClient();

  
const jobsTable = supabase.from("processing_jobs") as any;

const { error } = await jobsTable
  .update({
    status: "complete",
    completed_at: new Date().toISOString(),
  })
  .eq("id", jobId);



  if (error) {
    throw new Error(`Failed to complete job ${jobId}: ${error.message}`);
  }
}


/**
 * Mark a job as failed with a descriptive error message.
 */
export async function failJob(
jobId: string,
errorMessage: string
): Promise<void> {
const supabase = await createClient();

const jobsTable = supabase.from("processing_jobs") as any;

const { error } = await jobsTable
.update({
status: "failed",
completed_at: new Date().toISOString(),
error_message: errorMessage.slice(0, 1000),
})
.eq("id", jobId);

if (error) {
console.error(`Failed to mark job ${jobId} as failed:`, error.message);
}
}
