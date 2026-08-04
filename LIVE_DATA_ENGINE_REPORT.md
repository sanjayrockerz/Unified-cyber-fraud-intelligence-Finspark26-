# Live Data Engine Report

## Implemented

- Transaction pipeline decisions are recorded into the backend event timeline and published through the existing event broker.
- `/analytics/summary` computes tenant-scoped totals, decisions, amounts, hourly activity, and threat vectors from SQLite and the threat engine.
- `/reports` reads tenant-scoped generated report records; `/report/cert-in` persists a report before returning the PDF.
- `/synthetic/simulate` supports 1–10,000 generated sessions, optional deterministic seeds, random seeds, tenant-scoped persistence, and replay metadata.
- Synthetic transactions receive session IDs and realistic UTC timestamps.
- Empty live state is represented by waiting/unavailable messages instead of fabricated KPI records.

## Data flow

APK/SDK -> authenticated FastAPI -> authoritative pipeline -> SQLite processed/store records -> event broker/WebSocket -> dashboard widgets. Graph and model results remain attached to pipeline decisions and health status.

## Remaining release work

Legacy engine modules and several secondary frontend panels still contain dormant demo constants. They are not used by the new empty-state paths, but should be removed or converted before a strict no-static-data production gate.

## Verification

- Python compileall: passed.
- Synthetic simulation smoke test with two sessions: passed.
- Analytics, timeline, reports, and graph endpoint smoke tests: passed.
- Frontend build: passed.
- Android compileDebugKotlin with configured URLs: passed.
