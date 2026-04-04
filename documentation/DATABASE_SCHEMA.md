# DATABASE_SCHEMA.md
# Agentic AI Job Application Copilot — Database Schema (PostgreSQL)

## 1. Notes
- This schema is designed for an MVP and can be extended.
- Types are PostgreSQL-native. JSON fields are used for flexible, explainable reasons.
- Use Alembic migrations to manage changes.

---

## 2. Tables

### 2.1 `companies`
Stores canonical company info.

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | generated |
| name | text | not null | display name |
| name_normalized | text | not null | lowercase/trimmed for matching |
| domain | text | null | optional (company website domain) |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes/constraints:
- UNIQUE (`name_normalized`)

---

### 2.2 `boards`
Stores Greenhouse board tokens and metadata.

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| source_type | text | not null | e.g. `greenhouse` |
| token | text | not null | e.g. `graphcore` |
| board_url | text | not null | `https://boards.greenhouse.io/{token}` (or job-boards.*) |
| api_url | text | not null | `https://boards-api.greenhouse.io/v1/boards/{token}/jobs` |
| is_active | boolean | not null default true | disable if broken |
| last_checked_at | timestamptz | null | |
| last_success_at | timestamptz | null | |
| last_job_count | integer | not null default 0 | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes/constraints:
- UNIQUE (`source_type`, `token`)
- INDEX (`is_active`)

---

### 2.3 `jobs`
Canonical job record (deduped).

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| company_id | uuid | FK -> companies(id) | not null |
| board_id | uuid | FK -> boards(id) | null | job may come from other sources later |
| external_source | text | not null default 'greenhouse' | source family |
| external_job_id | text | not null | Greenhouse `id` as string |
| title | text | not null | |
| title_normalized | text | not null | |
| location_raw | text | null | raw location string |
| location_normalized | text | null | normalized for filtering |
| country | text | null | e.g. `UK` |
| is_remote | boolean | not null default false | derived |
| employment_type | text | null | optional |
| absolute_url | text | not null | canonical URL to job |
| application_url | text | null | often same as absolute_url |
| content_html | text | null | raw HTML (may be large) |
| content_text | text | null | plain text |
| content_hash | text | null | SHA-256 hex of normalized `content_text` |
| dedupe_key_secondary | text | null | SHA-256 hex of company_id + title + location (cross-URL dedupe) |
| posted_at | timestamptz | null | if available |
| updated_at_source | timestamptz | null | Greenhouse updated_at |
| discovered_at | timestamptz | not null default now() | when we first saw it |
| last_seen_at | timestamptz | not null default now() | updated each run |
| is_active | boolean | not null default true | mark false when removed |
| filter_is_uk | boolean | not null default false | |
| filter_is_entry_level | boolean | not null default false | |
| filter_is_ai_ml | boolean | not null default false | |
| filter_reasons | jsonb | not null default '[]'::jsonb | list of strings |
| match_score | integer | not null default 0 | 0–100 |
| match_reasons | jsonb | not null default '[]'::jsonb | list of strings |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes/constraints:
- UNIQUE (`absolute_url`)
- INDEX (`company_id`)
- INDEX (`board_id`)
- INDEX (`title_normalized`)
- INDEX (`location_normalized`)
- INDEX (`filter_is_uk`, `filter_is_entry_level`, `filter_is_ai_ml`)
- INDEX (`match_score`)
- INDEX (`last_seen_at`)
- INDEX (`is_active`)

Notes:
- `content_html` can be large; optionally move to a separate table later if needed.

---

### 2.4 `job_sources`
Tracks where a job was discovered from (supports multi-source dedupe later).

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| job_id | uuid | FK -> jobs(id) | not null |
| source_type | text | not null | greenhouse, lever, adzuna, google |
| source_url | text | not null | the URL that led to discovery |
| discovered_at | timestamptz | not null default now() | |
| metadata | jsonb | not null default '{}'::jsonb | optional |
| created_at | timestamptz | not null default now() | |

Indexes/constraints:
- UNIQUE (`source_type`, `source_url`)
- INDEX (`job_id`)

---

### 2.5 `run_logs`
Records each scheduled run (observability).

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| run_type | text | not null | e.g. `greenhouse_ingest` |
| status | text | not null | success, partial, failed |
| started_at | timestamptz | not null default now() | |
| ended_at | timestamptz | null | |
| boards_checked | integer | not null default 0 | |
| jobs_fetched | integer | not null default 0 | |
| jobs_created | integer | not null default 0 | |
| jobs_updated | integer | not null default 0 | |
| jobs_deactivated | integer | not null default 0 | |
| errors_count | integer | not null default 0 | |
| errors_sample | jsonb | not null default '[]'::jsonb | list of error summaries |
| created_at | timestamptz | not null default now() | |

Indexes:
- INDEX (`run_type`, `started_at`)

---

### 2.6 `user_profile`
Stores the user’s structured profile (from CV). MVP assumes single user.

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| display_name | text | null | |
| headline | text | null | e.g. “MSc Applied AI student” |
| location | text | null | |
| skills | jsonb | not null default '[]'::jsonb | list of skills |
| experience | jsonb | not null default '[]'::jsonb | structured jobs/roles |
| projects | jsonb | not null default '[]'::jsonb | structured projects |
| education | jsonb | not null default '[]'::jsonb | |
| preferences | jsonb | not null default '{}'::jsonb | UK-only, remote, etc. |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes:
- none required for MVP

---

### 2.7 `applications`
Tracks your application pipeline status per job.

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| job_id | uuid | FK -> jobs(id) | not null |
| status | text | not null | saved, applied, oa, interview, offer, rejected, no_response |
| applied_at | timestamptz | null | |
| last_follow_up_at | timestamptz | null | |
| next_follow_up_at | timestamptz | null | |
| notes | text | null | |
| custom_fields | jsonb | not null default '{}'::jsonb | any extra |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes/constraints:
- UNIQUE (`job_id`)  (one application record per job for MVP)
- INDEX (`status`)
- INDEX (`next_follow_up_at`)

---

### 2.8 `stories`
STAR-format story bank for behavioural questions.

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| title | text | not null | short name, e.g. “EPL Predict — Problem Solving” |
| category | text | not null | teamwork, leadership, failure, etc. |
| tags | jsonb | not null default '[]'::jsonb | e.g. ["python","ml","agile"] |
| situation | text | not null | |
| task | text | not null | |
| action | text | not null | |
| result | text | not null | |
| metrics | jsonb | not null default '{}'::jsonb | optional numeric outcomes |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes:
- INDEX (`category`)

---

### 2.9 `generated_content`
Stores generated text drafts (cover letters, answers, why-company).

| column | type | constraints | notes |
|---|---|---|---|
| id | uuid | PK | |
| job_id | uuid | FK -> jobs(id) | not null |
| content_type | text | not null | cover_letter, why_company, behavioural_answer |
| prompt_metadata | jsonb | not null default '{}'::jsonb | model, params, etc. |
| content | text | not null | generated draft |
| source_story_id | uuid | FK -> stories(id) | null | for behavioural answers |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Indexes:
- INDEX (`job_id`)
- INDEX (`content_type`)

---

## 3. Enumerations (recommended)
You can enforce with CHECK constraints or in application code.

### `applications.status`
- saved
- applied
- oa
- interview
- offer
- rejected
- no_response

### `run_logs.status`
- success
- partial
- failed

---

## 4. Suggested SQL (optional)
Implementation can be via SQLAlchemy models + Alembic migrations.

Key constraints to include:
- UNIQUE (jobs.absolute_url)
- UNIQUE (boards.source_type, boards.token)
- UNIQUE (job_sources.source_type, job_sources.source_url)
- UNIQUE (applications.job_id)

---

## 5. MVP Query Examples (what the UI will run)
- Today’s jobs:
  - filter active + passed filters:
    - `is_active = true`
    - `filter_is_uk = true`
    - `filter_is_entry_level = true`
    - `filter_is_ai_ml = true`
  - order by `match_score desc, updated_at_source desc`

- “Saved” applications:
  - join `applications` on `jobs`, filter `status='saved'`

---

## 6. Data Validation Rules (MVP)

### Jobs Table
- `title`: required, length > 5 chars, trim whitespace
- `title_normalized`: derived from `title` (lowercase, trim)
- `location_raw`: accept null, store as-is for audit trail
- `location_normalized`: null if location_raw is empty; otherwise normalized (lowercase, remove extra spaces)
- `country`: default to null if filtering fails; set to 'UK' if UK keywords match
- `absolute_url`: required, must be valid URL, should be unique
- `content_html`: accept null (some jobs may have no description)
- `content_text`: generated from content_html; if null, use empty string
- `content_hash`: only set if content_text exists
- Filter flags (`filter_is_uk`, etc.): default false; set to true only if passing respective filter

### User Profile Table
- `skills`: must be array of objects with {name: string, category?: string, proficiency?: string}
- `projects`: must be array of objects with {name: string, tech_stack?: [strings], tags?: [strings]}
- `education`: must be array of objects with {degree?: string, subject?: string, university?: string}
- `preferences`: must be object with optional keys: target_location, remote_ok (boolean), role_types (array), keywords_include (array), keywords_exclude (array)

### Applications Table
- `status`: must be one of enum values (saved, applied, oa, interview, offer, rejected, no_response)
- `job_id`: required, must exist in jobs table
- `applied_at`: set only when status transitions to 'applied' or later

---

## 7. Job Update & Re-scoring Logic (MVP)

### Update Behavior
When Greenhouse API returns a job:
1. Check `absolute_url` against existing `jobs` records (primary dedupe key)
2. If URL found:
   - If `updated_at_source` from API > DB `updated_at_source`: merge new fields
   - Re-apply filters (in case description changed)
   - Re-compute match score
   - Update `last_seen_at = now()`
3. If URL not found:
   - Insert as new job
4. If a job is NOT seen in latest run:
   - After 7 consecutive runs without seeing it: set `is_active = false`
   - This handles job removal/archival

### Re-scoring Behavior
- Match score is computed on every ingest (not cached)
- Reasons regenerated based on current user profile + job content
- If user profile changes: old scores become stale (acceptable for MVP; bulk re-score in v1.1)

---

## 8. Future Extensions (planned)
- Add `sources` table for non-Greenhouse sources.
- Split large HTML fields into `job_content` table.
- Add multi-user support: add `user_id` foreign keys to profile/applications/stories.
- Add `company_profiles` table for "why company" research summaries.
