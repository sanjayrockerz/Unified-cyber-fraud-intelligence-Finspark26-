import React from 'react';
import { GitBranch, Sigma } from 'lucide-react';

import useResource from '../../lib/useResource';
import PanelState from '../common/PanelState';

/**
 * Feature attribution and the cyber-signal counterfactual, both computed by the
 * backend from the trained artifacts.
 *
 * Attribution is exact LightGBM TreeSHAP in log-odds, not an approximation and
 * not an illustrative list. The counterfactual re-scores the same transaction
 * with the cyber flag cleared, so the sentence shown is reproducible from
 * ml/explain.py -- including when the answer is "the decision does not change".
 */
export default function XAIWorkspace({ caseId }) {
  const { data, status, error, reload } = useResource(
    caseId ? `/cases/${encodeURIComponent(caseId)}/explain` : null,
  );

  const unavailable = data?.status === 'UNAVAILABLE';
  const features = data?.attribution?.features ?? [];
  const counterfactual = data?.counterfactual;
  const maxImpact = features.reduce((peak, item) => Math.max(peak, Math.abs(item.impact)), 0) || 1;

  return (
    <section className="overflow-hidden rounded-xl border border-soc-border bg-soc-panel shadow-lg">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-soc-border bg-soc-surface/50 p-3">
        <div className="flex items-center gap-2">
          <Sigma aria-hidden="true" className="h-4 w-4 text-soc-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-soc-text">
            Explainability
          </h3>
        </div>
        <span className="rounded border border-soc-border bg-soc-bg px-2 py-0.5 font-mono text-[10px] text-soc-muted">
          {data?.attribution?.method || 'TreeSHAP'} · log-odds
        </span>
      </header>

      <div className="p-4">
        <PanelState
          status={status}
          error={error}
          onRetry={reload}
          isEmpty={unavailable}
          loadingLabel="Computing feature attributions…"
          emptyTitle="Explanation unavailable"
          emptyDescription={
            data?.detail ||
            'The explainer could not run for this case. No illustrative attribution is shown in its place.'
          }
        >
          {() => (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-1 font-mono text-[10px] font-semibold uppercase text-soc-dim">
                  Feature contributions
                </h4>
                <p className="mb-3 text-[10px] text-soc-muted">
                  Red pushed this transaction toward fraud, green away from it. Base value{' '}
                  <span className="font-mono">{data?.attribution?.base_value}</span>.
                </p>
                <ul className="space-y-2">
                  {features.map((item) => {
                    const width = Math.max(6, (Math.abs(item.impact) / maxImpact) * 100);
                    const isPositive = item.impact > 0;
                    return (
                      <li key={item.feature} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-32 shrink-0 truncate font-mono text-soc-muted"
                          title={`${item.feature} = ${item.value}`}
                        >
                          {item.feature}
                        </span>
                        <span className="flex flex-1 items-center">
                          <span className="flex flex-1 justify-end">
                            {!isPositive && (
                              <span
                                className="h-1.5 rounded-l bg-soc-success"
                                style={{ width: `${width}%` }}
                              />
                            )}
                          </span>
                          <span className="mx-1 h-3 w-px bg-soc-border" />
                          <span className="flex-1">
                            {isPositive && (
                              <span
                                className="block h-1.5 rounded-r bg-soc-danger"
                                style={{ width: `${width}%` }}
                              />
                            )}
                          </span>
                        </span>
                        <span
                          className={`w-16 shrink-0 text-right font-mono tabular-nums ${
                            isPositive ? 'text-soc-danger' : 'text-soc-success'
                          }`}
                        >
                          {item.impact > 0 ? '+' : ''}
                          {item.impact.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {counterfactual && (
                <div className="border-t border-soc-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <h4 className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-soc-primary">
                    <GitBranch aria-hidden="true" className="h-3 w-3" />
                    Without the cyber signal
                  </h4>
                  <blockquote className="rounded-r border-l-2 border-soc-primary bg-soc-surface/40 py-2 pl-3 text-xs leading-relaxed text-soc-text">
                    {counterfactual.sentence}
                  </blockquote>

                  {counterfactual.status === 'EXECUTED' && (
                    <dl className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-[10px] uppercase text-soc-dim">Observed</dt>
                        <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums text-soc-text">
                          {counterfactual.factual_score} · {counterfactual.factual_verdict}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-soc-dim">Counterfactual</dt>
                        <dd
                          className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
                            counterfactual.decision_changed ? 'text-soc-success' : 'text-soc-muted'
                          }`}
                        >
                          {counterfactual.counterfactual_score} ·{' '}
                          {counterfactual.counterfactual_verdict}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              )}
            </div>
          )}
        </PanelState>
      </div>
    </section>
  );
}
