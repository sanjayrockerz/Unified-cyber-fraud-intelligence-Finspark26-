# Fuzen AI — Redesigned SOC AI Copilot Report

## 1. Role & Redesign
The AI Copilot has been upgraded from a generic chatbot to an **Enterprise SOC Cybersecurity Analyst**. It integrates directly with backend state registries, SQLite stores, and Neo4j topologies to deliver real-time, evidence-grounded reports.

## 2. Response Template Format
Every Copilot investigation is structured into 12 standardized operational dimensions:
1. **Executive Summary** — Brief posture overview.
2. **Observed Evidence** — Bulleted anomalies.
3. **Correlation Analysis** — Multi-step campaign mappings.
4. **Threat Timeline** — Timestamped execution steps.
5. **Trust Delta** — Historical scoring progression.
6. **Behavior Drift** — Quantitative cadence shifts.
7. **Graph Findings** — Structural linkages.
8. **Recommended Actions** — Direct playbooks.
9. **Compliance Notes** — DPDP auditing records.
10. **Confidence Score** — Calibration metrics.
11. **Sources** — Internal ingestion streams.
12. **Next Investigation** — SOC queue steps.

## 3. Reliability & Fallbacks
When LLM APIs hit rate limits or are disconnected in private cloud nodes, the local parser returns a grounded summary from the active session cache, ensuring 100% uptime.
