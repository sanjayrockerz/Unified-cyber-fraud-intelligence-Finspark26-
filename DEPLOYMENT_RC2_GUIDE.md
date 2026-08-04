# Fuzen AI RC2 Deployment Guide

## Local/private-cloud API

1. Copy `.env.example` to `.env` and replace every placeholder with secret-manager values.
2. Validate configuration with `python -c "from api.core_platform.config import validate_environment; validate_environment()"`.
3. Start with `docker compose up -d --build`.
4. Verify `GET /health/live` and `GET /health/ready`.
5. Stop with `docker compose down`; restart with `docker compose up -d`.

The Compose file persists SQLite in a named volume. Back up before upgrades with `powershell -File scripts/backup_sqlite.ps1`.

## Render/private cloud

Use `render.yaml` as the environment contract. Store secrets in the platform secret manager, keep `FUSION_SECURITY_MODE=production`, configure explicit CORS origins, and provide a durable SQLite volume or approved backup/restore process.

## Vercel

Vercel serves the web application and the server-side token proxy. The API must be deployed separately; set the proxy's API base and server-side client credentials. Never expose client secrets in `VITE_*` variables.

## Air-gapped deployment

Pre-stage the Python wheels, Node packages, model artifacts, graph assets, and Android APK in the approved artifact repository. Disable optional outbound providers and verify that the application reports degraded provider status while core SQLite and policy evaluation remain available.
