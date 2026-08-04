# Session Intelligence Report

After successful login and SDK session creation, the app starts behavioural collection, the telemetry loop, WebSocket trust streaming, and emits `SESSION_STARTED`.

Navigation and application lifecycle events are emitted through the existing SDK event endpoint and therefore use the existing tenant/session/request/correlation pipeline.

Trust Passport remains the authoritative session view. It refreshes the current passport and history and displays component deltas, confidence, trend, connection, and latency.
