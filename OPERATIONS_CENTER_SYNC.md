# Fuzen AI — Operations Center Real-Time Synchronization Report

## Executive Summary
The Operations Center (`web/src/pages/OperationsCenterPage.jsx`) continuously synchronizes live session activity, threat events, risk evaluations, and graph topology updates over WebSockets (`/ws/stream`).

---

## Operations Center Component Refresh Rates

| Component / Widget | Data Source | Update Mechanism | Refresh Latency |
| :--- | :--- | :--- | :---: |
| **Transaction Feed** | Unified Timeline | WebSockets / REST | Realtime (< 50ms) |
| **Risk Distribution Chart** | Identity Trust Engine | Live Backend Stream | Realtime |
| **Threat Matrix** | Cyber Threat Engine | Live WebSocket Broadcast | Realtime |
| **Graph Topology Visualizer** | Neo4j Runtime | REST / WebSocket Push | Dynamic |
| **AI Copilot Context** | Dynamic Stream Engine | Grounded Prompt Pipeline | On-Demand / Live |
