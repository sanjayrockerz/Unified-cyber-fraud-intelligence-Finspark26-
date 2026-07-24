# Identity Trust and Customer Security Report

## Implemented

- Versioned Supabase schema for customers, devices, sessions, login history, transactions, notifications, security events, risk scores, email logs, device trust, behaviour profiles, VPN detections, and location history.
- Supabase Auth registration, email verification state, password reset, and password login adapter through `/identity/*`.
- Compatibility integration with the existing `/banking/auth/*` APK flow. Banking login now creates an identity security session and returns a live security assessment.
- Device, location, network, VPN/proxy, root, emulator, new-device, and multi-device evidence collection.
- Dynamic login risk scoring and security event creation.
- Resend-backed HTML customer email delivery with durable email logs and in-app notifications.
- Identity security event streaming through the existing platform WebSocket broker.
- Operations Center identity-security counters and live suspicious-login timeline.
- Android registration screen and VPN transport attestation header.

## Deployment gates

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, and `SECURITY_EMAIL_FROM` on the backend. Apply the SQL
migration before enabling `IDENTITY_SUPABASE_REQUIRED=true`.
