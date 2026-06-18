# TrackMyCredit — Phase 3 & Phase 4

## PDF Processing Infrastructure + Transaction Extraction Engine

---

## What This Phase Delivers

### Phase 3 — PDF Processing Infrastructure
- PDF download from Supabase Storage
- Raw text extraction via `pdf-parse`
- Bank auto-detection from PDF text
- SBI statement header parsing (month, year, balances, card number, due dates)
- Processing job lifecycle management (pending → processing → complete/failed)
- Statement record update after successful parse
- POST `/api/process/[statementId]` — trigger processing
- GET `/api/jobs/[jobId]` — poll job status

### Phase 4 — Transaction Extraction Engine
- SBI transaction row extraction
- RBL transaction row extraction
- Modular parser architecture (new banks plug in without touching the engine)
- Bulk transaction insert into `transactions` table
- All transactions stored with `category = "other"` (Phase 5 categorizes)
- Re-processing safety (soft-deletes old transactions before re-inserting)

### Parser Architecture
```
lib/parsers/
├── types.ts          ← shared contract (ParsedHeader, RawTransaction, ParseResult)
├── base.ts           ← abstract BaseParser (detect, parseHeader, parseTransactions)
├── router.ts         ← detects bank, dispatches to correct parser
├── sbi/
│   ├── patterns.ts   ← regex patterns (NEEDS_SAMPLE_PDF verification)
│   └── extractor.ts  ← SBI concrete parser
└── rbl/
    ├── patterns.ts   ← regex patterns (NEEDS_SAMPLE_PDF verification)
    └── extractor.ts  ← RBL concrete parser
```

---

## ⚠️ Important: Pattern Verification Required

All regex patterns in `lib/parsers/sbi/patterns.ts` and `lib/parsers/rbl/patterns.ts`
are marked **NEEDS_SAMPLE_PDF**. They are educated structural stubs based on expected
SBI/RBL PDF formats, but **must be verified against real statements** before processing
will work correctly.

### How to verify patterns

**Step 1 — Extract text from a real SBI statement:**
```bash
npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts ~/path/to/sbi-statement.pdf
```

**Step 2 — Save the output:**
```bash
npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts ~/path/to/sbi-statement.pdf > sbi-text-output.txt
```

**Step 3 — Review the output and update patterns:**

Look for:
- How "SBI Card" or "STATE BANK OF INDIA" appears → update `SBI_BANK_IDENTIFIER`
- How the statement period/date is formatted → update `SBI_STATEMENT_PERIOD`
- How the card number appears (masked) → update `SBI_CARD_NUMBER`
- How balances are labelled → update `SBI_OPENING_BALANCE`, `SBI_CLOSING_BALANCE`
- How transaction rows are laid out → update `SBI_TRANSACTION_ROW_GLOBAL`

**Step 4 — Update fixture strings in test files:**
```
lib/parsers/sbi/extractor.test.ts  ← replace SAMPLE_SBI_* constants
lib/parsers/rbl/extractor.test.ts  ← replace SAMPLE_RBL_* constants
```

**Step 5 — Run tests:**
```bash
npx jest lib/parsers/sbi/extractor.test.ts
npx jest lib/parsers/rbl/extractor.test.ts
```

---

## Files in This Package

### New Files (14 including docs)
```
lib/parsers/types.ts
lib/parsers/base.ts
lib/parsers/router.ts
lib/parsers/sbi/patterns.ts
lib/parsers/sbi/extractor.ts
lib/parsers/sbi/extractor.test.ts
lib/parsers/rbl/patterns.ts
lib/parsers/rbl/extractor.ts
lib/parsers/rbl/extractor.test.ts
lib/repositories/transactions.ts
lib/queue/processor.ts
app/api/process/[statementId]/route.ts
app/api/jobs/[jobId]/route.ts
scripts/extract-pdf-text.ts
```

### Modified Files (3)
```
lib/repositories/jobs.ts         ← added: startJob, completeJob, failJob
lib/repositories/statements.ts   ← added: updateStatementAfterParsing
lib/supabase/storage.ts          ← added: downloadStatementFile
```

### Not Modified (confirmed)
- All Phase 1 files (auth, layout, sidebar, middleware)
- All Phase 2 files (upload UI, statement list, upload action, storage bucket config)
- All database migrations (001, 002, 003)
- No schema changes
- No new environment variables

---

## npm Packages

No new packages required. All dependencies were already declared in Phase 1:

```json
"pdf-parse": "^1.1.1",
"@types/pdf-parse": "^1.1.4"
```

Confirm they are installed:
```bash
npm list pdf-parse
```

If missing:
```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

---

## Environment Variables

No new environment variables are required. Phase 1 variables cover everything:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=...
```

---

## Merge Instructions

See `MERGE_CHECKLIST.md` for the step-by-step merge process.

The ZIP is structured to mirror your repository root. Copy files into place preserving
the directory structure exactly.

---

## Testing the Processing Pipeline

### 1. Trigger processing via API

After uploading a statement, call:
```bash
curl -X POST https://your-app.vercel.app/api/process/{statementId} \
  -H "Cookie: <your-auth-cookie>"
```

Or from the browser console (when logged in):
```javascript
fetch('/api/process/YOUR_STATEMENT_ID', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

### 2. Poll job status

```javascript
fetch('/api/jobs/YOUR_JOB_ID')
  .then(r => r.json())
  .then(console.log)
```

Expected response when complete:
```json
{
  "id": "...",
  "statement_id": "...",
  "status": "complete",
  "error_message": null,
  "started_at": "2025-01-01T10:00:00Z",
  "completed_at": "2025-01-01T10:00:03Z"
}
```

### 3. Verify transactions in Supabase

In Supabase SQL Editor:
```sql
SELECT
  txn_date,
  description,
  amount,
  txn_type,
  category
FROM transactions
WHERE statement_id = 'YOUR_STATEMENT_ID'
ORDER BY txn_date;
```

All rows should have `category = 'other'` until Phase 5 categorization.

### 4. Verify statement header update

```sql
SELECT
  statement_month,
  statement_year,
  opening_balance,
  closing_balance,
  minimum_due,
  total_debits,
  total_credits,
  processing_status
FROM statements
WHERE id = 'YOUR_STATEMENT_ID';
```

`processing_status` should be `complete` after successful processing.

---

## Running Tests

```bash
# Run all parser tests
npx jest lib/parsers/

# Run SBI tests only
npx jest lib/parsers/sbi/extractor.test.ts

# Run RBL tests only
npx jest lib/parsers/rbl/extractor.test.ts

# Run with verbose output
npx jest lib/parsers/ --verbose
```

**Note:** Tests will fail on pattern-dependent assertions until you update
`patterns.ts` files with verified regex from real PDF output. Detection tests
(the `detect()` suite) will pass immediately as they match simple strings.

---

## Build Verification

```bash
npm run build
```

Expected: exits 0, no TypeScript errors, no missing module errors.

If you see `Cannot find module 'pdf-parse'`:
```bash
npm install pdf-parse @types/pdf-parse
```

---

## Processing Flow Summary

```
POST /api/process/{statementId}
         │
         ▼
    processor.ts
         │
    ┌────┴────────────────────────────────────────┐
    │  1. Fetch statement (validates ownership)   │
    │  2. Fetch processing job                    │
    │  3. Mark job → processing                   │
    │  4. Download PDF from Supabase Storage      │
    │  5. Extract text (pdf-parse)                │
    │  6. router.ts → detect bank                 │
    │  7. parser.parseHeader() → metadata         │
    │  8. parser.parseTransactions() → rows       │
    │  9. bulkInsertTransactions()                │
    │ 10. updateStatementAfterParsing()           │
    │ 11. Mark job → complete                     │
    └─────────────────────────────────────────────┘
         │
         ▼
    { success, bank, transactionsInserted }

On any failure:
    → failJob(jobId, errorMessage)
    → statement.processing_status = "failed"
```

---

## What Comes Next

**Phase 5 — Categorization Engine**
- Keyword-based transaction categorization
- Sets `category`, `fee_type`, `tax_type`, all `is_*` boolean tags
- Runs after Phase 3/4 processing

**Phase 6 — Analytics Engine**
- Computes `statement_analytics` rows
- Writes `analytics_snapshots` (monthly cache)
