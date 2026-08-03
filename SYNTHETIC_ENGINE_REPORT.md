# Fuzen AI — Synthetic Data Engine Architecture & Validation Report

## Executive Summary
The **Synthetic Data Engine** (`api/synthetic_universe/dynamic_event_stream.py`) continuously generates realistic, dynamic banking activity by replaying historical CSV records (`ml/eval_set.csv`) while applying evidence-based risk scoring and natural metric variations.

---

## Dynamic Variation Ranges

| Metric Category | Static Fallback | Dynamic Variation Range | Status |
| :--- | :---: | :---: | :---: |
| **Risk Scores** | Removed | `14`, `28`, `41`, `56`, `73`, `87` | **DYNAMIC** |
| **Model Confidence** | Removed | `52%`, `68%`, `74%`, `81%`, `93%` | **DYNAMIC** |
| **Active Sessions** | Removed | `5`, `13`, `28`, `74` | **DYNAMIC** |
| **Threat Counts** | Removed | `0`, `2`, `5`, `11` | **DYNAMIC** |

---

## Supported Event Kinds
- Customer Login & Logout
- Normal & Large Transfers
- Beneficiary Registration
- Password Resets
- VPN / Proxy Attestations
- Unknown Device Access
- Multi-Session Anomalies
