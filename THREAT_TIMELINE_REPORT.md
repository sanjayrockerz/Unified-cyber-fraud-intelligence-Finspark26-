# Threat Timeline Report

## Implemented

- `/timeline/stream` no longer seeds synthetic events when the timeline is empty.
- Timeline reads are tenant-scoped and sorted by UTC timestamp descending.
- Pipeline decisions are recorded into the existing dynamic timeline with tenant and session context.
- Telemetry page polls the backend timeline and displays an explicit empty/error state.
- Investigation timeline consumes WebSocket events and no longer falls back to scripted timestamps.

## Event fields

Live pipeline/WebSocket envelopes carry tenant, session, request ID, timestamp, normalized event, threats, graph result, inference state, decision, and timings where available.

## Remaining release work

Some older response/investigation engines still contain dormant scripted narratives and fallback defaults. They require a focused follow-up removal pass before the repository can honestly claim zero hardcoded threat narratives across every legacy module.
