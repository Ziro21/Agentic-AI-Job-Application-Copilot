# Agentic AI Job Application Copilot — Full Project Context Prompt

**Use this prompt with Claude Code (or any AI) when starting a new session with no prior context. Copy the entire content below.**

---

## 1. Project Overview

**Agentic AI Job Application Copilot** is an intelligent system that automates job discovery, analysis, and application tracking for UK entry-level AI/ML roles. It fetches jobs from the Greenhouse Job Board API, filters them for UK + entry-level + AI/ML relevance, scores them by match quality (0–100), stores them in PostgreSQL, and presents them in a Next.js dashboard.

**Core principle**: The system does NOT auto-submit applications. The user always controls final submission. It is a copilot, not an autopilot.

**Target user**: A graduate/junior developer (e.g. MSc AI student) seeking ML Engineer, AI Engineer, Data Scientist roles in the UK.

---

## 2. What Has Been Built (Current State)

### 2.1 Backend (Python)

**Greenhouse Ingest Pipeline**
- `agents/greenhouse/client.py` — HTTP client with retries, timeouts, rate limiting. Fetches from `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`
- `agents/greenhouse/parser.py` — Converts raw Greenhouse JSON → canonical `JobIngestPayload` (title, location, absolute_url, content_html, company_name, etc.)
- `agents/greenhouse/collector.py` — Main entrypoint. For each configured board token: fetch → parse → filter → score → upsert. Creates `RunLog` per run. Run with: `python -m agents.greenhouse.collector`

**Pipeline**
- `pipeline/html_to_text.py` — Converts HTML job descriptions to plain text (BeautifulSoup)
- `pipeline/filters.py` — Rules-based filters: UK (location keywords), entry-level (graduate, junior, etc.), AI/ML (machine learning, pytorch, etc.). Returns `FilterResult` with booleans + reasons. Uses `config/settings.yaml` filters (location.countries, cities, remote_keywords; entry_level_keywords; ai_ml_keywords; exclude_keywords)
- `pipeline/scoring.py` — 0–100 match score with reasons. Uses: skill overlap (AI/ML keywords), priority skills (Python, TensorFlow, PyTorch, SQL, cloud), role-type match, seniority penalty, entry-level bonus, location bonus. Configurable via `config/settings.yaml` scoring section

**Database**
- `db/models.py` — SQLAlchemy ORM: `Company`, `Board`, `Job`, `RunLog`, `Application`
- `db/session.py` — Session factory, `SessionLocal`, `expire_on_commit=False` (avoids DetachedInstanceError)
- `alembic/` — Migrations. Run `alembic upgrade head` to apply

**API (FastAPI)**
- `api/main.py` — FastAPI app with CORS for `localhost:3000`. Endpoints:
  - `GET /healthz` — Health check
  - `GET /api/jobs` — List jobs (q, min_score, is_active, passed_filters_only, page, page_size, sort=score_desc|recent_desc)
  - `GET /api/jobs/{id}` — Job detail (full description, match/filter reasons, application)
  - `PUT /api/jobs/{id}/application` — Create/update application (status, applied_at, notes, etc.)
  - `GET /api/applications` — List applications (status filter, pagination). Returns `job_title` and `company_name` per application
  - `GET /api/runs/latest` — Latest ingest run
  - `GET /api/runs` — Run history (paginated)

**Configuration**
- `config/loader.py` — Loads `.env` (override=True) and `config/settings.yaml`. Functions: `get_database_url()`, `get_greenhouse_settings()`, `get_filters()`, etc.
- `config/settings.yaml` — Gitignored. Copy from `config/settings.example.yaml`. Contains: `sources.greenhouse.board_tokens`, `filters` (location, entry_level_keywords, ai_ml_keywords, exclude_keywords), `scoring` (weights), `user_preferences` (target_location, role_types, etc.)
- `.env` — Gitignored. Copy from `.env.example`. Required: `DATABASE_URL` (PostgreSQL, use Supabase Session Pooler for cloud: `postgresql://...@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`)

### 2.2 Frontend (Next.js)

**Dashboard** (`dashboard/`)
- Next.js 16, TypeScript, Tailwind CSS, React Query (TanStack Query), date-fns
- Dark theme (zinc palette), DM Sans + JetBrains Mono fonts
- `src/lib/api.ts` — Typed API client. Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- `src/lib/types.ts` — TypeScript types matching API schemas
- **Pages**:
  - `/` — Jobs list: filters (search, min score, passed filters only), sort (score/recent), pagination, IngestStatus component
  - `/jobs/[id]` — Job detail: full description, filter/match reasons, application status, actions (Save, Mark Applied, status buttons), external Apply link
  - `/applications` — Application tracker: list with status filter, quick status dropdown, job title/company
  - `/runs` — Ingest run history table
- **Components**: Nav, JobRow, ScoreBadge, FilterBadges, IngestStatus, Providers (QueryClient)

### 2.3 Database Schema (Implemented)

- `companies` — id, name, name_normalized, domain
- `boards` — id, source_type, token, board_url, api_url, is_active
- `jobs` — id, company_id, board_id, title, location_raw, absolute_url, content_html, content_text, filter_is_uk/entry_level/ai_ml, filter_reasons (JSONB), match_score, match_reasons (JSONB), last_seen_at, is_active, etc.
- `run_logs` — id, run_type, status, started_at, boards_checked, jobs_fetched, jobs_created, jobs_updated, errors_count, errors_sample (JSONB)
- `applications` — id, job_id, status (saved|applied|oa|interview|offer|rejected|no_response), applied_at, notes, custom_fields

---

## 3. How to Run

**Prerequisites**: Python 3.10+, Node.js 18+, PostgreSQL (or Supabase)

**Backend**
```bash
cd /path/to/Agentic-AI-Job-Application-Copilot-1
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DATABASE_URL
cp config/settings.example.yaml config/settings.yaml
# Edit config/settings.yaml: add board_tokens
alembic upgrade head
uvicorn api.main:app --reload
```

**Ingest (populate jobs)**
```bash
python -m agents.greenhouse.collector
```

**Dashboard**
```bash
cd dashboard
npm install
npm run dev
```
Open http://localhost:3000. API must be running on port 8000.

---

## 4. Key File Paths

| Path | Purpose |
|------|---------|
| `config/settings.yaml` | Board tokens, filters, scoring, user prefs |
| `.env` | DATABASE_URL, LOG_LEVEL, etc. |
| `agents/greenhouse/collector.py` | Ingest entrypoint |
| `api/main.py` | FastAPI app |
| `db/models.py` | ORM models |
| `pipeline/filters.py` | UK/entry-level/AI-ML filters |
| `pipeline/scoring.py` | Match scoring |
| `dashboard/src/app/page.tsx` | Jobs list |
| `dashboard/src/app/jobs/[id]/page.tsx` | Job detail |

---

## 5. What Is NOT Yet Built

- **Scheduler** — No `scheduler/run_daily.py` or APScheduler/cron. Ingest is manual.
- **Streamlit** — Original docs mention Streamlit; we use Next.js instead.
- **User profile seed** — DB schema exists for user_profile; no seed script.
- **Story bank / content generation** — Post-MVP (behavioural answers, cover letters).
- **Dedupe module** — `pipeline/dedupe.py`: `content_hash` (SHA-256 of normalized text), `dedupe_key_secondary` (company + title + location) for cross-URL merge; primary key remains `absolute_url`.
- **job_sources table** — Migration `0003_dedupe_job_sources`; Greenhouse rows synced in collector (`source_type=greenhouse`, `source_url=absolute_url`).

---

## 6. Known Issues / Notes

- **Invalid board tokens**: Some tokens (e.g. `synthesia`) return 404. Remove them from `config/settings.yaml` when they fail.
- **Supabase**: Use Session Pooler URL (IPv4-compatible), not direct `db.*.supabase.co`.
- **Config**: `.env` overrides env vars when present. `load_dotenv(env_file, override=True)`.
- **Dashboard lib**: `dashboard/src/lib/` is un-ignored via `!dashboard/src/lib/` in root `.gitignore` (because `lib/` is ignored for Python).

---

## 7. Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.10+, FastAPI |
| Database | PostgreSQL, SQLAlchemy 2.0, Alembic |
| Frontend | Next.js 16, TypeScript, Tailwind, React Query |
| Job source | Greenhouse Job Board API |
| Config | python-dotenv, PyYAML |

---

## 8. Glossary

- **Board token**: Greenhouse board identifier (e.g. `graphcore`, `wayve`). URL: `https://boards.greenhouse.io/{token}`
- **Greenhouse API**: `https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`
- **RunLog**: Record of each ingest run (status, counts, errors)
- **Application**: User's tracking of a job (saved, applied, interview, etc.)

---

*Use this document to onboard any AI or developer to the project with full context.*
