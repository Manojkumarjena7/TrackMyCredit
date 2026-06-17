"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildStoragePath,
  uploadStatementFile,
  deleteStorageFile,
} from "@/lib/supabase/storage";
import {
  validatePdfBuffer,
  validateStatementDate,
} from "@/lib/validation/upload";
import { checkDuplicateStatement, createStatement } from "@/lib/repositories/statements";
import { getCardById, createCard } from "@/lib/repositories/cards";
import { createProcessingJob } from "@/lib/repositories/jobs";
import type { BankName } from "@/types";

export interface UploadResult {
  success: boolean;
  error?: string;
  statementId?: string;
  jobId?: string;
}

export interface UploadFormValues {
  // Existing card — provide cardId
  cardId?: string;
  // New card — provide these instead
  bankName?: BankName;
  cardName?: string;
  cardLastFour?: string;
  // Statement period
  month: number;
  year: number;
}

/**
 * Primary upload action.
 *
 * Called from the UploadZone client component via a FormData post.
 * The file is passed as a File blob in the FormData, all other
 * values are string fields that are parsed and validated here.
 *
 * Execution order:
 *  1. Authenticate
 *  2. Parse + validate form fields
 *  3. Validate PDF buffer (magic bytes + size)
 *  4. Resolve or create card
 *  5. Duplicate detection
 *  6. Upload to Supabase Storage
 *  7. Create statement row
 *  8. Create processing_job row
 *  9. Return { success, statementId, jobId }
 *
 * On any failure after step 6, the uploaded file is deleted (rollback).
 */
export async function uploadStatement(
  formData: FormData
): Promise<UploadResult> {
  // ── 1. Auth ───────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to upload statements." };
  }

  // ── 2. Parse form fields ──────────────────────────────────────────────
  const file = formData.get("file") as File | null;
  const cardId = formData.get("card_id") as string | null;
  const bankName = formData.get("bank_name") as BankName | null;
  const cardName = formData.get("card_name") as string | null;
  const cardLastFour = formData.get("card_last_four") as string | null;
  const monthRaw = formData.get("month") as string | null;
  const yearRaw = formData.get("year") as string | null;

  if (!file) {
    return { success: false, error: "No file was included in the request." };
  }

  const month = parseInt(monthRaw ?? "", 10);
  const year = parseInt(yearRaw ?? "", 10);

  if (isNaN(month) || isNaN(year)) {
    return { success: false, error: "Statement month and year are required." };
  }

  // ── 3. Validate statement date ─────────────────────────────────────────
  const dateValidation = validateStatementDate(month, year);
  if (!dateValidation.valid) {
    return { success: false, error: dateValidation.error };
  }

  // ── 4. Validate PDF buffer (server-side authoritative check) ──────────
  const fileBuffer = await file.arrayBuffer();
  const bufferValidation = validatePdfBuffer(fileBuffer);
  if (!bufferValidation.valid) {
    return { success: false, error: bufferValidation.error };
  }

  // ── 5. Resolve or create card ─────────────────────────────────────────
  let resolvedCardId: string;

  if (cardId) {
    // Verify the card belongs to this user
    const existingCard = await getCardById(cardId, user.id);
    if (!existingCard) {
      return { success: false, error: "Selected card not found." };
    }
    resolvedCardId = existingCard.id;
  } else {
    // Create a new card
    if (!bankName || !cardName) {
      return {
        success: false,
        error: "Bank name and card name are required when adding a new card.",
      };
    }
    const newCard = await createCard(
      user.id,
      bankName,
      cardName.trim(),
      cardLastFour?.trim() || undefined
    );
    resolvedCardId = newCard.id;
  }

  // ── 6. Duplicate detection ────────────────────────────────────────────
  const isDuplicate = await checkDuplicateStatement(resolvedCardId, month, year);
  if (isDuplicate) {
    const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", {
      month: "long",
    });
    return {
      success: false,
      error: `A statement for ${monthName} ${year} already exists for this card. Delete the existing statement before uploading a new one.`,
    };
  }

  // ── 7. Upload to Supabase Storage ─────────────────────────────────────
  const storagePath = buildStoragePath(user.id, year, month, file.name);

  let uploadedPath: string;
  try {
    uploadedPath = await uploadStatementFile(storagePath, fileBuffer);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "File upload failed.",
    };
  }

  // ── 8. Create statement DB row ────────────────────────────────────────
  let statementId: string;
  try {
    const statement = await createStatement({
      card_id: resolvedCardId,
      user_id: user.id,
      statement_month: month,
      statement_year: year,
      opening_balance: 0,
      closing_balance: 0,
      minimum_due: 0,
      total_debits: 0,
      total_credits: 0,
      storage_path: uploadedPath,
      processing_status: "pending",
      uploaded_at: new Date().toISOString(),
      deleted_at: null,
    });
    statementId = statement.id;
  } catch (err) {
    // Rollback: remove uploaded file so storage doesn't accumulate orphans
    await deleteStorageFile(uploadedPath);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record statement.",
    };
  }

  // ── 9. Create processing job ──────────────────────────────────────────
  let jobId: string;
  try {
    const job = await createProcessingJob(statementId, user.id);
    jobId = job.id;
  } catch (err) {
    // Non-fatal: statement is created; job can be retried later.
    // Log the error but still report upload success.
    console.error("Failed to create processing job:", err);
    return {
      success: true,
      statementId,
    };
  }

  return { success: true, statementId, jobId };
}
