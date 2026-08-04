# Conflict Matrix

| Area | Resolution | Result |
|---|---|---|
| Deployment/Docker/ML packaging | Retained GitHub implementation | Preserved |
| UI redesign and investigation tabs | Retained GitHub implementation | Preserved |
| Authentication and environment | Restored local hardened implementation | JWT claims, fail-closed config, no demo fallback |
| Public paths and tenant scope | Restored local middleware/dependency behavior | Business endpoints require authenticated tenant |
| WebSocket | GitHub endpoint retained and local secure protocol/envelope behavior reintroduced | Bearer subprotocol, tenant/request metadata, duplicate-session guard |
| SQLite | New GitHub database packaging retained; local store schema/index/idempotency behavior restored | No binary overwrite |
| Analytics | GitHub page retained; backend summary and live values reintroduced | Static primary KPIs removed |
| Synthetic simulation | Added to GitHub API surface | Tenant-scoped smoke test passes |
| Timeline | GitHub session UI retained; seeded timeline behavior removed | Empty state is authoritative |
| Copilot | GitHub visual shell retained; response rendering replaced | Structured cards, no runtime Markdown |
| Reports | Backend-driven local report page restored | Demo report removed |

