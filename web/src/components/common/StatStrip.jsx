import React from 'react';
import { Activity } from 'lucide-react';

const toneClasses = {
  primary: 'text-soc-primary', success: 'text-soc-success', warning: 'text-soc-warning',
  danger: 'text-soc-danger', info: 'text-soc-info', quantum: 'text-soc-quantum',
};

export default function StatStrip({ items = [] }) {
  return (
    <section aria-label="Operational metrics" className="grid border border-soc-border sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, detail, tone = 'primary', icon: Icon = Activity }) => (
        <article key={label} className="flex min-w-0 gap-3 border-b border-soc-border p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
          <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${toneClasses[tone] || toneClasses.primary}`} strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-soc-muted">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-soc-text">{value}</p>
            {detail && <p className="mt-1 text-xs text-soc-muted">{detail}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
