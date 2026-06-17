import { createClient } from "@/lib/supabase/server";

export const STORAGE_BUCKET = "statements";

/**
 * Build a deterministic storage path for a PDF statement.
 * Structure: {userId}/{year}/{month}/{timestamp}-{sanitisedFilename}
 *
 * Including a timestamp prefix prevents collisions when the same filename
 * is uploaded more than once (re-uploads after deletion, etc.).
 */
export function buildStoragePath(
  userId: string,
  year: number,
  month: number,
  originalFilename: string
): string {
  const sanitised = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  const timestamp = Date.now();
  const paddedMonth = String(month).padStart(2, "0");
  return `${userId}/${year}/${paddedMonth}/${timestamp}-${sanitised}`;
}

/**
 * Upload a PDF buffer to Supabase Storage.
 * Returns the storage path on success, throws on failure.
 */
export async function uploadStatementFile(
  path: string,
  fileBuffer: ArrayBuffer
): Promise<string> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return path;
}

/**
 * Generate a short-lived signed URL for downloading/viewing a statement.
 * Default expiry: 60 minutes.
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage (used when rolling back a failed upload).
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    // Log but do not throw — deletion failure should not block the caller.
    console.error(`Storage deletion failed for ${storagePath}:`, error.message);
  }
}
