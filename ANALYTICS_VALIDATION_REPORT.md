# Analytics Validation Report

## Backend source of truth

The new `/analytics/summary` endpoint computes tenant-scoped analytics from the current SQLite store and threat engine. It supports daily, weekly, monthly, custom, 1h, 24h, 7d, and 30d selector values and returns:

- transaction, decision, blocked, challenged, threat, and amount totals;
- hourly transaction buckets;
- threat-vector counts;
- generated-at timestamp and source metadata.

The React Analytics page consumes this endpoint for operational KPIs, threat vectors, and hourly charts. It no longer supplies hardcoded attack counts, geographic shares, or static SHAP drivers for those sections.

## Validation

- Analytics endpoint smoke test: passed.
- Standard response envelope: passed.
- Frontend build: passed.

## Remaining release work

Offline model evaluation files remain a separate backend metrics source. They should be labeled as model-evaluation artifacts rather than live operational analytics, and geographic aggregation should be added server-side if that chart is required.
