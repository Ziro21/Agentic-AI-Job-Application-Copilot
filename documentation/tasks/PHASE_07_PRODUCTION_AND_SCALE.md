# Phase 7 — Production & Scale

**Goal:** Deployed stack with backups, recovery, and cost awareness.

**Depends on:** Phases 1–3 minimum.

---

## 7.1 Deployment topology

**Objective:** Repeatable deploy.

### Steps

1. **Option A:** Single VM (Docker Compose): `api` + `postgres` optional; dashboard static or Node SSR
2. **Option B:** Managed Postgres (Supabase) + API on Fly/Render + Vercel for Next.js
3. Document `DATABASE_URL` (pooler), `APP_ENV=production`

---

## 7.2 Backups

**Objective:** Recover from data loss.

### Steps

1. Supabase: enable PITR or daily logical backups
2. Self-hosted: `pg_dump` cron + off-site storage (S3)

---

## 7.3 SLOs and monitoring

**Objective:** Explicit expectations.

### Steps

1. Define SLO: e.g. “99% of daily ingests complete within 30 min”
2. Uptime monitor on `/readyz` (UptimeRobot, Better Stack)
3. Optional: Grafana + Loki for logs

---

## 7.4 Cost controls

**Objective:** Predictable spend.

### Steps

1. Cap LLM API daily budget (Phase 5)
2. Alert on Supabase egress / row count

---

## 7.5 Horizontal scaling (future)

**Objective:** Multiple API replicas.

### Steps

1. Stateless API instances behind load balancer
2. Single writer for ingest OR queue (SQS/RabbitMQ) with one consumer
3. Session affinity not required if JWT/API key

---

## 7.6 Cross-Platform ATS Expansion (Expert Upgrade)

**Objective:** Integrate Workday, Lever, and Ashby APIs.

### Steps

1. Restructure the ingestion module to support an Adapter Pattern (`parsers/workday.py`, `parsers/lever.py`).
2. Add headless browser fallback scraping (Playwright) via queues for hidden jobs.

---

## 7.7 Automated Follow-ups & Calendar Sync (Expert Upgrade)

**Objective:** Manage the post-application lifecycle gracefully.

### Steps

1. Integrate with Google Gmail APIs directly tracking the user's inbox strictly for application responses.
2. Auto-transition database stages to "Interviewing" via regex matching.
3. Automatically block out Calendar events for interviews or cron-schedule draft 7-day follow-up templates for ghosting companies.

---

## Phase 7 exit criteria

- [ ] Runbook: deploy, rollback, restore backup
- [ ] Monitoring on `/readyz` and ingest success/failure
