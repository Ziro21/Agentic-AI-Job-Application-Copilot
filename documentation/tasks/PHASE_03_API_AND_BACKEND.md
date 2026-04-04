# Phase 3 — API & Backend

**Goal:** FastAPI layer suitable for remote dashboard access and future mobile clients.

**Depends on:** Phase 1 health checks; Phase 2 optional for richer filters.

---

## 3.1 API contract stability

**Objective:** Versioned, documented contracts.

### Steps

1. Pin OpenAPI tags and descriptions in FastAPI routers
2. Export `openapi.json` in CI artifact or `scripts/export_openapi.py`
3. Add optional `/api/v1` prefix for future breaking changes; keep `/api` as alias during transition

---

## 3.2 Authentication (when remote)

**Objective:** Protect API when not localhost-only.

### Steps

1. Choose: API keys (`X-API-Key`), JWT, or OAuth2 password flow for single user
2. Middleware: allow `GET /healthz`, `/docs`, `/openapi.json` without auth in dev; require auth in prod via `APP_ENV=production`
3. Dashboard: store token in secure cookie or memory; never commit

---

## 3.3 Rate limiting

**Objective:** Prevent abuse of expensive list endpoints.

### Steps

1. `slowapi` or Starlette middleware: e.g. 100 req/min per IP for `/api/jobs`
2. Return `429` with `Retry-After`

---

## 3.4 Pagination consistency

**Objective:** Ensure all list endpoints use same `Paginated` shape and max `page_size` cap (already partially done).

### Steps

1. Audit `cursor`-based pagination for large datasets (optional future)
2. Add `Link` headers for `next`/`prev` (optional)

---

## 3.5 Webhooks (optional)

**Objective:** Notify dashboard or external systems on new high-score jobs.

### Steps

1. `user_preferences.webhook_url` + secret
2. After ingest, if `match_score >= threshold`, POST JSON payload (signed HMAC)

---

## 3.6 Background tasks

**Objective:** Long-running exports without blocking request.

### Steps

1. For CSV export: `POST /api/jobs/export` → job id → poll `GET /api/exports/{id}` or use Redis queue (heavy infra — defer)

---

## 3.7 Multi-Tenant Architecture (Expert Upgrade)

**Objective:** Isolate users natively for SaaS deployment.

### Steps

1. Create `users` and `user_profiles` tables via Alembic to replace global YAML settings.
2. Tie `applications`, `run_logs`, and scoring weights exclusively to the `user_id`.

---

## 3.8 Career Funnel Observability API (Expert Upgrade)

**Objective:** Map true ROI metrics.

### Steps

1. Expose `GET /api/metrics/funnel` tracing the conversion rates (Saved → Applied → Interviewing → Offer).
2. Apply warnings if particular job boards have high rejection rates to force resume rewrites.

---

## Phase 3 exit criteria

- [ ] OpenAPI complete and exported
- [ ] Auth strategy chosen and documented for production deploy
- [ ] Rate limits on public endpoints
