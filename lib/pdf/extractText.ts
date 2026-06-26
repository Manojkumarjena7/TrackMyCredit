/**
 * lib/pdf/extractText.ts
 */

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractPdfText(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error("PDF extraction failed: input buffer is empty or missing.");
  }

  const header = buffer.subarray(0, 4).toString("latin1");
  if (header !== "%PDF") {
    throw new Error(
      "PDF extraction failed: input buffer does not have a valid PDF header. " +
        "The file may be corrupted or not a PDF at all."
    );
  }

  if (typeof (Promise as { withResolvers?: unknown }).withResolvers !== "function") {
    throw new Error(
      "PDF extraction failed: the current Node.js runtime does not support " +
        "Promise.withResolvers, which pdfjs-dist requires (Node 22+ only). " +
        `Detected Node version: ${typeof process !== "undefined" ? process.version : "unknown"}.`
    );
  }

  let getDocument: typeof import("pdfjs-dist/legacy/build/pdf.mjs").getDocument;
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    console.log("PDFJS EXPORTS:", Object.keys(pdfjsLib));

    if ((pdfjsLib as any).GlobalWorkerOptions) {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
        "pdfjs-dist/build/pdf.worker.mjs";

      console.log(
        "WORKER SRC SET TO:",
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc
      );

      console.log(
        "WORKER SRC:",
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc
      );
    }

    getDocument = pdfjsLib.getDocument;

    if (typeof getDocument !== "function") {
      throw new Error(
        `pdfjs-dist loaded but no "getDocument" export was found. ` +
          `Resolved export keys: ${Object.keys(pdfjsLib).join(", ") || "(none)"}`
      );
    }
  } catch (err) {
    throw new Error(
      `PDF extraction failed: pdfjs-dist failed to load. ${describeError(err)}`
    );
  }

  const data = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

 let pdfDocument: import("pdfjs-dist/legacy/build/pdf.mjs").PDFDocumentProxy;

  try {
    const loadingTask = getDocument({
      data,
    } as any);

    console.log("LOADING PDF...");

    pdfDocument = await loadingTask.promise;

    console.log("PDF LOADED");
    console.log("PDF PAGE COUNT:", pdfDocument.numPages);
    } catch (err) {
      const message = describeError(err);
      const name = isErrorWithName(err) ? err.name : "";

    if (name === "PasswordException" || /password/i.test(message)) {
      throw new Error(
        "PDF extraction failed: this PDF is password-protected or encrypted and cannot be read without a password."
      );
    }

    throw new Error(
      `PDF extraction failed: the file could not be parsed and may be corrupted or malformed. ${message}`
    );
  }

    const pageCount = pdfDocument.numPages;

    if (!pageCount || pageCount < 1) {
      throw new Error(
        "PDF extraction failed: the document reports zero pages. " +
          "The file may be corrupted or empty."
      );
    }

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      console.log(
        "PAGE",
        pageNumber,
        "TEXT ITEMS:",
        textContent.items.length
      );

      console.log(
        "FIRST ITEMS:",
        textContent.items.slice(0, 10)
      );
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      pageTexts.push(pageText);
    } catch (err) {
      throw new Error(
        `PDF extraction failed: could not extract text from page ${pageNumber} ` +
          `of ${pageCount}. ${describeError(err)}`
      );
    }
  }

  const text = pageTexts.join("\n").trim();

  if (text.length === 0) {
    throw new Error(
      "PDF extraction failed: the document parsed successfully but contains " +
        "no extractable text. The file may be a scanned image rather than a " +
        "digitally-generated PDF."
    );
  }

  return { text, pageCount };
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err === undefined) return "(no error details provided)";
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isErrorWithName(err: unknown): err is { name: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    typeof (err as { name: unknown }).name === "string"
  );
}