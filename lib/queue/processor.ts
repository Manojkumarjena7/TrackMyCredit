/**
 * lib/queue/processor.ts
 *
 * Orchestrates the full PDF processing pipeline for a single statement.
 *
 * Called by: app/api/process/[statementId]/route.ts
 *
 * Steps:
 *  1.  Fetch statement row (validates ownership, gets storage_path)
 *  2.  Fetch the pending processing job
 *  3.  Mark job → processing, statement → processing
 *  4.  Download PDF from Supabase Storage
 *  5.  Extract text with pdf-parse
 *  6.  Route text to correct bank parser
 *  7.  Parse header (statement metadata)
 *  8.  Parse transactions
 *  9.  Bulk-insert transactions (category = "other" until Phase 5)
 * 10.  Update statement with parsed header data + status = complete
 * 11.  Mark job → complete
 *
 * On any failure after step 3:
 *  → Mark job → failed with error message
 *  → Mark statement → failed
 *  → Return ProcessorResult with success = false
 */

import { extractPdfText } from "@/lib/pdf/extractText";
import { downloadStatementFile } from "@/lib/supabase/storage";
import { getStatementById, updateStatementAfterParsing } from "@/lib/repositories/statements";
import { getLatestJobForStatement, startJob, completeJob, failJob } from "@/lib/repositories/jobs";
import { bulkInsertTransactions, softDeleteTransactionsByStatement } from "@/lib/repositories/transactions";
import { routeAndParse } from "@/lib/parsers/router";

export interface ProcessorResult {
  success: boolean;
  statementId: string;
  jobId: string | null;
  bank: string | null;
  transactionsInserted: number;
  error?: string;
}

/**
 * Run the full processing pipeline for a statement.
 *
 * @param statementId  UUID of the statement to process
 * @param userId       UUID of the owning user (used for RLS validation)
 * @param debug        When true, parsers emit verbose console output
 */
export async function processStatement(
  statementId: string,
  userId: string,
  debug = false
): Promise<ProcessorResult> {
  // ── 1. Fetch statement ────────────────────────────────────────────────────
  const statement = await getStatementById(statementId, userId);

  if (!statement) {
    return {
      success: false,
      statementId,
      jobId: null,
      bank: null,
      transactionsInserted: 0,
      error: "Statement not found or access denied.",
    };
  }

  if (statement.processing_status === "complete") {
    return {
      success: false,
      statementId,
      jobId: null,
      bank: null,
      transactionsInserted: 0,
      error: "Statement has already been processed. Delete transactions first to re-process.",
    };
  }

  // ── 2. Fetch processing job ───────────────────────────────────────────────
  const job = await getLatestJobForStatement(statementId, userId);

  if (!job) {
    return {
      success: false,
      statementId,
      jobId: null,
      bank: null,
      transactionsInserted: 0,
      error: "No processing job found for this statement.",
    };
  }

  const jobId = job.id;

  // ── 3. Mark as in-progress ────────────────────────────────────────────────
  try {
    await startJob(jobId);
    await updateStatementAfterParsing(statementId, {
      statement_month: statement.statement_month,
      statement_year: statement.statement_year,
      opening_balance: statement.opening_balance,
      closing_balance: statement.closing_balance,
      minimum_due: statement.minimum_due,
      total_debits: statement.total_debits,
      total_credits: statement.total_credits,
      processing_status: "failed", // pessimistic default — updated to complete on success
    });
  } catch (err) {
    // Can't update status — return early, don't attempt processing
    return {
      success: false,
      statementId,
      jobId,
      bank: null,
      transactionsInserted: 0,
      error: `Failed to initialise processing: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // All subsequent failures must call failJob() before returning ─────────────

  // ── 4. Download PDF ───────────────────────────────────────────────────────
let pdfBuffer: Buffer;

try {
  pdfBuffer = await downloadStatementFile(statement.storage_path);

  console.log("PDF SIZE:", pdfBuffer.length);
  console.log(
    "PDF HEADER:",
    pdfBuffer.slice(0, 50).toString()
  );
} catch (err) {
  const message =
    `PDF download failed: ${
      err instanceof Error ? err.message : String(err)
    }`;

  await failJob(jobId, message);

  return {
    success: false,
    statementId,
    jobId,
    bank: null,
    transactionsInserted: 0,
    error: message,
  };
}

  // ── 5. Extract text ───────────────────────────────────────
// ── 5. Extract text ───────────────────────────────────────────────────────
  let extraction: { text: string; pageCount: number };
  try {
    extraction = await extractPdfText(pdfBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failJob(jobId, message);
    return { success: false, statementId, jobId, bank: null, transactionsInserted: 0, error: message };
  }

  const rawText = extraction.text;
  console.log("===== RAW PDF TEXT START =====");
  console.log(rawText);
  console.log("===== RAW PDF TEXT END =====");
  console.log("TEXT LENGTH:", rawText.length);
  console.log("PAGE COUNT:", extraction.pageCount);

  // ── 6–8. Route, parse header, parse transactions ─────────────────────────
  const parseResult = routeAndParse(rawText, { debug });

  if (!parseResult.success || !parseResult.header) {
    const message = parseResult.error ?? "Parsing failed with unknown error.";
    await failJob(jobId, message);
    return {
      success: false,
      statementId,
      jobId,
      bank: parseResult.bank,
      transactionsInserted: 0,
      error: message,
    };
  }

  const { header, transactions, bank } = parseResult;

  // ── 9. Insert transactions ────────────────────────────────────────────────
  // Soft-delete any previously inserted transactions first (re-process safety)
  // ── 9. Insert transactions ────────────────────────────────
let transactionsInserted = 0;

try {
  await softDeleteTransactionsByStatement(statementId, userId);

  transactionsInserted = await bulkInsertTransactions(
    transactions,
    statementId,
    userId
  );
} catch (err: unknown) {
  const message = `Transaction storage failed: ${
    err instanceof Error ? err.message : String(err)
  }`;

  await failJob(jobId, message);

  return {
    success: false,
    statementId,
    jobId,
    bank,
    transactionsInserted: 0,
    error: message,
  };
}
  // ── 10. Update statement with parsed data ─────────────────────────────────
  try {
    await updateStatementAfterParsing(statementId, {
      statement_month: header.statement_month,
      statement_year: header.statement_year,
      opening_balance: header.opening_balance,
      closing_balance: header.closing_balance,
      minimum_due: header.minimum_due,
      total_debits: header.total_debits,
      total_credits: header.total_credits,
      processing_status: "complete",
    });
  } catch (err) {
    const message = `Failed to update statement after parsing: ${err instanceof Error ? err.message : String(err)}`;
    await failJob(jobId, message);
    return { success: false, statementId, jobId, bank, transactionsInserted, error: message };
  }

  // ── 11. Complete job ──────────────────────────────────────────────────────
  await completeJob(jobId);

  return {
    success: true,
    statementId,
    jobId,
    bank,
    transactionsInserted,
  };
}
