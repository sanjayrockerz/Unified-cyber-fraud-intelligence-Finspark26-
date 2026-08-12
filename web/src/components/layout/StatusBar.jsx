import React from 'react';
import { Activity, ShieldCheck, Wifi } from 'lucide-react';

export default function StatusBar() {
  const connected = window.__FUSION_AUTH_READY__ === true;
  const apiBase = import.meta.env.VITE_API_BASE || window.__FUSION_CONFIG__?.apiBase || 'https://risk-engine-api-o2kl.onrender.com';
  return (
    <div className="flex h-6 items-center justify-between overflow-hidden border-t border-soc-border bg-soc-surface px-3 text-[10px] font-mono text-soc-dim select-none sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <span className={`flex items-center gap-1 ${connected ? 'text-soc-success' : 'text-soc-warning'}`} title={connected ? apiBase : window.__FUSION_AUTH_ERROR__ || 'Set Vercel token proxy variables'}>
          <Wifi className="w-3 h-3" />
          <span className="truncate">{connected ? 'Connected to Render' : 'Connect Vercel to Render'}<span className="hidden sm:inline"> · {apiBase}</span></span>
        </span>
        <span className="hidden sm:inline">SLA Target: &lt;50ms</span>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <span>FPR Budget: 0.48% / 0.50%</span>
        <span>Graph Engine: NetworkX / Neo4j Aura</span>
        <span className="text-soc-muted">Fuzen AI Enterprise v2.6</span>
      </div>
    </div>
  );
}

