/**
 * scripts/extract-pdf-text.ts
 *
 * Utility script to extract raw text from a PDF file.
 * Use this to capture the exact text output that pdf-parse produces
 * from a real SBI or RBL credit card statement PDF.
 *
 * The output shows you exactly what the parsers will receive, so you can
 * write and verify regex patterns in patterns.ts accurately.
 *
 * USAGE:
 *   npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts <path-to-pdf>
 *
 * EXAMPLES:
 *   npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts ~/Downloads/sbi-dec-2024.pdf
 *   npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts ./statement.pdf > output.txt
 *
 * OUTPUT:
 *   Prints the full extracted text to stdout.
 *   Use > output.txt to save to a file for easier inspection.
 *
 * WHAT TO LOOK FOR:
 *   1. The bank identifier line (to verify SBI_BANK_IDENTIFIER / RBL_BANK_IDENTIFIER)
 *   2. How the statement period / date is formatted
 *   3. How the card number appears (masked format)
 *   4. How balances are labelled and formatted
 *   5. How transaction rows are laid out (columns, spacing, date format)
 *   6. Whether amounts have "Cr" suffix or use separate columns
 *   7. Where the transaction section starts and ends
 *
 * PRIVACY NOTE:
 *   This script only reads the file locally — nothing is sent anywhere.
 *   You can safely redact personal details in the PDF before sharing output.
 */

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Usage: npx ts-node scripts/extract-pdf-text.ts <path-to-pdf>"
    );
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".pdf") {
    console.error(`Expected a .pdf file, got: ${ext}`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

  console.error(`\n📄 File:    ${filePath}`);
  console.error(`   Size:    ${sizeMB} MB`);
  console.error(`   Parsing...\n`);

  const buffer = fs.readFileSync(filePath);

  let result;
  try {
    result = await pdfParse(buffer);
  } catch (err) {
    console.error(
      `❌ pdf-parse failed: ${err instanceof Error ? err.message : String(err)}`
    );
    console.error(
      "\nThis may mean the PDF is password-protected or corrupted."
    );
    process.exit(1);
  }

  if (!result.text || result.text.trim().length === 0) {
    console.error(
      "❌ Extracted text is empty.\n" +
        "This PDF appears to be a scanned image rather than machine-readable text.\n" +
        "The parsers cannot process image-based PDFs — only digitally-generated statements."
    );
    process.exit(1);
  }

  console.error(`✅ Extracted ${result.text.length} characters from ${result.numpages} page(s)\n`);
  console.error("─".repeat(60));
  console.error("EXTRACTED TEXT OUTPUT:");
  console.error("─".repeat(60) + "\n");

  // Print to stdout so it can be piped/redirected separately from the log output
  process.stdout.write(result.text);

  console.error("\n\n" + "─".repeat(60));
  console.error("EXTRACTION COMPLETE");
  console.error("─".repeat(60));
  console.error("\nNext steps:");
  console.error(
    "  1. Review the output above to identify the exact text format"
  );
  console.error(
    "  2. Update the relevant NEEDS_SAMPLE_PDF patterns in:"
  );
  console.error("       lib/parsers/sbi/patterns.ts  (for SBI statements)");
  console.error("       lib/parsers/rbl/patterns.ts  (for RBL statements)");
  console.error(
    "  3. Update the fixture strings in the corresponding test files"
  );
  console.error("  4. Run the tests to verify: npx jest lib/parsers/");
}

main();
