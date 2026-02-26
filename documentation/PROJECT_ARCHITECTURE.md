# PROJECT_ARCHITECTURE.md
# Agentic AI Job Application Copilot (UK Entry-Level AI/ML) — Project Architecture

## 1. Goal (MVP)
Build an agentic system that:
- Ingests job postings from **Greenhouse Job Board API** (first source).
- Filters for **UK** + **Entry-level/Graduate** + **AI/ML/Data Science** relevance.
- Deduplicates and stores jobs in a database.
- Scores jobs against a user profile (CV).
- Presents results in a simple UI (Streamlit MVP).
- Generates draft content (later epics): behavioural answers from a story bank, “why this company”, cover letter.
- Tracks application status (Saved → Applied → …).

Non-goals for MVP:
- No automatic application submission to ATS.
- No unsolicited outbound emailing automation.

---

## 2. High-level Architecture

### Core components
1) **Collectors (Agents)**
   - Fetch jobs from sources (Greenhouse first).
   - Optionally discover Greenhouse boards (role-first discovery) in later milestone.

2) **Normalizer + Filter**
   - Convert raw job JSON into a canonical Job model.
   - Extract plain text from HTML content.
   - Apply filters (UK, entry-level, AI/ML relevance).

3) **Database Layer**
   - Stores canonical jobs, sources, boards, companies, runs, user profile, stories, generated content, applications.

4) **Scoring Engine**
   - Computes match scores (0–100) + explanations.

5) **UI**
   - Dashboard of jobs + filters + job detail view.
   - Actions: Save, mark Applied, add notes, generate drafts, copy content.

6) **Scheduler**
   - Runs collectors on a schedule (daily) and records run results.

---

## 3. Data Flow (MVP)

### 3.1 Greenhouse ingest flow
1. Scheduler triggers `greenhouse_collector`.
2. Collector fetches jobs list for each configured board token:
   - `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`
3. For each job record:
   - Normalize fields → canonical job payload.
   - Clean HTML → plain text.
   - Compute dedupe keys.
4. Upsert into database:
   - Insert/update `companies`, `boards`, `job_sources`, `jobs`.
5. Run filter pipeline:
   - Save filter flags + reasons.
6. Run scorer:
   - Save match score + explanation.
7. UI reads from DB and shows ranked jobs.

### 3.2 Optional board discovery flow (later epic)
1. Discovery agent runs search queries and extracts tokens (e.g. from `boards.greenhouse.io/<token>` URLs).
2. Token validator hits:
   - `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs`
3. Valid tokens are stored in `boards` and added to ingestion list.

---

## 4. Repository Structure (recommended)

```
agentic-job-copilot/
  README.md
  KANBAN.md
  PROJECT_ARCHITECTURE.md
  DATABASE_SCHEMA.md

  config/
    settings.example.yaml
    settings.yaml                # ignored by git (contains your local prefs)
    keywords.yaml                # AI/ML + entry-level + UK keyword sets

  agents/
    __init__.py
    greenhouse/
      __init__.py
      client.py                  # HTTP client + retry/backoff + rate limiting
      collector.py               # fetch jobs list + upsert pipeline
      parser.py                  # map Greenhouse JSON -> canonical model
      validators.py              # validate board tokens + API health checks
    discovery/
      __init__.py
      board_discovery.py         # (later) discover greenhouse boards via search results
      token_extractor.py         # (later) parse URLs -> tokens

  pipeline/
    __init__.py
    normalize.py                 # title/location normalization
    html_to_text.py              # clean HTML descriptions to text
    filters.py                   # UK + entry-level + AI/ML relevance filters
    dedupe.py                    # dedupe keys + merge logic
    scoring.py                   # baseline scoring + explanations
    content_gen.py               # (later) behavioural answers, why-company, cover letter

  db/
    __init__.py
    session.py                   # SQLAlchemy session, engine, connection
    models.py                    # ORM models
    migrations/                  # Alembic migrations
    crud/
      __init__.py
      jobs.py
      boards.py
      applications.py
      profile.py
      stories.py

  api/                           # optional in MVP (Streamlit can read DB directly)
    __init__.py
    main.py                      # FastAPI app
    routes/
      jobs.py
      applications.py
      profile.py

  ui/
    streamlit_app.py             # MVP UI entrypoint
    pages/
      01_jobs_dashboard.py
      02_job_detail.py
      03_story_bank.py
      04_application_tracker.py
    components/
      filters.py
      job_cards.py
      editors.py

  scheduler/
    run_daily.py                 # cron/APScheduler entry
    tasks.py                     # scheduled tasks definitions

  tests/
    unit/
      test_filters.py
      test_html_to_text.py
      test_dedupe.py
      test_scoring.py
    integration/
      test_greenhouse_ingest.py
    fixtures/
      greenhouse_job_list.json

  scripts/
    seed_profile.py              # load your CV profile initially
    seed_boards.py               # add known board tokens (graphcore, wayve, etc.)
    export_jobs_csv.py           # optional utility

  .env.example
  .gitignore
  pyproject.toml / requirements.txt
```

---

## 5. Key Modules (what each does)

### 5.1 `agents/greenhouse/client.py`
Responsibilities:
- Make HTTP requests with:
  - retry + exponential backoff
  - timeouts
  - basic per-domain rate limiting (sleep between requests)
- Return raw JSON

Key functions:
- `get_jobs(token: str, include_content: bool = True) -> dict`
- `get_job_detail(token: str, job_id: int) -> dict` (optional)

### 5.2 `agents/greenhouse/parser.py`
Responsibilities:
- Convert Greenhouse JSON into a canonical `JobIngestPayload` structure.
- Extract fields:
  - `external_id` (Greenhouse job id)
  - `title`, `location_raw`, `absolute_url`, `updated_at`, `content_html`

### 5.3 `pipeline/html_to_text.py`
Responsibilities:
- Convert HTML to plain text while preserving bullet points and headings reasonably.
- Output `content_text` used by filters and scoring.

### 5.4 `pipeline/filters.py`
Responsibilities:
- Determine boolean flags + reasons:
  - `is_uk`
  - `is_entry_level`
  - `is_ai_ml_relevant`
- Produce `filter_reasons` (human-readable list)

### 5.5 `pipeline/dedupe.py`
Responsibilities:
- Compute dedupe keys:
  - `dedupe_key_primary`: absolute_url (canonical if present)
  - `dedupe_key_secondary`: normalized company+title+location
  - `content_hash`: hash(content_text)
- Merge duplicates across sources

### 5.6 `pipeline/scoring.py`
Responsibilities:
- Compute match score 0–100.
- Provide reasons/explanations used in UI.
- MVP scoring approach (explicit formula):
  - **Skill overlap scoring**: For each user skill, check if present in job description. Base score = (matched_skills / total_user_skills) × 60
  - **Priority skill bonuses**: +10 points if job mentions Python; +8 if TensorFlow/PyTorch/scikit-learn; +5 if SQL; +5 if cloud (AWS/GCP/Azure)
  - **Role type match**: +15 if job title matches user's target role types (ML Engineer, Data Scientist, etc.)
  - **Seniority penalty**: -20 if job description contains "Senior", "Staff", "Principal", "Lead", "Manager"
  - **Entry-level bonus**: +10 if job description contains "graduate", "junior", "entry", "early career"
  - **Location bonus**: +5 if location matches user's city preference
  - **Final score**: clamp(base_score, 0, 100)
  - **Reasons**: list of factors applied (e.g., ["Python required + found in profile", "Machine Learning Engineer role matches", "Graduate role bonus"])

**Example scoring:**
- Base: 60 (3 of 5 skills matched)
- Python bonus: +10 → 70
- TensorFlow bonus: +8 → 78
- Graduate role bonus: +10 → 88
- Final: 88
- Reasons: ["3/5 skills matched", "Python + TensorFlow in profile", "Graduate role"]

### 5.7 `ui/streamlit_app.py`
Responsibilities:
- Show jobs sorted by match score + recency.
- Filters: location, remote, keyword, min score, date.
- Job detail page shows:
  - description
  - match reasons
  - actions (save/apply)
- Story bank + generated content pages (later epics)

---

## 6. Configuration (MVP)
Store configuration in `config/settings.yaml` (gitignored) and document in `config/settings.example.yaml`.

Suggested config fields:
- `sources.greenhouse.board_tokens: [graphcore, wayve, ...]`
- `filters.uk_keywords: [ "UK", "United Kingdom", "London", ... ]`
- `filters.entry_keywords: [ "graduate", "junior", "entry", "early careers", ... ]`
- `filters.ai_keywords: [ "machine learning", "ml", "ai", "nlp", "computer vision", "llm", "data science" ]`
- `scheduler.daily_time_utc: "06:30"`

---

## 7. Error Handling & Recovery (MVP)

### Greenhouse Collector Errors
1. **HTTP errors (5xx, connection timeout)**:
   - Retry up to 3 times with exponential backoff (1s, 2s, 4s)
   - If all retries fail: log error, record in `run_logs.errors_sample`, mark `run_logs.status = 'partial'`, continue with next board
   - **Action**: Alert user in UI ("Last run partially failed; see logs")

2. **Malformed job data (missing title, invalid URL)**:
   - Log error with job ID + field name
   - Skip job (do not insert)
   - Increment `run_logs.errors_count`
   - Continue processing remaining jobs

3. **Rate limiting (429 Too Many Requests)**:
   - Backoff with exponential delay (start 5s, max 60s)
   - Retry up to 5 times
   - If still failing: mark board as unhealthy, defer to next run

4. **Database errors (unique constraint violation, connection timeout)**:
   - Log full error
   - For constraint violations: assume duplicate (dedupe success), continue
   - For connection errors: rollback transaction, mark run as failed, stop

### Run Log Status
- **success**: all boards checked, jobs processed, no errors
- **partial**: some boards checked, some errors occurred, but data ingested
- **failed**: critical error (DB connection lost, no boards checked), no data ingested

---

## 8. Observability (minimum)
- `run_logs` table records each run:
  - start/end time
  - status (success/partial/failed)
  - counts (jobs fetched, jobs added, jobs updated, jobs deactivated, errors)
  - errors_sample: list of up to 5 recent error messages (for debugging)
- Collector logs every failure with board token, URL, job ID, and error message (structured JSON)
- UI dashboard shows:
  - Last successful run timestamp
  - Total jobs in DB
  - Jobs passing filters (UK + entry + AI/ML)
  - Last run status (with error count if partial/failed)
  - Link to detailed run logs

---

## 9. Security and Compliance (MVP)
- Do not store unnecessary personal data.
- Keep request volume low (daily run, polite delays between requests: 0.5–1s per board).
- Keep secrets in `.env` (database URL, any API keys for search later).
- Rate limiting: max 5 requests per second per domain; use exponential backoff for 429 responses.

---

## 10. Job Lifecycle & Stale Job Handling

### Job Freshness
- **Freshness window**: Jobs discovered in the last 30 days are considered "fresh"
- **Stale marking**: If a job's `last_seen_at` is > 7 days old (not in latest 7 runs), set `is_active = false`
- **Rationale**: Greenhouse jobs may be removed; marking them inactive hides them from matching without data loss

### Re-run Behavior
- Run scheduler: daily at 06:30 UTC (configurable in settings.yaml)
- On each run:
  - Fetch all active boards from DB
  - For each job returned by API: check `absolute_url`, update/insert as needed
  - For jobs in DB but NOT in latest API response: increment "missed_runs" counter
  - If missed_runs >= 7: set `is_active = false` and update UI accordingly
  - Record run metadata in `run_logs`

---

## 11. MVP Milestones
Milestone A (week 1):
- DB schema + migrations
- Greenhouse collector for manual tokens
- UK/entry/AI filters
- Streamlit dashboard

Milestone B (week 2):
- Match scoring + explanations
- Application tracker
- Basic profile ingestion

Milestone C (week 3+):
- Story bank + behavioural answer generator
- Why-company generator
- Add Lever / board discovery / job board API

---

## 12. Answers to Key Questions (MVP Planning)

### Q1: Scoring Weights
**A:** See section 5.6 (`pipeline/scoring.py`) for explicit formula. Summary:
- Base: skill overlap (max 60)
- Priority skills: Python +10, ML frameworks +8, SQL +5, Cloud +5
- Role type match: +15
- Seniority penalty: -20
- Entry-level bonus: +10
- Location bonus: +5
- Final: clamp to 0–100

This is simple, debuggable, and can be tweaked based on real data in v1.1.

### Q2: Stale Job Handling
**A:** Jobs not seen for 7 consecutive runs (roughly 7 days) are marked `is_active = false`. This prevents stale jobs from cluttering the UI while preserving data for audit. See section 10 (Job Lifecycle & Stale Job Handling).

### Q3: Content Storage
**A:** For MVP, store HTML directly in `jobs.content_html` (PostgreSQL can handle large text fields). If size becomes an issue in production (>100GB), move to S3 in v1.1. This keeps MVP simple.

### Q4: Scheduler Default
**A:** Daily at 06:30 UTC is reasonable for MVP (low-frequency, predictable). If you prefer more frequent runs (e.g., every 6 hours), update `scheduler.daily_time_utc` in `config/settings.yaml`. For this MVP, daily is sufficient to catch new postings within 24 hours.

---
