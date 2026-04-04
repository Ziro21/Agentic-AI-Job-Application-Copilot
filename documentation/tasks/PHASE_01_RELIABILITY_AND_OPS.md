# Phase 1 — Reliability & Operations

**Goal:** Hands-off ingest, clear operational visibility, and fast feedback on regressions.

**Depends on:** Existing collector and `run_logs`.

---

## 1.1 Scheduled ingest (mandatory)

**Objective:** Run `run_greenhouse_ingest()` on a fixed schedule without manual intervention.

### Steps

1. Add `scheduler/run_daily.py` (or `python -m scheduler`) that:
   - Imports `run_greenhouse_ingest` from `agents.greenhouse.collector`
   - Reads `SCHEDULER_ENABLED` from env; exits 0 immediately if disabled
   - Optionally reads `SCHEDULER_TIME_UTC` only if using in-process APScheduler (see below)
   - Calls `run_greenhouse_ingest()` once and exits with code 0 on success, non-zero on unhandled exception
2. **Option A — OS scheduler (recommended for laptop):**
   - Document `crontab` example: `30 6 * * * cd /path && /path/venv/bin/python -m scheduler.run_daily`
   - Document macOS `launchd` plist with `StartCalendarInterval` and `WorkingDirectory`
3. **Option B — APScheduler:** Add `apscheduler` to `requirements.txt`; long-running process that triggers at `SCHEDULER_TIME_UTC`; suitable for single container/VPS
4. Log start/end with structured fields: `run_id`, `run_type=greenhouse_ingest`, `duration_ms`
5. **Acceptance:** After 24h, `run_logs` shows a new row without manual `collector` invocation

---

## 1.2 Stale job lifecycle

**Objective:** Align `jobs.is_active` with architecture doc (jobs not seen in N runs become inactive).

### Steps

1. Add `missed_runs` or derive staleness from `last_seen_at` vs last successful global ingest timestamp
2. At end of each ingest run (or separate batch job):
   - For each job whose `absolute_url` was not returned this run, increment `missed_runs` (requires migration)
   - Reset `missed_runs` to 0 when job appears again
   - When `missed_runs >= N` (e.g. 7), set `is_active = false`
3. **Alternative (simpler):** If `last_seen_at` older than `N * 24h` since last ingest, set `is_active = false` (no new column)
4. API: default `list_jobs` to `is_active=true` unless user toggles “show inactive”
5. **Acceptance:** Stale jobs disappear from default dashboard view but remain queryable

---

## 1.3 Structured logging

**Objective:** Parseable logs for debugging and future log aggregation.

### Steps

1. Configure `logging` JSON formatter or `structlog` (optional dependency)
2. Include: `timestamp`, `level`, `logger`, `message`, `extra` (token, job_id, run_id)
3. Respect `LOG_LEVEL` and optional `LOG_FILE` from `.env`
4. Never log secrets or full `DATABASE_URL`

---

## 1.4 Health and readiness

**Objective:** Orchestrators can probe the API and DB.

### Steps

1. `GET /healthz` — keep lightweight (already exists)
2. Add `GET /readyz` that:
   - Opens a DB session and runs `SELECT 1`
   - Returns 503 if DB unreachable
3. Document for Docker/K8s: liveness = `/healthz`, readiness = `/readyz`

---

## 1.5 CI pipeline

**Objective:** Every push runs automated checks.

### Steps

1. GitHub Actions (or GitLab CI): matrix Python 3.10–3.12
2. Steps: checkout → cache venv → `pip install -r requirements.txt` → `pytest` → `ruff check` (or flake8) → optional `mypy` on `api/` and `agents/`
3. Optional: `dashboard`/`dashboard-v2` job: `npm ci && npm run lint && npm run build`
4. Fail on coverage drop below threshold (optional, phase 2)

---

## 1.6 Run metrics (optional dashboard)

**Objective:** Single place to see “is the system healthy?”

### Steps

1. Expose `/api/metrics/summary` (or reuse `/api/runs/latest` + counts) returning: last run status, jobs total, jobs passing filters last 7d
2. Or integrate Prometheus `/metrics` endpoint (optional)

---

## 1.7 Alerting hooks (optional)

**Objective:** Notify on failed or partial runs.

### Steps

1. After ingest, if `run_log.status == 'failed'` or `'partial'` with `errors_count > threshold`, call webhook URL from env `ALERT_WEBHOOK_URL`
2. Payload: JSON with run id, status, errors_sample

---

## Phase 1 exit criteria

- [x] Daily ingest runs without manual command (`scheduler/run_daily.py`, optional `scheduler/daemon.py`, `documentation/SCHEDULER.md`)
- [x] Stale jobs hidden by default (`missed_runs`, `pipeline/stale_jobs.py`, jobs list defaults to active)
- [x] CI green on main branch (`.github/workflows/ci.yml`, `pytest tests/unit`)
- [x] `/readyz` documents DB connectivity (`GET /readyz`, liveness vs readiness in code comments / `SCHEDULER.md` patterns)
