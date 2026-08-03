# Information Architecture Restructure

**Goal:** reduce first-time-viewer overwhelm. The feature set is complete; the problem is that
everything arrives at maximum density on load and a newcomer does not know where to look.

**Constraint:** nothing is deleted. Every component, route, and API endpoint stays in the repo and
stays reachable. This is reorganisation and progressive disclosure only. No new dependencies.
Backend (`api/`) is untouched.

---

## Findings that changed the plan

The brief listed four issues. Three needed correcting against the actual code.

1. **`web/src/pages/DashboardPage.jsx` does not exist.** The `/` index route renders
   `pages/CyberThreatIntelligencePage.jsx` (6 lines) → `components/threat/ThreatIntelligenceDashboard.jsx`
   (721 lines). The premise holds in spirit — `/` is the densest screen and there is no real
   overview — but the file and its target differ from the brief.

2. **Sidebar density is worse than 15.** On top of 15 `NAV_ITEMS` across 3 groups there is a
   duplicate permanent Overview block, a "Pinned Favorites" section defaulting to 2 pinned items,
   "Recent Investigations", "Simulations", and a second Settings link in the footer — roughly 20
   choices on first paint.

3. **Operations Center already has a collapsed section.** `showSecondaryFeeds` defaults to `false`,
   and the live transaction stream is *inside* it. Its row `onClick` is the **only** manual case
   picker on the page. So the restructure **promotes the stream out** rather than collapsing it.
   Of the 7 heavy panels, only two actually fetch on mount: `SessionTrustPassportPanel`
   (`/trust-passport/{id}`) and `InvestigationIntelligencePanel` (`/investigation/analyse`).
   `AICopilotPanel` fetches only on user input but owns its entire chat history in local state.

4. **`QuantumTrustPanel` has no route.** It renders inline at `InvestigationWorkbench.jsx:271`,
   firing 4 parallel `/quantum/*` fetches on every `/investigation` load. Giving it a nav entry
   means creating a route that did not exist.

Also found: **`/quantum/posture` in Operations Center is entirely dead** — `quantumData` is written
and never read anywhere in the file.

---

## Route inventory

| Current path | Renders | After | Nav placement |
|---|---|---|---|
| — (new) | **`OverviewPage`** (new) | `/` | **Primary** · Overview |
| `/` (index) | `CyberThreatIntelligencePage` → `ThreatIntelligenceDashboard` | **`/threats`** | Advanced · Cyber Threat Intelligence |
| `/threats` | redirect → `/` | **becomes the real route** | ↑ |
| `/operations` | `OperationsCenterPage` | unchanged | **Primary** · Operations Center |
| `/investigation/:caseId?` | `InvestigationPage` → `InvestigationWorkbench` | unchanged | **Primary** · Investigation |
| `/analytics` | `AnalyticsPage` | unchanged | **Primary** · Analytics |
| `/graph` | `GraphPage` | unchanged | **Primary** · Graph Runtime |
| `/cases` | `CasesPage` | unchanged | Advanced · Cases |
| `/customers` | `CustomersPage` | unchanged | Advanced · Customers |
| `/reports` | `ReportsPage` | unchanged | Advanced · Reports |
| `/sessions` | `SessionIntelligencePage` | unchanged | Advanced · Session Intelligence |
| `/executive` | `ExecutiveCommandCenterPage` | unchanged | Advanced · Executive Command Center |
| `/telemetry` | `TelemetryPage` | unchanged | Advanced · Telemetry |
| `/banking` | `BankingPage` | unchanged | Advanced · Banking |
| `/synthetic-lab` | `SyntheticLabPage` | unchanged | Advanced · Synthetic Lab |
| `/developer` | `DeveloperPlatformPage` | unchanged | Advanced · SDK Runtime |
| — (new) | **`QuantumTrustPage`** (new) → existing `QuantumTrustPanel` | `/quantum` | Advanced · Quantum Trust |
| `/settings` | `SettingsPage` | unchanged | Advanced · Settings |
| `/copilot` | redirect → `/operations` | unchanged | — |
| `*` | redirect → `/` | unchanged | — |

5 primary + 12 advanced = 17 destinations, all directly navigable by URL.

## Operations Center panel inventory

| Panel | Today | After |
|---|---|---|
| Mission-overview header (inline) | always on | **default view** |
| Active-session focus bar (inline) | always on | **default view** |
| `VerdictHero` | always on | **default view** |
| `FusionLifecyclePipeline` | always on | **default view** (sole consumer of `websocketStages`) |
| Incoming Transaction Stream (inline) | inside collapsed block | **promoted to default view** — restores the case picker |
| Synchronized SIEM Cyber Logs (inline) | inside collapsed block | **promoted to default view**, beside the stream |
| `SessionTrustPassportPanel` | always on, **fetches on mount** | collapsed §, lazy-mount |
| `InvestigationIntelligencePanel` | always on, **fetches on mount** | collapsed §, lazy-mount |
| `AICopilotPanel` | always on (owns chat state) | collapsed §, lazy-mount, never unmounted once opened |
| `NarrativeAIStoryteller` | always on (pure) | collapsed §, lazy-mount |
| `FraudDevToolsInspector` | inside collapsed block (pure) | own collapsed §, lazy-mount |
| `CSVSchemaMapperModal` | modal, self-gates on `isOpen` | unchanged |
| `fetchQuantumPosture()` → `/quantum/posture` | on mount, **result never read** | **removed from load path** |

`QuantumTrustPanel` in `InvestigationWorkbench` (4 fetches on mount) → collapsed §, lazy-mount,
plus reachable full-page at `/quantum`.

---

## Changes

### New files

**`web/src/components/common/CollapsibleSection.jsx`** — the progressive-disclosure primitive.
Two flags: `isOpen` and `hasOpened`. Children are not rendered at all until first expand. After
first expand the subtree **stays mounted**; collapsing applies a `hidden` class instead of
unmounting.

> Mount-once is deliberate. True unmount-on-collapse would re-fire `/trust-passport/{id}` and
> `/investigation/analyse` on every re-expand, and would wipe `AICopilotPanel`'s chat history.
> Mount-once still satisfies "no network requests until expanded".

**`web/src/pages/OverviewPage.jsx`** — exactly 4 sections:
1. Headline fusion detection performance from `GET /metrics/evaluate`.
2. `StatStrip` of 4 real tiles from `GET /platform/status` (engine status, models loaded, graph
   backend) plus the critical-case count.
3. The 5 most recent critical alerts via `DataTable` on `/cases?severity=CRITICAL`.
4. A single primary CTA into Operations Center.

No WebSocket. Every number traces to a real endpoint; a failed fetch renders an explicit degraded
state rather than a fabricated figure, per `CLAUDE.md`'s metrics-honesty rule.

**`web/src/pages/QuantumTrustPage.jsx`** — thin wrapper around the existing `QuantumTrustPanel`.

**`web/src/lib/metricsFormat.js`** — `formatPct`, `formatF`, `getUplift`, `FLAT_EPSILON`, extracted
from `AnalyticsPage.jsx` so two pages reporting the same fusion numbers cannot diverge.

### Modified files

- **`web/src/App.jsx`** — index → `OverviewPage`; `/threats` becomes a real route; add `/quantum`.
- **`web/src/components/layout/Sidebar.jsx`** — 5 primary items + one Advanced group, collapsed by
  default and persisted to `localStorage` (`nav-advanced-open`), auto-opening when the active route
  is inside it. Duplicate Overview block removed; `pinnedPaths` defaults to empty; "Recent
  Investigations" `<a href>` converted to `NavLink` (they were causing full page reloads).
- **`web/src/pages/OperationsCenterPage.jsx`** — dead `/quantum/posture` fetch removed; stream and
  SIEM feed promoted to the default view; 5 panels wrapped in lazy `CollapsibleSection`s.
- **`web/src/components/investigation/InvestigationWorkbench.jsx`** — `QuantumTrustPanel` wrapped in
  a collapsed section.
- **`web/src/pages/AnalyticsPage.jsx`** — import the extracted metric helpers.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `overviewItem.to` throws if `/` leaves `NAV_ITEMS` | `/` stays in `NAV_ITEMS`; only the duplicate render block is removed |
| Users lose the only manual case picker | The transaction stream is promoted to the default view — a net fix |
| Re-expanding hammers `/trust-passport` + `/investigation/analyse` | Mount-once + CSS `hidden`, never unmount |
| `AICopilotPanel` chat wiped on collapse | Same mechanism — never unmounted after first open |
| Live pipeline stages stop rendering | `FusionLifecyclePipeline` is the sole consumer of `websocketStages` and stays in the default view |
| Bookmarks / deep links break | No path is renamed. `UniversalSearch`'s hardcoded routes, `CasesPage`'s `navigate('/operations')`, and `ErrorBoundary`'s `<a href="/">` were all checked and stay valid |
| Fabricated numbers on Overview | Every figure traces to `/metrics/evaluate`, `/platform/status`, or `/cases` |

Out of scope, noted only: the WS handler's stale `selectedCase` closure, the double `PageHeader` on
several routes, `AppLayout quantumData={null}` dead code, TopBar's hardcoded "Analysts Online: 14",
and the three conflicting product names across TopBar/Sidebar/StatusBar.

---

## Acceptance

1. `npm run build` in `web/` passes with no errors.
2. All 17 routes plus both redirects render with a clean console.
3. `/` renders 4 sections and opens no WebSocket.
4. `/operations` fires no `/trust-passport/*`, `/investigation/analyse`, or `/quantum/posture` on
   load. Expanding a section fetches exactly once; collapse and re-expand fetches nothing further.
   `/investigation` fires no `/quantum/*` until that section is expanded.
5. Selecting a row in the promoted transaction stream still drives `VerdictHero` and the pipeline;
   Copilot chat history survives a collapse/expand cycle.
