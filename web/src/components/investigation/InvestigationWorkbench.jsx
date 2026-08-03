import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Download, Loader2, User } from 'lucide-react';

import useResource, { API_BASE } from '../../lib/useResource';
import { useCase } from '../../context/CaseContext';
import { formatAmount, formatTimestamp, normalizeVerdict } from '../../lib/verdict';
import VerdictHero from '../common/VerdictHero';
import EmptyState from '../common/EmptyState';
import CaseSwitcher from './CaseSwitcher';
import InvestigationQueuePicker from './InvestigationQueuePicker';

// One tab's panels mount on first visit and stay mounted. First paint costs a
// single tab rather than the sixteen panels this page used to render at once.
const SummaryTab = lazy(() => import('./tabs/SummaryTab'));
const EvidenceTab = lazy(() => import('./tabs/EvidenceTab'));
const ResponseTab = lazy(() => import('./tabs/ResponseTab'));
const ExplainabilityTab = lazy(() => import('./tabs/ExplainabilityTab'));
const RawTab = lazy(() => import('./tabs/RawTab'));

const TABS = [
  { id: 'summary', label: 'Summary', Component: SummaryTab },
  { id: 'evidence', label: 'Evidence', Component: EvidenceTab },
  { id: 'response', label: 'Response', Component: ResponseTab },
  { id: 'xai', label: 'Explainability', Component: ExplainabilityTab },
  { id: 'raw', label: 'Raw', Component: RawTab },
];

const DEFAULT_TAB = 'summary';

function TabFallback() {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-xs text-soc-muted">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-soc-primary" />
      <span className="font-mono">Loading panel…</span>
    </div>
  );
}

export default function InvestigationWorkbench({ caseId, resumed = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pushRecent } = useCase();

  const { data, status, error, reload } = useResource(
    caseId ? `/cases/${encodeURIComponent(caseId)}/context` : null,
  );

  // Tab lives in the URL so a deep link opens the right panel and browser back
  // steps through tabs rather than leaving the workspace.
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : DEFAULT_TAB;
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));

  useEffect(() => {
    setVisitedTabs((visited) => (visited.has(activeTab) ? visited : new Set(visited).add(activeTab)));
  }, [activeTab]);

  const selectTab = useCallback(
    (tabId) => {
      const next = new URLSearchParams(searchParams);
      if (tabId === DEFAULT_TAB) next.delete('tab');
      else next.set('tab', tabId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const caseRecord = data?.case ?? null;
  const transaction = data?.transaction ?? null;
  const customer = data?.customer ?? null;
  const evaluation = data?.evaluation ?? null;

  // Enrich the recents entry once severity is known, so the sidebar and the
  // switcher can show it. pushRecent replaces by case id, so this is idempotent.
  useEffect(() => {
    if (caseRecord?.case_id) {
      pushRecent({
        caseId: caseRecord.case_id,
        severity: caseRecord.severity,
        amount: caseRecord.amount,
      });
    }
  }, [caseRecord, pushRecent]);

  const verdict = normalizeVerdict(evaluation?.action);

  const downloadCertInReport = useCallback(async () => {
    if (!transaction || !evaluation) return;
    const response = await fetch(`${API_BASE}/report/cert-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txn_id: transaction.txn_id,
        user_id: transaction.user_id,
        amount: transaction.amount,
        reasons: evaluation.reasons ?? [],
        score: evaluation.score ?? 0,
      }),
    });
    if (!response.ok) throw new Error(`Report generation failed (${response.status})`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `CERT-In_Report_${caseId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }, [transaction, evaluation, caseId]);

  const tabContext = useMemo(
    () => ({ caseId, caseRecord, transaction, customer, evaluation, downloadCertInReport }),
    [caseId, caseRecord, transaction, customer, evaluation, downloadCertInReport],
  );

  if (!caseId) return null;

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-soc-muted">
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-soc-primary" />
        <span className="font-mono">Loading {caseId}…</span>
      </div>
    );
  }

  // A case id that does not resolve is stated plainly and answered with the
  // queue. It is never quietly swapped for a different case.
  if (status === 'error') {
    const notFound = error?.status === 404;
    return (
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
        <section
          role="alert"
          className="flex flex-col gap-2 rounded-xl border border-soc-danger/40 bg-soc-danger/5 p-5"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle aria-hidden="true" className="h-5 w-5 text-soc-danger" />
            <h2 className="text-sm font-semibold text-soc-text">
              {notFound ? 'Case not found' : 'Could not open this case'}
            </h2>
          </div>
          <p className="text-xs leading-5 text-soc-muted">
            {notFound ? (
              <>
                <span className="font-mono text-soc-text">{caseId}</span> does not exist in the case
                store. Nothing has been substituted for it — choose a real case below.
              </>
            ) : (
              error?.message
            )}
          </p>
          {!notFound && (
            <button
              type="button"
              onClick={reload}
              className="mt-1 self-start rounded border border-soc-border bg-soc-panel px-3 py-1.5 text-xs font-medium text-soc-text transition-colors hover:border-soc-primary"
            >
              Retry
            </button>
          )}
        </section>
        <InvestigationQueuePicker
          title="Open a different case"
          description="These are the cases currently in the queue."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1850px] flex-col gap-4 pb-8 font-sans text-soc-text">
      {/* Identity and verdict stay pinned; depth lives behind the tabs. */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-col gap-3 bg-soc-bg/95 px-1 pb-3 pt-1 backdrop-blur">
        <CaseSwitcher caseId={caseId} caseRecord={caseRecord} resumed={resumed} />

        <VerdictHero
          verdict={verdict}
          score={evaluation?.score}
          reason={
            data?.evaluation_error
              ? `No decision available: ${data.evaluation_error}`
              : evaluation?.reasons?.[0] || caseRecord?.reason
          }
          timestamp={formatTimestamp(caseRecord?.created_at)}
          transactionId={transaction?.txn_id}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Investigation sections" className="flex flex-wrap items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary ${
                  activeTab === tab.id
                    ? 'bg-soc-primary text-soc-onPrimary shadow'
                    : 'text-soc-muted hover:bg-soc-panel hover:text-soc-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
            {customer && (
              <span className="flex items-center gap-1.5 text-soc-muted">
                <User aria-hidden="true" className="h-3.5 w-3.5 text-soc-primary" />
                <span className="text-soc-text">
                  {customer.name || customer.full_name || customer.customer_id}
                </span>
                <span className="text-soc-dim">({customer.customer_id})</span>
              </span>
            )}
            {caseRecord?.amount != null && (
              <span className="font-semibold tabular-nums text-soc-text">
                {formatAmount(caseRecord.amount)}
              </span>
            )}
            <button
              type="button"
              onClick={downloadCertInReport}
              disabled={!transaction || !evaluation}
              className="inline-flex items-center gap-2 rounded-lg bg-soc-primary px-3.5 py-2 font-bold text-soc-onPrimary shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              <span>CERT-In PDF</span>
            </button>
          </div>
        </div>
      </div>

      {data?.evaluation_error && (
        <div
          role="status"
          className="rounded-lg border border-soc-warning/40 bg-soc-warning/10 px-4 py-3 text-xs text-soc-text"
        >
          This case has no live decision:{' '}
          <span className="font-mono">{data.evaluation_error}</span>. Panels that depend on a
          scored transaction show what is missing rather than a stand-in value.
        </div>
      )}

      {!transaction && !data?.evaluation_error && (
        <EmptyState
          title="No transaction linked to this case"
          description="The case record references a transaction that is not in the store, so transaction-level panels have nothing to show."
        />
      )}

      <Suspense fallback={<TabFallback />}>
        {TABS.filter((tab) => visitedTabs.has(tab.id)).map(({ id, Component }) => (
          <div key={id} hidden={id !== activeTab}>
            <Component {...tabContext} />
          </div>
        ))}
      </Suspense>
    </div>
  );
}
