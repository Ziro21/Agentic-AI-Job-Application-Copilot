# Job Copilot Dashboard

Next.js dashboard for the Agentic AI Job Application Copilot.

## Prerequisites

- Node.js 18+
- FastAPI backend running (see project root)

## Setup

```bash
# Install dependencies (already done if you cloned)
npm install

# Optional: configure API URL (defaults to http://localhost:8000)
cp .env.local.example .env.local
# Edit .env.local if your API runs elsewhere
```

## Run

```bash
# Start the dashboard (port 3000)
npm run dev
```

Ensure the FastAPI backend is running first:

```bash
# From project root
source venv/bin/activate
uvicorn api.main:app --reload
```

## Features

- **Jobs** — List, filter, sort, and paginate jobs. Click to view details.
- **Job Detail** — Full description, match/filter reasons, application actions.
- **Applications** — Track pipeline (saved → applied → interview → offer/rejected).
- **Runs** — Ingest history and health.
