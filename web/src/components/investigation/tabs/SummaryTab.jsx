import React from 'react';

import NarrativeAIStoryteller from '../../runtime/NarrativeAIStoryteller';
import DigitalTwinBaseline from '../../fabric/DigitalTwinBaseline';
import SessionTrustPassportPanel from '../../trust/SessionTrustPassportPanel';
import EmptyState from '../../common/EmptyState';
import { formatAmount, formatTimestamp } from '../../../lib/verdict';

function Fact({ label, value }) {
  return (
    <div className="border-b border-soc-border pb-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-soc-muted">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-xs tabular-nums text-soc-text">{value ?? '—'}</dd>
    </div>
  );
}

export default function SummaryTab({ caseRecord, transaction, customer, evaluation }) {
  if (!transaction) {
    return (
      <EmptyState
        title="No transaction to summarise"
        description="This case has no linked transaction in the store."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-soc-border bg-soc-surface p-5">
        <h2 className="text-sm font-semibold text-soc-text">Case facts</h2>
        <p className="mt-1 text-xs text-soc-muted">{caseRecord?.reason}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Transaction" value={transaction.txn_id} />
          <Fact label="Amount" value={formatAmount(transaction.amount)} />
          <Fact label="Type" value={transaction.type} />
          <Fact label="Opened" value={formatTimestamp(caseRecord?.created_at)} />
          <Fact label="Sender account" value={transaction.nameOrig} />
          <Fact label="Beneficiary account" value={transaction.nameDest} />
          <Fact label="Mule cluster" value={transaction.dest_mule_cluster_id} />
          <Fact
            label="Cyber compromise in window"
            value={transaction.cyber_compromise_in_window ? 'Yes' : 'No'}
          />
        </dl>
      </section>

      {evaluation?.reasons?.length > 0 && (
        <section className="rounded-xl border border-soc-border bg-soc-surface p-5">
          <h2 className="text-sm font-semibold text-soc-text">Why the engine decided this</h2>
          <ul className="mt-3 space-y-2">
            {evaluation.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-xs leading-5 text-soc-muted">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-soc-primary" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {evaluation.model_used && (
            <p className="mt-3 font-mono text-[11px] text-soc-dim">
              Model: {evaluation.model_used} · status {evaluation.model_status}
            </p>
          )}
        </section>
      )}

      <NarrativeAIStoryteller activeTxn={transaction} evaluation={evaluation} />
      <DigitalTwinBaseline
        userId={customer?.customer_id || transaction.user_id}
        transaction={transaction}
      />
      <SessionTrustPassportPanel
        sessionId={evaluation?.session_id || transaction.session_id}
        activeTxn={transaction}
      />
    </div>
  );
}
