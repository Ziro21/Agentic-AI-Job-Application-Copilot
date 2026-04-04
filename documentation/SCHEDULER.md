# Scheduled ingest

The ingest pipeline runs **Greenhouse → filters → score → Postgres** via `run_greenhouse_ingest()`.

## One-shot (cron / launchd / systemd timer)

Use the project venv and **working directory = repo root**:

```bash
/path/to/venv/bin/python -m scheduler.run_daily
```

Environment:

| Variable | Meaning |
|----------|---------|
| `SCHEDULER_ENABLED` | If `false` / `0` / `no`, exits immediately without ingesting. |
| `DATABASE_URL` | Required (same as API). |
| `LOG_LEVEL` | Default `INFO`. |

### crontab (daily 06:30 UTC)

```cron
30 6 * * * cd /path/to/Agentic-AI-Job-Application-Copilot-1 && /path/to/venv/bin/python -m scheduler.run_daily >> logs/cron-ingest.log 2>&1
```

### macOS launchd

Create `~/Library/LaunchAgents/com.jobcopilot.ingest.plist` with `StartCalendarInterval` for hour `6` minute `30`, `WorkingDirectory` set to the repo, and `ProgramArguments` pointing to `python -m scheduler.run_daily`.

## Long-running daemon (VPS / Docker)

Runs APScheduler in-process at `SCHEDULER_TIME_UTC` (default `06:30`):

```bash
python -m scheduler.daemon
```

Use `systemd` `Type=simple` with `Restart=always` for production.

## Stale jobs

Configured in `config/settings.yaml` under `scheduler`:

```yaml
scheduler:
  stale_after_missed_runs: 7
  enable_stale_job_pass: true
```

Jobs not returned in an ingest run get `missed_runs` incremented; at `>= stale_after_missed_runs` they become `is_active=false`. The jobs API defaults to **active only** unless `include_inactive=true`.

## Alert webhooks (optional)

| Variable | Meaning |
|----------|---------|
| `ALERT_WEBHOOK_URL` | POST after run if status is `failed` or `partial`. |
| `ALERT_MIN_ERRORS` | Minimum `errors_count` to alert (default `1`). |
| `ALERT_WEBHOOK_FORMAT` | `json` (default) or `slack` for Slack incoming webhooks. |
| `ALERT_WEBHOOK_TIMEOUT` | Seconds (default `15`). |

Payload includes `run_id`, `status`, `errors_sample`, counts, timestamps — **never** secrets.

API health probes for deploys: see `documentation/HEALTH_AND_ALERTS.md` (`/healthz` vs `/readyz`).
