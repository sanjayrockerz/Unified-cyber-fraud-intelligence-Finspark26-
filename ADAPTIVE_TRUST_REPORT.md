# Fuzen AI — Adaptive Trust Score Report

## 1. Overview
Fuzen AI replaces static transaction risk scores with a continuous **Adaptive Trust Score** (0 to 100). Trust fluctuates continuously per session event, adjusting as security telemetry updates.

## 2. Score Breakdown & Pillars
$$\text{Adaptive Trust} = w_1 \times T_{\text{Device}} + w_2 \times T_{\text{Runtime}} + w_3 \times T_{\text{Network}} + w_4 \times T_{\text{Behavior}} - P_{\text{Correlation}}$$
- **Device Trust ($T_{\text{Device}}$)**: Baseline: 95. Root/Emulator reduces by -30/-20.
- **Runtime Trust ($T_{\text{Runtime}}$)**: Frida, debuggers, or tampers reduce by -35 to -40.
- **Network Trust ($T_{\text{Network}}$)**: VPN or proxy tunnels reduce by -20.
- **Behavior Trust ($T_{\text{Behavior}}$)**: Cadence drifts reduce by -25.
- **Correlation Penalty ($P_{\text{Correlation}}$)**: Multi-indicator co-occurrence (e.g. VPN + Root + Accessibility Abuse) triggers additional exponential penalties (-15 per additional threat).

## 3. Trust Timeline Decay & Recovery
```
[95.0 Healthy] ──(VPN Active)──> [75.0 Suspicious] ──(Root Detected)──> [35.0 Blocked]
                                                                              │
                                                                       (Biometric MFA)
                                                                              ▼
                                                                     [75.0 Restored]
```
Biometric verification successfully recovers the trust, ensuring seamless customer experience for benign alerts.
