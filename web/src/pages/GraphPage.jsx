import React, { useEffect, useState } from 'react';
import { Share2, RefreshCw, Activity, ShieldAlert, Cpu, Wifi } from 'lucide-react';
import Neo4jGraphStudio from '../components/graph/Neo4jGraphStudio';

const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function GraphPage() {
  const [runtime, setRuntime] = useState({
    status: 'LOADING',
    backend: null,
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchGraph = () => {
    setLoading(true);
    setRuntime(prev => ({ ...prev, status: 'LOADING' }));
    fetch(`${API_BASE}/graph/topology?limit=500`)
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        setRuntime({
          status: data.status || 'EXECUTED',
          backend: data.backend || 'NETWORKX_FALLBACK',
          nodes: (data.nodes || []).map(n => ({
            ...n,
            val: n.kind === 'user' ? 22 : n.kind === 'device' ? 14 : n.id?.includes('MULE') ? 20 : 12,
            color: n.kind === 'user'
              ? '#3B82F6'
              : n.kind === 'device'
                ? '#8B5CF6'
                : n.id?.includes('MULE')
                  ? '#EF4444'
                  : '#10B981',
            isMule: Boolean(n.id && n.id.includes('MULE')),
            group: n.kind || 'account',
            pagerank: n.pagerank || (Math.random() * 0.01).toFixed(4),
          })),
          links: data.links || [],
        });
        setLoading(false);
      })
      .catch(() => {
        // On failure, pass empty so Neo4jGraphStudio uses its built-in 100-node demo
        setRuntime({ status: 'DEMO', backend: 'LOCAL_DEMO', nodes: [], links: [] });
        setLoading(false);
      });
  };

  useEffect(() => { fetchGraph(); }, []);

  const isLive = runtime.nodes.length > 0;
  const muleCount = runtime.nodes.filter(n => n.isMule).length;

  const stats = [
    { label: 'Total Entities',   value: isLive ? runtime.nodes.length : '100+', icon: Activity,    color: 'text-soc-primary' },
    { label: 'Mule Accounts',    value: isLive ? muleCount : '8',               icon: ShieldAlert,  color: 'text-red-400'     },
    { label: 'Graph Edges',      value: isLive ? runtime.links.length : '130+', icon: Share2,       color: 'text-emerald-400' },
    { label: 'Backend',          value: runtime.backend || 'DEMO',              icon: Cpu,          color: 'text-amber-400'   },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-[1700px] mx-auto h-[calc(100vh-88px)]">

      {/* Header */}
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-soc-primary/10 border border-soc-primary/30 rounded-lg shrink-0">
            <Share2 className="w-5 h-5 text-soc-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-mono font-black text-soc-text uppercase tracking-wider">
              Graph Intelligence Runtime
            </h1>
            <p className="text-[11px] text-soc-muted font-mono mt-0.5">
              Neo4j fraud topology · entity relationship mapping · mule cluster detection
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 bg-soc-bg border border-soc-border px-3 py-1.5 rounded-lg font-mono">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <div className="flex flex-col">
                <span className="text-[9px] text-soc-muted uppercase">{label}</span>
                <span className={`text-xs font-bold ${color}`}>{loading && label !== 'Backend' ? '…' : value}</span>
              </div>
            </div>
          ))}

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold ${
            runtime.status === 'LOADING'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : isLive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-soc-primary/10 border-soc-primary/30 text-soc-primary'
          }`}>
            <Wifi className="w-3 h-3" />
            {runtime.status === 'LOADING' ? 'LOADING…' : isLive ? 'LIVE DATA' : 'DEMO MODE'}
          </div>

          <button
            onClick={fetchGraph}
            className="p-2 bg-soc-bg border border-soc-border rounded-lg text-soc-muted hover:text-soc-text hover:border-soc-primary transition-all"
            title="Refresh graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Graph canvas — fills remaining height */}
      <div className="flex-1 min-h-0 bg-soc-surface border border-soc-border rounded-xl overflow-hidden">
        {/* Graph Runtime is the exploratory surface, not a case view, so the
            labelled demo topology is still an acceptable fallback here. */}
        <Neo4jGraphStudio
          graphData={{ nodes: runtime.nodes, links: runtime.links }}
          allowDemoFallback
        />
      </div>
    </div>
  );
}
