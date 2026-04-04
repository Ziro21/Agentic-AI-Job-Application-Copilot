# Phase 4 — Frontend & UX

**Goal:** One canonical dashboard, excellent usability, and alignment with API.

**Depends on:** Stable API (Phase 3 optional for auth).

---

## 4.1 Dashboard consolidation

**Objective:** Single source of truth in repo root (avoid `dashboard/` vs `dashboard-v2/` drift).

### Steps

1. Decide: promote `dashboard-v2` → `dashboard/` (or rename `dashboard` → `dashboard-legacy` and archive)
2. Update `README`, `PROJECT_CONTEXT_PROMPT.md`, CI paths
3. Ensure one `package.json` build in CI
4. Remove duplicate `src/lib/api` patterns; shared env: `NEXT_PUBLIC_API_URL` or proxy in `next.config.ts`

---

## 4.2 Error and empty states

**Objective:** When API is down (`ECONNREFUSED`), show actionable recovery UI.

### Steps

1. Global error boundary + React Query `retry` policy
2. Banner: “API unreachable — start `uvicorn api.main:app`” with link to docs
3. Differentiate 404 job vs network error

---

## 4.3 Accessibility

**Objective:** Keyboard navigation, focus order, contrast.

### Steps

1. Audit job list and Kanban with keyboard; visible focus rings
2. `aria-live` for ingest status updates
3. Run `@axe-core/react` in dev or Lighthouse CI

---

## 4.4 Performance

**Objective:** Fast perceived load for 1k+ jobs.

### Steps

1. Virtualize long job lists (`@tanstack/react-virtual`)
2. Image lazy loading if company logos added later
3. `next/font` and route-level code splitting (verify bundle analyzer)

---

## 4.5 E2E tests (optional)

**Objective:** Critical path coverage.

### Steps

1. Playwright: load jobs page, open detail, change application status (against local API + seeded DB)
2. Run in CI with `docker compose` for Postgres + API

---

## 4.6 Browser Extension Integration (Expert Upgrade)

**Objective:** "1-Click" zero-touch application automation.

### Steps

1. Build a local Chrome Extension leveraging the Copilot REST API.
2. Autofill ATS web forms (Greenhouse, Workday) using the user's stored resume context.
3. Push Webhooks back to the Copilot backend to automatically transition status to "Applied" upon submission.

---

## Phase 4 exit criteria

- [ ] One primary dashboard app documented
- [ ] Clear UX when API offline
- [ ] Core flows keyboard-accessible
