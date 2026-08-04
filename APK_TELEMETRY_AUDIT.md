# APK Telemetry Audit

## Scope

The existing authentication, QR pairing, SDK, session, WebSocket, and transfer architecture was preserved.

## Implemented telemetry seams

- Session start and end
- Login/logout lifecycle
- App resume/background
- Navigation screen open/close
- Transfer started, completed, cancelled, and result viewed
- Existing touch, typing-rhythm, and motion aggregates
- Existing WebSocket trust updates
- Existing offline event queue and retry path

Telemetry excludes passwords, PINs, clipboard contents, raw keystrokes, screen contents, and location coordinates.

## Remaining audit note

Beneficiary, QR, bill, and profile actions already have SDK seams in the repository; their event coverage should be exercised on a physical device during the demo rehearsal.
