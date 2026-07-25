import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw, ShieldAlert, Sparkles, TimerReset } from 'lucide-react';
import { authenticatedWebSocketUrl } from '../../platformAuth';
import DataTable from '../common/DataTable';
import Drawer from '../common/Drawer';
import LiveFeed from '../common/LiveFeed';
import PageHeader from '../common/PageHeader';
import StatStrip from '../common/StatStrip';
import VerdictHero from '../common/VerdictHero';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');
const WS_BASE = API_BASE.replace(/^http/, 'ws');
const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const severityTone = { CRITICAL: 'text-soc-danger', HIGH: 'text-soc-danger', MEDIUM: 'text-soc-warning', LOW: 'text-soc-info' };

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function decisionForThreat(threat) {
  const action = String(threat?.recommended_action || threat?.action || 'ALLOW').toUpperCase();
  if (action.includes('BLOCK')) return 'BLOCK';
  if (action.includes('CHALLENGE') || action.includes('REVIEW')) return 'CHALLENGE';
  return 'ALLOW';
}

function TransactionDetail({ transaction }) {
  if (!transaction) return null;
  const fields = [
    ['Transaction ID', transaction.txn_id], ['Timestamp', transaction.timestamp], ['Customer', transaction.user_id],
    ['Origin account', transaction.nameOrig], ['Destination account', transaction.nameDest], ['Amount', currency.format(Number(transaction.amount || 0))],
    ['Channel', transaction.channel], ['Type', transaction.type], ['Cyber correlation', transaction.cyber_compromise_in_window ? 'Present' : 'Not present'],
  ];
  return <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="border-b border-soc-border pb-3"><dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-soc-muted">{label}</dt><dd className="mt-1 break-words font-mono text-xs text-soc-text">{value ?? '—'}</dd></div>)}</dl>;
}

export default function ThreatIntelligenceDashboard() {
  const [threats, setThreats] = useState([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableQuery, setTableQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  async function fetchThreats() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/threats`);
      if (response.ok) {
        const data = await response.json();
        setThreats(data.threats || []);
      }
    } catch {
      setThreats([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchThreats();
    let socket;
    let reconnectTimer;
    let closed = false;

    function connect() {
      try {
        socket = new WebSocket(authenticatedWebSocketUrl(`${WS_BASE}/ws/stream`));
        socket.onopen = () => setStreamConnected(true);
        socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.msg_type === 'pipeline_decision' || message.msg_type === 'cyber_event') fetchThreats();
        };
        socket.onclose = () => {
          setStreamConnected(false);
          if (!closed) reconnectTimer = window.setTimeout(connect, 2000);
        };
        socket.onerror = () => socket.close();
      } catch {
        setStreamConnected(false);
      }
    }

    connect();
    return () => {
      closed = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const overview = useMemo(() => {
    const currentThreat = [...threats].sort((left, right) => (severityWeight[right.severity] || 0) - (severityWeight[left.severity] || 0))[0];
    const activeCount = threats.filter((threat) => threat.status === 'ACTIVE').length;
    const criticalCount = threats.filter((threat) => ['CRITICAL', 'HIGH'].includes(threat.severity)).length;
    const latencies = threats.map((threat) => Number(threat.detection_latency_ms)).filter(Number.isFinite);
    const confidences = threats.map((threat) => Number(threat.confidence)).filter(Number.isFinite);
    return {
      currentThreat,
      activeCount,
      criticalCount,
      averageLatency: latencies.length ? `${Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)} ms` : '—',
      averageConfidence: confidences.length ? `${(confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(1)}%` : '—',
    };
  }, [threats]);

  const transactionColumns = [
    { key: 'timestamp', label: 'Time' },
    { key: 'user_id', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: (value) => currency.format(Number(value || 0)) },
    { key: 'type', label: 'Type' },
    { key: 'cyber_compromise_in_window', label: 'Verdict', sortable: false, render: (value) => <span className={value ? 'inline-flex items-center gap-1 font-semibold text-soc-danger' : 'inline-flex items-center gap-1 font-semibold text-soc-success'}>{value ? <><ShieldAlert className="h-3.5 w-3.5" />BLOCK</> : <><Activity className="h-3.5 w-3.5" />ALLOW</>}</span> },
  ];

  const latestDecision = overview.currentThreat;
  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-6 pb-8">
      <PageHeader
        title="Cyber Threat Intelligence"
        description="Fuse cyber evidence with transaction risk before money leaves the bank."
        action={<button type="button" onClick={fetchThreats} className="inline-flex items-center gap-2 border border-soc-border bg-soc-panel px-3 py-2 text-xs font-medium text-soc-text transition-colors hover:border-soc-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>}
      />

      <VerdictHero
        verdict={decisionForThreat(latestDecision)}
        score={latestDecision?.confidence}
        reason={latestDecision?.evidence?.[0] || latestDecision?.confidence_explanation || 'Awaiting the next evaluated decision from the authenticated pipeline.'}
        timestamp={latestDecision?.timestamp}
        transactionId={latestDecision?.threat_id}
      />

      <StatStrip items={[
        { label: 'Active threats', value: overview.activeCount, detail: 'Open detections in the current stream', tone: 'danger', icon: ShieldAlert },
        { label: 'Critical and high', value: overview.criticalCount, detail: 'Decisions needing analyst attention', tone: 'warning', icon: AlertTriangle },
        { label: 'Detection latency', value: overview.averageLatency, detail: 'Measured event-to-decision time', tone: 'success', icon: TimerReset },
        { label: 'Engine confidence', value: overview.averageConfidence, detail: 'Average across current detections', tone: 'info', icon: Sparkles },
      ]} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-semibold text-soc-text">Live SIEM feed</h2><p className="mt-1 text-xs text-soc-muted">Bounded to the latest 500 events.</p></div><span className={`inline-flex items-center gap-2 text-xs ${streamConnected ? 'text-soc-success' : 'text-soc-warning'}`}><span className={`h-2 w-2 rounded-full ${streamConnected ? 'bg-soc-success' : 'bg-soc-warning'}`} />{streamConnected ? 'Live' : 'Reconnecting'}</span></div>
          <LiveFeed items={threats} title="SIEM events" renderItem={(threat) => <article className="grid gap-2 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><span className={`text-xs font-semibold ${severityTone[threat.severity] || 'text-soc-info'}`}>{threat.severity || 'INFO'}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-soc-text">{threat.threat_name || 'Pipeline event'}</p><p className="mt-1 truncate text-xs text-soc-muted">{threat.evidence?.[0] || threat.detection_source || 'Evidence pending'}</p></div><time className="font-mono text-[11px] text-soc-muted">{threat.timestamp || '—'}</time></article>} />
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold text-soc-text">Transaction ledger</h2><p className="mt-1 text-xs text-soc-muted">Server-paginated decisions with inspectable evidence.</p></div><label className="relative block"><span className="sr-only">Search transactions</span><input value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} placeholder="Search ledger" className="h-9 border border-soc-border bg-soc-bg px-3 text-xs text-soc-text placeholder:text-soc-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary" /></label></div>
          <DataTable endpoint="/transactions" columns={transactionColumns} query={tableQuery} onRowClick={setSelectedTransaction} emptyLabel="No transactions are available. Generate a synthetic universe or enable the explicit demo-scale seed." />
        </section>
      </div>

      <Drawer isOpen={Boolean(selectedTransaction)} onClose={() => setSelectedTransaction(null)} title="Transaction evidence"><TransactionDetail transaction={selectedTransaction} /></Drawer>
    </div>
  );
}
