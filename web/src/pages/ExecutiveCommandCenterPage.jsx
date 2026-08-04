import React from 'react';
import { DollarSign, ShieldAlert, Cpu, Activity, TrendingUp, CheckCircle2, FileCheck2, ArrowUpRight } from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import PageContainer from '../components/layout/PageContainer';
import useResource from '../lib/useResource';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function ExecutiveCommandCenterPage() {
  const quantumResource = useResource('/quantum/posture', { refreshMs: 60000 });
  const analyticsResource = useResource('/analytics/summary?period=monthly', { refreshMs: 60000 });
  const quantumData = quantumResource.data?.data ?? quantumResource.data ?? null;
  const analyticsData = analyticsResource.data?.data ?? analyticsResource.data ?? null;
  const totals = analyticsData?.totals ?? {};
  const retry = () => { quantumResource.reload(); analyticsResource.reload(); };

  return (
    <PageContainer>
      <div className="flex flex-col gap-5 select-none font-mono">
        {(quantumResource.status === 'error' || analyticsResource.status === 'error') && (
          <div role="status" className="flex items-center justify-between rounded-lg border border-soc-warning/40 bg-soc-warning/5 px-4 py-3 text-xs text-soc-muted">
            <span>Service temporarily unavailable. Reconnecting automatically. Monitoring continues in the background.</span>
            <button type="button" onClick={retry} className="rounded border border-soc-border px-3 py-1 text-soc-text">Retry</button>
          </div>
        )}
        
        {/* Executive KPI Header Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Today's Prevented Loss" value={analyticsData ? `INR ${Number(totals.blocked_amount ?? 0).toLocaleString('en-IN')}` : 'Waiting for telemetry'} subtext="Backend blocked transaction total" icon={DollarSign} color="success" />
          <MetricCard title="Observed Transaction Value" value={analyticsData ? `INR ${Number(totals.amount ?? 0).toLocaleString('en-IN')}` : 'Waiting for telemetry'} subtext="Tenant-scoped backend amount" icon={TrendingUp} color="primary" />
          <MetricCard title="Decision Volume" value={analyticsData ? (totals.decisions ?? 0) : 'Waiting for telemetry'} subtext="Authoritative pipeline decisions" icon={Activity} color="warning" />
          <MetricCard title="Threat Telemetry" value={analyticsData ? (totals.threats ?? 0) : 'Waiting for telemetry'} subtext="Threat engine observations" icon={FileCheck2} color="quantum" />
        </div>

        {/* CISO Security Strategy Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Top Threat Vectors (7/12) */}
          <div className="lg:col-span-7 bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-soc-text uppercase tracking-wider border-b border-soc-border pb-2 flex items-center justify-between">
              <span>Top Attack Vectors Intercepted (Current Month)</span>
              <span className="text-[10px] text-soc-muted">Live Telemetry</span>
            </h3>

            <div className="space-y-3 text-xs">{!analyticsData?.threat_vectors?.length && <p className="text-soc-muted">Waiting for backend threat telemetry.</p>}{analyticsData?.threat_vectors?.slice(0, 5).map((vector, index) => <div key={vector.type} className="space-y-1"><div className="flex justify-between font-bold"><span>{index + 1}. {vector.type}</span><span className="text-soc-primary">{vector.percent?.toFixed(1) ?? '—'}%</span></div><div className="h-2 w-full overflow-hidden rounded bg-soc-bg"><div className="h-full rounded bg-soc-primary" style={{ width: `${vector.percent || 0}%` }} /></div></div>)}</div>
          </div>

          {/* Post-Quantum TLS Posture Card (5/12) */}
          <div className="lg:col-span-5 bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-soc-text uppercase tracking-wider border-b border-soc-border pb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-soc-quantum" />
              <span>Post-Quantum TLS Posture (HNDL Risk)</span>
            </h3>

            <div className="p-4 bg-soc-panel border border-soc-border rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-soc-muted">Vulnerable TLS Handshakes:</span>
                <strong className="text-soc-quantum">{quantumData?.vulnerable_percent == null ? 'Waiting for telemetry' : `${quantumData.vulnerable_percent}%`}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-soc-muted">HNDL Harvest Risk Status:</span>
                <strong className="text-soc-danger">{quantumData?.hndl_flag == null ? 'Waiting for telemetry' : quantumData.hndl_flag ? 'CRITICAL ALERT' : 'NORMAL'}</strong>
              </div>
              <p className="text-[11px] text-soc-muted leading-relaxed pt-1 border-t border-soc-border">
                {quantumData?.hndl_details || 'Waiting for quantum posture telemetry.'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
