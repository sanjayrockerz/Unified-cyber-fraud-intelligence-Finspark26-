import React, { useMemo } from 'react';
import { Landmark, Network, Radio } from 'lucide-react';

import Neo4jGraphStudio from '../../graph/Neo4jGraphStudio';
import useResource from '../../../lib/useResource';
import PanelState from '../../common/PanelState';
import EmptyState from '../../common/EmptyState';
import { formatAmount, formatTimestamp, severityChip } from '../../../lib/verdict';

function formatEvidenceValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Build the threat graph from the entities the graph runtime actually returned
 * for this transaction. Every node id below comes from a real finding — nothing
 * is generated to fill the canvas out.
 */
function buildGraph(transaction, graph) {
  const nodes = new Map();
  const links = [];

  const addNode = (id, node) => {
    if (!id || nodes.has(id)) return;
    nodes.set(id, { id, name: id, ...node });
  };

  if (transaction?.nameOrig) {
    addNode(transaction.nameOrig, {
      group: 'account',
      val: 22,
      color: '#3B82F6',
      name: `Sender: ${transaction.nameOrig}`,
    });
  }
  if (transaction?.nameDest) {
    addNode(transaction.nameDest, {
      group: 'account',
      val: 30,
      color: '#EF4444',
      isMule: true,
      name: `Beneficiary: ${transaction.nameDest}`,
    });
  }
  if (transaction?.nameOrig && transaction?.nameDest) {
    links.push({ source: transaction.nameOrig, target: transaction.nameDest, label: 'TRANSFER' });
  }

  for (const finding of graph?.findings ?? []) {
    const [beneficiary, ...senders] = finding.entities ?? [];
    if (!beneficiary) continue;
    addNode(beneficiary, {
      group: 'account',
      val: 28,
      color: '#EF4444',
      isMule: true,
      name: `Beneficiary: ${beneficiary}`,
    });
    for (const sender of senders) {
      addNode(sender, {
        group: 'account',
        val: 14,
        color: '#F59E0B',
        name: `Linked sender: ${sender}`,
      });
      links.push({ source: sender, target: beneficiary, label: finding.finding_type });
    }
  }

  if (transaction?.dest_mule_cluster_id && nodes.has(transaction.nameDest)) {
    addNode(transaction.dest_mule_cluster_id, {
      group: 'mule_ring',
      val: 34,
      color: '#DC2626',
      isMule: true,
      name: `Cluster: ${transaction.dest_mule_cluster_id}`,
    });
    links.push({
      source: transaction.nameDest,
      target: transaction.dest_mule_cluster_id,
      label: 'belongs_to',
    });
  }

  return { nodes: [...nodes.values()], links };
}

export default function EvidenceTab({ transaction, evaluation }) {
  const graphData = useMemo(
    () => buildGraph(transaction, evaluation?.graph),
    [transaction, evaluation],
  );

  const beneficiary = transaction?.nameDest;
  const ledger = useResource(
    beneficiary ? `/transactions?q=${encodeURIComponent(beneficiary)}&page_size=25&sort=-timestamp` : null,
  );
  const ledgerRows = ledger.data?.items ?? [];
  const threats = evaluation?.threats ?? [];

  if (!transaction) {
    return (
      <EmptyState
        title="No evidence to show"
        description="This case has no linked transaction, so there is no cyber, graph or ledger evidence to correlate."
      />
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="flex min-w-0 flex-col rounded-xl border border-soc-border bg-soc-surface p-3 lg:col-span-3">
        <header className="mb-3 flex items-center justify-between border-b border-soc-border pb-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-soc-text">
            <Radio aria-hidden="true" className="h-4 w-4 text-soc-danger" />
            Cyber evidence
          </h3>
          <span className="font-mono text-[10px] text-soc-muted">{threats.length}</span>
        </header>
        <div className="max-h-[460px] flex-1 space-y-2 overflow-y-auto pr-1">
          {threats.length === 0 ? (
            <EmptyState
              title="No threats detected"
              description="The threat engine returned no findings for this transaction."
            />
          ) : (
            threats.map((threat) => (
              <article
                key={threat.threat_id}
                className="space-y-1.5 rounded-lg border border-soc-border bg-soc-panel p-2.5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      severityChip[threat.severity] || severityChip.LOW
                    }`}
                  >
                    {threat.severity}
                  </span>
                  <span className="font-mono text-[10px] text-soc-dim">
                    {threat.threat_category}
                  </span>
                </div>
                <h4 className="text-[11px] font-semibold leading-4 text-soc-text">
                  {threat.threat_name}
                </h4>
                {/* Threat engines emit two evidence shapes: rule threats use
                    {field, observed_value}, graph findings use arbitrary keys.
                    Render whichever arrived rather than printing "undefined". */}
                <ul className="space-y-0.5">
                  {(threat.evidence ?? []).flatMap((item, index) =>
                    item.field !== undefined
                      ? [
                          <li key={index} className="font-mono text-[10px] text-soc-muted">
                            {item.field}: {formatEvidenceValue(item.observed_value)}
                          </li>,
                        ]
                      : Object.entries(item).map(([key, value]) => (
                          <li key={`${index}-${key}`} className="font-mono text-[10px] text-soc-muted">
                            {key}: {formatEvidenceValue(value)}
                          </li>
                        )),
                  )}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="flex min-w-0 flex-col lg:col-span-6">
        <div className="h-[520px] overflow-hidden rounded-xl border border-soc-border bg-soc-surface">
          <Neo4jGraphStudio
            graphData={graphData}
            emptyMessage={`The graph runtime returned no linked entities for ${transaction.nameDest || 'this beneficiary'}.`}
          />
        </div>
        {evaluation?.graph?.backend && (
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-soc-dim">
            <Network aria-hidden="true" className="h-3 w-3" />
            Backend: {evaluation.graph.backend}
            {evaluation.graph.error_code ? ` · ${evaluation.graph.error_code}` : ''}
          </p>
        )}
      </section>

      <section className="flex min-w-0 flex-col rounded-xl border border-soc-border bg-soc-surface p-3 lg:col-span-3">
        <header className="mb-3 flex items-center justify-between border-b border-soc-border pb-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-soc-text">
            <Landmark aria-hidden="true" className="h-4 w-4 text-soc-primary" />
            Ledger activity
          </h3>
          <span className="font-mono text-[10px] text-soc-muted">{ledger.data?.total ?? 0}</span>
        </header>
        <p className="mb-2 text-[10px] leading-4 text-soc-muted">
          Stored transfers involving {beneficiary}.
        </p>
        <div className="max-h-[440px] flex-1 overflow-y-auto pr-1">
          <PanelState
            status={ledger.status}
            error={ledger.error}
            onRetry={ledger.reload}
            isEmpty={ledgerRows.length === 0}
            loadingLabel="Loading ledger…"
            emptyTitle="No related transfers"
            emptyDescription="No other stored transaction involves this beneficiary."
          >
            {() => (
              <ul className="space-y-1.5">
                {ledgerRows.map((row) => (
                  <li
                    key={row.txn_id}
                    className={`rounded border p-2 font-mono text-[10px] ${
                      row.txn_id === transaction.txn_id
                        ? 'border-soc-primary bg-soc-primary/10'
                        : 'border-soc-border bg-soc-panel'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-soc-text">{row.txn_id}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-soc-danger">
                        {formatAmount(row.amount)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-soc-muted">
                      {row.nameOrig} → {row.nameDest}
                    </p>
                    <p className="mt-0.5 text-soc-dim">{formatTimestamp(row.timestamp)}</p>
                  </li>
                ))}
              </ul>
            )}
          </PanelState>
        </div>
      </section>
    </div>
  );
}
