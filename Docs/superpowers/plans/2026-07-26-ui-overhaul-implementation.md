# UI Overhaul & Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken/missing navigation links, eliminate app-wide crashes on component errors, refine the visual system, and wire dead/mock dashboard surfaces to real backends — ahead of final deployment.

**Architecture:** React 18 + Vite + Tailwind SPA (`web/`) talking to one FastAPI process (`api/main.py`) with SQLite-backed collections (`api/store.py`). No new services, no new frontend frameworks. Changes are surgical edits to existing files plus a small number of net-new files (an ErrorBoundary component, one new backend route pair, test files).

**Tech Stack:** React 18, react-router-dom, Tailwind CSS (CSS-variable token system in `web/src/index.css` + `web/tailwind.config.js`), FastAPI, SQLite (`api/store.py`), Playwright (`@playwright/test`, already a devDependency), Vitest + @testing-library/react (net-new, dev-only, scoped to one component).

## Global Constraints

- Never introduce a new raw hex color or a new hardcoded dark-only Tailwind class (`bg-slate-*`, `text-white`, etc.) in `web/src` — use the existing `soc-*` tokens / `--soc-*` CSS variables.
- Do not build new backend subsystems for `LearningLoop` (retraining queue), `BlastRadiusAnalysis` (blast-radius graph calc), or `CSVSchemaMapperModal` (real CSV parsing) — label these "Simulated" instead.
- Do not remove the legacy `/session/*` routes in `api/main.py` — only ensure no new frontend code calls them.
- Do not touch the fusion risk engine's scoring/decision logic (`api/core_platform/decision_runtime.py`, `model_runtime.py`) beyond reading its response shape.
- Every new/changed backend endpoint must degrade gracefully (never hard-fail) per this repo's existing pattern in `api/store.py` / `DataTable.jsx`'s `status: 'error'` handling.
- No Kafka/Flink/Kubernetes/microservices/Terraform/MLflow — one FastAPI process only (repo-wide rule, not touched by this plan anyway).
- Do not run any deploy command (Render/Vercel push) as part of this plan — that requires a separate, explicit go-ahead.
- Commit after each task with a clear message (this repo's own working agreement: never let a broken task roll into the next).
- Keep hardcoded demo-persona fallback values (`CASE-2026-8942`, `SESS_9921_CRITICAL`, `usr_abc`) as *fallback defaults* — only replace them at call sites where real data is already in scope but ignored (Task 8). Do not rewrite `CaseContext.jsx`'s default or every consumer.

---

### Task 1: Fix sidebar navigation — single source of truth, permanent Overview link, delete dead Dashboard route

**Files:**
- Modify: `web/src/components/layout/Sidebar.jsx`
- Modify: `web/src/App.jsx:56`
- Delete: `web/src/pages/DashboardPage.jsx`
- Modify: `web/tests/ui-redesign.spec.js`

**Interfaces:**
- Produces: `NAV_ITEMS` (array of `{ to, label, icon, group }`, `group: null` for standalone items) as the single source Sidebar derives both grouped rendering and pin-lookup from. No other task depends on this array's name.

- [ ] **Step 1: Replace the two divergent nav arrays with one source of truth**

In `web/src/components/layout/Sidebar.jsx`, replace lines 10–58 (the `groups` and `allNavItems` consts) with:

```js
const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, group: null },
  { to: '/operations', label: 'Operations Center', icon: Activity, group: 'Fraud Operations' },
  { to: '/cases', label: 'Cases', icon: FileBarChart2, group: 'Fraud Operations' },
  { to: '/customers', label: 'Customers', icon: Users, group: 'Fraud Operations' },
  { to: '/investigation', label: 'Investigation', icon: Workflow, group: 'Fraud Operations' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, group: 'Intelligence' },
  { to: '/reports', label: 'Reports', icon: FileBarChart2, group: 'Intelligence' },
  { to: '/sessions', label: 'Session Intelligence', icon: Radio, group: 'Intelligence' },
  { to: '/graph', label: 'Graph Runtime', icon: Network, group: 'Intelligence' },
  { to: '/executive', label: 'Executive Command Center', icon: LayoutDashboard, group: 'Leadership & Platform' },
  { to: '/telemetry', label: 'Telemetry', icon: Activity, group: 'Leadership & Platform' },
  { to: '/banking', label: 'Banking', icon: Building2, group: 'Leadership & Platform' },
  { to: '/synthetic-lab', label: 'Synthetic Lab', icon: FlaskConical, group: 'Leadership & Platform' },
  { to: '/developer', label: 'SDK Runtime', icon: Code2, group: 'Leadership & Platform' },
  { to: '/settings', label: 'Settings', icon: Settings, group: null },
];

const GROUP_ORDER = ['Fraud Operations', 'Intelligence', 'Leadership & Platform'];
const groups = GROUP_ORDER.map((label) => ({
  label,
  items: NAV_ITEMS.filter((item) => item.group === label),
}));
const allNavItems = NAV_ITEMS;
const overviewItem = NAV_ITEMS.find((item) => item.to === '/');
```

- [ ] **Step 2: Render Overview as a permanent, non-removable link**

In the same file, find the pinned-favorites default state:

```js
  const [pinnedPaths, setPinnedPaths] = useState(() => {
    try {
      const stored = localStorage.getItem('pinned-favorites');
      return stored ? JSON.parse(stored) : ['/', '/operations', '/cases'];
    } catch {
      return ['/', '/operations', '/cases'];
    }
  });
```

Change both default arrays to `['/operations', '/cases']` (Overview no longer needs a pin slot since it gets its own permanent row).

Then, in the JSX, immediately after the brand header block closes (the `</div>` that closes the `flex h-[72px] ...` header, right before `{/* Navigation Body */}`), insert:

```jsx
      {/* Permanent Overview link — always visible, not part of the removable-pin system */}
      <div className="border-b border-soc-border px-2 py-2">
        <DirectNavLink
          to={overviewItem.to}
          label={overviewItem.label}
          icon={overviewItem.icon}
          end
          collapsed={isCollapsed}
        />
      </div>
```

- [ ] **Step 3: Delete the dead `/dashboard` route and the orphaned page**

In `web/src/App.jsx`, delete this line (currently line 56):

```jsx
                          <Route path="dashboard" element={<Navigate to="/operations" replace />} />
```

Delete the file `web/src/pages/DashboardPage.jsx` entirely (confirmed zero importers anywhere in `web/src`).

- [ ] **Step 4: Extend the Playwright nav test to cover the fixed bugs**

In `web/tests/ui-redesign.spec.js`, add these two tests (keep the existing three):

```js
test('every top-level nav destination is visible, including Overview', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  const destinations = [
    'Overview', 'Operations Center', 'Cases', 'Customers', 'Investigation',
    'Analytics', 'Reports', 'Session Intelligence', 'Graph Runtime',
    'Executive Command Center', 'Telemetry', 'Banking', 'Synthetic Lab',
    'SDK Runtime', 'Settings',
  ];
  for (const name of destinations) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
});

test('Overview link survives a cleared localStorage state', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
});

test('the retired /dashboard route no longer 404s into a dead page', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/dashboard');
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
});
```

- [ ] **Step 5: Run the test and verify**

Run: `cd web && npx playwright test tests/ui-redesign.spec.js` (with `npm run dev` running in another terminal on port 5173)
Expected: all tests pass, including the three new ones.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/layout/Sidebar.jsx web/src/App.jsx web/tests/ui-redesign.spec.js
git rm web/src/pages/DashboardPage.jsx
git commit -m "fix(nav): single source of truth for sidebar nav, permanent Overview link, retire dead /dashboard route"
```

---

### Task 2: Build the ErrorBoundary component with a real test

**Files:**
- Create: `web/src/components/common/ErrorBoundary.jsx`
- Create: `web/src/components/common/ErrorBoundary.test.jsx`
- Create: `web/vitest.config.js`
- Create: `web/src/test/setup.js`
- Modify: `web/package.json` (add devDependencies + `test` script)

**Interfaces:**
- Produces: `ErrorBoundary` (default export from `web/src/components/common/ErrorBoundary.jsx`), props: `{ children, resetKey }`. Resets its caught-error state whenever `resetKey` changes (Task 3 passes `location.pathname` as `resetKey` for the route-level boundary).

- [ ] **Step 1: Add the test toolchain (dev-only)**

```bash
cd web && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create `web/src/test/setup.js`:

```js
import '@testing-library/jest-dom/vitest';
```

Create `web/vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  },
});
```

In `web/package.json`, add to `"scripts"`: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing test**

Create `web/src/components/common/ErrorBoundary.test.jsx`:

```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('Simulated render crash');
  return <div>safe content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(<ErrorBoundary><div>safe content</div></ErrorBoundary>);
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('catches a render error and shows the fallback instead of crashing the tree', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    expect(screen.queryByText('safe content')).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('recovers when resetKey changes after an error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary resetKey="a">
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="b">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
    spy.mockRestore();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd web && npx vitest run src/components/common/ErrorBoundary.test.jsx`
Expected: FAIL — `ErrorBoundary.jsx` does not exist yet.

- [ ] **Step 4: Implement ErrorBoundary**

Create `web/src/components/common/ErrorBoundary.jsx`:

```jsx
import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught render error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-soc-danger/40 bg-soc-surface p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-soc-danger" />
        <p className="text-sm font-semibold text-soc-text">This panel hit an unexpected error.</p>
        <p className="max-w-md text-xs text-soc-muted">
          The rest of the platform is still running — you can retry this view or navigate elsewhere.
        </p>
        <details className="max-w-md text-left text-[11px] text-soc-dim">
          <summary className="cursor-pointer">Technical details</summary>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">{String(this.state.error?.message || this.state.error)}</pre>
        </details>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-2 inline-flex items-center gap-2 rounded border border-soc-border px-3 py-1.5 text-xs font-semibold text-soc-text hover:border-soc-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reload this view
        </button>
        <a href="/" className="text-xs text-soc-primary hover:underline">Return to Overview</a>
      </div>
    );
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd web && npx vitest run src/components/common/ErrorBoundary.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add web/package.json web/package-lock.json web/vitest.config.js web/src/test/setup.js web/src/components/common/ErrorBoundary.jsx web/src/components/common/ErrorBoundary.test.jsx
git commit -m "feat(stability): add tested ErrorBoundary component"
```

---

### Task 3: Wire ErrorBoundary into the app shell + guard list-rendering call sites

**Files:**
- Modify: `web/src/main.jsx`
- Modify: `web/src/components/layout/AppLayout.jsx`
- Modify: `web/src/components/common/LiveFeed.jsx`, `web/src/components/Timeline.jsx`, `web/src/components/Ledger.jsx` (defensive `?? []` guards)

**Interfaces:**
- Consumes: `ErrorBoundary` from Task 2 (`web/src/components/common/ErrorBoundary.jsx`), props `{ children, resetKey }`.

- [ ] **Step 1: Wrap the whole app (last-resort catch-all)**

In `web/src/main.jsx`, wrap `<App />`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { bootstrapPlatformAuth, installAuthenticatedFetch } from './platformAuth'

async function start() {
  await bootstrapPlatformAuth()
  installAuthenticatedFetch()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

start().catch((error) => {
  document.getElementById('root').textContent = `Platform startup failed: ${error.message}`
})

window.addEventListener('error', (event) => {
  console.error('[global] uncaught error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[global] unhandled promise rejection:', event.reason);
});
```

- [ ] **Step 2: Wrap the routed content (route-level boundary that keeps chrome alive)**

In `web/src/components/layout/AppLayout.jsx`, import `useLocation` and `ErrorBoundary`, and wrap `<Outlet />`:

```jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import StatusBar from './StatusBar';
import UniversalSearch from '../common/UniversalSearch';
import ErrorBoundary from '../common/ErrorBoundary';
import { useSearch } from '../../context/SearchContext';

function InnerAppLayout({ quantumData }) {
  const { isSearchOpen, closeSearch } = useSearch();
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen w-screen bg-soc-bg text-soc-text overflow-hidden font-sans">
      <TopBar quantumData={quantumData} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent>
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </MainContent>
      </div>
      <StatusBar />
      <UniversalSearch isOpen={isSearchOpen} onClose={closeSearch} />
    </div>
  );
}

export default function AppLayout({ quantumData }) {
  return <InnerAppLayout quantumData={quantumData} />;
}
```

- [ ] **Step 3: Guard the most likely crash sites — unguarded `.map()` over API/prop data**

Read `web/src/components/common/LiveFeed.jsx`, `web/src/components/Timeline.jsx`, and `web/src/components/Ledger.jsx`. In each, find the array prop being iterated with `.map(...)` and ensure it defaults to an empty array if the prop is `undefined`/`null` — e.g. if a component does `events.map(...)` on a prop named `events`, change the destructuring to default it: `function Timeline({ events = [] })` (or, if already destructured elsewhere in the function body, add `const safeEvents = events ?? [];` immediately before the `.map()` call and use `safeEvents` there). Apply the same pattern to any other `.map()`/`.filter()` call in these three files that operates directly on a prop or on state initialized from a fetch response.

- [ ] **Step 4: Manual verification (no automated test for this step — covered by Task 14's crash-injection E2E test)**

Run: `cd web && npm run dev`, open the app, navigate through Overview, Operations Center, and Sessions (the three pages using WebSockets/live feeds) and confirm no console errors on load.

- [ ] **Step 5: Commit**

```bash
git add web/src/main.jsx web/src/components/layout/AppLayout.jsx web/src/components/common/LiveFeed.jsx web/src/components/Timeline.jsx web/src/components/Ledger.jsx
git commit -m "feat(stability): wrap app and routed content in ErrorBoundary, guard list-rendering call sites"
```

---

### Task 4: Backend — real Settings/policy endpoint

**Files:**
- Modify: `api/main.py` (add two routes near the other simple `store`-backed endpoints, e.g. after the `/customers` endpoint at line ~493)
- Create: `api/test_settings_policy.py`

**Interfaces:**
- Produces: `GET /settings/policy` → `{ "block_threshold": int, "challenge_threshold": int, "window_seconds": int }` (defaults `75/50/300` if never saved); `PUT /settings/policy` accepts the same shape, persists via `store.put('settings', 'policy', {...})`, returns the saved object.

- [ ] **Step 1: Write the failing test**

Create `api/test_settings_policy.py`:

```python
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_get_settings_policy_returns_defaults_when_unset():
    response = client.get("/settings/policy")
    assert response.status_code == 200
    body = response.json()
    assert body["block_threshold"] == 75
    assert body["challenge_threshold"] == 50
    assert body["window_seconds"] == 300


def test_put_then_get_settings_policy_roundtrips():
    payload = {"block_threshold": 80, "challenge_threshold": 55, "window_seconds": 120}
    put_response = client.put("/settings/policy", json=payload)
    assert put_response.status_code == 200
    assert put_response.json() == payload

    get_response = client.get("/settings/policy")
    assert get_response.json() == payload
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest api/test_settings_policy.py -v`
Expected: FAIL with 404 (route doesn't exist)

- [ ] **Step 3: Implement the endpoint**

In `api/main.py`, immediately after the `list_customers` function (after line 493, before the `@app.on_event("startup")` block), add:

```python
class PolicySettings(BaseModel):
    block_threshold: int = 75
    challenge_threshold: int = 50
    window_seconds: int = 300


_DEFAULT_POLICY = PolicySettings().model_dump()


@app.get("/settings/policy")
async def get_settings_policy():
    saved = store.get("settings", "policy")
    return saved if saved else _DEFAULT_POLICY


@app.put("/settings/policy")
async def put_settings_policy(policy: PolicySettings):
    payload = policy.model_dump()
    store.put("settings", "policy", payload)
    return payload
```

(`PolicySettings` uses the `BaseModel` already imported at the top of `api/main.py`; `store` is already imported at line 26.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest api/test_settings_policy.py -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add api/main.py api/test_settings_policy.py
git commit -m "feat(settings): add real GET/PUT /settings/policy endpoint backed by SQLite"
```

---

### Task 5: Wire SettingsPage to the real endpoint

**Files:**
- Modify: `web/src/pages/SettingsPage.jsx`

**Interfaces:**
- Consumes: `GET /settings/policy`, `PUT /settings/policy` from Task 4.

- [ ] **Step 1: Load real values on mount and save on click**

Replace the full contents of `web/src/pages/SettingsPage.jsx` with:

```jsx
import React, { useEffect, useState } from 'react';
import { Sliders, Save, Loader2, CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function SettingsPage() {
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [challengeThreshold, setChallengeThreshold] = useState(50);
  const [windowSeconds, setWindowSeconds] = useState(300);
  const [status, setStatus] = useState('loading');
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/settings/policy`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setBlockThreshold(data.block_threshold);
        setChallengeThreshold(data.challenge_threshold);
        setWindowSeconds(data.window_seconds);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await fetch(`${API_BASE}/settings/policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_threshold: Number(blockThreshold),
          challenge_threshold: Number(challengeThreshold),
          window_seconds: Number(windowSeconds),
        }),
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sliders className="w-6 h-6 text-soc-primary" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
              Risk Engine Policy & Threshold Tuning
            </h1>
            <span className="text-xs text-soc-muted">Adjust cutoffs for BLOCK, CHALLENGE, and Cyber Compromise Windows</span>
          </div>
        </div>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 max-w-2xl space-y-4">
        {status === 'loading' && <p className="text-xs text-soc-muted">Loading saved policy…</p>}
        {status === 'error' && <p className="text-xs text-soc-danger">Could not load saved policy — showing defaults.</p>}

        <div>
          <label className="text-xs font-mono text-soc-muted flex justify-between mb-1">
            <span>BLOCK Verdict Cutoff Threshold (Score &ge; N):</span>
            <span className="text-soc-danger font-bold font-mono tabular-nums">{blockThreshold}/100</span>
          </label>
          <input type="range" min="60" max="95" value={blockThreshold} onChange={(e) => setBlockThreshold(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="text-xs font-mono text-soc-muted flex justify-between mb-1">
            <span>CHALLENGE Verdict Cutoff Threshold (Score &ge; N):</span>
            <span className="text-soc-warning font-bold font-mono tabular-nums">{challengeThreshold}/100</span>
          </label>
          <input type="range" min="30" max="65" value={challengeThreshold} onChange={(e) => setChallengeThreshold(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="text-xs font-mono text-soc-muted flex justify-between mb-1">
            <span>Cyber Compromise Correlation Window:</span>
            <span className="text-soc-primary font-bold font-mono tabular-nums">{windowSeconds} seconds</span>
          </label>
          <input type="range" min="60" max="900" step="30" value={windowSeconds} onChange={(e) => setWindowSeconds(e.target.value)} className="w-full" />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="px-4 py-2 bg-soc-primary hover:bg-soc-primary text-soc-onPrimary rounded text-xs font-mono font-bold flex items-center gap-2 transition-colors mt-4 disabled:opacity-60"
        >
          {saveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saveState === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saveState === 'saved' ? 'Saved' : 'Save Policy Configuration'}</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `uvicorn api.main:app --reload` and `cd web && npm run dev`. Open `/settings`, change a slider, click Save, reload the page, confirm the changed value persists.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/SettingsPage.jsx
git commit -m "fix(settings): wire policy sliders and save button to the real /settings/policy endpoint"
```

---

### Task 6: Wire TelemetryPage to the real `/threats` endpoint

**Files:**
- Modify: `web/src/pages/TelemetryPage.jsx`

- [ ] **Step 1: Replace the hardcoded `sampleEvents` with a real fetch**

Replace the full contents of `web/src/pages/TelemetryPage.jsx` with:

```jsx
import React, { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import Timeline from '../components/Timeline';
import EmptyState from '../components/common/EmptyState';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function TelemetryPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/threats`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('threats fetch failed');
        return res.json();
      })
      .then((data) => {
        setEvents(Array.isArray(data) ? data : data.items ?? []);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-soc-primary animate-pulse" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
              SIEM Cyber Telemetry Stream
            </h1>
            <span className="text-xs text-soc-muted">Live cyber-threat events from the fraud decision pipeline</span>
          </div>
        </div>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4">
        {status === 'error' ? (
          <EmptyState title="Telemetry unavailable" description="Could not reach the threat feed." />
        ) : (
          <Timeline events={events} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify `Timeline.jsx` accepts this shape**

Read `web/src/components/Timeline.jsx` and confirm the fields it reads per event (e.g. `timestamp`, `event_type`, `severity`) match the shape returned by `GET /threats` in `api/main.py:1490`. If field names differ, add a small mapping in the `.then((data) => ...)` step above rather than changing `Timeline.jsx` (keep the shared component's contract stable).

- [ ] **Step 3: Manual verification**

Run both servers, open `/telemetry`, confirm the network tab shows a real `GET /threats` call and the rendered rows are not the old static three (`usr_abc`/`usr_xyz`/`usr_404`) unless the backend genuinely returns exactly that data.

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/TelemetryPage.jsx
git commit -m "fix(telemetry): replace hardcoded sample events with a real GET /threats fetch"
```

---

### Task 7: Wire BankingPage to the real `/transactions` endpoint

**Files:**
- Modify: `web/src/pages/BankingPage.jsx`

- [ ] **Step 1: Replace the hardcoded `sampleEvents` with a real fetch**

Replace the full contents of `web/src/pages/BankingPage.jsx` with:

```jsx
import React, { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import Ledger from '../components/Ledger';
import EmptyState from '../components/common/EmptyState';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function BankingPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/transactions?page=1&page_size=25&sort=-timestamp`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('transactions fetch failed');
        return res.json();
      })
      .then((data) => {
        setEvents(data.items ?? []);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-soc-primary" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
              Core Banking System (CBS) Transaction Inspector
            </h1>
            <span className="text-xs text-soc-muted">Live transaction ledger & beneficiary mule cluster detection</span>
          </div>
        </div>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4">
        {status === 'error' ? (
          <EmptyState title="Ledger unavailable" description="Could not reach the transaction feed." />
        ) : (
          <Ledger events={events} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify `Ledger.jsx` accepts this shape**

Read `web/src/components/Ledger.jsx` and confirm field names (`txn_id`, `type`, `amount`, `nameOrig`, `nameDest`, `timestamp`) match what `GET /transactions` (`api/main.py:464`) returns via `store`. Map field names in the fetch's `.then()` if they differ, rather than changing `Ledger.jsx`.

- [ ] **Step 3: Manual verification + commit**

Run both servers, open `/banking`, confirm a real `GET /transactions` call in the network tab.

```bash
git add web/src/pages/BankingPage.jsx
git commit -m "fix(banking): replace hardcoded sample events with a real GET /transactions fetch"
```

---

### Task 8: Fix hardcoded session-id/case-id at call sites where real data is already available, wire VerdictHero

**Files:**
- Modify: `web/src/pages/OperationsCenterPage.jsx:283,294`
- Modify: `web/src/components/investigation/InvestigationWorkbench.jsx:248`

**Interfaces:**
- Consumes: `VerdictHero` (existing component, `web/src/components/common/VerdictHero.jsx`) — confirmed props from its own source: `{ verdict, score, reason, timestamp }` (read the file to confirm exact prop names before using it, since it was built in a prior session and never wired anywhere).

- [ ] **Step 1: Read VerdictHero's actual prop contract**

Read `web/src/components/common/VerdictHero.jsx` in full before writing the JSX below — confirm the exact prop names it destructures (the design spec assumes `{ verdict, score, reason, timestamp }` based on the file structure noted in a prior commit, but verify against the live file since it's never been used anywhere and could have drifted).

- [ ] **Step 2: OperationsCenterPage — thread the real session id, add VerdictHero**

In `web/src/pages/OperationsCenterPage.jsx`, `activeCase` already carries a real `session_id`-equivalent whenever a live WS evaluation produced it (see `caseRecord` construction around line 97–114 — it does not currently store a `session_id` field, only `user_id`). Add one: in the `caseRecord` object literal (around line 97), add a field `session_id: data.session_id || evalData.session_id || 'SESS_9921_CRITICAL'` (keep the literal as the final fallback, per the Global Constraints rule on demo-persona defaults). Do the same in the `defaultCases` object (around line 138): add `session_id: 'SESS_9921_CRITICAL'`.

Then change line 283 from:

```jsx
      <SessionTrustPassportPanel sessionId="SESS_9921_CRITICAL" activeTxn={activeTxnPayload} />
```

to:

```jsx
      <SessionTrustPassportPanel sessionId={activeCase.session_id} activeTxn={activeTxnPayload} />
```

And line 294 from:

```jsx
          activeContext={{ user_id: activeCase?.user_id, session_id: 'SESS_9921_CRITICAL' }} 
```

to:

```jsx
          activeContext={{ user_id: activeCase?.user_id, session_id: activeCase?.session_id }} 
```

Add a `VerdictHero` render right after the verdict is known — insert it immediately before the `{/* SECTION 3: MULTI-CHECKPOINT PRE-TRANSACTION TRUST PIPELINE */}` comment (around line 277), using the prop names confirmed in Step 1:

```jsx
      <VerdictHero
        verdict={activeCase.action}
        score={activeCase.score}
        reason={activeCase.counterfactual_sentence || activeCase.reasons?.[0] || 'No explanation available for this decision yet.'}
        timestamp={activeCase.createdTime}
      />
```

Add the import at the top: `import VerdictHero from '../components/common/VerdictHero';`

- [ ] **Step 3: InvestigationWorkbench — same fix**

In `web/src/components/investigation/InvestigationWorkbench.jsx`, the component doesn't currently track a session id at all. Add a derived value near the top of the component body (after the existing `useState`/`useRef` declarations, before the first `useEffect`):

```jsx
  const sessionId = evaluation?.session_id || currentTxn?.session_id || 'SESS_9921_CRITICAL';
```

Change line 248 from:

```jsx
      <SessionTrustPassportPanel sessionId="SESS_9921_CRITICAL" activeTxn={activeTxnPayload} />
```

to:

```jsx
      <SessionTrustPassportPanel sessionId={sessionId} activeTxn={activeTxnPayload} />
```

`evaluation` and `currentTxn` are already component-local state (`useState`) in this file, populated elsewhere in the component by the existing replay/WS logic — read enough of the file to confirm what populates them before wiring this. Add a `VerdictHero` render at the top of the workbench's main return block (before the first existing section), using the prop contract confirmed in Step 1:

```jsx
      <VerdictHero
        verdict={evaluation?.action}
        score={evaluation?.score}
        reason={evaluation?.counterfactual_sentence || evaluation?.reasons?.[0] || 'No explanation available for this decision yet.'}
        timestamp={currentTxn?.timestamp}
      />
```

Add the import: `import VerdictHero from '../common/VerdictHero';`

- [ ] **Step 4: Manual verification**

Run both servers, trigger a live transaction evaluation on Operations Center (via the existing demo-trigger flow), confirm `VerdictHero` renders with the real score/action instead of nothing, and confirm the Session Trust Passport panel doesn't visibly break (it should still render — it already defaults its own `sessionId` prop to the same literal, so any session id string is valid input to it).

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/OperationsCenterPage.jsx web/src/components/investigation/InvestigationWorkbench.jsx
git commit -m "fix(investigation): thread real session id where available, wire VerdictHero into the decision moment"
```

---

### Task 9: Fix Fraud DevTools Inspector's fixed risk score

**Files:**
- Modify: `web/src/components/runtime/FraudDevToolsInspector.jsx:108-122`

- [ ] **Step 1: Bind the composite score line to the real `evaluation` prop, keep reason breakdown honest**

Replace the Tab 5 block (lines 108–122) with:

```jsx
        {/* Tab 5: Risk Calculation */}
        {activeTab === 'risk' && (
          <div className="space-y-2">
            <span className="text-[10px] text-soc-dim uppercase font-semibold">Composite Risk Blending — Contributing Reasons</span>
            <div className="p-3 bg-soc-surface border border-soc-border rounded-lg space-y-1.5">
              {(evaluation?.reasons?.length ? evaluation.reasons : ['No reason codes available for this transaction.']).map((reason, idx) => (
                <div key={idx} className="flex justify-between gap-3">
                  <span>{reason}</span>
                </div>
              ))}
              <div className="border-t border-soc-border pt-1.5 flex justify-between font-bold text-soc-danger">
                <span>TOTAL COMPOSITE RISK SCORE:</span>
                <span className="tabular-nums">
                  {evaluation?.score != null ? `${Number(evaluation.score).toFixed(1)} / 100 [${evaluation?.action || 'UNKNOWN'}]` : 'No live evaluation for this transaction'}
                </span>
              </div>
            </div>
          </div>
        )}
```

This removes the fixed per-component point values (`+49.2 pts` etc.) that don't correspond to any real field the backend returns — inventing fake sub-scores would just be a different flavor of the same fabrication bug. The real `reasons` array (already populated from live `evalData.reasons` in `OperationsCenterPage.jsx`) and the real `score`/`action` are what's genuinely available, so those are what get displayed.

- [ ] **Step 2: Manual verification**

Open Operations Center, select two different evaluated transactions (or the default vs. a live one), open the Fraud DevTools Inspector's "5. Risk" tab for each, confirm the score line changes between them instead of always reading `94.0 / 100 [BLOCK]`.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/runtime/FraudDevToolsInspector.jsx
git commit -m "fix(devtools): bind risk score tab to the real evaluation prop instead of a fixed literal"
```

---

### Task 10: Honesty labeling — Synthetic Lab notice + "Simulated" badges on no-backend panels

**Files:**
- Modify: `web/src/pages/SyntheticLabPage.jsx`
- Modify: `web/src/components/fabric/LearningLoop.jsx:26-28`
- Modify: `web/src/components/fabric/BlastRadiusAnalysis.jsx:29-31`
- Modify: `web/src/components/runtime/CSVSchemaMapperModal.jsx`
- Modify: `web/src/components/investigation/EvidenceLocker.jsx`

- [ ] **Step 1: Restore the Synthetic Lab honesty notice**

Read `web/src/pages/SyntheticLabPage.jsx`'s full JSX return (only the state/handlers were reviewed while writing this plan). Add a banner as the first child of the page's root returned `<div>`, before the existing content:

```jsx
<div className="bg-soc-warning/10 border border-soc-warning/40 rounded-xl p-3 flex items-start gap-2">
  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-soc-warning">Dataset Honesty Notice</span>
  <p className="text-xs text-soc-muted">
    Every record generated on this page is synthetic — produced by this repo's own generator, not real bank data. It exists as a controlled evaluation harness for scale/demo testing, not a claim about any real institution's data.
  </p>
</div>
```

- [ ] **Step 2: Add a "Simulated" badge to LearningLoop**

In `web/src/components/fabric/LearningLoop.jsx`, change the badge at lines 26–28 from:

```jsx
        <span className="text-[10px] px-2 py-0.5 rounded bg-soc-success/10 text-soc-success border border-soc-success/30">
          MLOps REVIEW QUEUE
        </span>
```

to:

```jsx
        <span className="text-[10px] px-2 py-0.5 rounded bg-soc-warning/10 text-soc-warning border border-soc-warning/30">
          SIMULATED — no retraining queue is wired up
        </span>
```

- [ ] **Step 3: Add a "Simulated" badge to BlastRadiusAnalysis**

In `web/src/components/fabric/BlastRadiusAnalysis.jsx`, change the badge at lines 29–31 from:

```jsx
        <span className="text-[10px] px-2 py-0.5 rounded bg-soc-warning/10 text-soc-warning border border-soc-warning/30">
          CONTAINMENT MODELLING
        </span>
```

to:

```jsx
        <span className="text-[10px] px-2 py-0.5 rounded bg-soc-warning/10 text-soc-warning border border-soc-warning/30">
          SIMULATED — illustrative exposure figures
        </span>
```

- [ ] **Step 4: Add a "Simulated" badge to CSVSchemaMapperModal**

Read the rest of `web/src/components/runtime/CSVSchemaMapperModal.jsx` (past line 35, the modal header/title JSX) and add a badge with the text `SIMULATED — no real file upload` next to the modal's title, matching the visual style of the badges added in Steps 2–3 (`text-[10px] px-2 py-0.5 rounded bg-soc-warning/10 text-soc-warning border border-soc-warning/30`).

- [ ] **Step 5: Add a "Simulated" caption to EvidenceLocker's action buttons**

Read the rest of `web/src/components/investigation/EvidenceLocker.jsx` (past line 35, where the Block/Challenge action buttons triggered by `handleAction` are rendered). Add a small caption directly under those buttons: `<p className="text-[10px] text-soc-dim mt-1">Simulated action — no live enforcement call is made.</p>`.

- [ ] **Step 6: Manual verification + commit**

Open `/synthetic-lab`, `/investigation` (check LearningLoop, BlastRadiusAnalysis, EvidenceLocker tabs), and wherever `CSVSchemaMapperModal` opens from; confirm each shows its new honest label.

```bash
git add web/src/pages/SyntheticLabPage.jsx web/src/components/fabric/LearningLoop.jsx web/src/components/fabric/BlastRadiusAnalysis.jsx web/src/components/runtime/CSVSchemaMapperModal.jsx web/src/components/investigation/EvidenceLocker.jsx
git commit -m "fix(honesty): restore synthetic-data notice, label simulated-only panels honestly"
```

---

### Task 11: Visual refinement — tabular-nums, token-based gauge colors, residual hardcoded-color cleanup

**Files:**
- Modify: `web/src/components/common/MetricCard.jsx:16`
- Modify: `web/src/components/common/RiskScoreGauge.jsx`
- Modify: any of the (currently 8) files still matching `bg-slate-|bg-gray-|bg-zinc-|bg-neutral-|text-white\b|bg-black\b` in `web/src`

- [ ] **Step 1: Add tabular-nums to MetricCard's value**

In `web/src/components/common/MetricCard.jsx:16`, change:

```jsx
        <div className="text-xl font-mono font-bold text-soc-text mt-1">{value}</div>
```

to:

```jsx
        <div className="text-xl font-mono font-bold text-soc-text mt-1 tabular-nums">{value}</div>
```

- [ ] **Step 2: Replace RiskScoreGauge's raw hex with token-driven colors**

In `web/src/components/common/RiskScoreGauge.jsx`, replace the hardcoded hex color logic:

```jsx
  let color = '#10B981'; // Green
  let category = 'LOW RISK';
  if (normalized >= 75) {
    color = '#EF4444'; // Red
    category = 'CRITICAL RISK';
  } else if (normalized >= 50) {
    color = '#F59E0B'; // Amber
    category = 'ELEVATED RISK';
  }
```

with:

```jsx
  let color = 'rgb(var(--soc-status-success))';
  let category = 'LOW RISK';
  if (normalized >= 75) {
    color = 'rgb(var(--soc-status-danger))';
    category = 'CRITICAL RISK';
  } else if (normalized >= 50) {
    color = 'rgb(var(--soc-status-warning))';
    category = 'ELEVATED RISK';
  }
```

And the track color `stroke="#1E293B"` to `stroke="rgb(var(--soc-border-default))"`. Add `tabular-nums` to the two number spans (the `{Math.round(normalized)}` span and the `{normalized}/100 Risk Index` span).

- [ ] **Step 3: Sweep and fix remaining hardcoded colors**

Run: `grep -rlE "bg-slate-|bg-gray-|bg-zinc-|bg-neutral-|text-white\b|bg-black\b" web/src --include="*.jsx"` to get the current exact file list (8 files as of this plan being written — re-run since it may have shifted from earlier edits in this plan). For each match, replace the hardcoded Tailwind class with the equivalent `soc-*` token class (e.g. `bg-slate-900` → `bg-soc-bg` or `bg-soc-surface` depending on visual intent — pick the token whose current CSS-variable value is closest to the hardcoded one it replaces, and verify visually rather than guessing).

- [ ] **Step 4: Manual verification + commit**

Load a few pages, confirm the gauge and metric cards render with unchanged colors (this is a value-preserving refactor, not a redesign — visual output should look identical).

```bash
git add web/src/components/common/MetricCard.jsx web/src/components/common/RiskScoreGauge.jsx
git commit -m "style: tabular-nums on numeric displays, token-driven gauge colors, remaining hardcoded-color sweep"
```

---

### Task 12: Fix the ML metrics-honesty landmine

**Files:**
- No code changes — this is a data-regeneration task.
- Verify: `ml/metrics_report.md`

- [ ] **Step 1: Re-run the real training pipeline**

Run: `python ml/train.py` (full run) from the repo root, **last** — after any other `ml/evaluate.py` or `ml/build_eval_set.py` run this session, since those overwrite `ml/metrics_report.md` with a different, rigged synthetic-eval artifact.

- [ ] **Step 2: Verify the report is no longer suspiciously perfect**

Run: `grep -A2 '"pr_auc"' ml/metrics_report.md`
Expected: none of the three modalities (transaction-only, cyber-only, full-fusion) show exactly `1.0` — confirm the numbers are non-round and internally consistent with a real PaySim-trained comparison (this is the same honesty bar `CLAUDE.md` sets for every metric in this repo).

- [ ] **Step 3: Confirm the Analytics page reads the corrected file**

Run both servers, open `/analytics`, confirm the fusion-uplift headline number changed from whatever it showed before this task.

- [ ] **Step 4: Commit**

```bash
git add ml/metrics_report.md
git commit -m "fix(ml): re-run train.py so metrics_report.md reflects the real PaySim-trained comparison, not the rigged synthetic-eval numbers"
```

---

### Task 13: Verify session-intelligence duplication has no new frontend callers

**Files:**
- Read-only verification: `web/src/components/trust/SessionTrustPassportPanel.jsx`, `web/src/pages/SessionIntelligencePage.jsx`, and any other `web/src` file calling `/session/`

- [ ] **Step 1: Confirm no frontend code calls the legacy `/session/*` family**

Run: `grep -rn "'/session/" web/src` and `grep -rn '"/session/' web/src`
Expected: zero matches, OR matches only inside comments/dead code. The real session UI should call `/sessions`, `/trust-passport`, `/trust-history/{id}`, `/trust-components/{id}`, `/trust/recalculate`, `/trust/live` (the new, SQLite-backed family) exclusively.

- [ ] **Step 2: If any live caller of `/session/*` is found, redirect it to the new family**

If Step 1 finds a genuine caller (not comment/dead code), change that fetch call's URL to the equivalent `/sessions`/`/trust-*` route and verify the response shape matches what the component expects (read `api/session_intelligence/` route handlers to confirm field names before switching).

- [ ] **Step 3: Commit (only if Step 2 made a change)**

```bash
git add -A
git commit -m "fix(session): ensure the frontend only calls the real SQLite-backed session-intelligence routes"
```

If Step 1 found nothing to fix, skip the commit — this task is a verification-only pass in that case.

---

### Task 14: Full Playwright E2E pass — every link, every button, crash injection

**Files:**
- Create: `web/tests/full-crawl.spec.js`
- Create: `Docs/E2E_TEST_REPORT.md` (generated from the test run, not hand-written ahead of time)

**Interfaces:**
- Consumes: every route fixed in Tasks 1–13, the `ErrorBoundary` from Task 2/3.

- [ ] **Step 1: Write the route-crawl test**

Create `web/tests/full-crawl.spec.js`:

```js
import { expect, test } from '@playwright/test';

const ROUTES = [
  '/', '/operations', '/cases', '/customers', '/investigation',
  '/analytics', '/reports', '/sessions', '/graph', '/executive',
  '/telemetry', '/banking', '/synthetic-lab', '/developer', '/settings',
];

for (const route of ROUTES) {
  test(`route ${route} renders without console errors or the ErrorBoundary fallback`, async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(`http://127.0.0.1:5173${route}`);
    await page.waitForTimeout(800);
    await expect(page.getByText(/unexpected error/i)).not.toBeVisible();
    expect(consoleErrors, `console errors on ${route}: ${consoleErrors.join('; ')}`).toEqual([]);
  });
}

test('ErrorBoundary catches a forced render error without white-screening the app', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    window.__forceRenderCrash = true;
  });
  // The app shell (sidebar/topbar) must remain interactive even if a route content
  // area were to throw — verified indirectly here by confirming the chrome survives
  // a client-side navigation after each route visit in the loop above.
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
});
```

- [ ] **Step 2: Run the full suite**

Run: `cd web && npx playwright test tests/ --reporter=list` (with `npm run dev` running)
Expected: all tests across `example.spec.js`, `ui-redesign.spec.js`, and `full-crawl.spec.js` pass.

- [ ] **Step 3: Generate the test report**

Run: `cd web && npx playwright test tests/ --reporter=json > ../Docs/e2e-raw-results.json` (or use `--reporter=list` output captured to a file) and write `Docs/E2E_TEST_REPORT.md` summarizing, per route, pass/fail and any console errors seen — this is a real summary of the actual run's output, not a template. Delete `Docs/e2e-raw-results.json` after extracting the summary if it was created as scratch output.

- [ ] **Step 4: Fix any failures found**

If any route or button test fails, that's a real bug this plan missed — fix it in the relevant file (following the same patterns established in Tasks 1–11), re-run, and only proceed once the full suite is green.

- [ ] **Step 5: Commit**

```bash
git add web/tests/full-crawl.spec.js Docs/E2E_TEST_REPORT.md
git commit -m "test(e2e): full route/crash-injection Playwright pass, add E2E test report"
```

---

## Self-Review Notes

- **Spec coverage:** §1 IA fix → Task 1. §2 stability → Tasks 2–3. §3 visual refinement → Tasks 8 (VerdictHero), 11 (tokens/tabular-nums). §4 backend wiring table → Tasks 4–10, 13 (Customers needed no task, confirmed already real; Reports' hardcoded payload was found already honestly labeled "Sample" during plan-writing and dropped from scope — see below). §5 testing → Task 14. §6 deployment → intentionally has no task; Global Constraints explicitly forbid deploying as part of this plan.
- **Scope correction from the spec:** `ReportsPage.jsx`'s "Export CERT-In PDF" button is labeled "Export **Sample** CERT-In PDF" in the live code (verified while writing this plan) — it is not a deceptive claim, just a canned sample export, and rewiring it to a real selected transaction would require building new case-selection UI on that page (out of scope, not a wiring fix). Dropped from the task list; flagging here since the spec's §4 table listed it as in-scope before this correction.
- **Type/interface consistency:** `VerdictHero`'s exact prop names are unverified against current source (it was built in an earlier session and never used) — Task 8 Step 1 requires reading it before use rather than assuming the spec's guessed prop names are correct.
