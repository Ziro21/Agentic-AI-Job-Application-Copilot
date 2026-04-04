# Agentic AI Job Copilot - Deployment Architecture

This deployment guide covers spinning up the unified multi-tenant architecture locally or on a VPS (e.g. AWS EC2, DigitalOcean).

## 1. Backend & Database (Docker Compose)
The Python framework has been natively Dockerized inside `Dockerfile` yielding a single-click container launch.

```bash
# 1. Provide your environment vars securely
cp .env.example .env

# 2. Build and launch PostgreSQL + FastAPI asynchronously
docker-compose up -d --build
```

**Services Launched:**
- `db`: PostgreSQL 15 running on port 5432
- `api`: FastAPI Python Core running on port 8000

## 2. Frontend Application (Next.js 14)
The dashboard has been successfully tested against strict Server-Side generation constraints.

```bash
cd dashboard

# Installs all cached TS/React dependencies
npm install

# Compiles SSG/SSR components offline
npm run build

# Bootstraps the Node.js production server wrapper
npm run start
```
**Access View:** `http://localhost:3000`

## 3. Webhook Extension Mapping
Deep ATS inspection is achieved entirely client-side utilizing standard MV3 (Manifest V3) algorithms bundled inside `extension-build.zip`.

1. Navigate to `chrome://extensions/`
2. Enable Developer Mode (top right).
3. Drag and Drop `extension-build.zip` directly onto the Chrome Viewport.

*The AI Job Copilot is now successfully tracking job submissions natively securely over JWT payloads to the API running on `localhost:8000/api/v1/jobs/.../application`.*
