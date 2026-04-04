#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Local Development Scheduler
# ---------------------------------------------------------------------------
# Starts Celery worker + Beat scheduler in a single process for local dev.
# In production, these run as separate Docker containers (see docker-compose.yml).
#
# Prerequisites:
#   - Redis running on localhost:6379
#   - Python venv activated
#   - All dependencies installed (pip install -r requirements.txt)
#
# Usage:
#   chmod +x scripts/run_scheduler.sh
#   ./scripts/run_scheduler.sh
# ---------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Ensure venv is activated
if [ -d "venv" ] && [ -z "${VIRTUAL_ENV:-}" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
fi

# Check Redis connectivity
if ! redis-cli ping &>/dev/null; then
    echo "❌ Redis is not running on localhost:6379. Start Redis first."
    echo "   brew services start redis   (macOS)"
    echo "   docker run -d -p 6379:6379 redis:7-alpine  (Docker)"
    exit 1
fi

echo "🚀 Starting Celery Worker + Beat Scheduler (local dev mode)"
echo "   Broker:   ${CELERY_BROKER_URL:-redis://localhost:6379/1}"
echo "   Schedule:  Reads from config/settings.yaml → scheduler.daily_time_utc"
echo "   Press Ctrl+C to stop"
echo ""

# Combined worker + beat in a single process (dev only)
exec celery -A agents.core.celery_app worker \
    --beat \
    --loglevel=info \
    --concurrency=2 \
    --pidfile=/tmp/celerybeat.pid \
    --schedule=/tmp/celerybeat-schedule
