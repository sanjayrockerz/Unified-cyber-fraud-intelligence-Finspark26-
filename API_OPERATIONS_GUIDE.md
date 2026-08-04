# API Operations Guide

Canonical authentication is `/auth/token` for platform clients and `/auth/login`/`/auth/refresh` for banking users. Authenticated requests carry tenant and role claims. Business data routes are not public. Use `X-Request-ID` for correlation; responses include request and latency headers. WebSockets authenticate with `Bearer.<JWT>` as the subprotocol or an access-token cookie, never a query token.
