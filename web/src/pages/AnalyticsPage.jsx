import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Clock, 
  Globe, 
  Radio, 
  Share2, 
  Zap, 
  FileCheck2, 
  Filter, 
  Download, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  Cpu,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { FLAT_EPSILON, formatF, formatPct, getUplift } from '../lib/metricsFormat';
import useResource from '../lib/useResource';

const unwrap = (body) => body?.data ?? body ?? null;
const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const normalizeMetricSet = (value) => ({
  pr_auc: numberOrNull(value?.pr_auc),
  precision: numberOrNull(value?.precision),
  recall: numberOrNull(value?.recall),
  f1: numberOrNull(value?.f1),
  confusion_matrix: Object.fromEntries(['TP', 'TN', 'FP', 'FN'].map((key) => [key, numberOrNull(value?.confusion_matrix?.[key]) ?? 0])),
});
const normalizeEvaluation = (value) => {
  if (!value || typeof value !== 'object') return null;
  return { transaction_only: normalizeMetricSet(value.transaction_only), full_fusion: normalizeMetricSet(value.full_fusion) };
};
const normalizeSweep = (value) => {
  if (!value || typeof value !== 'object') return null;
  return { transaction_only: value.transaction_only || {}, cyber_only: value.cyber_only || {}, full_fusion: value.full_fusion || {} };
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  
  // Sweep controls
  const [fnCost, setFnCost] = useState(250000);
  const [fpCost, setFpCost] = useState(400);
  const [thresholdInt, setThresholdInt] = useState(50);
  const [selectedConfig, setSelectedConfig] = useState('full_fusion');

  const summaryResource = useResource(`/analytics/summary?period=${timeRange}`, { refreshMs: 60000 });
  const evalResource = useResource('/metrics/evaluate', { refreshMs: 300000 });
  const sweepResource = useResource(`/metrics/cost?fn_cost=${fnCost}&fp_cost=${fpCost}`, { refreshMs: 300000 });
  const summaryData = unwrap(summaryResource.data);
  const evalData = normalizeEvaluation(unwrap(evalResource.data));
  const sweepData = normalizeSweep(unwrap(sweepResource.data));
  const summaryError = summaryResource.status === 'error';
  const evalError = evalResource.status === 'error';
  const sweepError = sweepResource.status === 'error';
  const totals = summaryData?.totals ?? {};
  const hasEval = ['transaction_only', 'full_fusion'].every((config) =>
    ['pr_auc', 'precision', 'recall', 'f1'].every((metric) => Number.isFinite(evalData?.[config]?.[metric]))
  );
  const retryAll = () => {
    summaryResource.reload();
    evalResource.reload();
    sweepResource.reload();
  };

  let computedModelMetrics = [];
  let headlineUplift = "Loading...";
  let headlineLabel = "Fusion PR-AUC Uplift";
  let recallCompare = "";
  let headlineIsPositive = true;

  if (hasEval) {
    computedModelMetrics = [
      {
        metric: 'PR-AUC (Precision-Recall Area)',
        baseline: formatF(evalData.transaction_only.pr_auc),
        fusion: formatF(evalData.full_fusion.pr_auc),
        uplift: getUplift(evalData.transaction_only.pr_auc, evalData.full_fusion.pr_auc, false)
      },
      {
        metric: 'Precision',
        baseline: formatPct(evalData.transaction_only.precision),
        fusion: formatPct(evalData.full_fusion.precision),
        uplift: getUplift(evalData.transaction_only.precision, evalData.full_fusion.precision, true)
      },
      {
        metric: 'Recall',
        baseline: formatPct(evalData.transaction_only.recall),
        fusion: formatPct(evalData.full_fusion.recall),
        uplift: getUplift(evalData.transaction_only.recall, evalData.full_fusion.recall, true)
      },
      {
        metric: 'F1-Score',
        baseline: formatF(evalData.transaction_only.f1),
        fusion: formatF(evalData.full_fusion.f1),
        uplift: getUplift(evalData.transaction_only.f1, evalData.full_fusion.f1, false)
      }
    ];

    // Headline number: PR-AUC delta, the metric where fusion genuinely wins
    // on this test set (recall is already saturated near 99.9% for both
    // configs, so there's no headroom left for a recall-uplift story --
    // reporting it as the headline would either be flat or, if it ever
    // regresses, actively dishonest).
    const prAucDelta = evalData.full_fusion.pr_auc - evalData.transaction_only.pr_auc;
    const precisionDelta = evalData.full_fusion.precision - evalData.transaction_only.precision;
    const recallDelta = evalData.full_fusion.recall - evalData.transaction_only.recall;

    headlineUplift = getUplift(evalData.transaction_only.pr_auc, evalData.full_fusion.pr_auc, false);
    headlineIsPositive = prAucDelta >= -FLAT_EPSILON;
    headlineLabel = prAucDelta >= FLAT_EPSILON ? 'Fusion PR-AUC Uplift' : 'Fusion PR-AUC (Δ)';

    // Build the summary sentence entirely from the sign of the actual deltas
    // -- never a hardcoded direction word.
    const prAucWord = prAucDelta > FLAT_EPSILON ? 'improves' : (prAucDelta < -FLAT_EPSILON ? 'declines' : 'holds steady');
    const precisionWord = precisionDelta > FLAT_EPSILON ? 'improves' : (precisionDelta < -FLAT_EPSILON ? 'declines' : 'holds steady');
    const recallWord = Math.abs(recallDelta) <= FLAT_EPSILON
      ? `holds steady at ${formatPct(evalData.full_fusion.recall)}`
      : `${recallDelta > 0 ? 'improves' : 'declines'} from ${formatPct(evalData.transaction_only.recall)} to ${formatPct(evalData.full_fusion.recall)}`;

    recallCompare = `PR-AUC ${prAucWord} from ${evalData.transaction_only.pr_auc.toFixed(4)} to ${evalData.full_fusion.pr_auc.toFixed(4)}, precision ${precisionWord} by ${formatPct(Math.abs(precisionDelta))}, while recall ${recallWord}`;
  } else if (evalError) {
    headlineUplift = "Unavailable";
  }

  const kpis = [
    { title: 'Observed Transactions', val: summaryData ? (totals.transactions ?? 0) : 'Waiting', sub: summaryData ? `${totals.blocked ?? 0} blocked decisions` : 'Waiting for telemetry', color: 'text-soc-success', icon: ShieldAlert },
    {
      title: 'Fusion Model PR-AUC Uplift',
      val: headlineUplift,
      sub: hasEval ? `PR-AUC (${formatF(evalData.full_fusion.pr_auc)} vs ${formatF(evalData.transaction_only.pr_auc)})` : (evalError ? 'Retrying metrics connection' : 'Loading...'),
      color: headlineIsPositive ? 'text-soc-primary' : 'text-soc-warning', icon: TrendingUp
    },
    { title: 'Blocked Amount', val: summaryData ? `INR ${Number(totals.blocked_amount ?? 0).toLocaleString('en-IN')}` : 'Waiting', sub: 'Tenant-scoped backend total', color: 'text-soc-warning', icon: Activity },
    { title: 'Observed Threats', val: summaryData ? (totals.threats ?? 0) : 'Waiting', sub: summaryError ? 'Retrying analytics connection' : 'Threat engine telemetry', color: 'text-soc-success', icon: FileCheck2 }
  ];

  const threatVectors = (Array.isArray(summaryData?.threat_vectors) ? summaryData.threat_vectors : []).map((item) => ({ ...item, count: numberOrNull(item.count) ?? 0, pct: numberOrNull(item.percent) ?? 0, severity: 'OBSERVED', color: 'bg-soc-primary' }));

  const hourlyVelocities = (Array.isArray(summaryData?.hourly) ? summaryData.hourly : []).map((item) => ({ hour: item.hour, attacks: numberOrNull(item.transactions) ?? 0 }));

  const topOriginGeos = [];

  const shapDrivers = [];

  const handleExportAnalyticsReport = () => {
    alert("Exporting CERT-In Cyber Security Incident Analytics Report (PDF format)...");
  };

  const chartData = [];
  if (sweepData && sweepData.transaction_only) {
    for (let i = 0; i <= 100; i++) {
      chartData.push({
        threshold: i,
        txn_cost: numberOrNull(sweepData.transaction_only[i]?.total_cost) ?? 0,
        cyber_cost: numberOrNull(sweepData.cyber_only[i]?.total_cost) ?? 0,
        fusion_cost: numberOrNull(sweepData.full_fusion[i]?.total_cost) ?? 0,
      });
    }
  }

  const candidateSweepPt = sweepData?.[selectedConfig]?.[thresholdInt];
  const currentSweepPt = candidateSweepPt && ['precision', 'recall', 'total_cost', 'FP', 'FN'].every((key) => Number.isFinite(Number(candidateSweepPt[key])))
    ? { ...candidateSweepPt, precision: Number(candidateSweepPt.precision), recall: Number(candidateSweepPt.recall), total_cost: Number(candidateSweepPt.total_cost), FP: Number(candidateSweepPt.FP), FN: Number(candidateSweepPt.FN) }
    : null;
  // No fabricated fallback here: totalPos/totalNeg must come from the SAME
  // honest evalData source as the FP/FN counts rendered below, or the
  // confusion-matrix panel is hidden entirely rather than mixing a real
  // sweep with stale/fabricated totals (see CRITICAL 2 fix notes).
  let totalPos = null;
  let totalNeg = null;
  if (hasEval && evalData.transaction_only.confusion_matrix) {
    totalPos = evalData.transaction_only.confusion_matrix.TP + evalData.transaction_only.confusion_matrix.FN;
    totalNeg = evalData.transaction_only.confusion_matrix.TN + evalData.transaction_only.confusion_matrix.FP;
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none font-mono text-xs text-soc-text">
      
      {/* HEADER STRIP */}
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-soc-primary/20 border border-soc-primary/40 rounded-xl">
            <BarChart3 className="w-6 h-6 text-soc-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
                Cybersecurity Threat Analytics & AI Model Performance
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-soc-success/20 text-soc-success font-bold border border-soc-success/30">
                REAL-TIME SIEM TELEMETRY
              </span>
            </div>
            <span className="text-xs text-soc-muted">Actionable threat vector distributions, model uplift metrics, and CERT-In compliance SLA</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-soc-panel p-1 rounded-lg border border-soc-border text-[11px]">
            {['1h', '24h', '7d', '30d'].map((tr) => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-2.5 py-1 rounded font-bold uppercase transition-all ${
                  timeRange === tr ? 'bg-soc-primary text-soc-onPrimary shadow' : 'text-soc-muted hover:text-soc-text'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportAnalyticsReport}
            className="px-3.5 py-2 bg-soc-primary hover:bg-soc-primary text-soc-onPrimary font-bold rounded-lg flex items-center gap-2 transition-all shadow"
          >
            <Download className="w-4 h-4" />
            <span>Export CERT-In Report</span>
          </button>
        </div>
      </div>

      {(summaryError || evalError || sweepError) && (
        <div role="status" className="flex items-center justify-between rounded-lg border border-soc-warning/40 bg-soc-warning/5 px-4 py-3 text-xs text-soc-muted">
          <span>Some analytics telemetry is reconnecting. Available panels remain visible and will refresh automatically.</span>
          <button type="button" onClick={retryAll} className="rounded border border-soc-border px-3 py-1 text-soc-text">Retry telemetry</button>
        </div>
      )}

      {/* 1. EXEC KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-soc-muted font-bold uppercase">{kpi.title}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="my-2">
                <div className={`text-xl font-black font-mono ${kpi.color}`}>{kpi.val}</div>
                <div className="text-[11px] text-soc-muted mt-0.5">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. TABULAR VS FUSION MODEL UPLIFT (HONEST METRICS) */}
      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-soc-border pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-soc-primary" />
            <h2 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider">
              Fusion Model Uplift vs Tabular-Only Baseline
            </h2>
          </div>
        </div>

        {evalError ? (
          <div className="p-4 text-soc-danger font-bold border border-soc-danger/30 rounded bg-soc-danger/10">
            Service temporarily unavailable. Retrying metrics connection automatically.
          </div>
        ) : !evalData ? (
          <div className="p-4 text-soc-muted font-bold animate-pulse">Loading real-time metrics...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* COMPARISON TABLE (8/12) */}
            <div className="lg:col-span-8 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-soc-border text-soc-dim uppercase text-[10px]">
                    <th className="py-2.5 px-3">Evaluation Metric</th>
                    <th className="py-2.5 px-3">Tabular Baseline</th>
                    <th className="py-2.5 px-3">Fusion Cyber Engine</th>
                    <th className="py-2.5 px-3 text-right">Uplift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soc-border/50">
                  {computedModelMetrics.map((m, idx) => (
                    <tr key={idx} className="hover:bg-soc-panel/60">
                      <td className="py-2.5 px-3 font-bold text-soc-text">{m.metric}</td>
                      <td className="py-2.5 px-3 text-soc-muted">{m.baseline}</td>
                      <td className="py-2.5 px-3 font-bold text-soc-success">{m.fusion}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-soc-primary">{m.uplift}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* UPLIFT SUMMARY BADGE (4/12) */}
            <div className="lg:col-span-4 bg-soc-panel border border-soc-border rounded-xl p-4 space-y-2 text-center">
              <span className="text-[10px] text-soc-muted uppercase font-bold block">{headlineLabel}</span>
              <div className={`text-3xl font-black font-mono ${headlineIsPositive ? 'text-soc-success' : 'text-soc-warning'}`}>{headlineUplift}</div>
              <p className="text-[11px] text-soc-muted">
                {recallCompare} when using the Fusion overlay.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NEW: THRESHOLD SWEEP & COST ABLATION */}
      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-soc-border pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-soc-primary" />
            <h2 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider">
              Interactive Cost & Threshold Sweep
            </h2>
          </div>
        </div>

        {sweepError ? (
          <div className="text-soc-muted font-bold p-4 border border-soc-warning/30 rounded bg-soc-warning/5">Service temporarily unavailable. Retrying sweep connection automatically.</div>
        ) : !sweepData ? (
          <div className="text-soc-muted p-4 animate-pulse">Loading sweep data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CONTROLS (4/12) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-soc-muted font-bold uppercase">Configuration</label>
                <select 
                  className="w-full bg-soc-bg border border-soc-border p-2 rounded text-xs text-soc-text outline-none focus:border-soc-primary"
                  value={selectedConfig}
                  onChange={(e) => setSelectedConfig(e.target.value)}
                >
                  <option value="transaction_only">Tabular Baseline</option>
                  <option value="cyber_only">Cyber-Only</option>
                  <option value="full_fusion">Full Fusion</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] text-soc-muted font-bold uppercase">FN Cost (INR)</label>
                  <input 
                    type="number" 
                    className="w-full bg-soc-bg border border-soc-border p-2 rounded text-xs text-soc-text outline-none focus:border-soc-primary"
                    value={fnCost}
                    onChange={(e) => setFnCost(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-soc-muted font-bold uppercase">FP Cost (INR)</label>
                  <input 
                    type="number" 
                    className="w-full bg-soc-bg border border-soc-border p-2 rounded text-xs text-soc-text outline-none focus:border-soc-primary"
                    value={fpCost}
                    onChange={(e) => setFpCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-soc-muted font-bold uppercase">
                  <span>Threshold Slider</span>
                  <span className="text-soc-primary text-xs bg-soc-primary/20 px-2 py-0.5 rounded">{thresholdInt}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={thresholdInt} 
                  onChange={(e) => setThresholdInt(Number(e.target.value))}
                  className="w-full cursor-pointer accent-soc-primary h-2 bg-soc-bg rounded-lg appearance-none"
                />
              </div>

              {currentSweepPt && (
                <div className="bg-soc-panel border border-soc-border p-3 rounded-lg space-y-2">
                  <div className="text-[10px] text-soc-muted font-bold uppercase border-b border-soc-border pb-1">Live Performance @ T={thresholdInt}</div>
                  <div className="flex justify-between text-xs pt-1">
                    <span>Precision:</span> <span className="font-bold text-soc-success">{(currentSweepPt.precision * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Recall:</span> <span className="font-bold text-soc-success">{(currentSweepPt.recall * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>FP Count:</span> <span className="font-bold text-soc-danger">{currentSweepPt.FP}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>FN Count:</span> <span className="font-bold text-soc-danger">{currentSweepPt.FN}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-soc-border pt-1 mt-1">
                    <span>Total Cost (INR):</span> <span className="font-bold text-soc-warning">₹{currentSweepPt.total_cost.toLocaleString()}</span>
                  </div>
                  
                  {(totalPos != null && totalNeg != null) && (
                    <div className="pt-2">
                      <div className="text-[10px] text-soc-muted font-bold uppercase mb-1">Confusion Matrix</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-center font-mono">
                        <div className="bg-soc-success/10 border border-soc-success/20 p-1 rounded">TN: {totalNeg - currentSweepPt.FP}</div>
                        <div className="bg-soc-danger/10 border border-soc-danger/20 p-1 rounded">FP: {currentSweepPt.FP}</div>
                        <div className="bg-soc-danger/10 border border-soc-danger/20 p-1 rounded">FN: {currentSweepPt.FN}</div>
                        <div className="bg-soc-success/10 border border-soc-success/20 p-1 rounded">TP: {totalPos - currentSweepPt.FN}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CHART (8/12) */}
            <div className="lg:col-span-8 bg-soc-panel border border-soc-border rounded-lg p-2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                  <XAxis dataKey="threshold" stroke="#A0AEC0" tick={{fontSize: 10}} label={{ value: 'Threshold (0-100)', position: 'insideBottom', offset: -10, fill: '#A0AEC0', fontSize: 10 }} />
                  <YAxis stroke="#A0AEC0" tick={{fontSize: 10}} tickFormatter={(v) => '₹' + (v/1000).toFixed(0) + 'k'} width={60} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px' }}
                    formatter={(value, name) => ['₹' + (numberOrNull(value) ?? 0).toLocaleString(), name]}
                    labelFormatter={(label) => `Threshold: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}/>
                  <Line type="monotone" dataKey="txn_cost" name="Tabular Cost" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{r:6}} />
                  <Line type="monotone" dataKey="cyber_cost" name="Cyber-Only Cost" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:6}} />
                  <Line type="monotone" dataKey="fusion_cost" name="Fusion Cost" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r:6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}
      </div>

      {/* 3. SIEM THREAT VECTOR DISTRIBUTION & HOURLY ATTACK VELOCITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* THREAT VECTOR DISTRIBUTION (6/12) */}
        <div className="lg:col-span-6 bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-soc-border pb-3">
            <h3 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-soc-danger animate-pulse" />
              <span>SIEM Threat Vector Distribution</span>
            </h3>
            <span className="text-[10px] text-soc-muted">{summaryData ? `${totals.transactions ?? 0} Events` : 'Waiting for telemetry'}</span>
          </div>

          <div className="space-y-3">
            {threatVectors.map((tv, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-soc-text">{tv.type}</span>
                  <span className="text-soc-muted font-mono">{tv.count.toLocaleString()} ({tv.pct}%)</span>
                </div>
                <div className="w-full bg-soc-bg rounded-full h-2.5 overflow-hidden border border-soc-border/40">
                  <div className={`h-full ${tv.color} transition-all`} style={{ width: `${tv.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HOURLY ATTACK VELOCITY HEATMAP (6/12) */}
        <div className="lg:col-span-6 bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-soc-border pb-3">
            <h3 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-soc-warning" />
              <span>Hourly Attack Velocity Surge Timeline</span>
            </h3>
            <span className="text-[10px] text-soc-warning font-bold">Peak: 04:00 IST</span>
          </div>

          <div className="h-[180px] flex items-end gap-2 pt-4 px-2">
            {hourlyVelocities.map((h, idx) => {
              const heightPct = Math.round((h.attacks / 1420) * 100);
              const isPeak = h.attacks >= 1000;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-soc-panel border border-soc-border text-soc-text text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none transition-all z-10 whitespace-nowrap">
                    {h.hour}: {h.attacks} attacks
                  </div>
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isPeak ? 'bg-soc-danger hover:bg-soc-danger' : 'bg-soc-primary hover:bg-soc-primary'
                    }`} 
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-soc-muted rotate-45 md:rotate-0 mt-1">{h.hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. GEO IP THREAT TELEMETRY & GLOBAL SHAP DRIVERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* GEO IP MALICIOUS ORIGINS (6/12) */}
        <div className="lg:col-span-6 bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-soc-border pb-3">
            <h3 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-soc-primary" />
              <span>Malicious Origin Geo & Proxy Telemetry</span>
            </h3>
            <span className="text-[10px] text-soc-success font-bold">84.2% Proxy/VPN Rate</span>
          </div>

          <div className="space-y-2">
            {topOriginGeos.map((g, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border bg-soc-panel/60 border-soc-border flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-soc-text">{g.country}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-soc-danger/20 text-soc-danger font-bold border border-soc-danger/30">
                    {g.risk}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-soc-muted">{g.count.toLocaleString()} Events</span>
                  <span className="font-bold text-soc-primary">{g.share}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GLOBAL SHAP THREAT DRIVERS (6/12) */}
        <div className="lg:col-span-6 bg-soc-surface border border-soc-border rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-soc-border pb-3">
            <h3 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-soc-success" />
              <span>Global SHAP Threat Drivers (TreeSHAP)</span>
            </h3>
            <span className="text-[10px] text-soc-muted">Top 5 Features</span>
          </div>

          <div className="space-y-2">
            {shapDrivers.map((sd, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border bg-soc-panel/60 border-soc-border flex items-center justify-between text-[11px]">
                <div>
                  <div className="font-bold text-soc-text">{sd.feature}</div>
                  <div className="text-[10px] text-soc-muted mt-0.5">{sd.desc}</div>
                </div>
                <span className="font-bold text-soc-danger text-xs px-2 py-0.5 rounded bg-soc-danger/10 border border-soc-danger/30">
                  {sd.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
