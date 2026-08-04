# Pipeline Validation

## Verified locally

- Android `:app:compileDebugKotlin` succeeds.
- Existing backend session intelligence tests remain available from the prior release validation.
- Existing SDK transport uses Bearer WebSocket subprotocol authentication.
- Existing offline queue remains the retry path for failed event ingestion.

## End-to-end path

`APK event → SDK event/telemetry endpoint → threat and adaptive-trust pipeline → WebSocket trust update → Operations Center, timeline, analytics, copilot, and reports`.

## Not performed locally

Physical QR scan, physical handset network switching, and visual dashboard confirmation require a device and were not claimed as automated results.
