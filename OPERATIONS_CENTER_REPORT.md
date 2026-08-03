# Operations Center Report

## Changes

- Removed the default incident/customer/transaction fallback from Operations Center.
- Operations Center now loads `/transactions` and updates from `pipeline_decision`, `transaction`, and `cyber_event` WebSocket messages.
- Loss prevented and latency display backend/live-state dependent; empty state says “Waiting for telemetry” or “Monitoring Active”.
- Analyst, customer, session, transaction, and threat fields are taken from the selected backend event.
- Static SIEM fallback is replaced with an empty telemetry state.

## Failure handling

- Initial API failure is visible and retryable.
- Empty tenant state is visible and does not render a fake incident.
- WebSocket reconnect remains supported by the existing client pages.
- Backend response envelopes preserve legacy top-level fields while adding success/data/meta/errors.

## Remaining release work

Some imported child panels retain legacy fallback values when called independently. Their parent Operations Center no longer supplies fabricated active-case data; each child should receive explicit backend state or render its own empty state in the next cleanup pass.
