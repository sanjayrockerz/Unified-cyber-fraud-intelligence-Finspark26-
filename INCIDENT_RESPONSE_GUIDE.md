# Incident Response Guide

1. Confirm service liveness and isolate the affected tenant/session.
2. Preserve structured logs and evidence references using request IDs.
3. Rotate compromised JWT/client/signing credentials.
4. Disable affected provider integrations if they return corrupt or unauthorized data.
5. Restore SQLite from the most recent verified backup if integrity is uncertain.
6. Validate tenant isolation, WebSocket authorization, and replay/idempotency behavior before reopening traffic.
