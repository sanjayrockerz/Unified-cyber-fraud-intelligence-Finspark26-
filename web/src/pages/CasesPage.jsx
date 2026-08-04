import React, { useState } from 'react';
import { AlertTriangle, Clock3, ExternalLink, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/common/DataTable';
import Drawer from '../components/common/Drawer';
import PageHeader from '../components/common/PageHeader';
import StatStrip from '../components/common/StatStrip';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const severityTone = { CRITICAL: 'text-soc-danger', HIGH: 'text-soc-warning', MEDIUM: 'text-soc-info', LOW: 'text-soc-muted' };

function CaseDetail({ item, onInvestigate }) {
  if (!item) return null;
  return <div className="space-y-5"><div><p className={`font-mono text-xs font-semibold ${severityTone[item.severity] || 'text-soc-muted'}`}>{item.severity || 'UNCLASSIFIED'} · {item.status || 'UNASSIGNED'}</p><h3 className="mt-2 text-lg font-semibold text-soc-text">{item.case_id}</h3><p className="mt-2 text-sm leading-6 text-soc-muted">{item.reason || 'No analyst narrative has been recorded for this case.'}</p></div><dl className="grid gap-4 sm:grid-cols-2">{[['Risk score', item.score], ['Transaction', item.transaction_id], ['Customer', item.customer_id], ['Amount', currency.format(Number(item.amount || 0))], ['Created', item.created_at]].map(([label, value]) => <div key={label} className="border-b border-soc-border pb-3"><dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-soc-muted">{label}</dt><dd className="mt-1 font-mono text-xs text-soc-text">{value ?? '—'}</dd></div>)}</dl><button type="button" onClick={() => onInvestigate(item.case_id)} className="inline-flex items-center gap-2 bg-soc-primary px-3 py-2 text-xs font-semibold text-soc-onPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />Open investigation</button></div>;
}

export default function CasesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);

  const columns = [
    { key: 'case_id', label: 'Case' },
    { key: 'severity', label: 'Severity', render: (value) => <span className={`font-semibold ${severityTone[value] || 'text-soc-muted'}`}>{value || '—'}</span> },
    { key: 'status', label: 'Status' },
    { key: 'customer_id', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: (value) => currency.format(Number(value || 0)) },
    { key: 'created_at', label: 'Opened' },
  ];

  return <div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-8"><PageHeader title="Cases" description="Prioritize open fraud decisions before their investigation SLA expires." action={<button type="button" onClick={() => navigate('/operations')} className="inline-flex items-center gap-2 border border-soc-border bg-soc-panel px-3 py-2 text-xs font-medium text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><ShieldAlert aria-hidden="true" className="h-3.5 w-3.5 text-soc-danger" />Operations center</button>} /><StatStrip items={[{ label: 'Visible case queue', value: result?.total ?? '—', detail: 'Server-filtered case records', tone: 'danger', icon: AlertTriangle }, { label: 'Current filter', value: status || 'All', detail: 'Status applied to the queue', tone: 'info', icon: Clock3 }]} /><section><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold text-soc-text">Case queue</h2><p className="mt-1 text-xs text-soc-muted">Select a row to review decision context and continue into investigation.</p></div><div className="flex gap-2"><label className="sr-only" htmlFor="case-query">Search cases</label><input id="case-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases" className="h-9 border border-soc-border bg-soc-bg px-3 text-xs text-soc-text placeholder:text-soc-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary" /><select aria-label="Filter case status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 border border-soc-border bg-soc-bg px-3 text-xs text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><option value="">All statuses</option><option value="OPEN">Open</option><option value="TRIAGE">Triage</option></select></div></div><DataTable endpoint="/cases" columns={columns} query={query} filters={{ status }} onRowClick={setSelectedCase} onResult={setResult} emptyLabel="No cases match the current filters." /></section><Drawer isOpen={Boolean(selectedCase)} onClose={() => setSelectedCase(null)} title="Case decision"><CaseDetail item={selectedCase} onInvestigate={(caseId) => navigate(`/investigation/${caseId}`)} /></Drawer></div>;
}
