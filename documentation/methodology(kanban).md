# Agentic AI Job Application Copilot --- Kanban Board

## Overview

This Kanban board defines the full development structure for the Agentic
AI Job Application Copilot.

Goal: Automatically discover UK entry-level AI/ML roles (starting with
Greenhouse), match them to the user profile, generate tailored
application materials, and track applications.

Methodology: Agile Kanban

Columns:

-   Inbox
-   Backlog
-   Ready
-   Doing (WIP limit: 2)
-   Review / QA (WIP limit: 2)
-   Blocked
-   Done

Labels:

-   Core
-   Data
-   AI
-   Frontend
-   Infra
-   Quality
-   Compliance

------------------------------------------------------------------------

# EPIC 0 --- Project Foundation

## 0.1 Define MVP Scope \[Core\]

-   Define success criteria
-   Define non-goals
-   Write project overview in README

## 0.2 Repository Setup \[Infra\]

Create folders:

agents/ api/ db/ ui/ tests/ docs/

## 0.3 Environment Setup \[Infra\]

-   .env file
-   configuration system
-   secrets management

## 0.4 Logging Setup \[Quality\]

-   structured logging
-   run identifiers

## 0.5 CI Setup \[Quality\]

-   lint
-   tests on commit

------------------------------------------------------------------------

# EPIC 1 --- Database & Data Model

## 1.1 Schema Design \[Core\]

Tables:

-   jobs
-   job_sources
-   boards
-   companies
-   applications
-   user_profile
-   stories
-   generated_content
-   run_logs

## 1.2 Database Implementation \[Infra\]

-   PostgreSQL
-   migrations

## 1.3 Deduplication Logic \[Core\]

Primary key:

absolute_url

Secondary:

company + title + location

## 1.4 Data Normalisation \[Core\]

Normalize:

-   titles
-   locations
-   keywords

------------------------------------------------------------------------

# EPIC 2 --- Greenhouse Job Discovery

## 2.1 API Exploration \[Data\]

Verify fields:

-   id
-   title
-   location
-   absolute_url
-   updated_at
-   content

## 2.2 Board Collector \[Core\]

Input:

board tokens

Output:

jobs stored in database

## 2.3 Job Detail Fetching \[Data\]

Optional detailed job retrieval

## 2.4 Scheduler \[Core\]

Run collectors daily

## 2.5 Rate Limiting \[Compliance\]

Add delays and retries

------------------------------------------------------------------------

# EPIC 3 --- Automatic Board Discovery

## 3.1 Search Queries \[Core\]

Find Greenhouse boards automatically

## 3.2 Token Extraction \[Data\]

Extract board tokens

## 3.3 Token Validation \[Data\]

Verify boards via API

## 3.4 Store Boards \[Core\]

Save valid boards

## 3.5 Add Boards to Pipeline \[Core\]

Automatically ingest jobs

------------------------------------------------------------------------

# EPIC 4 --- Job Filtering

## 4.1 Extract Plain Text \[Data\]

Convert HTML to text

## 4.2 UK Location Filter \[Core\]

Include:

-   UK
-   United Kingdom
-   London
-   Remote UK

## 4.3 Entry Level Filter \[Core\]

Include:

-   Graduate
-   Junior
-   Entry Level

Exclude:

-   Senior
-   Lead
-   Principal

## 4.4 AI / ML Filter \[Core\]

Include:

-   Machine Learning
-   AI
-   NLP
-   Data Science

## 4.5 Store Filter Reasons \[Core\]

Save filtering decisions

------------------------------------------------------------------------

# EPIC 5 --- Job Matching

## 5.1 CV Ingestion \[Core\]

Extract:

-   skills
-   projects
-   education

## 5.2 Match Scoring \[AI\]

Score 0--100

## 5.3 Improve Matching \[AI\]

Add skill synonyms

## 5.4 Ranking \[Core\]

Sort jobs

------------------------------------------------------------------------

# EPIC 6 --- Story Bank

## 6.1 Story Categories \[Core\]

-   Teamwork
-   Leadership
-   Failure
-   Problem Solving

## 6.2 Story Input UI \[Frontend\]

Save STAR stories

## 6.3 Question Classification \[AI\]

Map question to story

## 6.4 Answer Generation \[AI\]

Generate answers

------------------------------------------------------------------------

# EPIC 7 --- Why This Company Generator

## 7.1 Company Context \[Data\]

Extract company info

## 7.2 Answer Generator \[AI\]

Generate tailored answer

## 7.3 Anti Generic Check \[Quality\]

Ensure specificity

------------------------------------------------------------------------

# EPIC 8 --- Application Pack Generator

## 8.1 Cover Letter Generator \[AI\]

Generate cover letter

## 8.2 Tailored CV Suggestions \[AI\]

Recommend edits

## 8.3 Build Application Pack \[Core\]

Bundle application materials

## 8.4 Export Options \[Frontend\]

Copy or download

------------------------------------------------------------------------

# EPIC 9 --- Application Tracker

## 9.1 Status Pipeline \[Core\]

Statuses:

-   Saved
-   Applied
-   Interview
-   Offer
-   Rejected

## 9.2 Notes \[Core\]

Save notes

## 9.3 Follow Ups \[Core\]

Reminders

## 9.4 Analytics \[Quality\]

Track success rate

------------------------------------------------------------------------

# EPIC 10 --- User Interface

## 10.1 Dashboard \[Frontend\]

Show jobs

## 10.2 Job Detail Page \[Frontend\]

Show details

## 10.3 Story Bank UI \[Frontend\]

Manage stories

## 10.4 Content Editor \[Frontend\]

Edit generated content

------------------------------------------------------------------------

# EPIC 11 --- Reliability & Testing

## 11.1 Unit Tests \[Quality\]

Test collectors

## 11.2 Integration Tests \[Quality\]

Test pipeline

## 11.3 Monitoring \[Quality\]

Detect failures

## 11.4 Database Backup \[Infra\]

Backup data

------------------------------------------------------------------------

# Recommended MVP Build Order

1.  EPIC 0
2.  EPIC 1
3.  EPIC 2
4.  EPIC 4
5.  EPIC 10
6.  EPIC 5
7.  EPIC 6
8.  EPIC 7
9.  EPIC 9

------------------------------------------------------------------------

# Final Goal

A fully operational agentic AI job application copilot that:

-   Finds jobs automatically
-   Matches them intelligently
-   Generates application materials
-   Tracks applications
