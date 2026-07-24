# Fusion Risk OS — UI/UX Redesign Plan

**Project:** Unified Cyber-Fraud Intelligence Platform (FinSpark'26, Bank of Maharashtra PS2)
**Repo root:** `C:\Users\clash\Documents\Unified Cyber-Fraud Intelligence Platform`
**Scope of this document:** frontend (`web/`) UI/UX redesign + the minimal backend (`api/`) changes needed to support it (pagination, demo-scale data seeding). It does **not** change the ML/graph/fusion logic, the risk engine's decisioning, or add any infrastructure beyond what already exists (see Guardrails, §7).

This file is self-contained: an AI coding session with **no memory of the conversation that produced it** should be able to execute it phase by phase using only what's written here.

---

## 0. Why this redesign

The live dashboard (`/threats` → `ThreatIntelligenceDashboard.jsx`, 417 lines) crams the SIEM timeline, transaction ledger, fused verdict/XAI panel, and threat graph into one dense screen with no clear visual hierarchy — everything is roughly the same size and weight. It has to read clearly to a bank teller/assistant in ~5 seconds *and* hold up to an analyst drilling into SHAP detail, at real bank scale (thousands–tens of thousands of transactions), in both dark and light mode. Today none of that is true:

- **No visual hierarchy.** The verdict (ALLOW/CHALLENGE/BLOCK) — the single most important fact on the page — is one badge among many equally-sized panels, not the hero.
- **No scale handling.** `TransactionTable.jsx` does `events.map(...)` over the full array with no pagination or windowing. Fine for a 20-row demo, breaks at bank scale.
- **Light mode is wired but not real.** `ThemeContext`, the toggle button (`TopBar.jsx`), and light-mode CSS variables (`theme.css`) all exist and work — but 56 occurrences across 31 component files use hardcoded dark-only Tailwind classes (`bg-slate-900`, `text-white`, etc.) instead of the `soc-*` theme tokens, so flipping the toggle breaks those components visually (invisible text, wrong contrast).
- **Navigation only reaches 4 of 15 pages.** `Sidebar.jsx` has 4 flat links; `App.jsx`'s router only defines routes for those 4. The other 11 built pages (Operations Center, Analytics, Customers, Cases, Executive Command Center, Reports, Session Intelligence, Investigation, Banking, Synthetic Lab, Telemetry) are unreachable — any other path falls through the router's catch-all back to `/threats`. Several of these pages call `useNavigate()` to routes that don't exist yet.
- **Several pages are hardcoded mock data with no backing endpoint** (e.g. `CasesPage.jsx` has a literal JS array of case objects). There's no `/transactions`, `/cases`, or `/customers` list endpoint in `api/main.py` today.

This plan fixes all five, in dependency order, without touching the fusion/risk-scoring logic itself.

---

## 1. Design system (tokens, typography, hierarchy, accessibility)

**Keep the dark SOC theme as the primary/signature identity** — this is mandated by the project's own CLAUDE.md ("dark SOC theme (red = BLOCK, amber = CHALLENGE, green = ALLOW)") and is also the right call aesthetically: a security console reading as a security console is a *feature*, not a generic-dashboard default. Light mode is a first-class second theme, not an afterthought — same structure, same signature element, different tokens.

### 1.1 Color tokens — keep and enforce, don't replace

`web/src/styles/theme.css` already has the right values (validated against professional B2B/security-industry palettes, not just "looked fine"):

- **Dark** (default): bg `#070A10` → surface `#0F1420` → panel `#151C2C` → elevated `#1B2438`; text `#F3F4F6` / `#9CA3AF` / `#6B7280`; primary `#3B82F6`; status success `#10B981`, warning `#F59E0B`, danger `#EF4444`, quantum `#8B5CF6`.
- **Light**: bg `#F8FAFC` → surface `#FFFFFF` → panel `#F1F5F9`; text `#0F172A` / `#475569` / `#64748B`; primary `#2563EB`. This matches the "Professional navy + blue CTA" / "High contrast navy + blue" family used by real B2B security and government platforms — it's a legitimate professional pairing, not a placeholder.

**The work here is not inventing new colors — it's eliminating the 56 hardcoded-class occurrences** (`grep -rn "bg-slate-\|bg-gray-\|bg-zinc-\|bg-neutral-\|text-white\b\|bg-black\b" web/src` to regenerate the current list) and replacing them with the existing `soc-*` Tailwind tokens (`tailwind.config.js` → `theme.extend.colors.soc`) or the `--soc-*` CSS variables directly. **Never introduce a new raw hex value or a new hardcoded Tailwind color class anywhere in `web/src` from this point on** — if a token is missing (e.g. no elevated/hover variant for a given status color), add it to `theme.css` + `tailwind.config.js` once, centrally, not ad hoc per component.

### 1.2 Typography

Keep the existing two-face system — it's already a genuinely distinctive, on-brief choice (most dashboards don't dare use monospace for real content):
- **Sans** (`--soc-font-sans`, system stack) for UI chrome, labels, prose.
- **Mono** (`--soc-font-mono`, JetBrains Mono / Fira Code) for anything *data*: transaction IDs, amounts, timestamps, scores, hashes, account numbers. This is the signature typographic move — commit to it everywhere data appears, including places that currently use sans for numbers.

Formalize a type scale (don't let it drift per-component): `11 / 12 / 13 / 14 / 16 / 18 / 24 / 32 / 40px`, weights `400` body / `500` labels / `600–700` headings and hero numbers. Use tabular figures (`font-variant-numeric: tabular-nums` — mono already gives this) for every column of numbers so columns don't jitter.

### 1.3 The signature element: the verdict

The risk verdict (ALLOW / CHALLENGE / BLOCK) is the one thing every persona — teller, analyst, executive — needs to register instantly. It becomes a dedicated `VerdictHero` component (see §2), not a badge buried in a panel:
- Large (dominates its row), color **+ icon + text label** together — never color alone (accessibility: `color-not-only`).
- Score rendered in mono, tabular-nums, large.
- One-sentence plain-English reason directly under it (the "counterfactual sentence" CLAUDE.md already calls for) — this is what makes it read instantly to a non-technical bank assistant, with SHAP/technical detail available on drill-down, not upfront.
- A subtle state-change pulse (150–300ms, respects `prefers-reduced-motion`) when a new verdict arrives live — motion used to mean something (a new decision happened), not as decoration.

### 1.4 Density & hierarchy rules (apply to every page)

- **One hero per page.** The single most important number/verdict/status for that page's job is large and at the top. Everything else is visually subordinate (smaller type, less contrast, more muted borders).
- **4/8px spacing rhythm** throughout; stop ad hoc padding values.
- **Progressive disclosure**: SHAP values, raw feature vectors, full graph exploration, and other analyst-depth detail move into a drawer/tab/expand — not permanently on-screen competing with the hero. (`progressive-disclosure` UX rule.)
- **Max 2 information densities per screen**: a hero zone (sparse, large) and a working zone (dense, tabular). Don't let five equally-dense panels compete.

### 1.5 Accessibility floor (non-negotiable, check every phase)

- Text contrast ≥ 4.5:1 (body) in **both** themes — verify light mode separately, don't assume dark-mode contrast choices transfer.
- Visible focus rings on every interactive element (nav items, table rows/sort headers, buttons).
- Icon-only buttons (bell, theme toggle, sidebar collapse) get `aria-label`.
- Status is never color-only (verdict badges, severity chips already need icon+text per §1.3 — audit `Badge.jsx`, `SeverityBadge.jsx`, `StatusBadge.jsx`, `RiskBadge.jsx` for this).
- `prefers-reduced-motion` respected for the verdict pulse and any list-entry animations.
- Data tables: sortable columns expose `aria-sort`.

---

## 2. Shared component library (build once in Phase 1, reuse everywhere)

New/rebuilt components under `web/src/components/common/`:

| Component | Responsibility |
|---|---|
| `PageHeader` | Title + one-line context + primary action slot. Every page starts with this — gives 15 pages a consistent entry point instead of each inventing its own header markup. |
| `VerdictHero` | The signature element from §1.3. Takes `{ verdict, score, reason, timestamp }`. Used on the flagship dashboard and anywhere a per-transaction/per-case decision needs to be the focal point. |
| `StatStrip` | Row of compact KPI tiles (throughput, active threats, block rate, etc.) — secondary to the hero, not competing with it. Replaces one-off stat card markup scattered across pages. |
| `DataTable` | **The scale answer.** Server-paginated (`page`, `pageSize`, `sort`, `q`, column filters), sticky header, tabular-nums, sortable columns with `aria-sort`, empty/loading/error states, row click → drawer. This is what `TransactionTable.jsx`, `CasesPage.jsx`'s inline table, `CustomersPage.jsx`, etc. all migrate to. Backed by the paginated endpoints in §4 — it must never receive and render an unbounded array. |
| `LiveFeed` | For genuinely unbounded live streams (SIEM timeline / WS replay) where there's no "page" concept — caps in-memory rendered rows (e.g. keep last 500, show "+N earlier events" affordance) instead of an ever-growing DOM list. This is the one place true client-side capping/windowing is needed; everything else uses `DataTable` pagination instead of virtualization. |
| `NavGroup` | Collapsible/dropdown nav section for the sidebar (§3). Accordion when sidebar expanded, flyout when collapsed to icon rail. |
| `EmptyState` | Consistent "no data yet" + guidance, replacing ad hoc empty-state text per page. |

Existing components to **reuse, not rebuild** (already theme-token-correct or close to it): `Badge`, `Button`, `Card`, `Drawer`, `Modal`, `Panel`, `Tabs`, `Tooltip`, `KeyValueGrid`, `SearchInput` — audit each for the §1.1 hardcoded-class sweep, but keep their APIs.

---

## 3. Navigation architecture

Replace the 4 flat `Sidebar.jsx` links with grouped navigation covering all 15 pages, and add the matching routes to `App.jsx` (currently only 4 of 15 are routable — this is the most basic gap to fix before any page-level redesign work is visible to a user).

| Nav entry | Type | Route | Page component |
|---|---|---|---|
| Overview | direct link (flagship/default) | `/` (redirect target, replaces current `/threats` redirect) | `CyberThreatIntelligencePage` (→ redesigned `ThreatIntelligenceDashboard`) |
| **Fraud Operations** | dropdown | | |
| ↳ Operations Center | | `/operations` | `OperationsCenterPage` |
| ↳ Cases | | `/cases` | `CasesPage` |
| ↳ Customers | | `/customers` | `CustomersPage` |
| ↳ Investigation | | `/investigation` | `InvestigationPage` |
| **Intelligence** | dropdown | | |
| ↳ Analytics | | `/analytics` | `AnalyticsPage` |
| ↳ Reports | | `/reports` | `ReportsPage` |
| ↳ Session Intelligence | | `/sessions` | `SessionIntelligencePage` |
| ↳ Graph Runtime | | `/graph` | `GraphPage` |
| **Platform** | dropdown | | |
| ↳ Executive Command Center | | `/executive` | `ExecutiveCommandCenterPage` |
| ↳ Telemetry | | `/telemetry` | `TelemetryPage` |
| ↳ Banking | | `/banking` | `BankingPage` |
| ↳ Synthetic Lab | | `/synthetic-lab` | `SyntheticLabPage` |
| ↳ SDK Runtime | | `/developer` | `DeveloperPlatformPage` |
| Settings | direct link | `/settings` | `SettingsPage` |

Notes:
- `DashboardPage.jsx` (currently a thin wrapper redirecting to `OperationsCenterPage`) is redundant once `/operations` is a real nav destination — remove it and any reference, and keep `/dashboard` as a redirect alias to `/operations` for old links.
- Any page's internal `useNavigate()` calls that target routes outside this table need to be fixed to point at real routes as part of that page's redesign pass (Phase 5/6) — grep for `navigate(` per page before starting it.
- Interaction pattern for `NavGroup`: expanded sidebar → accordion-style expand/collapse per group, active group auto-expanded based on current route; collapsed (icon-rail) sidebar → flyout menu on hover/focus. Keyboard-operable (arrow keys / Enter to expand, Tab through items) — don't ship a mouse-only dropdown.
- Active route highlighted (existing `isActive` pattern in `Sidebar.jsx` — extend it to also highlight the parent group).

---

## 4. Data-at-scale strategy

**Frontend contract.** `DataTable` (§2) always fetches paginated: `GET <endpoint>?page=1&page_size=50&sort=-timestamp&q=&<column filters>` and expects back:
```json
{ "items": [...], "page": 1, "page_size": 50, "total": 4213, "total_pages": 85 }
```
No component ever holds more than one page of rows in state for tabular data. The one exception is `LiveFeed` (§2), which caps at a fixed in-memory window instead of paginating (it's a live stream, not a queryable list).

**Backend work (minimal, additive — per user decision, in scope for this pass):**

1. `api/store.py` currently has `list_all(collection)` with no pagination. Add a `list_paginated(collection, page, page_size, sort_key=None, sort_desc=True, filter_fn=None) -> (items, total)` helper alongside it — keep it generic, every new list endpoint uses it.
2. Add list endpoints to `api/main.py` for the collections that today are frontend-hardcoded mock arrays: `GET /transactions`, `GET /cases`, `GET /customers` (check `api/investigation_intelligence_engine.py` and `api/pipeline_engine.py` first — some of this data may already be produced server-side for other endpoints and just needs a paginated list view, not a new source of truth). Each takes `page`, `page_size`, `sort`, `q`, and 1–2 relevant column filters (e.g. `/cases?status=CRITICAL`).
3. These endpoints read from `store.py` collections (`"transactions"`, `"cases"`, `"customers"`) — the risk engine / synthetic generators need to `put()` into these collections as they produce data, if they don't already.

**Demo-scale data seeding (per user decision):**

`api/synthetic_universe/transaction_behavior_engine.py` already has `generate_transaction_universe(customers, total_txns=1000, anomaly_pct=0.02, seed=42)` — reuse it, don't write a new generator. Add a seed path (e.g. a startup flag `SEED_DEMO_SCALE=1` read in `api/main.py`, or reuse the existing `POST /synthetic/universe/generate` endpoint with a larger `total_txns`) that populates on the order of **3,000–5,000 transactions, ~150–300 cases, ~500 customers** into the `store.py` collections above at startup or on demand. Gate it so it never runs during `pytest` (check `api/test_*.py` for how test fixtures currently avoid touching real state) and never runs unless explicitly invoked — this is synthetic in-memory demo data via the project's own existing generator, not an external dataset download, so it's within what CLAUDE.md allows, but it must stay off by default.

---

## 5. Visual hierarchy per page (what "biggest/most important at top" means concretely)

Apply the §1.4 hero+working-zone pattern per page type — this is guidance for whoever redesigns each page in Phase 5/6, not a rigid template:

- **Overview (flagship, `ThreatIntelligenceDashboard`)**: `VerdictHero` for the most recent/most severe live decision → `StatStrip` (throughput, active threats, block rate, quantum posture) → two-column working zone: SIEM timeline (`LiveFeed`) + transaction ledger (`DataTable`) → graph/XAI moved to a drawer opened from a row, not permanently rendered.
- **Operations Center**: hero = current system health/throughput state; working zone = live event stream + evaluated cases table.
- **Cases**: hero = open critical-case count + oldest-unresolved age (SLA risk, the thing that actually needs attention first); working zone = `DataTable` of cases with status/severity filters.
- **Customers**: hero = flagged/at-risk customer count; working zone = searchable `DataTable`, drill into a customer via `Drawer`.
- **Analytics / Reports**: hero = the single headline metric this build's judges care about (fusion uplift — recall at fixed FPR, tabular-only vs fused, per CLAUDE.md's metrics-honesty rule) rendered large; supporting charts below, not competing for top billing.
- **Executive Command Center**: hero = overall risk posture (one gauge/number a non-technical exec reads in 2 seconds); everything else is supporting detail.
- **Session Intelligence / Investigation / Graph Runtime / Telemetry / Banking / Synthetic Lab / SDK Runtime / Settings**: apply the same discipline (one clear hero fact or primary action per page) — specifics decided when that page's redesign starts, following §1.4's rules, not invented from scratch each time.

---

## 6. Execution phases

Work through these **in order** — each phase must run end-to-end and be verified before the next starts (this repo's own working agreement: "Never let a broken phase roll into the next"). Commit at the end of each phase with a clear message.

### Phase 1 — Design system foundation
- Sweep and fix the 56 hardcoded-color occurrences across 31 files (re-run the grep in §1.1 to get the current exact list — files will have shifted).
- Add any missing tokens to `theme.css` + `tailwind.config.js` (centrally, once).
- Build the `web/src/components/common/` additions from §2: `PageHeader`, `VerdictHero`, `StatStrip`, `DataTable`, `LiveFeed`, `NavGroup`, `EmptyState`.
- **Verify:** toggle light/dark on every existing route (`/threats`, `/graph`, `/developer`, `/settings`) and visually confirm no invisible text / broken contrast. Run existing Playwright tests in `web/tests/` if any cover these routes.

### Phase 2 — Navigation
- Rebuild `Sidebar.jsx` using `NavGroup` per the §3 table.
- Add all 15 routes to `App.jsx` (lazy-loaded like the existing 4).
- Remove `DashboardPage.jsx`, redirect `/dashboard` → `/operations`.
- **Verify:** every nav entry in §3 is clickable and renders its page without falling through to the catch-all redirect. Keyboard-navigate the whole menu.

### Phase 3 — Backend pagination + demo data
- Add `list_paginated` to `api/store.py`.
- Add `GET /transactions`, `GET /cases`, `GET /customers` to `api/main.py` per §4.
- Wire the demo-scale seeding path (§4) behind an explicit flag, off by default.
- **Verify:** hit each new endpoint with `page_size` small enough to see multiple pages against the seeded dataset; confirm `total`/`total_pages` are correct; confirm tests still pass with seeding **off**.

### Phase 4 — Flagship redesign
- Rebuild `ThreatIntelligenceDashboard.jsx` per §5's Overview spec, using the Phase 1 components.
- Migrate `TransactionTable.jsx` usage to `DataTable` against the new `/transactions` endpoint.
- **Verify:** the demo's 90-second narrative (CLAUDE.md's mission statement — SIEM event → transfer → fused block, in one glance) still reads clearly at a glance; test with the seeded multi-thousand-row dataset to confirm no scroll/render jank; test both themes.

### Phase 5 — Fraud Operations pages
- `OperationsCenterPage`, `CasesPage`, `CustomersPage`, `InvestigationPage` — migrate to shared components, apply §5 hierarchy, wire real `useNavigate()` targets, replace hardcoded mock arrays with the new paginated endpoints where §4 added them (Cases, Customers).

### Phase 6 — Intelligence pages
- `AnalyticsPage`, `ReportsPage`, `SessionIntelligencePage`, `GraphPage` — same treatment.

### Phase 7 — Platform pages
- `ExecutiveCommandCenterPage`, `TelemetryPage`, `BankingPage`, `SyntheticLabPage`, `DeveloperPlatformPage`, `SettingsPage` — same treatment.

### Phase 8 — Cross-cutting QA pass
- Full light/dark toggle sweep across all 15 pages (not just spot-checks).
- Accessibility checklist from §1.5 across all pages.
- Responsive check at 375 / 768 / 1024 / 1440px.
- Performance check: seeded dataset, confirm `DataTable` pagination keeps DOM node count bounded and `LiveFeed` caps correctly on the flagship page.
- `prefers-reduced-motion` check on the verdict pulse and any list animations.

Phases 5–7 touch disjoint sets of pages that all depend on Phases 1–4 but not on each other — they can be parallelized (e.g. one subagent per phase/page-group) once Phase 4 is done and merged.

---

## 7. Guardrails (do not violate)

Inherited from this repo's `CLAUDE.md` — still apply during this redesign:
- No Kafka, Flink, Go microservices, Kubernetes, Terraform, MLflow, Seldon, federated learning. "Streaming" stays a WebSocket replay, not a message broker.
- One FastAPI process, no new services/servers.
- Neo4j stays optional with the `networkx` fallback — don't make the graph page hard-require it.
- Don't touch the fusion risk engine's scoring/decision logic — this is a presentation-layer + minimal-pagination-layer redesign only.
- Don't download new datasets or add new ML training in this pass — the demo-scale seeding in §4 reuses the existing synthetic generator, not a new/external dataset.
- Never hardcode a metrics number; Analytics/Reports headline figures must stay reproducible from actual code (existing `ml/metrics_report.md` rule).
- Never introduce a new raw hex color or hardcoded dark-only Tailwind class (§1.1) — every color goes through the token system so light mode never silently breaks again.

## 8. Decisions made on the user's behalf while writing this plan (flag for review)

- Placed this plan at the **project root**, not `docs/superpowers/specs/`, per explicit instruction. If "home directory" meant the OS user home (`C:\Users\clash\`) rather than the project root, move the file — everything else in this doc is unaffected by its own location.
- Chose the specific nav grouping/route names in §3 (Fraud Operations / Intelligence / Platform) — reasonable given each page's content, but arbitrary in the sense that no one has confirmed these exact group names or groupings.
- Chose 3,000–5,000 transactions / 150–300 cases / 500 customers as "demo scale" — big enough to force real pagination behavior, small enough to seed instantly on startup. Adjust if a specific number matters for the demo narrative.
- `DataTable` is server-paginated rather than client-side virtualized (e.g. no `react-window`/`react-virtual` dependency added) — this was the simpler choice given Phase 3 adds real backend pagination anyway, and avoids a new dependency for a hackathon build. `LiveFeed` is the only place true client-side capping is used, for the genuinely unbounded live stream case.
