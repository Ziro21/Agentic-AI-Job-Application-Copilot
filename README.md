# Agentic AI Job Application Copilot

> An end-to-end platform that **finds, ranks, and tracks graduate/early-career roles**
> across multiple Applicant Tracking Systems (ATS), using semantic matching and an
> agent-based integration layer — built as a production-style, multi-tenant service.

---

## Problem & motivation

Job hunting at scale is a data problem: roles are scattered across dozens of ATS
platforms (Greenhouse, Lever, Workday, Ashby…), each with its own format, and ranking
them against a candidate's profile by hand is slow and inconsistent. This project
automates the full loop — ingest postings from many sources, embed and rank them
against the user's profile, and track each application through its pipeline — behind a
clean API and dashboard.

## Approach & architecture

```
ATS sources (Greenhouse / Lever / Workday / …)
        │  agent-based integrations (one adapter per ATS)
        ▼
   FastAPI core  ──►  PostgreSQL (jobs, applications, users, runs)
        │  semantic matching (embeddings) → ranked roles
        ▼
   Next.js dashboard  +  Chrome extension (autofill / tracking)
```

- **`agents/`** — per-ATS integration adapters (`greenhouse/`, `lever/`, `workday/`,
  `integrations/`) plus shared `core/` logic for scraping and normalising postings.
- **`api/`** — FastAPI service with routers for `jobs`, `applications`, `boards`,
  `metrics`, `runs`, `users`, `exports`; auth and middleware layers.
- **`alembic/`** — versioned database migrations (schema is managed, not ad-hoc).
- **`dashboard/`** — Next.js front-end for browsing ranked roles and tracking pipelines.
- **Multi-tenant** design with PII-aware data retention (see `PRIVACY.md`).

## Tech stack

| Layer | Tech |
|---|---|
| API | FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL 15 |
| Matching | Text embeddings + semantic ranking |
| Front-end | Next.js, React |
| Browser | Chrome Extension (MV3) |
| Infra | Docker / docker-compose |
| Testing | pytest |

## How to run it

```bash
# 1. Backend + database (Docker)
cp .env.example .env          # provide your config/secrets
docker-compose up -d --build  # PostgreSQL :5432 + FastAPI :8000

# 2. Apply database migrations
alembic upgrade head

# 3. Dashboard
cd dashboard
npm install
npm run dev                   # http://localhost:3000
```

See [`README_DEPLOYMENT.md`](README_DEPLOYMENT.md) for VPS deployment and
[`RUNBOOK.md`](RUNBOOK.md) for operational notes.

## Results & status

- Multi-ATS ingestion with per-source adapters and semantic ranking of roles.
- Dockerised backend (one-command launch), managed schema via Alembic migrations,
  and a working Next.js dashboard + Chrome extension.
- PII-aware retention policy with a documented "right to be forgotten" path.

## Limitations & next steps

- ATS adapters depend on each provider's current page/API structure and need
  maintenance as those change.
- Ranking quality is bounded by the embedding model and profile detail; a learned
  re-ranker is a natural next step.
- Add CI for the test suite and broaden ATS coverage.
