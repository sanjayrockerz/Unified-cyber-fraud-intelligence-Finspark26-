# Performance Benchmark

## Measurements available in the repository

The existing synthetic benchmark was run against isolated temporary SQLite stores. Results are directional, not a capacity guarantee:

| Sessions | Elapsed |
|---:|---:|
| 100 | 5.58 s |
| 500 | 2.65 s |
| 1,000 | 5.82 s |
| 5,000 | 38.87 s |

The non-monotonic small-run result reflects process and database setup overhead. The 5,000-session result demonstrates that the current path is functional but does not establish a sub-300 ms end-to-end target.

## Frontend verification

- Vite production build: passed.
- Playwright crawl: 24/24 passed.
- Resource requests now have timeout, cache, stale-data retention, and background refresh behavior.

## Required next measurement

Run browser performance traces with production assets and configured backend services. Record FCP, LCP, TTI, dashboard API latency, WebSocket event latency, memory, and CPU separately; the current Playwright smoke suite is not a substitute for those measurements.
