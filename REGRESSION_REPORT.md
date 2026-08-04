# Regression Report

## Full test suite

`20 passed, 11 failed`.

The failures are concentrated in tests that intentionally assert superseded behavior:

- `fusion-android-dev` and `fusion-dashboard-dev` hardcoded development clients
- `demo_user` / `FusionDemo!2026`
- allowing newly registered users when configured banking users are absent
- `ModelUnavailable` instead of the structured degraded model status
- old WebSocket close-code expectations
- startup without required production environment variables

These failures are contract regressions in the old tests, not evidence that the hardened behavior should be reverted. They require test fixture migration to configured users/clients and the new security contract.

## Playwright

The committed Playwright suite was invoked, but the temporary Vite process exited before workers connected, producing `ERR_CONNECTION_REFUSED` rather than application assertions. The production build and Vitest suite pass; Playwright needs to be rerun with a persistent dev-server process or CI `webServer` configuration.

