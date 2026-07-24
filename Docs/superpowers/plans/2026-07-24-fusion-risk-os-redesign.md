# Fusion Risk OS UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved dark-first, accessible, responsive Fusion Risk OS redesign across every routed platform page while adding bounded, server-paginated data views for transactions, cases, and customers.

**Architecture:** Keep the existing React/Vite application and FastAPI process. Add a small reusable frontend primitive layer (`PageHeader`, `VerdictHero`, `StatStrip`, `DataTable`, `LiveFeed`, `NavGroup`, `EmptyState`), route every existing page, and make the flagship overview compose those primitives. Add a generic SQLite-backed pagination helper and additive list endpoints; demo-scale data is deliberately not seeded automatically.

**Tech Stack:** React 18, React Router, Vite, Tailwind CSS, lucide-react, FastAPI, Pydantic, SQLite.

## Global Constraints

- Keep the dark SOC identity as default; light mode uses the same CSS-token classes.
- Do not introduce raw hex colors or hardcoded Tailwind palette color classes in `web/src`.
- Do not change fusion/risk-scoring logic, add a service, add datasets, or seed data without an explicit request.
- Data tables fetch exactly one server page at a time; live feeds retain a bounded in-memory window.
- Status always combines an icon and a text label; all interaction controls have an accessible label and visible focus styling.
- Preserve unrelated dirty-worktree changes and do not commit from this shared checkout.

---

### Task 1: Establish theme-safe layout and reusable presentation primitives

**Files:**
- Modify: `web/tailwind.config.js`, `web/src/styles/theme.css`, `web/src/components/layout/TopBar.jsx`, `web/src/components/layout/AppLayout.jsx`
- Create: `web/src/components/common/PageHeader.jsx`, `web/src/components/common/VerdictHero.jsx`, `web/src/components/common/StatStrip.jsx`, `web/src/components/common/EmptyState.jsx`

**Interfaces:**
- `PageHeader({ title, description, action, eyebrow })` renders the consistent page entry without requiring an eyebrow.
- `VerdictHero({ verdict, score, reason, timestamp, transactionId })` returns an accessible decision focal point.
- `StatStrip({ items })`, where every item is `{ label, value, detail, tone, icon }`.

- [ ] **Step 1: Add theme variables and Tailwind indirections**

```css
--soc-status-danger: #EF4444;
--soc-status-warning: #F59E0B;
--soc-status-success: #10B981;
```

Use CSS variable utilities for semantic surfaces and text; do not put a dark-only color into JSX.

- [ ] **Step 2: Build the three shared hierarchy components**

```jsx
<PageHeader title="Cases" description="Prioritize high-risk decisions before their SLA expires." />
<VerdictHero verdict="BLOCK" score={96.4} reason="Cyber compromise and mule-network evidence require a block." />
<StatStrip items={[{ label: 'Active threats', value: activeCount, tone: 'danger' }]} />
```

- [ ] **Step 3: Make top-level controls accessible and token-only**

```jsx
<button aria-label="Toggle light or dark theme" onClick={toggleTheme} className="focus-visible:ring-2 focus-visible:ring-soc-primary"><Sun className="w-4 h-4" /></button>
```

- [ ] **Step 4: Run the frontend build**

Run: `npm.cmd run build` from `web/`.

Expected: Vite production build completes with no missing import or JSX errors.

### Task 2: Add bounded list primitives and complete navigation

**Files:**
- Create: `web/src/components/common/DataTable.jsx`, `web/src/components/common/LiveFeed.jsx`, `web/src/components/common/NavGroup.jsx`
- Modify: `web/src/components/layout/Sidebar.jsx`, `web/src/App.jsx`

**Interfaces:**
- `DataTable({ columns, endpoint, query, onRowClick, emptyLabel })` calls `GET ${endpoint}?page&page_size&sort&q`, owns pagination/loading/error state, and calls `onRowClick(row)`.
- `LiveFeed({ items, renderItem, limit = 500, title })` displays at most `limit` rows.
- `NavGroup({ label, icon: Icon, items, collapsed })` owns keyboard-operable expansion.

- [ ] **Step 1: Write a route inventory test checklist**

The required paths are `/`, `/operations`, `/cases`, `/customers`, `/investigation`, `/analytics`, `/reports`, `/sessions`, `/graph`, `/executive`, `/telemetry`, `/banking`, `/synthetic-lab`, `/developer`, and `/settings`; `/dashboard` redirects to `/operations`.

- [ ] **Step 2: Implement the paginated table state machine**

```jsx
const requestUrl = `${API_BASE}${endpoint}?${new URLSearchParams({ page, page_size: pageSize, sort, q: query })}`;
const response = await fetch(requestUrl);
if (!response.ok) throw new Error('Could not load table data.');
setResult(await response.json());
```

Render loading, error, empty, and page-navigation states. Sortable headers use `aria-sort`; rows are keyboard-activatable when `onRowClick` exists.

- [ ] **Step 3: Rebuild sidebar as grouped nav**

```jsx
const groups = [
  { label: 'Fraud Operations', items: [{ to: '/operations', label: 'Operations Center' }, { to: '/cases', label: 'Cases' }, { to: '/customers', label: 'Customers' }, { to: '/investigation', label: 'Investigation' }] },
  { label: 'Intelligence', items: [{ to: '/analytics', label: 'Analytics' }, { to: '/reports', label: 'Reports' }, { to: '/sessions', label: 'Session Intelligence' }, { to: '/graph', label: 'Graph Runtime' }] },
  { label: 'Platform', items: [{ to: '/executive', label: 'Executive Command Center' }, { to: '/telemetry', label: 'Telemetry' }, { to: '/banking', label: 'Banking' }, { to: '/synthetic-lab', label: 'Synthetic Lab' }, { to: '/developer', label: 'SDK Runtime' }] },
];
```

Expand the active group by route and render direct Overview and Settings links.

- [ ] **Step 4: Register every page route with lazy imports**

```jsx
<Route index element={<ThreatDashboard />} />
<Route path="operations" element={<OperationsCenterPage />} />
<Route path="dashboard" element={<Navigate to="/operations" replace />} />
```

- [ ] **Step 5: Run the frontend build and manually verify route fallbacks**

Run: `npm.cmd run build` from `web/`.

Expected: all lazy imports compile and the catch-all redirects only unknown URLs to `/`.

### Task 3: Add generic backend pagination and reproducible list endpoints

**Files:**
- Modify: `api/store.py`, `api/main.py`
- Create: `api/test_pagination.py`

**Interfaces:**
- `list_paginated(collection, page, page_size, sort_key=None, sort_desc=True, filter_fn=None) -> tuple[list[dict], int]`.
- `GET /transactions`, `GET /cases`, and `GET /customers` return `{ items, page, page_size, total, total_pages }`.

- [ ] **Step 1: Write failing tests for page slicing and endpoint envelope**

```python
def test_list_paginated_returns_one_based_page_and_total(tmp_path, monkeypatch):
    store.put('transactions', 'one', {'amount': 10})
    items, total = store.list_paginated('transactions', page=1, page_size=1)
    assert total == 1
    assert items == [{'amount': 10}]
```

- [ ] **Step 2: Implement sorting, filtering, and defensive bounds in `store.py`**

```python
page = max(1, page)
page_size = min(max(1, page_size), 100)
items = [item for item in list_all(collection) if filter_fn is None or filter_fn(item)]
items.sort(key=lambda item: str(item.get(sort_key, '')), reverse=sort_desc)
return items[(page - 1) * page_size:page * page_size], len(items)
```

- [ ] **Step 3: Implement additive FastAPI endpoints**

```python
@app.get('/transactions')
async def list_transactions(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100), sort: str = '-timestamp', q: str = ''):
    return paginated_collection('transactions', page, page_size, sort, q)
```

Use the same envelope for cases and customers. Return an empty, valid page when collections are absent; do not seed at import/startup.

- [ ] **Step 4: Run focused API tests**

Run: `.venv\Scripts\python.exe -m pytest api/test_pagination.py -q`.

Expected: pagination and all three endpoint envelopes pass.

### Task 4: Rebuild the flagship overview around verdict-first decision making

**Files:**
- Modify: `web/src/components/threat/ThreatIntelligenceDashboard.jsx`, `web/src/components/Ledger.jsx`, `web/src/components/Timeline.jsx`, `web/src/components/XAIPanel.jsx`, `web/src/components/VerdictBadge.jsx`

**Interfaces:**
- The overview selects the highest-severity current decision for `VerdictHero`.
- Transaction ledger uses `DataTable` and `/transactions`, not an unbounded `.map()` list.
- The timeline uses `LiveFeed` and has a rendered cap of 500.

- [ ] **Step 1: Replace competing top cards with `PageHeader`, `VerdictHero`, and `StatStrip`**

```jsx
<VerdictHero verdict={decision.action} score={decision.score} reason={decision.reason} timestamp={decision.timestamp} transactionId={decision.txn_id} />
<StatStrip items={overviewMetrics} />
```

- [ ] **Step 2: Move full XAI/detail into the selection drawer**

```jsx
<Drawer isOpen={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} title="Decision evidence">
  <XAIPanel evaluation={selectedRow} />
</Drawer>
```

- [ ] **Step 3: Replace legacy hardcoded palette classes with semantic tokens**

```jsx
className="bg-soc-panel text-soc-muted border-soc-border focus-visible:ring-2 focus-visible:ring-soc-primary"
```

- [ ] **Step 4: Build and exercise the key UI states**

Run: `npm.cmd run build` from `web/`.

Expected: overview compiles with data loading, empty, selected-row, and disconnected-stream states.

### Task 5: Apply a consistent page hierarchy to every route

**Files:**
- Modify: `web/src/pages/OperationsCenterPage.jsx`, `web/src/pages/CasesPage.jsx`, `web/src/pages/CustomersPage.jsx`, `web/src/pages/InvestigationPage.jsx`, `web/src/pages/AnalyticsPage.jsx`, `web/src/pages/ReportsPage.jsx`, `web/src/pages/SessionIntelligencePage.jsx`, `web/src/pages/GraphPage.jsx`, `web/src/pages/ExecutiveCommandCenterPage.jsx`, `web/src/pages/TelemetryPage.jsx`, `web/src/pages/BankingPage.jsx`, `web/src/pages/SyntheticLabPage.jsx`, `web/src/pages/DeveloperPlatformPage.jsx`, `web/src/pages/SettingsPage.jsx`

**Interfaces:**
- Each page begins with one `PageHeader` and one clear hero fact/action.
- Cases and customers use `DataTable` endpoints with a `Drawer` for detail.
- Existing domain widgets remain in place after their page header/hero; no backend domain behavior changes.

- [ ] **Step 1: Replace Cases’ inline mock table with endpoint-backed `DataTable`**

```jsx
<DataTable endpoint="/cases" columns={caseColumns} query={query} onRowClick={setSelectedCase} emptyLabel="No cases match the current filters." />
```

- [ ] **Step 2: Replace Customers’ unbounded table with endpoint-backed `DataTable`**

```jsx
<DataTable endpoint="/customers" columns={customerColumns} query={query} onRowClick={setSelectedCustomer} emptyLabel="No customer records found." />
```

- [ ] **Step 3: Add `PageHeader` to each remaining routed page without replacing existing domain panels**

```jsx
<PageHeader title="Analytics" description="Measured fusion performance and reproducible operating insight." />
```

- [ ] **Step 4: Sweep dark-only classes across `web/src`**

Run: `Select-String -Path (Get-ChildItem web/src -Recurse -Filter *.jsx).FullName -Pattern 'bg-slate-|bg-gray-|bg-zinc-|bg-neutral-|text-white\\b|bg-black\\b'`.

Expected: no results. Replace primary-action text with `text-soc-inverse` and overlays with a named token utility rather than a raw palette utility.

### Task 6: Verify responsive behavior, functional paths, and visual fidelity

**Files:**
- Modify: `web/tests/example.spec.js`
- Create: `Docs/design-references/fusion-risk-os-overview-concept.png`

- [ ] **Step 1: Extend browser tests for page navigation and theme toggle**

```js
for (const link of ['Overview', 'Operations Center', 'Cases', 'Analytics', 'Settings']) {
  await page.getByRole('link', { name: link }).click();
  await expect(page.locator('main')).toBeVisible();
}
```

- [ ] **Step 2: Run production build and tests**

Run: `npm.cmd run build` from `web/` and `.venv\Scripts\python.exe -m pytest api/test_pagination.py -q`.

Expected: both commands exit successfully.

- [ ] **Step 3: Run browser QA at 1440, 1024, 768, and 375 pixels**

Verify the sidebar collapses, no content overflows, light/dark token contrast holds, the verdict remains first on overview, tables paginate, live feed is capped, and focus is visible.

- [ ] **Step 4: Compare the desktop overview screenshot to `Docs/design-references/fusion-risk-os-overview-concept.png`**

Check exactly: verdict emphasis, sidebar grouping, top-bar restraint, sparse-to-dense hierarchy, monospaced data, token palette, and ledger/feed anatomy. Fix any material mismatch found before handoff.
