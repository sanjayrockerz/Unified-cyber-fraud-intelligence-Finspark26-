# Merge Report

## Merged improvements

- GitHub deployment, Docker, database/ML packaging, UI redesign, investigation tabs, error boundaries, Playwright, Vitest, explainability, threshold sweep, and documentation remain on the reconciliation branch.
- Authentication now uses `FUSION_BANK_USERS_JSON`, JWT secret validation, tenant/role/permission/request claims, and no demo credential fallback.
- Business lists, synthetic persistence, threat reads, reports, timeline, and analytics are tenant-scoped.
- SQLite indexes, `processed_requests`, persistent idempotency, and paginated store access are restored.
- WebSocket access uses the Bearer subprotocol or secure cookie, propagates tenant/session/request/timestamp metadata, and rejects duplicate sessions.
- `/analytics/summary` and `/synthetic/simulate` are available on the GitHub API surface.
- Copilot responses render as investigation cards rather than Markdown or raw JSON.

## Validation

- Python compileall: pass
- Focused backend tests: 4 passed
- Vitest: 3 passed
- Frontend build: pass
- Android `compileDebugKotlin`: pass
- Auth/analytics/timeline/WebSocket smoke: pass
- Synthetic simulation smoke: pass
- Route deduplication: 133 unique routes

