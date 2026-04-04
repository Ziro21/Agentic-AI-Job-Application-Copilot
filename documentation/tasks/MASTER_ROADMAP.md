# Advanced Development Tasks — Master Roadmap

**Purpose:** Ordered, actionable work items to evolve the Agentic AI Job Application Copilot into a production-grade system. Use with `methodology(kanban).md` and `PROJECT_CONTEXT_PROMPT.md`.

**Principles**

- **Human-in-the-loop:** Never auto-submit to ATS; auditability of filters and scores.
- **Idempotent ingest:** Re-running the collector must not corrupt data; dedupe by canonical keys.
- **Observable:** Every scheduled run leaves a trace (`run_logs`, structured logs, optional metrics).
- **Config-as-code:** Tokens and thresholds in versioned templates; secrets only in env.
- **Test the pipeline:** Unit tests for filters/scoring; integration tests against recorded API fixtures.

---

## How to use this folder

| File | Contents |
|------|----------|
| `MASTER_ROADMAP.md` (this file) | Phases, dependencies, priority order |
| `PHASE_01_RELIABILITY_AND_OPS.md` | Scheduler, stale jobs, observability, CI |
| `PHASE_02_DATA_AND_PIPELINE.md` | Schema, dedupe, normalization, multi-source prep |
| `PHASE_03_API_AND_BACKEND.md` | FastAPI hardening, auth, pagination, webhooks |
| `PHASE_04_FRONTEND_AND_UX.md` | Dashboard consolidation, a11y, PWA |
| `PHASE_05_INTELLIGENCE_AND_CONTENT.md` | Profile, LLM drafts, evaluation |
| `PHASE_06_SECURITY_AND_COMPLIANCE.md` | Secrets, GDPR, rate limits |
| `PHASE_07_PRODUCTION_AND_SCALE.md` | Deploy, backups, SLOs, cost |

Execute phases roughly in numeric order; tasks inside each file are ordered unless marked parallel.

---

## Current baseline (snapshot)

**Done:** Greenhouse client/parser/collector, filters, scoring, SQLAlchemy models, Alembic, FastAPI (jobs, applications, runs), CORS, Next.js dashboard(s), `run_logs` on ingest.

**Phase 1 (Reliability & ops) — complete:** Scheduled ingest (`scheduler/run_daily.py`, optional `daemon.py`), stale-job lifecycle (`missed_runs`, end-of-run pass), structured JSON logging, `/` + `/readyz` + metrics summary, optional alert webhook, CI (Python 3.10–3.12, unit tests). Apply DB migration `0002_job_missed_runs` before relying on stale logic.

**Gaps / next:** Phase 2 (in progress): dedupe v2 + `job_sources` done; remaining — location normalization, board 404 auto-disable, data quality flags. Two dashboard codebases; no user_profile/stories in DB as first-class features; API auth for remote deploy (Phase 3).

---

## Phase map (priority order)

```
Phase 1 ─ Reliability & ops     ← highest impact: daily ingest, monitoring, CI
    │
Phase 2 ─ Data & pipeline       ← dedupe v2, job_sources, normalization
    │
Phase 3 ─ API & backend         ← auth, rate limits, OpenAPI contracts
    │
Phase 4 ─ Frontend & UX         ← single dashboard, polish, offline/error UX
    │
Phase 5 ─ Intelligence          ← profile seed, optional LLM (post-MVP)
    │
Phase 6 ─ Security              ← secrets rotation, PII minimization
    │
Phase 7 ─ Production            ← deploy, backups, alerting
```

---

## Quick wins (can start immediately)

1. **Scheduled ingest** — cron/launchd or `scheduler/run_daily.py` + `SCHEDULER_*` from `.env`.
2. **Root route + health** — `GET /` returns JSON links to `/docs` and `/healthz` (avoid “404 confusion”).
3. **CI workflow** — `pytest` + `ruff`/`black` on push; optional `npm run build` for chosen dashboard.
4. **Token hygiene script** — `scripts/validate_greenhouse_tokens.py` hits API, prints 404 tokens to remove from `settings.yaml`.

---

## Definition of done (global)

- Migrations applied; rollback path documented.
- New code covered by tests or explicitly marked with issue for follow-up.
- Env vars documented in `.env.example`.
- No secrets in git; `config/settings.yaml` remains gitignored where it contains personal prefs.

---

## Links

- Kanban: `documentation/methodology(kanban).md`
- Architecture: `documentation/PROJECT_ARCHITECTURE.md`
- Schema: `documentation/DATABASE_SCHEMA.md`
- Context for AI: `documentation/PROJECT_CONTEXT_PROMPT.md`
- Health probes & ingest alerts: `documentation/HEALTH_AND_ALERTS.md`
