# Phase 2 — Data & Pipeline

**Goal:** Robust deduplication, traceability of source, and cleaner normalization for future multi-source ingest.

**Depends on:** Phase 1 basics (reliable runs).

---

## 2.1 Deduplication v2

**Objective:** Beyond `absolute_url`, handle cross-source duplicates.

### Steps

1. Implement `content_hash` (SHA-256 of normalized `content_text`) in `jobs`; backfill on next ingest
2. Define `dedupe_key_secondary`: normalized `(company_id, title_normalized, location_normalized)` with collision policy
3. On conflict: merge metadata, keep earliest `discovered_at`, update `last_seen_at`
4. Unit tests: `tests/unit/test_dedupe.py` with fixtures

---

## 2.2 `job_sources` table (if not migrated)

**Objective:** Track where each job was discovered (multi-source future).

### Steps

1. Alembic migration: `job_sources` per `DATABASE_SCHEMA.md`
2. On Greenhouse upsert: insert/update `job_sources` row `(job_id, greenhouse, absolute_url)`
3. Query API: optional `source` filter on jobs list

---

## 2.3 Location normalization

**Objective:** Consistent UK vs remote vs country for filtering and analytics.

### Steps

1. Add `pipeline/normalize_location.py`: map common strings → `{country, region, remote_flag, remote_scope}`
2. Persist `country`, `is_remote` from parser + normalization (partially exists)
3. Extend filters to use structured fields when available, fallback to keyword match

---

## 2.4 Board health

**Objective:** Auto-disable bad tokens after repeated failures.

### Steps

1. On `GreenhouseClientError` 404 for token: set `boards.is_active = false`, log reason
2. Admin API or script: `POST /api/boards/{id}/reactivate`
3. Dashboard: show “inactive boards” in settings or runs page

---

## 2.5 Ingest idempotency

**Objective:** Safe retries and overlapping runs.

### Steps

1. Wrap per-board transaction boundaries (already partially committed per board)
2. Document: single writer per environment; if horizontal scaling later, use advisory locks or queue
3. Add `run_logs.ended_at` populated in `finally` block (verify column exists)

---

## 2.6 Data quality checks

**Objective:** Catch bad rows before they pollute UX.

### Steps

1. Reject jobs with empty `title` or `absolute_url` (already skip with logging — formalize metrics)
2. Optional: `jobs.data_quality_flags` JSONB for “missing_description”, “short_content”

---

## Phase 2 exit criteria

- [x] Dedupe tests pass; documented merge strategy (`pipeline/dedupe.py`, secondary merge in `collector._upsert_job`)
- [x] `job_sources` populated for Greenhouse rows (migration `0003`, `_sync_greenhouse_job_source`)
- [ ] Token 404 auto-disables board after repeated failures
