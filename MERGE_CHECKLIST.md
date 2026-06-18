# TrackMyCredit — Phase 3 & Phase 4 Merge Checklist

Complete every step in order. Do not skip steps.

---

## Pre-Merge Verification

Before starting, confirm Phase 1 and Phase 2 are fully working:
- [ ] `npm run dev` starts without errors
- [ ] Login (email + Google) works
- [ ] Upload page accepts PDF files
- [ ] Uploaded statements appear in `/dashboard/statements`
- [ ] Supabase Storage bucket `statements` exists with RLS policies applied
- [ ] `npm run build` passes on current Phase 2 code

---

## Step 1 — Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/phase3-phase4-pdf-processing
```

Confirm you are on the new branch:
```bash
git branch --show-current
# Expected output: feature/phase3-phase4-pdf-processing
```

---

## Step 2 — Copy Files

Extract the ZIP and copy files into your repository root.

The ZIP structure mirrors your repository exactly.

**New files to copy (14):**
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

**Modified files to merge carefully (3):**

> ⚠️  These files already exist in your repository.
> The ZIP versions contain the FULL file (original content + new functions appended).
> Replace the existing file with the ZIP version.

```
lib/repositories/jobs.ts
  → New functions added: startJob(), completeJob(), failJob()
  → Original 3 functions (createProcessingJob, getLatestJobForStatement, getJobById) UNCHANGED

lib/repositories/statements.ts
  → New function added: updateStatementAfterParsing()
  → Original 5 functions UNCHANGED

lib/supabase/storage.ts
  → New function added: downloadStatementFile()
  → Original 4 functions (buildStoragePath, uploadStatementFile, getSignedUrl, deleteStorageFile) UNCHANGED
```

**Verify nothing from Phase 1 or Phase 2 was overwritten:**
```bash
git diff --name-only
```

Expected: only the 17 Phase 3/4 files should appear as changed/new.

---

## Step 3 — Install Packages

Phase 3/4 uses `pdf-parse` which was already declared in Phase 1 `package.json`.

Confirm it is installed:
```bash
npm list pdf-parse
```

If not installed:
```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

No other new packages are required.

---

## Step 4 — Run `npm run build`

```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
Route (app) ...
```

**If you see TypeScript errors:**

| Error | Fix |
|---|---|
| `Cannot find module 'pdf-parse'` | `npm install pdf-parse @types/pdf-parse` |
| `Cannot find module '@/lib/parsers/...'` | Confirm files were copied into the correct directories |
| `Type error in processor.ts` | Confirm `lib/repositories/statements.ts` was replaced (not just appended to manually) |

---

## Step 5 — Run `npm run dev`

```bash
npm run dev
```

- [ ] Dev server starts without errors
- [ ] No red error overlay on any dashboard page
- [ ] `/dashboard/upload` loads correctly
- [ ] `/dashboard/statements` loads correctly

---

## Step 6 — Verify Endpoints

### 6a. Upload a test statement

1. Go to `/dashboard/upload`
2. Upload a real SBI or RBL credit card PDF
3. Confirm it redirects to `/dashboard/statements`
4. Confirm the statement shows status: **Pending**

### 6b. Trigger processing

Open browser console (F12) while logged in and run:
```javascript
// Replace with the actual statement ID from your Supabase statements table
const statementId = 'PASTE-STATEMENT-UUID-HERE';

fetch(`/api/process/${statementId}`, { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Process result:', data));
```

**Expected (patterns not yet verified):**
```json
{
  "success": false,
  "error": "Statement period not found. Pattern: NEEDS_SAMPLE_PDF verification."
}
```
This is correct at this stage — it means the pipeline ran successfully
all the way to parsing, then hit an unverified pattern. The infrastructure works.

**If you see:**
```json
{ "error": "Unauthorized" }
```
→ You are not logged in. Log in first, then retry.

**If you see:**
```json
{ "error": "PDF download failed: ..." }
```
→ Check that Supabase Storage bucket RLS policies are applied correctly (Phase 2 setup).

### 6c. Poll job status

```javascript
const jobId = 'PASTE-JOB-UUID-HERE'; // from processing_jobs table in Supabase

fetch(`/api/jobs/${jobId}`)
  .then(r => r.json())
  .then(data => console.log('Job status:', data));
```

Expected response shape:
```json
{
  "id": "...",
  "statement_id": "...",
  "status": "failed",
  "error_message": "Statement period not found. Pattern: NEEDS_SAMPLE_PDF verification.",
  "started_at": "...",
  "completed_at": "..."
}
```

### 6d. Verify pattern extraction utility

```bash
npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts path/to/your/statement.pdf
```

Expected: full text of the PDF printed to terminal.

---

## Step 7 — Pattern Verification (before committing to main)

This step must be completed before Phase 3/4 is production-ready.

### For SBI:
1. Run: `npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts sbi-statement.pdf > sbi-output.txt`
2. Open `sbi-output.txt`
3. Update every `NEEDS_SAMPLE_PDF` pattern in `lib/parsers/sbi/patterns.ts`
4. Update fixture strings in `lib/parsers/sbi/extractor.test.ts`
5. Run: `npx jest lib/parsers/sbi/extractor.test.ts`
6. All tests must pass

### For RBL:
1. Run: `npx ts-node --project tsconfig.json scripts/extract-pdf-text.ts rbl-statement.pdf > rbl-output.txt`
2. Open `rbl-output.txt`
3. Update every `NEEDS_SAMPLE_PDF` pattern in `lib/parsers/rbl/patterns.ts`
4. Update fixture strings in `lib/parsers/rbl/extractor.test.ts`
5. Run: `npx jest lib/parsers/rbl/extractor.test.ts`
6. All tests must pass

### End-to-end test after pattern verification:
1. Upload a real SBI statement
2. Trigger: `POST /api/process/{statementId}`
3. Expected result:
```json
{
  "success": true,
  "bank": "SBI",
  "transactionsInserted": 42
}
```
4. Check Supabase → `transactions` table → rows exist with correct dates/amounts
5. Check Supabase → `statements` table → `processing_status = 'complete'`

---

## Step 8 — Commit

```bash
# Stage only Phase 3/4 files
git add \
  lib/parsers/ \
  lib/queue/ \
  lib/repositories/transactions.ts \
  lib/repositories/jobs.ts \
  lib/repositories/statements.ts \
  lib/supabase/storage.ts \
  app/api/process/ \
  app/api/jobs/ \
  scripts/ \
  README_PHASE3_PHASE4.md \
  MERGE_CHECKLIST.md

# Verify staged files
git status

# Commit
git commit -m "Phase 3 & 4: PDF processing infrastructure and transaction extraction engine

- Add modular parser architecture (BaseParser, router, types)
- Add SBI parser (header + transactions) with NEEDS_SAMPLE_PDF patterns
- Add RBL parser (header + transactions) with NEEDS_SAMPLE_PDF patterns
- Add processor orchestrator (download → parse → insert → update status)
- Add transaction bulk insert repository
- Add POST /api/process/[statementId] endpoint
- Add GET /api/jobs/[jobId] status polling endpoint
- Add PDF text extraction utility script
- Add parser test files (SBI + RBL)
- Extend jobs.ts: startJob, completeJob, failJob
- Extend statements.ts: updateStatementAfterParsing
- Extend storage.ts: downloadStatementFile
- No schema changes, no UI changes, no Phase 1/2 modifications"
```

---

## Step 9 — Push

```bash
git push origin feature/phase3-phase4-pdf-processing
```

Open a Pull Request on GitHub.

PR description checklist:
- [ ] `npm run build` passes
- [ ] No Phase 1/2 files modified
- [ ] No schema changes
- [ ] API endpoints respond correctly
- [ ] Pattern verification status noted (pending real PDFs / completed)

---

## Schema Verification

Run this in Supabase SQL Editor to confirm no schema changes are needed:

```sql
-- Verify all columns used by Phase 3/4 exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'statements'
  AND column_name IN (
    'statement_month', 'statement_year', 'opening_balance',
    'closing_balance', 'minimum_due', 'total_debits',
    'total_credits', 'processing_status'
  );
-- Expected: 8 rows

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN (
    'statement_id', 'user_id', 'txn_date', 'description',
    'amount', 'txn_type', 'category', 'fee_type', 'tax_type',
    'gst_amount', 'is_interest', 'is_tax', 'is_hidden_charge',
    'is_rent_payment', 'is_education_payment', 'is_cash_withdrawal'
  );
-- Expected: 16 rows

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'processing_jobs'
  AND column_name IN (
    'status', 'started_at', 'completed_at', 'error_message'
  );
-- Expected: 4 rows
```

All queries must return the expected row counts. If any column is missing, the Phase 1 migrations were not applied correctly.

---

## Rollback Instructions

If anything goes wrong:

```bash
# Discard all changes and return to Phase 2 state
git checkout main
git branch -D feature/phase3-phase4-pdf-processing
```

Phase 1 and Phase 2 are completely unaffected — Phase 3/4 only adds new files
and appends functions to 3 existing files.
