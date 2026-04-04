# Phase 6 — Security & Compliance

**Goal:** Safe handling of credentials and minimal personal data.

**Depends on:** Any remote deployment (Phase 3 auth).

---

## 6.1 Secrets

**Objective:** No secrets in repo; rotation path.

### Steps

1. Audit repo for accidental keys; use `git-secrets` or TruffleHog in CI
2. Supabase: use connection pooler URL; rotate DB password periodically
3. Document env injection for production (Render, Fly, K8s secrets)

---

## 6.2 PII minimization

**Objective:** Notes in `applications` may contain personal data.

### Steps

1. Document retention policy (e.g. export/delete on request)
2. Optional: encrypt `applications.notes` at rest (DB-level or application-level)
3. GDPR: export user data script (`scripts/export_user_data.py`)

---

## 6.3 Dependency scanning

**Objective:** Known vulnerabilities.

### Steps

1. `pip audit` / Dependabot / Renovate
2. `npm audit` for dashboard

---

## 6.4 CORS and CSRF

**Objective:** Production CORS allowlist only.

### Steps

1. Replace `allow_origins=["*"]` with env `CORS_ORIGINS=https://app.example.com`
2. If cookies used for auth, CSRF tokens for mutating requests

---

## 6.5 Local PII Scrubbing (Expert Upgrade)

**Objective:** Mask private data before GenAI generation.

### Steps

1. Deploy Microsoft Presidio locally via Python.
2. Mask `<USER_NAME>`, `<PHONE>`, `<ADDRESS>` prior to hitting OpenAI / Anthropic APIs and unmask via local client mapping.

---

## Phase 6 exit criteria

- [ ] CI blocks known secret patterns
- [ ] CORS documented for production
- [ ] Data retention documented
