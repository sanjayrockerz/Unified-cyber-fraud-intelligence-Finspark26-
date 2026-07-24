# End-to-End Validation

## Automated checks

- Python compilation: run `python -m compileall -q api`.
- Dashboard build: run `npm run build`.
- Android build: run `fusion-reference-bank\gradlew.bat :app:assembleDebug`.
- SQL migration: run through `supabase db push` against a disposable Supabase
  project before production.

## Runtime acceptance flow

1. Register from the APK with full name, email, mobile, and password.
2. Confirm the Supabase verification email when Supabase Auth is enabled.
3. Log in from the registered device and confirm an active identity session.
4. Log in from a second device or send `X-Fusion-VPN-Detected: true`.
5. Confirm risk, `SUSPICIOUS_LOGIN`, VPN evidence, in-app notification, email
   delivery log, and Operations Center timeline update.
6. Confirm a valid provider message ID exists in `email_logs`.

Provider delivery and Supabase persistence require the deployment credentials;
they cannot be truthfully marked verified from a local build without those
external services configured.
