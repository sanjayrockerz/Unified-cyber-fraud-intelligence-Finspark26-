import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, RefreshCw } from 'lucide-react';

export default function InvestigationCard({ title, icon: Icon, children, status, timestamp, loading = false, onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyCard = async () => {
    const text = typeof children === 'string' ? children : title;
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="rounded-xl border border-soc-border bg-soc-surface shadow-lg" aria-label={title}>
      <header className="flex items-center justify-between gap-3 border-b border-soc-border bg-soc-panel/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-soc-primary" />}
          <h3 className="truncate text-xs font-bold uppercase tracking-wider text-soc-text">{title}</h3>
          {status && <span className="rounded border border-soc-border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-soc-muted">{status}</span>}
        </div>
        <div className="flex items-center gap-1 text-soc-muted">
          {timestamp && <time className="mr-2 hidden text-[10px] font-mono sm:block">{timestamp}</time>}
          <button type="button" onClick={copyCard} aria-label={`Copy ${title}`} className="rounded p-1.5 hover:bg-soc-bg hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary">
            {copied ? <Check className="h-3.5 w-3.5 text-soc-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {onRefresh && <button type="button" onClick={onRefresh} aria-label={`Refresh ${title}`} className="rounded p-1.5 hover:bg-soc-bg hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><RefreshCw className="h-3.5 w-3.5" /></button>}
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`} className="rounded p-1.5 hover:bg-soc-bg hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>
      {expanded && <div className="p-4 text-xs leading-5 text-soc-secondary">{loading ? <div className="h-12 animate-pulse rounded bg-soc-panel" aria-label="Loading" /> : children}</div>}
    </section>
  );
}
