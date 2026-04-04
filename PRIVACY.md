# Agentic AI Job Application Copilot - Privacy & Data Retention Policy

This robust architectural boundary is strictly designed to scrape and track external ATS pipelines securely. However, we acknowledge it inadvertently aggregates PII (Personal Identifiable Information) natively via the Chrome Extension injecting custom `user_id` metrics during the application phase.

## 1. PII Minimization & Data Retention Regulations
* **Storage Logic:** Job metadata (public identifiers, salaries, locations) is safely indexed globally for Deep Learning analytics.
* **Sensitive Retention Limits:** User application data (including personal notes, unique tracking stages, and ATS autofill metadata) is classified as strict PII.
* **Right to be Forgotten:** If utilizing the Copilot across multi-tenant scale vectors, user pipeline data must be securely purged upon request directly destroying the rows from the `applications` postgres index.

## 2. GDPR Data Export Architectures (Article 20 Compliance)
Data administrators utilizing the system are required complying strictly to user requests downloading their physical pipeline histories entirely natively. We have supplied an automated export pipeline that serializes the relational POSTGRES database models securely down into strict JSON deliverables natively over pandas constraints.

**Execution Parameters:**
```bash
python scripts/export_user_data.py gdpr_user_export_2026.json
```

**Output Syntax:**
This pipeline emits `gdpr_export.json` which completely packages timestamps, states, and physical logs matching the user's historical bounds. Under GDPR standards, this file may be provided seamlessly out to the respective user upon verification.
