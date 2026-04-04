# Site Reliability Engineering (SRE) - Production Runbook

This document dictates the authoritative operational bounds for deploying, restoring, and rolling back the Agentic AI Job Application Copilot natively across dynamic cloud VM and Docker Compose topologies.

## 1. 🚀 Production Deployment
The infrastructure relies entirely on containerized microservices managed via standard Make abstractions.

### Zero-Downtime Deployment
Deployments orchestrate new containers natively without breaking existing connection pools:
```bash
git pull origin main
make deploy
```
*Note: Make will natively spawn Postgres, Redis, the Python API, and the strict Nginx Multiplexer.*

### Real-Time Service Verification
Monitor the live endpoints directly to verify uptime health status natively. Our `/healthz` constraint acts as the explicit Liveness probe for Load Balancers:
```bash
curl http://localhost:8000/healthz
# Expected Liveness Output: {"status": "ok"}
```

## 2. ⏪ Emergency Physical Rollbacks
If a newly pushed deployment triggers an environment crash or frontend regression, execute an immediate repository state rollback.

```bash
# 1. Reverse the git tracking HEAD to the last stable hash seamlessly
git checkout <stable_commit_hash>

# 2. Re-compile the image binaries globally and recycle the proxy loop
make clean
make deploy
```

## 3. 💾 Database Bare-Metal Restoration
The backend architecture securely utilizes an automated `db-backup` sidecar container that forcefully snapshots `pg_dump` binary records into the local `/backups` host volume every 24 hours strictly.

### Restoring an Emergency Snapshot
If critical relational data loss occurs, restore the persistence constraints directly from the locally mapped Docker volume explicitly:

```bash
# 1. Identify the latest structural backup inside the host volume
ls backups/

# 2. Pipe the SQL binary buffer directly into the live Postgres container seamlessly
cat backups/db_backup_2026-04-03_00-00-00.sql | docker exec -i ai-job-copilot-postgres-1 psql -U user -d ai_jobs
```

*Warning: Executing this restoration pipeline will completely wipe existing live data schemas up to the point of the snapshot. Ensure scraping cron-jobs are physically paused prior to execution.*
