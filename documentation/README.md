# Agentic AI Job Application Copilot

An intelligent system to automate job discovery, analysis, and application preparation for UK entry-level AI/ML roles.

## Project Overview

This project is an agentic AI system designed to reduce manual effort in finding relevant job opportunities and preparing tailored application materials. The system operates as an intelligent copilot—discovering roles, ranking them by relevance, and generating application content—while keeping the human user in control of final submission.

**Key Principle**: The system will NOT automatically submit applications. You remain responsible for the final submission.

---

## MVP Scope & Goals

### What the MVP Delivers

✅ **Automated Job Discovery**
- Fetches job listings from Greenhouse Job Board API
- Filters for UK-only, entry-level, and AI/ML roles
- Deduplicates jobs from multiple sources

✅ **Smart Job Matching**
- Scores jobs against your profile (0–100)
- Provides match explanations
- Ranks jobs by relevance

✅ **Structured Job Storage**
- PostgreSQL database for reliable persistence
- Job metadata: title, company, location, description, application URL
- Filter decisions and match scores stored for audit

✅ **Application Tracking**
- Track job applications through pipeline (Saved → Applied → Interview → Offer/Rejected)
- Notes and follow-up reminders
- Analytics: success rate, response time

✅ **User-Friendly Dashboard**
- Streamlit-based UI (MVP, simple and functional)
- Jobs table with filters (location, score, keyword)
- Job detail view with full description and match reasoning
- Application tracker

✅ **Basic Observability**
- Run logs for every scheduled job discovery
- Error tracking and alerting
- UI shows last successful run and job health

---

### What the MVP Does NOT Include

❌ **Automatic Application Submission** — You control final submission  
❌ **Advanced Content Generation** — Story bank, cover letters, "why company" responses (post-MVP)  
❌ **CV/PDF Parsing** — Manual structured profile form instead  
❌ **Multiple Job Sources** — Greenhouse only (MVP); Lever and others in v1.1  
❌ **Automatic Board Discovery** — Manual board token configuration; auto-discovery in v1.1  
❌ **LLM-Based Classification** — Rules-based filtering (simple, fast, debuggable)  
❌ **Multi-User Support** — Single-user MVP; multi-user in future versions  

---

## Target User Profile

**MVP User**: You (the developer)

**Profile Example**:
- MSc Applied Artificial Intelligence student (University of Warwick)
- Seeking: ML Engineer, AI Engineer, Data Scientist, Applied AI roles
- Tech: Python, PyTorch, TensorFlow, SQL, cloud platforms
- Location: UK-based roles + remote-OK
- Seniority: Graduate or Junior only

---

## Success Criteria (How to Know MVP Works)

1. ✅ **Discovery**: System finds 100+ UK entry-level AI/ML roles in first run
2. ✅ **Filtering**: 70%+ of discovered jobs are genuinely relevant (UK + entry-level + AI/ML)
3. ✅ **Matching**: Top 20 jobs have intuitive ranking (your actual target roles score highest)
4. ✅ **Persistence**: Jobs remain in DB across multiple runs; no data loss
5. ✅ **Deduplication**: Same job from multiple sources = 1 record (no duplication clutter)
6. ✅ **UI**: Can view jobs, filter by score/location/keyword, track applications
7. ✅ **Reliability**: Scheduler runs daily without manual intervention; errors logged clearly
8. ✅ **Speed**: Full pipeline (discover → filter → match → persist) completes in < 5 minutes

---

## Architecture Overview

### Core Modules

**Agents** (`agents/greenhouse/`)
- `client.py`: HTTP requests with retry/backoff logic
- `collector.py`: Fetch jobs, normalize, dedupe, store
- `parser.py`: Convert Greenhouse JSON → canonical model

**Pipeline** (`pipeline/`)
- `html_to_text.py`: Clean HTML descriptions
- `filters.py`: UK + entry-level + AI/ML classification
- `dedupe.py`: Detect and merge duplicate jobs
- `scoring.py`: Match user profile against jobs (0–100)

**Database** (`db/`)
- `models.py`: SQLAlchemy ORM models
- `crud/`: Database operations (jobs, applications, profile, stories)
- `migrations/`: Alembic schema versioning

**UI** (`ui/`)
- `streamlit_app.py`: Main dashboard
- `pages/`: Job detail, tracker, story bank (future)

**Scheduler** (`scheduler/`)
- `run_daily.py`: Daily job discovery trigger
- `tasks.py`: Task definitions

### Data Flow

```
Greenhouse API
    ↓
Client (fetch + retry)
    ↓
Parser (normalize fields)
    ↓
Filters (UK + entry-level + AI/ML)
    ↓
Deduper (absolute_url primary key)
    ↓
Scorer (match 0–100)
    ↓
Database (jobs, companies, boards, run_logs)
    ↓
Streamlit UI (display + track)
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Python 3.10+ |
| **Web Framework** | FastAPI (optional; UI can read DB directly) |
| **Database** | PostgreSQL 13+ |
| **ORM** | SQLAlchemy 2.0+ |
| **Migrations** | Alembic |
| **Frontend** | Streamlit (MVP) |
| **Scheduler** | APScheduler or cron |
| **Testing** | pytest |
| **Environment** | python-dotenv |

---

## Quick Start (To Be Implemented)

### Prerequisites
- Python 3.10+
- PostgreSQL 13+
- pip or poetry

### Installation
```bash
# Clone repo
git clone https://github.com/Ziro21/Agentic-AI-Job-Application-Copilot.git
cd Agentic-AI-Job-Application-Copilot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Setup database
alembic upgrade head

# Configure
cp config/settings.example.yaml config/settings.yaml
# Edit config/settings.yaml with your board tokens and preferences

# Run scheduler (or cron job)
python scheduler/run_daily.py

# Launch UI
streamlit run ui/streamlit_app.py
```

---

## Project Structure

```
agentic-job-copilot/
├── README.md (this file)
├── KANBAN.md (development roadmap)
├── PROJECT_ARCHITECTURE.md (detailed architecture)
├── DATABASE_SCHEMA.md (database design)
│
├── config/
│   ├── settings.example.yaml
│   └── settings.yaml (gitignored)
│
├── agents/
│   ├── __init__.py
│   └── greenhouse/
│       ├── __init__.py
│       ├── client.py
│       ├── collector.py
│       └── parser.py
│
├── pipeline/
│   ├── __init__.py
│   ├── html_to_text.py
│   ├── filters.py
│   ├── dedupe.py
│   └── scoring.py
│
├── db/
│   ├── __init__.py
│   ├── session.py
│   ├── models.py
│   ├── migrations/ (Alembic)
│   └── crud/
│       ├── __init__.py
│       ├── jobs.py
│       ├── applications.py
│       ├── profile.py
│       └── stories.py
│
├── ui/
│   ├── streamlit_app.py
│   └── pages/
│       ├── 01_jobs_dashboard.py
│       ├── 02_job_detail.py
│       ├── 03_story_bank.py
│       └── 04_application_tracker.py
│
├── scheduler/
│   ├── run_daily.py
│   └── tasks.py
│
├── scripts/
│   ├── seed_profile.py
│   ├── seed_boards.py
│   └── export_jobs_csv.py
│
├── tests/
│   ├── unit/
│   │   ├── test_filters.py
│   │   ├── test_scoring.py
│   │   └── test_dedupe.py
│   └── integration/
│       └── test_greenhouse_ingest.py
│
├── .env.example
├── .gitignore
├── requirements.txt
└── pyproject.toml
```

---

## Development Methodology

**Agile Kanban**
- Columns: Inbox → Backlog → Ready → Doing → Review/QA → Blocked → Done
- WIP limits: 2 tasks in Doing, 2 in Review/QA
- Task sizing: All cards ≤ 1 day of work
- See `KANBAN.md` for current roadmap

---

## Roadmap

### Milestone A (Week 1–2)
- Database schema + migrations
- Greenhouse collector (manual tokens)
- UK/entry-level/AI/ML filters
- Streamlit dashboard (jobs table, filters)

### Milestone B (Week 2–3)
- Match scoring + explanations
- Application tracker UI
- User profile form ingestion

### Milestone C (Week 3+)
- Story bank + behavioural answer generator
- "Why this company?" response generator
- Add Lever + other sources
- Auto board discovery

---

## FAQ

**Q: Why not use established job boards like Indeed?**  
A: Greenhouse focuses on tech/growth-focused companies and has a clean API. Starting here validates the core pipeline before adding complexity.

**Q: Will you scrape LinkedIn?**  
A: Not in MVP. Violates ToS and adds fragility. Job board APIs are cleaner.

**Q: How often does the system check for new jobs?**  
A: Daily at 06:30 UTC (configurable). Balances freshness with rate limits. Can increase in v1.1.

**Q: Can I manually add jobs?**  
A: Not in MVP. Focus is on automation. Post-MVP feature.

**Q: What if a job I'm interested in isn't UK or entry-level?**  
A: It's still stored in the database (with filter flags). You can manually review it in the UI if needed.

---

## Contributing

This is a solo project for now. Future versions may support contributions.

---

## License

[To be determined]

---

## Contact & Support

Questions or feedback? Open an issue on GitHub.

---

## Glossary

- **Greenhouse**: ATS (Applicant Tracking System) platform hosting job boards
- **Board Token**: Unique identifier for a company's job board on Greenhouse (e.g., `graphcore`, `wayve`)
- **Dedupe**: Deduplication (removing duplicate job records)
- **STAR Format**: Behavioural interview answer framework (Situation, Task, Action, Result)
- **ATS**: Applicant Tracking System
- **MVP**: Minimum Viable Product
- **Copilot**: AI system that assists but doesn't automate final decisions

---

*Last updated: 25 Feb 2026*
