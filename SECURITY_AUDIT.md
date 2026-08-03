# RC1 Security Audit

## Passed or enforced

- JWT validation uses configured secret, issuer/audience, expiry, tenant, role, permissions, and request identity claims.
- Public paths exclude business data endpoints.
- WebSockets reject missing credentials with 4403 and accept the Bearer subprotocol or secure cookie.
- Banking login has no demo-user fallback and rejects empty configuration.
- Tenant context is required by authenticated requests and storage helpers scope reads/writes.
- Persistent idempotency uses a tenant/hash uniqueness constraint.
- Artifact lookup returns 404 instead of creating a dummy artifact.

## Residual risks

- Provider integrations are optional and degrade to local fallbacks when not configured.
- `LEDGER_SIGNING_KEY` still has a development-only ephemeral warning and must be provisioned in production.
- Legacy experimental modules retain static scenario fixtures; see `LEGACY_CLEANUP_REPORT.md`.
- Rate-limit and external WAF enforcement remain deployment responsibilities.
