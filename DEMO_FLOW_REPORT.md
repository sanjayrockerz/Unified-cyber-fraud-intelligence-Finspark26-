# Demo Flow Report

1. Pair the APK from the Developer Portal QR payload.
2. Log in with the configured banking test account.
3. Confirm the status card shows device verification, active session, and monitoring.
4. Navigate through Home, Accounts, Beneficiary, and Transfer; screen lifecycle telemetry is emitted.
5. Submit a synthetic transfer. The SDK emits start and outcome events and requests the existing adaptive decision.
6. Open Trust Passport and show the current score, component deltas, confidence, trend, and live connection.
7. In the SOC dashboard, observe the event, trust update, timeline, graph correlation, copilot evidence, and report state.

The transfer remains synthetic and does not connect to payment networks or financial institutions.
