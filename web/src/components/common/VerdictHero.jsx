import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldX, Clock3 } from 'lucide-react';

const verdictConfig = {
  ALLOW: { icon: CheckCircle2, label: 'ALLOW', hero: 'border-soc-success/50 bg-soc-success/10', tone: 'text-soc-success' },
  CHALLENGE: { icon: AlertTriangle, label: 'CHALLENGE', hero: 'border-soc-warning/50 bg-soc-warning/10', tone: 'text-soc-warning' },
  BLOCK: { icon: ShieldX, label: 'BLOCK', hero: 'border-soc-danger/50 bg-soc-danger/10', tone: 'text-soc-danger' },
};

export default function VerdictHero({ verdict = 'BLOCK', score = 0, reason, timestamp, transactionId }) {
  const config = verdictConfig[verdict] || verdictConfig.BLOCK;
  const Icon = config.icon;
  const numericScore = Number(score);
  const formattedScore = Number.isFinite(numericScore) ? numericScore.toFixed(1) : '—';

  return (
    <section aria-label={`Latest decision: ${config.label}`} className={`decision-pulse border p-5 sm:p-6 ${config.hero}`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.8fr)_minmax(0,1.15fr)_auto] lg:items-center">
        <div className={`flex items-center gap-4 ${config.tone}`}>
          <Icon aria-hidden="true" className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-soc-muted">Current decision</p>
            <strong className="mt-1 block text-4xl font-semibold tracking-tight sm:text-5xl">{config.label}</strong>
          </div>
        </div>
        <div className="border-t border-soc-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-soc-muted">Risk score</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-soc-text">{formattedScore}<span className="ml-2 text-base text-soc-muted">/ 100</span></p>
        </div>
        <div className="border-t border-soc-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-soc-muted">Why this decision</p>
          <p className="mt-1 text-sm leading-6 text-soc-text">{reason || 'Awaiting the next evaluated decision.'}</p>
          {transactionId && <p className="mt-2 font-mono text-xs text-soc-muted">{transactionId}</p>}
        </div>
        {timestamp && <div className="flex items-center gap-2 border-t border-soc-border pt-4 font-mono text-xs text-soc-muted lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><Clock3 className="h-4 w-4" aria-hidden="true" />{timestamp}</div>}
      </div>
    </section>
  );
}
