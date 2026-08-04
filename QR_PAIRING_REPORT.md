# QR Pairing Report

## Verified flow

`/device/pair` creates a short-lived pairing record. `/device/register` consumes the pair and bootstrap token, validates the device payload, selects the configured SDK authentication client, and issues a scoped JWT.

The issued SDK JWT is now asserted to contain:

- tenant: `TENANT_FUSB_001` in the configured integration environment
- role: `sdk`
- device identity and request correlation claims from the existing token implementation

## Root cause of the reported 403

The registration path used a fixed development client. In environments where that client was not configured or did not carry tenant scope, the token could not satisfy downstream tenant authentication. The path now resolves the configured SDK client and fails explicitly with 503 if no tenant-scoped SDK client exists.

## Regression test

`test_pairing_registers_device_and_issues_sdk_credentials` now decodes the returned token and verifies tenant and role claims. The focused pairing and stabilization suite passes 7/7.

## External checks still required

Execute on a real device/emulator: QR expiry, replay, duplicate device, clock skew, Supabase session handoff, WebSocket upgrade, reconnect after token refresh, offline resume, and network transition.
