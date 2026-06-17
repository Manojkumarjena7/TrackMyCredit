export const UPLOAD_LIMITS = {
  MAX_SIZE_BYTES: 20 * 1024 * 1024, // 20 MB
  MAX_SIZE_LABEL: "20 MB",
  ALLOWED_MIME_TYPES: ["application/pdf"],
  ALLOWED_EXTENSIONS: [".pdf"],
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a File object on the client side before any network call.
 */
export function validatePdfFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(ext as ".pdf")) {
    return {
      valid: false,
      error: `Only PDF files are accepted. You selected a ${ext || "unknown"} file.`,
    };
  }

  // MIME type check (can be spoofed on client — server re-validates)
  if (
    file.type &&
    !UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as "application/pdf")
  ) {
    return {
      valid: false,
      error: "File MIME type is not PDF. Please upload a valid PDF statement.",
    };
  }

  if (file.size > UPLOAD_LIMITS.MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is ${sizeMB} MB. Maximum allowed size is ${UPLOAD_LIMITS.MAX_SIZE_LABEL}.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "The selected file is empty." };
  }

  return { valid: true };
}

/**
 * Validate statement month (1–12) and year (2000–current+1).
 */
export function validateStatementDate(
  month: number,
  year: number
): ValidationResult {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, error: "Statement month must be between 1 and 12." };
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > currentYear + 1) {
    return {
      valid: false,
      error: `Statement year must be between 2000 and ${currentYear + 1}.`,
    };
  }

  // Prevent future statements beyond the current month
  const now = new Date();
  const statementDate = new Date(year, month - 1, 1);
  const firstDayNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );
  if (statementDate >= firstDayNextMonth) {
    return {
      valid: false,
      error: "Cannot upload a statement for a future billing period.",
    };
  }

  return { valid: true };
}

/**
 * Validate ArrayBuffer on the server — checks PDF magic bytes.
 * Real PDFs start with the bytes: %PDF (hex 25 50 44 46).
 */
export function validatePdfBuffer(buffer: ArrayBuffer): ValidationResult {
  if (buffer.byteLength === 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  if (buffer.byteLength > UPLOAD_LIMITS.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds the ${UPLOAD_LIMITS.MAX_SIZE_LABEL} size limit.`,
    };
  }

  // Check PDF magic bytes
  const header = new Uint8Array(buffer.slice(0, 4));
  const isPdf =
    header[0] === 0x25 && // %
    header[1] === 0x50 && // P
    header[2] === 0x44 && // D
    header[3] === 0x46;   // F

  if (!isPdf) {
    return {
      valid: false,
      error: "File does not appear to be a valid PDF. Please upload the original statement PDF.",
    };
  }

  return { valid: true };
}
