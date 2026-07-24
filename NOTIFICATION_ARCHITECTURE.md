# Notification Architecture

1. Banking or identity login enters `IdentityTrustService`.
2. Device, network, location, VPN, behaviour, and session evidence produce a
   risk assessment.
3. Suspicious evidence creates `security_events`, `risk_scores`, and an
   in-app `customer_notifications` record.
4. `SecurityEmailService` renders an HTML alert and sends it through Resend.
5. Every attempt is stored in `email_logs` with provider status and error data.
6. The same security event is published to the Operations Center WebSocket.

The email service fails observably when email credentials are absent; it does
not report a successful delivery without a provider response.
