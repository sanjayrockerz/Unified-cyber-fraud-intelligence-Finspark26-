# RC2 Benchmark Report

Synthetic simulation was measured against an isolated temporary SQLite database using the authenticated API path:

| Sessions | Result | Wall latency |
|---:|---|---:|
| 100 | HTTP 200 | 5.58 s |
| 500 | HTTP 200 | 2.65 s |
| 1,000 | HTTP 200 | 5.82 s |
| 5,000 | HTTP 200 | 38.87 s |

The first run includes application/test startup effects, so these numbers are directional. No production hardware, CPU/memory profiler, WebSocket fan-out test, Neo4j latency test, or Gemini latency test was available. Do not treat this as an approved banking throughput SLA.
