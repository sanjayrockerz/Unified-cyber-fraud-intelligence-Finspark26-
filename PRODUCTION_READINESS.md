# Production Readiness

## Ready

- GitHub deployment and packaging improvements are preserved.
- Authentication fails closed when required configuration is absent.
- Business data paths enforce tenant context.
- WebSocket authentication no longer uses query-string tokens.
- Persistent idempotency and SQLite indexes are present.
- Analytics, synthetic simulation, timeline, and Copilot smoke paths pass.
- Frontend and Android compile successfully.

## Remaining blockers

1. Migrate the 11 stale Python tests to the hardened authentication/model/WebSocket/startup contracts.
2. Rerun Playwright using a persistent server process and resolve any real UI assertions separately from the observed connection-refused harness failure.
3. Remove dormant legacy demo constants from non-primary engines (`copilot_engine.py`, graph fallback, response orchestrator, trust engines, and runtime demo panels) only after equivalent live backend bindings are added.
4. Replace the remaining duplicate legacy route declarations with explicit compatibility adapters; import-time deduplication prevents duplicate exposure but does not remove duplicate source definitions.
5. Configure production `JWT_SECRET_KEY`, `DATABASE_URL`, `FUSION_BANK_USERS_JSON`, `FUSION_AUTH_CLIENTS_JSON`, and provider credentials in deployment secrets.

