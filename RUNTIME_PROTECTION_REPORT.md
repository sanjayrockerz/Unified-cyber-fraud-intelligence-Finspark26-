# Fuzen AI — Runtime Application Self-Protection (RASP) Report

## 1. Core Threat Categories
The Fuzen SDK acts as a self-defending binary executing inside hostile user-space environments.

## 2. Implemented Detectors & Controls
| Sensor check | Method & Mechanism | Severity |
| :--- | :--- | :--- |
| **Debugger Detection** | Polling `android.os.Debug.isDebuggerConnected()` and checking `TracerPid` in `/proc/self/status`. | HIGH |
| **Frida hook detection** | Scanning memory for `frida-agent.so` and checking default server ports (27042). | CRITICAL |
| **Root & Magisk** | Searching Magisk hides, `/sbin/su` binaries, and testing Superuser application package checks. | CRITICAL |
| **Overlay Detection** | Monitoring active `SYSTEM_ALERT_WINDOW` objects rendering over banking payment layouts. | HIGH |
| **Accessibility Abuse** | Scanning for malicious listeners accessing payment fields or bypassing clicks. | CRITICAL |
| **Certificate Pinning** | Enforcing strict SSL trust management pinning through SSL Context validation. | HIGH |
| **APK Tampering** | Comparing current package signature hashes against authoritative production builds. | CRITICAL |

## 3. Dynamic Telemetry Response
Any compromise instantly flags the session status to `BLOCKED`, decay trust, and broadcasts threat indicators to the Operations dashboard.
