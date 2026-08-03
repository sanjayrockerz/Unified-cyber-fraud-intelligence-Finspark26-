import React from 'react';
import { DollarSign, Layers, Share2, ShieldAlert, Smartphone, Users } from 'lucide-react';

import useResource from '../../lib/useResource';
import PanelState from '../common/PanelState';
import { formatAmount } from '../../lib/verdict';

/**
 * Secondary exposure, counted from the transaction store.
 *
 * Every figure here is an exact count over stored records that share this
 * case's beneficiary account or mule cluster -- not a projection. The panel
 * shows what each number was counted from so the figure can be checked.
 */
export default function BlastRadiusAnalysis({ caseId }) {
  const { data, status, error, reload } = useResource(
    caseId ? `/cases/${encodeURIComponent(caseId)}/blast-radius` : null,
  );

  const unavailable = data?.status === 'UNAVAILABLE';

  const metrics = data
    ? [
        {
          label: 'Impacted customers',
          value: data.impacted_customers?.count ?? 0,
          detail: 'Distinct senders into this beneficiary or cluster',
          tone: 'text-soc-danger',
          icon: Users,
        },
        {
          label: 'Total exposure',
          value: formatAmount(data.total_exposure),
          detail: `Sum over ${data.derived_from?.linked_transactions ?? 0} linked transactions`,
          tone: 'text-soc-warning',
          icon: DollarSign,
        },
        {
          label: 'Linked accounts',
          value: data.linked_accounts?.count ?? 0,
          detail: 'Distinct beneficiary accounts in the cluster',
          tone: 'text-soc-primary',
          icon: Share2,
        },
        {
          label: 'Cyber-preceded',
          value: data.cyber_preceded_transactions ?? 0,
          detail: 'Linked transfers with a compromise in window',
          tone: 'text-soc-quantum',
          icon: Layers,
        },
      ]
    : [];

  return (
    <section className="rounded-xl border border-soc-border bg-soc-surface p-4 shadow-lg">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-soc-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert aria-hidden="true" className="h-4 w-4 text-soc-warning" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-soc-text">
              Blast radius
            </h3>
            <p className="text-[11px] text-soc-muted">
              Secondary exposure counted from stored transactions
            </p>
          </div>
        </div>
        {data?.derived_from?.mule_cluster && (
          <span className="rounded border border-soc-border bg-soc-panel px-2 py-0.5 font-mono text-[10px] text-soc-muted">
            {data.derived_from.mule_cluster}
          </span>
        )}
      </header>

      <PanelState
        status={status}
        error={error}
        onRetry={reload}
        isEmpty={unavailable}
        loadingLabel="Counting linked transactions…"
        emptyTitle="Blast radius unavailable"
        emptyDescription="This case has no stored transaction, so linked exposure cannot be counted."
      >
        {() => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-soc-border bg-soc-panel p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase text-soc-dim">
                        {metric.label}
                      </span>
                      <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${metric.tone}`} />
                    </div>
                    <p
                      className={`mt-1 font-mono text-lg font-bold tabular-nums ${metric.tone}`}
                    >
                      {metric.value}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-soc-muted">{metric.detail}</p>
                  </div>
                );
              })}
            </div>

            {data.shared_devices?.count > 0 && (
              <div className="rounded-lg border border-soc-border bg-soc-panel p-3">
                <div className="flex items-center gap-2">
                  <Smartphone aria-hidden="true" className="h-3.5 w-3.5 text-soc-danger" />
                  <span className="text-[10px] font-semibold uppercase text-soc-dim">
                    Shared devices across impacted customers
                  </span>
                </div>
                <ul className="mt-2 space-y-1 font-mono text-[11px] text-soc-text">
                  {data.shared_devices.devices.map((device) => (
                    <li key={device.device_id}>
                      {device.device_id} — {device.customer_ids.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-soc-dim">
                Propagation chain
              </p>
              <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {(data.propagation_chain ?? []).map((step) => (
                  <li
                    key={step.step}
                    className="rounded-lg border border-soc-border bg-soc-panel p-2.5"
                  >
                    <span className="block text-[10px] text-soc-dim">{step.step}</span>
                    <span className="mt-0.5 block truncate font-mono text-xs font-bold text-soc-text">
                      {step.entity ?? '—'}
                    </span>
                    <span className="mt-1 block text-[10px] text-soc-muted">{step.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </PanelState>
    </section>
  );
}
