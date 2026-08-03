import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldAlert } from 'lucide-react';

import useResource from '../../lib/useResource';
import PanelState from '../common/PanelState';
import {
  compareBySeverity,
  formatAmount,
  formatTimestamp,
  severityChip,
} from '../../lib/verdict';

const QUEUE_PATH = '/cases?page_size=25&sort=-created_at';

/**
 * The queue an analyst chooses from when no case is in context.
 *
 * This is the deliberate answer to "why is this case open?" -- with no history
 * to resume, the workspace opens nothing and asks. Real rows from /cases only.
 */
export default function InvestigationQueuePicker({
  title = 'Choose an investigation',
  description = 'No case is open. Pick one from the queue below, or open a case from the Cases page.',
  onSelect,
}) {
  const navigate = useNavigate();
  const { data, status, error, reload } = useResource(QUEUE_PATH);

  const openCase = (nextCaseId) => {
    navigate(`/investigation/${nextCaseId}`);
    onSelect?.(nextCaseId);
  };

  const cases = [...(data?.items ?? [])].sort(compareBySeverity);

  return (
    <section aria-label="Open investigation queue" className="flex flex-col gap-4">
      <header>
        <div className="flex items-center gap-2">
          <ShieldAlert aria-hidden="true" className="h-4 w-4 text-soc-primary" />
          <h2 className="text-base font-semibold text-soc-text">{title}</h2>
        </div>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-soc-muted">{description}</p>
        {status === 'ready' && (
          <p className="mt-1 font-mono text-[11px] text-soc-dim">
            {data?.total ?? cases.length} case{(data?.total ?? cases.length) === 1 ? '' : 's'} in
            the queue · sorted by severity, then score
          </p>
        )}
      </header>

      <PanelState
        status={status}
        error={error}
        onRetry={reload}
        isEmpty={cases.length === 0}
        loadingLabel="Loading the case queue…"
        emptyTitle="No cases in the queue"
        emptyDescription="Nothing is open for investigation right now. Operations Center shows decisions as they are made."
      >
        {() => (
          <ul className="divide-y divide-soc-border overflow-hidden rounded-lg border border-soc-border bg-soc-surface">
            {cases.map((item) => (
              <li key={item.case_id}>
                <button
                  type="button"
                  onClick={() => openCase(item.case_id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-soc-panel/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-soc-primary"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-soc-text">
                        {item.case_id}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          severityChip[item.severity] || severityChip.LOW
                        }`}
                      >
                        {item.severity || 'UNCLASSIFIED'}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-soc-muted">
                        {item.status || 'UNASSIGNED'}
                      </span>
                    </div>
                    <p className="mt-1 max-w-xl truncate text-xs text-soc-muted">{item.reason}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums text-soc-text">
                        {formatAmount(item.amount)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-soc-dim">
                        Score {item.score} · {formatTimestamp(item.created_at)}
                      </p>
                    </div>
                    <ArrowRight aria-hidden="true" className="h-4 w-4 text-soc-primary" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PanelState>
    </section>
  );
}
