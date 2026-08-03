import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, Cpu, Network, ShieldCheck } from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import StatStrip from '../components/common/StatStrip';
import EmptyState from '../components/common/EmptyState';
import { FLAT_EPSILON, deltaWord, formatF, formatPct, getUplift } from '../lib/metricsFormat';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

// Deliberately no WebSocket on this page. The landing view is meant to be calm,
// and Operations Center already owns the /ws/stream connection.
const CRITICAL_CASES_URL = `${API_BASE}/cases?severity=CRITICAL&page=1&page_size=5&sort=-created_at`;

const severityTone = {
  CRITICAL: 'text-soc-danger',
  HIGH: 'text-soc-warning',
  MEDIUM: 'text-soc-info',
  LOW: 'text-soc-muted',
};

const UNAVAILABLE = '—';

function formatTimestamp(value) {
  if (!value) return UNAVAILABLE;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [platformError, setPlatformError] = useState(false);
  const [cases, setCases] = useState(null);
  const [casesError, setCasesError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const load = async (url, onData, onError) => {
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const data = await response.json();
        if (data && data.error) throw new Error(data.error);
        onData(data);
      } catch (error) {
        if (error.name === 'AbortError') return;
        onError();
      }
    };

    load(`${API_BASE}/metrics/evaluate`, setMetrics, () => setMetricsError(true));
    load(`${API_BASE}/platform/status`, setPlatform, () => setPlatformError(true));
    load(CRITICAL_CASES_URL, setCases, () => setCasesError(true));

    return () => controller.abort();
  }, []);

  // ---- Section 1: headline fusion performance ------------------------------
  // The headline is the PR-AUC delta, matching Analytics. Recall is saturated
  // near 99.9% for both configurations on this test set, so a recall-uplift
  // headline would be flat at best and dishonest if it ever regressed.
  let headlineValue = 'Loading…';
  let headlineLabel = 'Fusion PR-AUC vs tabular-only';
  let headlineDetail = 'Reading reproducible metrics from the evaluation harness.';
  let headlineTone = 'text-soc-text';

  if (metricsError) {
    headlineValue = 'Unavailable';
    headlineLabel = 'Fusion PR-AUC vs tabular-only';
    headlineDetail =
      'The evaluation harness did not return metrics. Run the training pipeline to regenerate ml/metrics_report.md — no figure is shown rather than an assumed one.';
    headlineTone = 'text-soc-muted';
  } else if (metrics?.full_fusion && metrics?.transaction_only) {
    const base = metrics.transaction_only;
    const fused = metrics.full_fusion;
    const prAucDelta = fused.pr_auc - base.pr_auc;

    headlineValue = getUplift(base.pr_auc, fused.pr_auc, false);
    headlineLabel = prAucDelta >= FLAT_EPSILON ? 'Fusion PR-AUC uplift' : 'Fusion PR-AUC (Δ)';
    headlineTone = prAucDelta >= -FLAT_EPSILON ? 'text-soc-success' : 'text-soc-danger';
    // 4dp here, not formatF's 3dp: at 3 decimals both configurations round to
    // the same number and the sentence reads "improves from 0.998 to 0.998".
    headlineDetail =
      `PR-AUC ${deltaWord(prAucDelta)} from ${base.pr_auc.toFixed(4)} to ${fused.pr_auc.toFixed(4)}. ` +
      `Recall ${formatPct(base.recall)} → ${formatPct(fused.recall)}, ` +
      `precision ${formatPct(base.precision)} → ${formatPct(fused.precision)}.`;
  }

  // ---- Section 2: platform status tiles ------------------------------------
  const modelsAvailable = platform?.models?.status === 'AVAILABLE';
  const artifactCount = platform?.models?.artifacts?.length ?? 0;
  const missingCount = platform?.models?.missing_artifacts?.length ?? 0;
  const graphAvailable = platform?.graph?.status === 'AVAILABLE';
  const engineReady = modelsAvailable && graphAvailable;

  const statusItems = [
    {
      label: 'Decision engine',
      value: platformError ? 'Unavailable' : platform ? (engineReady ? 'Ready' : 'Degraded') : '…',
      detail: platform
        ? `${platform.decision_engine?.implementation ?? 'engine'} · v${platform.version ?? UNAVAILABLE}`
        : 'Querying /platform/status',
      tone: platformError ? 'warning' :engineReady ? 'success' : 'warning',
      icon: ShieldCheck,
    },
    {
      label: 'Models loaded',
      value: platformError
        ? UNAVAILABLE
        : platform
          ? modelsAvailable ? String(artifactCount) : `${missingCount} missing`
          : '…',
      detail: platform
        ? modelsAvailable ? 'All artifacts resolved' : (platform.models?.reason ?? 'Artifacts incomplete')
        : 'Querying /platform/status',
      tone: platformError ? 'warning' :modelsAvailable ? 'success' : 'danger',
      icon: Cpu,
    },
    {
      label: 'Graph backend',
      value: platformError ? UNAVAILABLE : platform ? (platform.graph?.backend ?? UNAVAILABLE) : '…',
      detail: platform
        ? graphAvailable ? 'Connected' : (platform.graph?.fallback_reason ?? 'Not connected')
        : 'Querying /platform/status',
      tone: platformError ? 'warning' :graphAvailable ? 'success' : 'warning',
      icon: Network,
    },
    {
      label: 'Open critical cases',
      value: casesError ? UNAVAILABLE : cases ? String(cases.total ?? 0) : '…',
      detail: casesError ? 'Case service unavailable' : 'Severity CRITICAL, all statuses',
      tone: casesError ? 'warning' : (cases?.total ?? 0) > 0 ? 'danger' : 'success',
      icon: AlertTriangle,
    },
  ];

  // ---- Section 3: most recent critical alerts ------------------------------
  const alerts = cases?.items ?? [];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 pb-8">
      <PageHeader
        title="Overview"
        description="Current state of the fusion engine and the cases that need attention first. Start here, then move into Operations Center to watch decisions happen live."
      />

      {/* SECTION 1 — headline fusion detection performance */}
      <section
        aria-label="Fusion detection performance"
        className="rounded-xl border border-soc-border bg-soc-surface p-6 shadow-md"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-soc-muted">
          {headlineLabel}
        </p>
        <p className={`mt-2 font-mono text-4xl font-bold tabular-nums ${headlineTone}`}>
          {headlineValue}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-soc-muted">{headlineDetail}</p>
        <p className="mt-3 text-[11px] font-mono text-soc-dim">
          Source: /metrics/evaluate
          {metrics?.computed_at ? ` · computed ${formatTimestamp(metrics.computed_at)}` : ''}
        </p>
      </section>

      {/* SECTION 2 — live platform status */}
      <StatStrip items={statusItems} />

      {/* SECTION 3 — most recent critical alerts */}
      <section aria-label="Recent critical alerts" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold text-soc-text">Most recent critical alerts</h2>
          <Link
            to="/cases"
            className="text-xs font-medium text-soc-primary transition-colors hover:text-soc-text"
          >
            View all cases
          </Link>
        </div>

        {casesError ? (
          <EmptyState
            title="Case queue unavailable"
            description="The case service did not respond. Alerts are not shown rather than showing a stale or assumed count."
          />
        ) : !cases ? (
          <div className="rounded-lg border border-soc-border bg-soc-surface p-6 font-mono text-xs text-soc-muted">
            Loading critical cases…
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No critical cases open"
            description="Nothing at CRITICAL severity right now. Operations Center shows the live stream as decisions are made."
          />
        ) : (
          <ul className="divide-y divide-soc-border overflow-hidden rounded-lg border border-soc-border bg-soc-surface">
            {alerts.map((item) => (
              <li key={item.case_id}>
                <Link
                  to={`/investigation/${item.case_id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-soc-panel/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-soc-text">{item.case_id}</span>
                      <span
                        className={`font-mono text-[10px] font-bold uppercase ${
                          severityTone[item.severity] || severityTone.LOW
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-soc-muted">{item.status}</span>
                    </div>
                    <p className="mt-1 max-w-xl truncate text-xs text-soc-muted">{item.reason}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-soc-text">
                      Score {item.score}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-soc-dim">
                      {formatTimestamp(item.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 4 — primary call to action */}
      <section
        aria-label="Continue to Operations Center"
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-soc-primary/40 bg-soc-primary/10 p-5"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-soc-text">Watch the fusion engine decide</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-soc-muted">
            Operations Center replays the transaction stream beside the SIEM feed that explains it,
            and shows the ALLOW / CHALLENGE / BLOCK verdict as each transfer is scored.
          </p>
        </div>
        <Link
          to="/operations"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-soc-primary px-5 py-2.5 font-mono text-sm font-bold text-soc-onPrimary shadow-md transition-colors hover:opacity-90"
        >
          <Activity aria-hidden="true" className="h-4 w-4" />
          <span>Open Operations Center</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
