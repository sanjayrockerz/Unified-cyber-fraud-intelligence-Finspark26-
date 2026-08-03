import React, { useEffect, useState } from 'react';
import { Download, FileCheck2, FileText } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reports`);
      if (!response.ok) throw new Error(`Reports unavailable (${response.status})`);
      const body = await response.json();
      setReports(body.reports || body.data?.reports || []);
      setError(null);
    } catch (exception) {
      setError(exception.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const download = async (report) => {
    const response = await fetch(`${API_BASE}/report/cert-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txn_id: report.txn_id,
        user_id: report.user_id,
        amount: report.amount,
        reasons: report.reasons || [],
        score: report.score,
      }),
    });
    if (!response.ok) throw new Error(`Report export failed (${response.status})`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `CERT-In_Report_${report.txn_id}.pdf`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck2 className="w-6 h-6 text-soc-primary" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">CERT-In Regulatory Incident Reports</h1>
            <span className="text-xs text-soc-muted">Tenant-scoped reports generated from backend incidents.</span>
          </div>
        </div>
        <button onClick={refresh} className="px-4 py-2 border border-soc-border text-soc-text rounded-lg text-xs font-mono">Refresh</button>
      </div>
      <div className="bg-soc-surface border border-soc-border rounded-xl p-4">
        <h3 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider border-b border-soc-border pb-2 mb-3">Incident Filings Queue</h3>
        {loading && <p className="text-sm text-soc-muted">Loading backend reports…</p>}
        {!loading && error && <p className="text-sm text-soc-danger">{error}</p>}
        {!loading && !error && reports.length === 0 && <p className="text-sm text-soc-muted">No active incident reports.</p>}
        <div className="space-y-2 font-mono text-xs">
          {reports.map((report) => (
            <div key={report.report_id} className="p-3 bg-soc-bg border border-soc-border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-soc-danger" /><div><div className="font-bold text-soc-text">{report.report_id}</div><div className="text-soc-muted text-[11px]">Transaction: {report.txn_id} · Amount: INR {Number(report.amount || 0).toLocaleString('en-IN')} · Score: {report.score ?? '—'}</div></div></div>
              <button onClick={() => download(report).catch((exception) => setError(exception.message))} className="px-3 py-1 bg-soc-panel border border-soc-border hover:border-soc-primary text-soc-text rounded text-xs"><Download className="inline w-3 h-3 mr-1" />Download PDF</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
