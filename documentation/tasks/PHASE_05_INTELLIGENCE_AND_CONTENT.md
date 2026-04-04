# Phase 5 — Intelligence & Content (Post-MVP)

**Goal:** Personalized scoring and draft application materials — without violating “no auto-submit.”

**Depends on:** `user_profile` schema + stable job pipeline.

---

## 5.1 User profile in DB

**Objective:** Structured profile drives scoring.

### Steps

1. Migrate `user_profile` table per `DATABASE_SCHEMA.md`
2. `scripts/seed_profile.py` from YAML or interactive CLI
3. API: `GET/PUT /api/profile` (single-user MVP)
4. Re-wire `compute_score()` to read profile from DB (with cache) instead of only YAML

---

## 5.2 Scoring calibration

**Objective:** Tune weights from real usage.

### Steps

1. Log anonymized score components per job (optional `analytics_events` table)
2. Dashboard analytics: distribution of scores, filter pass rates
3. A/B: two weight sets in `settings.yaml` — feature flag

---

## 5.3 Story bank

**Objective:** STAR stories for behavioural questions.

### Steps

1. `stories` table + CRUD API
2. UI: story bank page, link from job detail “Generate draft answer”
3. No LLM yet: template fill from story + job title

---

## 5.4 LLM-assisted drafts (optional)

**Objective:** Cover letter / “why this company” with human edit.

### Steps

1. Provider abstraction (`OpenAI`, `Anthropic`, local)
2. `generated_content` table; store prompt hash + model version for reproducibility
3. Rate limits and cost caps per day in env
4. **Compliance:** never send secrets; user reviews before copy

---

## 5.5 Evaluation harness

**Objective:** Measure quality of filters and LLM outputs.

### Steps

1. Curated golden set of ~50 job JSONs with expected labels
2. `pytest` asserts: filter pass rate, score bounds
3. For LLM: human rubric or LLM-as-judge on small set

---

## 5.6 Adaptive Feedback Loop & Vector Scoring (Expert Upgrade)

**Objective:** Ensure the recommendation quality improves dynamically based on interaction.

### Steps

1. Build a `user_interactions` model capturing explicit (rejections/saves) and implicit behavior.
2. Migrate the hardcoded score keyword engine to a pgvector embedding similarity model mapping the user's preferences to descriptions dynamically.

---

## 5.7 Advanced Semantic Extractor (Expert Upgrade)

**Objective:** Extract hidden metadata (Salary bands, H1B constraints) from raw descriptions.

### Steps

1. Pipe job text through a fine-tuned small LLM or NER model before database insertion.
2. Filter explicitly on `sponsorship_offered` or `minimum_salary` before populating the feed.

---

## 5.8 Context-Aware Interview Prep (Expert Upgrade)

**Objective:** Go beyond resume-writing into active interview passing.

### Steps

1. Connect the existing Story Bank to an LLM Retrieval-Augmented Generation (RAG) framework.
2. Generate specific STAR-method preparation sheets tuned identically to a company's mission statement prior to the interview.

---

## 5.9 Reverse Company Intelligence (Expert Upgrade)

**Objective:** Prevent users from applying to sinking ships.

### Steps

1. Call Clearbit / AlphaVantage APIs during job ingestion.
2. Inject a "Risk Score" natively onto the dashboard citing recent employee churn or corporate funding metrics.

---

## Phase 5 exit criteria

- [ ] Profile stored and used in scoring
- [ ] Story bank MVP usable without LLM
- [ ] LLM optional path documented with cost and safety
