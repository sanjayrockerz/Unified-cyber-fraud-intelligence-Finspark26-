# Realtime Synchronization Report

## Contract

WebSocket authentication is now identical for browser and Android clients:

- Sec-WebSocket-Protocol: Bearer.<token>
- access_token cookie remains supported for compatible non-browser clients.
- Query-string access tokens are not accepted.

Every server message includes tenant, session, request_id, and timestamp. The server sends connection_ack, heartbeat, pong, recent events, pipeline decisions, and live broker events using the same envelope.

## Reliability behavior

- Server heartbeat is emitted after an idle interval.
- Expired tokens close with 4401 and require client reconnect/refresh.
- Missing credentials close with 4403.
- Duplicate tenant/session connections close the previous connection with 4409.
- Browser and Android clients use the Bearer subprotocol and preserve reconnect behavior.
- Event history is replayed on connection and live events are fanned out through the existing broker.

## Verification

TestClient WebSocket integration passed: connection_ack and pong both contained all required envelope fields.

## Remaining release work

Cross-process broker durability and multi-worker event ordering remain bounded by the existing process-local broker architecture. Production deployment should retain the documented single-worker SQLite/event-process constraint unless an approved external broker is introduced in a later phase.
