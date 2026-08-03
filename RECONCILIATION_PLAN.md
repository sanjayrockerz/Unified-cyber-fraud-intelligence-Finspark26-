# Fuzen AI Reconciliation Plan

## Base

Reconciliation branch: `reconciliation/phase1-4-with-github`, based on GitHub `origin/main` commit `e20713e`.

## GitHub-only capabilities retained

- Docker and deployment packaging
- Production database and ML artifact packaging
- Overview and investigation UI redesign
- Investigation tabs, panel state, and error boundaries
- Playwright and Vitest infrastructure
- Threshold sweep, explainability, and training tools
- Demo-readiness and E2E documentation

## Local-only capabilities to restore

- Hardened authentication and JWT claims
- Fail-closed environment validation
- Tenant-scoped ownership and pagination
- Persistent SQLite idempotency and indexes
- Backend analytics summary and live metrics
- Synthetic session simulation
- Dynamic timeline and realtime envelopes
- Duplicate route removal
- Structured enterprise Copilot cards
- Android secure WebSocket authentication and SDK health wiring

## Conflict strategy

GitHub remains authoritative for newly introduced layout, deployment, packaging, and test infrastructure. Existing local security and data-integrity changes are restored where GitHub did not alter the same implementation. Overlapping backend and page modules are reconciled by preserving GitHub additions and reinserting only the local security/data-flow behavior. SQLite binaries are not blindly replaced; schema and migration behavior are checked against the newer packaged database.

