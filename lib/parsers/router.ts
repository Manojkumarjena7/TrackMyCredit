/**
 * lib/parsers/router.ts
 *
 * Routes raw PDF text to the correct bank parser.
 *
 * Adding a new bank requires only:
 *   1. Create the parser in lib/parsers/{bank}/extractor.ts
 *   2. Import and add it to REGISTERED_PARSERS below
 *   Nothing else changes.
 */
import type { RawTransaction } from "./types";
import type { ParseResult, ParserConfig } from "@/lib/parsers/types";
import type { BaseParser } from "@/lib/parsers/base";
import { SBIParser } from "@/lib/parsers/sbi/extractor";
import { RBLParser } from "@/lib/parsers/rbl/extractor";

// ─── Registry ─────────────────────────────────────────────────────────────────
// Order matters: more specific detectors should come first.

function buildRegistry(config: ParserConfig): BaseParser[] {
  return [
    new SBIParser(config),
    new RBLParser(config),
  ];
}

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Given raw text extracted from a PDF, detect the bank, parse the header,
 * and extract all transactions.
 *
 * @param text   Raw text from pdf-parse
 * @param config Optional parser config (e.g. { debug: true })
 * @returns      ParseResult — always returns, never throws
 */
export function routeAndParse(
  text: string,
  config: ParserConfig = {}
): ParseResult {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      bank: null,
      header: null,
      transactions: [],
      error: "PDF text extraction produced empty output. The PDF may be scanned/image-based or password protected.",
    };
  }

  const parsers = buildRegistry(config);

  // Find the first parser that recognises this PDF
  const matched = parsers.find((p) => {
    try {
      return p.detect(text);
    } catch {
      return false;
    }
  });

  if (!matched) {
    return {
      success: false,
      bank: null,
      header: null,
      transactions: [],
      error:
        "Bank not recognised. Currently supported: SBI, RBL. " +
        "Please verify the statement is a supported credit card PDF.",
      raw_text: text.slice(0, 500), // Include start of text to aid debugging
    };
  }

  // Parse header
  let header;
  try {
    header = matched.parseHeader(text);
  } catch (err) {
    return {
      success: false,
      bank: matched.bank,
      header: null,
      transactions: [],
      error:
        err instanceof Error
          ? `Header parsing failed: ${err.message}`
          : "Header parsing failed with unknown error.",
      raw_text: text.slice(0, 500),
    };
  }

  // Parse transactions — non-fatal if none found
  let transactions: RawTransaction[] = [];
  try {
    transactions = matched.parseTransactions(text);
  } catch (err) {
    // Transactions failed but header succeeded — partial success.
    // Store header data, log the error, continue with empty transactions.
    console.error(
      `[Router] Transaction parsing failed for ${matched.bank}:`,
      err
    );
    transactions = [];
  }

  return {
    success: true,
    bank: matched.bank,
    header,
    transactions,
  };
}
