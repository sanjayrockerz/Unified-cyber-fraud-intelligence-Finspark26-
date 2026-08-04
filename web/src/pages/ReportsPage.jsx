import React, { useEffect, useRef, useState } from 'react';
import { Download, FileCheck2, FileText } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');
const REPORT_CACHE_KEY = 'fuzen.reports.cache';

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(REPORT_CACHE_KEY) || '[]'); } catch { return []; }
}

export default function ReportsPage() {
  const [reports, setReports] = useState(readCache);
  const [loading, setLoading] = useState(reports.length === 0);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);

  const refresh = async () => {
    setLoading((current) => reports.length === 0 && current);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${API_BASE}/reports`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Report service returned HTTP ${response.status}`);
      const body = await response.json();
      const nextReports = body.reports || body.items || body.data?.reports || body.data?.items || [];
      if (!mounted.current) return;
      setReports(nextReports);
      sessionStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(nextReports));
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (exception) {
      if (mounted.current) setError(exception.name === 'AbortError' ? 'Report service timed out.' : exception.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => { mounted.current = true; refresh(); const timer = setInterval(refresh, 30000); return () => { mounted.current = false; clearInterval(timer); }; }, []);

  const download = async (report) => {
    const response = await fetch(`${API_BASE}/report/cert-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txn_id: report.txn_id, user_id: report.user_id, amount: report.amount, reasons: report.reasons || [], score: report.score }) });
    if (!response.ok) throw new Error(`Report export failed (HTTP ${response.status})`);
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `CERT-In_Report_${report.txn_id}.pdf`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="flex max-w-[1600px] flex-col gap-5 mx-auto select-none">
    <div className="flex items-center justify-between rounded-xl border border-soc-border bg-soc-surface p-4"><div className="flex items-center gap-3"><FileCheck2 className="h-6 w-6 text-soc-primary" /><div><h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">CERT-In Regulatory Incident Reports</h1><span className="text-xs text-soc-muted">Tenant-scoped reports generated from backend incidents.</span></div></div><button onClick={refresh} className="rounded-lg border border-soc-border px-4 py-2 text-xs font-mono text-soc-text">Refresh</button></div>
    <div className="rounded-xl border border-soc-border bg-soc-surface p-4"><h3 className="mb-3 border-b border-soc-border pb-2 text-xs font-mono font-bold uppercase tracking-wider text-soc-text">Incident Filings Queue</h3>
      {loading && <p className="text-sm text-soc-muted">Generating report queue…</p>}
      {!loading && error && <div role="status" className="mb-3 flex items-center justify-between rounded-lg border border-soc-warning/40 bg-soc-warning/5 p-3 text-sm text-soc-muted"><span>Service temporarily unavailable. Reconnecting automatically. {lastUpdated ? `Last successful update: ${new Date(lastUpdated).toLocaleString()}` : 'No successful update yet.'}</span><button onClick={refresh} className="ml-3 rounded border border-soc-border px-3 py-1 text-xs text-soc-text">Retry</button></div>}
      {!loading && !error && reports.length === 0 && <p className="text-sm text-soc-muted">No investigations yet.</p>}
      <div className="space-y-2 font-mono text-xs">{reports.map((report) => <div key={report.report_id} className="flex items-center justify-between rounded-lg border border-soc-border bg-soc-bg p-3"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-soc-danger" /><div><div className="font-bold text-soc-text">{report.report_id}</div><div className="text-[11px] text-soc-muted">Transaction: {report.txn_id} · Amount: INR {Number(report.amount || 0).toLocaleString('en-IN')} · Score: {report.score ?? '—'}</div></div></div><button onClick={() => download(report).catch(() => setError('Report export is temporarily unavailable. Retry when the service reconnects.'))} className="rounded border border-soc-border bg-soc-panel px-3 py-1 text-xs text-soc-text hover:border-soc-primary"><Download className="mr-1 inline h-3 w-3" />Download PDF</button></div>)}</div>
    </div>
  </div>;
}
