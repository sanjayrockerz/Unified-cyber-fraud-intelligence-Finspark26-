import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History } from 'lucide-react';

import useResource from '../../lib/useResource';
import PanelState from '../common/PanelState';
import { formatAmount, formatTimestamp, severityChip } from '../../lib/verdict';

/**
 * Precedents drawn from the case store, ranked by how they actually overlap
 * with this case (shared mule cluster, shared beneficiary, same customer, same
 * severity). The backend states the basis for every match. Nothing about
 * outcome or recovered value is claimed, because the store does not record it.
 */
export default function SimilarIncidentSearch({ caseId }) {
  const navigate = useNavigate();
  const { data, status, error, reload } = useResource(
    caseId ? `/cases/${encodeURIComponent(caseId)}/similar` : null,
  );

  const matches = data?.items ?? [];

  return (
    <section className="rounded-xl border border-soc-border bg-soc-surface p-4 shadow-lg">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-soc-border pb-3">
        <div className="flex items-center gap-2">
          <History aria-hidden="true" className="h-4 w-4 text-soc-primary" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-soc-text">
              Similar cases
            </h3>
            <p className="text-[11px] text-soc-muted">
              Precedents that share entities with this case
            </p>
          </div>
        </div>
        {status === 'ready' && (
          <span className="font-mono text-[10px] text-soc-dim">
            {matches.length} of {data?.compared_against ?? 0} compared
          </span>
        )}
      </header>

      <PanelState
        status={status}
        error={error}
        onRetry={reload}
        isEmpty={matches.length === 0}
        loadingLabel="Searching the case store…"
        emptyTitle="No comparable cases"
        emptyDescription="No other case in the store shares a beneficiary, mule cluster, customer or severity with this one."
      >
        {() => (
          <ul className="space-y-2">
            {matches.map((match) => (
              <li key={match.case_id}>
                <button
                  type="button"
                  onClick={() => navigate(`/investigation/${match.case_id}`)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-soc-border bg-soc-panel p-3 text-left transition-colors hover:border-soc-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-soc-text">
                        {match.case_id}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                          severityChip[match.severity] || severityChip.LOW
                        }`}
                      >
                        {match.severity}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-soc-muted">
                        {match.status}
                      </span>
                    </div>
                    <p className="text-[11px] leading-5 text-soc-muted">
                      {match.match_basis.join(' · ')}
                    </p>
                    <p className="font-mono text-[10px] text-soc-dim">
                      Score {match.score} · {formatTimestamp(match.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm font-semibold tabular-nums text-soc-text">
                      {formatAmount(match.amount)}
                    </span>
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
