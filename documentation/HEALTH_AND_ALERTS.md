# Health checks and ingest alerts

Use these when deploying behind a load balancer, Kubernetes, or when you want chat notifications after scheduled runs.

## Liveness vs readiness

| Endpoint | Purpose |
|----------|---------|
| `GET /healthz` | Process is running. No database call. |
| `GET /readyz` | Database is reachable (`SELECT 1`). Returns **503** if the DB is down. |

Probe configuration (typical):

- **Liveness:** `GET /healthz` — restart the pod if the process is wedged.
- **Readiness:** `GET /readyz` — remove the instance from rotation if Postgres is unavailable.

`/readyz` sets `Cache-Control: no-store` so probes do not cache a stale “ready” response.

## Ingest webhook alerts (optional)

After each `run_greenhouse_ingest()` run, if `ALERT_WEBHOOK_URL` is set and the run status is `failed` or `partial` (and `errors_count` meets the threshold), the app **POSTs JSON** to that URL.

| Variable | Meaning |
|----------|---------|
| `ALERT_WEBHOOK_URL` | HTTPS URL (Slack incoming webhook, Discord, or generic receiver). |
| `ALERT_MIN_ERRORS` | Minimum `errors_count` before alerting on `partial` (default `1`). |
| `ALERT_WEBHOOK_FORMAT` | `json` (default, structured payload) or `slack` (Slack `{"text": "..."}`). |
| `ALERT_WEBHOOK_TIMEOUT` | Request timeout in seconds (default `15`). |

Payloads **never** include secrets or `DATABASE_URL`.

### Slack

1. Create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) for a channel.
2. Set `ALERT_WEBHOOK_URL` to the webhook URL and `ALERT_WEBHOOK_FORMAT=slack`.

### Local smoke test

```bash
# Terminal 1: start API with DATABASE_URL set
uvicorn api.main:app --host 127.0.0.1 --port 8000

# Terminal 2
curl -sS http://127.0.0.1:8000/readyz
```

Expect `200` and JSON with `"status":"ready"` and `"checks":{"database":"ok"}`.
