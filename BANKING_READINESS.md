# Fuzen AI RC2 Banking Readiness

## Decision

**Conditional pilot readiness; not production signoff yet.**

## Verified locally

- Frozen architecture and current RC1 commit are clean.
- Backend tests, frontend build, Vitest, Playwright, Python compilation, authentication, tenant isolation, WebSocket authentication, pagination, idempotency, and synthetic simulation were previously verified.
- Docker and Compose tooling are installed, and an explicit Compose deployment definition plus healthcheck is now present.

## Not verifiable in this workstation

- Docker engine build: Docker Desktop Linux engine is unavailable (`dockerDesktopLinuxEngine` pipe missing).
- Render/Vercel/private-cloud deployment and TLS termination.
- Gemini, Neo4j, and Supabase failure drills with live provider credentials.
- Physical Android cold-install, upgrade, offline, VPN, background/resume, notification, and APK-update tests.
- 100/500/1000/5000 concurrent-session benchmarks with production hardware.
- RBI/DPDP legal and institutional approval.

## RBI/DPDP assumptions

The pilot must define data residency, retention/deletion, access reviews, incident reporting, encryption/key custody, processor contracts, audit-log retention, and customer-data minimization with the bank's compliance and legal teams. This repository does not constitute regulatory certification.

## Demo mode

The existing `/synthetic/simulate` capability is the approved controlled simulation surface. A one-click autonomous production/demo orchestrator was not added because the architecture is frozen and the RC2 brief prohibits new features; use the existing endpoint and dashboard controls under an explicitly non-production environment.

## Pilot checklist

- [ ] Provision and validate all production secrets.
- [ ] Configure durable SQLite storage and tested backup/restore.
- [ ] Set explicit TLS, CORS, WSS, logging, and network controls.
- [ ] Run provider degradation drills.
- [ ] Complete physical Android validation.
- [ ] Run concurrency benchmarks on pilot hardware.
- [ ] Obtain bank security, privacy, and operational approvals.
