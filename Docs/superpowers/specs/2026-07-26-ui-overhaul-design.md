# UI Overhaul & Stability Design — Fuzen AI Dashboard

**Status:** Approved by user 2026-07-26. Ready for implementation planning.
**Audience for this doc:** whoever picks up implementation (human or subagent) — should be able to work from this without re-reading the whole codebase.

## Problem statement

Two concrete, reproducible bugs anchor this work:

1. **Missing nav links.** `web/src/components/layout/Sidebar.jsx` maintains two hand-written arrays: `groups` (drives the visible sidebar) and `allNavItems` (drives the pinned-favorites lookup). They already disagree — `/` ("Overview") and `/settings` exist only in `allNavItems`, not in `groups`. `/` survives today only because `pinnedPaths` defaults to `['/', '/operations', '/cases']` in localStorage — a user (or a cleared/corrupted localStorage) can unpin it and lose the only way to reach it from the sidebar. `/dashboard` (`web/src/App.jsx:56`) is a bare `<Navigate to="/operations" replace />` with no nav entry anywhere and no real content — `web/src/pages/DashboardPage.jsx` is confirmed orphaned (grep finds zero importers).
2. **App-wide crash on any component error.** Zero `ErrorBoundary` exists anywhere in `web/src` (confirmed by grep). `web/src/main.jsx` only catches a failure in the async auth-bootstrap before React even mounts; once mounted, any uncaught error in any single component (bad prop, `undefined.map()`, a malformed API response) unmounts the entire React tree — this is the "have to close and reopen the app" symptom.

Beyond these two, the user asked for a full visual/IA redesign from the perspective of a bank fraud analyst / SOC security analyst, plus wiring dead/mock UI surfaces to real backends where reasonable, ahead of the final deployment.

**Verification note:** `Docs/DEMO_READINESS.md` (an audit from the prior session) was used as a starting map but was independently re-verified claim-by-claim against current source before being relied on here, and it contains at least one stale/incorrect claim: it says `/customers` is "100% hardcoded mock" — direct reading of `web/src/pages/CustomersPage.jsx` and `api/main.py:486` shows it already calls the real, paginated `/customers` endpoint via `DataTable`. Only claims re-confirmed directly against current source (cited by file:line below) are treated as ground truth in this spec.

## Scope boundary (read before adding work)

**In scope:** navigation/IA fix, crash isolation, visual refinement of the existing dark `soc-*` token system, and backend-wiring for dead/mock UI *where a real data source already exists or a small, honest addition suffices*.

**Explicitly out of scope** (relabel as "Simulated" instead of building new backend subsystems): a real ML retraining queue for `LearningLoop`'s "Submit Feedback," real blast-radius graph computation for `BlastRadiusAnalysis`, real CSV upload/parsing for `CSVSchemaMapperModal`, Razorpay order/payment-link creation (already flagged FUTURE by the prior audit), MITRE ATT&CK re-mapping. These are net-new product surface CLAUDE.md never asked for, and building them untested hours before a demo is the highest-risk thing we could do.

**Hardcoded demo-persona values** (`CASE-2026-8942`, `SESS_9921_CRITICAL`, `usr_abc`, etc.) appear as default fallback props/state across ~12 files (`CaseContext.jsx`, `InvestigationWorkbench.jsx`, `SessionTrustPassportPanel.jsx`, `OperationsCenterPage.jsx`, `ResponseOrchestrator.jsx`, `RealTimeProcessingPipeline.jsx`, `UniversalSearch.jsx`, `ThreatIntelligenceDashboard.jsx`, `Sidebar.jsx`'s "Recent Investigations" list, etc.). **Decision: keep these as fallback defaults** (reasonable, matches the graph runtime's own intentionally-seeded demo edges) — do **not** rip out `CaseContext`'s default or rewrite every consumer, that's a disproportionately large, high-blast-radius change for this task. **Fix only the specific spots where real data is already in scope but a hardcoded literal is used instead of it** (enumerated in §4 below) — that's a targeted prop-threading fix, not an architecture change.

## 1. Navigation / IA fix

Files: `web/src/components/layout/Sidebar.jsx`, `web/src/App.jsx`.

- Merge `groups` and `allNavItems` into one source-of-truth array with a `group` field per item; derive both the grouped rendering and the pin-lookup from it, so they can never diverge again.
- `/` ("Overview") and `/settings` become permanent, non-removable nav rows (Overview at the top, standalone; Settings stays in the footer as today) — not part of the removable-pin system.
- Delete the `/dashboard` route (`App.jsx:56`) and delete `web/src/pages/DashboardPage.jsx` (confirmed zero importers).
- Regroup: **Overview** (standalone) → **Fraud Operations** (Operations Center, Cases, Customers, Investigation) → **Intelligence** (Analytics, Reports, Session Intelligence, Graph Runtime) → **Leadership & Platform** (Executive Command Center, Telemetry, Banking, Synthetic Lab, SDK Runtime) → **Settings** (footer).
- `Sidebar.jsx`'s hardcoded "Recent Investigations" links (`CASE-2026-8942`, `CASE-2026-2104`) stay as-is — this is a static shortcut list, not a broken-link bug, and `CASE-2026-2104` doesn't need to resolve to anything special since `InvestigationWorkbench` accepts any `caseId`.

## 2. Crash isolation

Files: new `web/src/components/common/ErrorBoundary.jsx`, `web/src/main.jsx`, `web/src/components/layout/AppLayout.jsx`.

- Build a class-based `ErrorBoundary` (React requires class components for `componentDidCatch`/`getDerivedStateFromError`) with a fallback UI matching the dark SOC theme: "This panel hit an unexpected error" + the error message in a collapsed `<details>` + a "Reload this view" button that resets the boundary's state (not `location.reload()` — must not force a full app reload) + a "Return to Overview" link.
- Wrap `<App />` in `main.jsx` with one top-level boundary (last-resort catch-all).
- Wrap `<Outlet />` inside `AppLayout.jsx` with a second boundary keyed on `location.pathname` (so navigating away from a crashed route remounts cleanly) — this is the one that keeps TopBar/Sidebar/StatusBar alive while an individual page fails.
- Add a `window.addEventListener('error', ...)` and `('unhandledrejection', ...)` pair in `main.jsx` that logs to console with a clear prefix — doesn't need a UI surface, just makes silent async failures visible in devtools instead of invisible.
- Grep-audit list-rendering call sites that call `.map()`/`.filter()` directly on a fetched API field without a `?? []` guard, and fix any found — this is the most likely actual trigger of an uncaught render crash. Priority files: anything using `DataTable`'s `onResult`, `Timeline.jsx`, `Ledger.jsx`, `LiveFeed.jsx`, the WebSocket message handlers in `ThreatIntelligenceDashboard.jsx` and `OperationsCenterPage.jsx`.
- Confirm WebSocket `useEffect` cleanup (`ws.close()` on unmount) exists in every component that opens one, to prevent orphaned sockets/reconnect loops across route changes.

## 3. Visual refinement

Keep the existing `soc-*` CSS-variable token system in `web/tailwind.config.js` and `web/src/index.css` — it's already a real semantic system, not raw hex-in-components, and doesn't need to be replaced. Per the `ui-ux-pro-max` design-system query for this product category (fintech/security, dark mode), the target palette family and explicit anti-pattern ("no AI purple/pink gradients") both already match the current navy/slate + red/amber/green direction — this is a refinement pass, not a repaint:

- Contrast-check `--soc-text-secondary` / `--soc-text-muted` against `--soc-bg-panel` and `--soc-bg-surface` for WCAG AA (4.5:1 body text, 3:1 large text); adjust the CSS variable values only if they fail, don't touch component code.
- Enforce a single type scale (12/13/14/16/20/24/32px) and `tabular-nums` on every numeric/money/timestamp column (several already use `font-mono tabular-nums` in `DataTable.jsx` — extend that convention to `MetricCard`, `StatStrip`, `RiskScoreGauge` where missing).
- Normalize spacing to the existing 4/8px rhythm on `Panel`, `Card`, `PageHeader` — light consistency pass.
- Wire the already-built, currently-unused `VerdictHero.jsx` (confirmed zero importers) into the two places a verdict is the climax of the screen: `OperationsCenterPage.jsx` (after a transaction is evaluated) and `InvestigationWorkbench.jsx` (case verdict summary) — highest visual-impact, lowest-risk win available since the component already exists and just needs real props.
- Every verdict/status color continues pairing with an icon + text label (already the pattern in `Badge`/`RiskBadge`/`VerdictBadge` — enforce, don't redesign).

## 4. Backend wiring (scoped)

| Surface | Current state (verified) | Fix |
|---|---|---|
| Settings (`SettingsPage.jsx`) | 3 sliders are local state only; Save button (`SettingsPage.jsx:70`) has **no `onClick` at all** | Add `GET/PUT /settings/policy` in `api/main.py` backed by a small SQLite table (block/challenge thresholds, correlation window); load on mount, save on click with a success toast |
| Telemetry (`TelemetryPage.jsx`) | `sampleEvents` is a 3-row inline literal, zero fetch calls | Fetch from the real `GET /threats` endpoint (`api/main.py:1490`, already live cyber-event data) instead of the literal array |
| Banking (`BankingPage.jsx`) | `sampleEvents` is a 3-row inline literal, zero fetch calls | Fetch from the real `GET /transactions` endpoint (`api/main.py:464`) instead of the literal array |
| Customers (`CustomersPage.jsx`) | **Already real** — calls `GET /customers` via `DataTable` (verified `api/main.py:486`) | No change needed; just confirm the `customers` SQLite collection has seed data so the page isn't an empty state |
| Session intelligence duplication | Two systems live simultaneously: legacy `/session/*` (`api/main.py:813-828`) vs. real SQLite-backed `/sessions` + `/trust-*` (`api/main.py:836-990`) | Confirm the frontend calls only the new `/sessions`/`/trust-*` family (spot-check `SessionTrustPassportPanel.jsx` and `SessionIntelligencePage.jsx`); if the legacy routes have no remaining frontend caller, leave them registered (removing backend routes is a bigger, riskier change than this task needs) but do not introduce any new caller of `/session/*` |
| Investigation → embedded session panel | `OperationsCenterPage.jsx:283`, `InvestigationWorkbench.jsx:248` pass the literal `sessionId="SESS_9921_CRITICAL"` to `SessionTrustPassportPanel` even when `activeCase`/`activeTxn` already carries a real session identifier in scope | Thread the real session id through when available; fall back to the literal only when no real session id exists in context (keeps the safe default, fixes the actual-data-ignored bug) |
| Fraud DevTools Inspector | `FraudDevToolsInspector.jsx:118` hardcodes `"TOTAL COMPOSITE RISK SCORE: 94.0 / 100 [BLOCK]"` regardless of the selected transaction | Compute this line from the actually-selected transaction's real score/verdict props |
| CERT-In report (`ReportsPage.jsx`) | `POST /report/cert-in` is real and genuinely downloads a PDF, but the request body is a hardcoded literal (`txn_demo_999` etc.) | Submit the currently-selected transaction/case's real fields instead of the literal; "Recent Filings Queue" stays a static single row unless a persisted reports list already exists — do not build new persistence for this if none exists |
| Analytics fusion-uplift number | `ml/metrics_report.md` currently shows `"pr_auc": 1.0` for all three modalities (transaction-only/cyber-only/full-fusion) and `fusion_vs_best_single_modality_pr_auc: 0.0` — a rigged synthetic-eval artifact, not `ml/train.py`'s real PaySim-trained output (confirmed by direct read) | Re-run `python ml/train.py` (full run) last, so `ml/metrics_report.md` reflects the honest PaySim-trained comparison — this is CLAUDE.md's own explicit "never hardcode/fake a suspiciously round headline metric" rule, and the Analytics page reads this file live |
| Synthetic Lab honesty notice | Prior "Dataset Honesty & Methodology Notice" panel was removed in an earlier redesign (per prior audit; to be re-confirmed against current `SyntheticLabPage.jsx` during implementation) | Restore a clear "synthetic data, not real bank data" notice |
| Dead investigation-collaboration panels (`LearningLoop`, `BlastRadiusAnalysis`, `CSVSchemaMapperModal`, `EvidenceLocker`'s fake file input) | Local-state theater with no backend call, per scope boundary above | Add a consistent "Simulated" badge to each instead of building new backend subsystems |

## 5. Testing

- Playwright crawl of every route in `App.jsx` and every sidebar link (including from a **clean/cleared `localStorage`** state, which is exactly the state that hides Overview today) — assert the page renders with zero console errors and the `ErrorBoundary` fallback never triggers on the happy path.
- Click-test every visible primary button per page; assert it either produces a real state change / network call, or displays the new "Simulated" badge — no silent no-ops presented as real actions.
- Deliberately induce a render error (e.g. a temporary throw injected via a test-only prop, or stopping the backend mid-session) to confirm the `ErrorBoundary` shows the fallback and the rest of the shell (TopBar/Sidebar) stays interactive, instead of a white screen.
- Produce `Docs/E2E_TEST_REPORT.md` enumerating every route/button tested and its result.

## 6. Deployment

Prepare everything to run correctly locally first (matches the prior audit's explicit recommendation given Render's free-tier cold-start issues). **Do not push to Render/Vercel or run any deploy command without a separate, explicit go-ahead** — that's a shared-system, hard-to-reverse action outside this design's approval.

## Error handling notes

- `ErrorBoundary` fallback must never itself throw — keep it dependency-free (no hooks that could fail, no fetch calls).
- New backend endpoints (`/settings/policy`) must follow the existing graceful-degrade pattern in this codebase (never hard-fail if SQLite is briefly locked — return the last-known values).
- All new/changed fetches must handle non-200 responses without throwing past the component boundary (existing `DataTable.jsx` pattern of `status: 'error'` + `EmptyState` is the model to copy).
