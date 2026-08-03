# RC1 Legacy Cleanup Report

## Removed or retired

- Removed demo banking credentials from the backend test contract; tests now use explicit RC1-only fixtures.
- Removed duplicate `/sdk/request-decision` and duplicate SDK route implementations from `api/main.py`.
- Removed the old `ModelUnavailable` response expectation and standardized on `degraded`.
- Removed retry identity dependence on generated event IDs; persistent idempotency now uses the client request ID.
- Removed WebSocket query-token usage from browser clients and aligned all callers to the Bearer subprotocol.

## Remaining inventory

The following values remain in legacy/experimental modules that are not used by the canonical dashboard flow: `api/response_orchestrator_engine.py`, `api/digital_twin_engine.py`, `api/synthetic_universe/transaction_behavior_engine.py`, `api/synthetic_universe/fraud_scenario_engine.py`, `api/core_platform/graph_runtime.py`, and `web/src/components/graph/Neo4jGraphStudio.jsx`.

They were not deleted because no equivalent live route was verified for each module. Removing them would delete compatibility behavior rather than clean a proven dead path. They are release debt and must be removed or parameterized before a banking production deployment.

# Status

RC1 canonical runtime paths are clean; legacy experimental paths remain explicitly tracked.
