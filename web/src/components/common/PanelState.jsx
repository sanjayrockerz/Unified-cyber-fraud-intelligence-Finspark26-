import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';

export default function PanelState({ status, error, onRetry, isEmpty = false, loadingLabel = 'Loading…', emptyTitle = 'Nothing to show', emptyDescription = 'No records matched this case.', children }) {
  if (status === 'loading' || status === 'idle') {
    return <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-soc-border bg-soc-surface p-6 text-xs text-soc-muted"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-soc-primary" /><span className="font-mono">{loadingLabel}</span></div>;
  }
  if (status === 'error') {
    return <div role="alert" className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-soc-warning/40 bg-soc-warning/5 p-6 text-center"><AlertTriangle aria-hidden="true" className="h-5 w-5 text-soc-warning" /><div><p className="text-sm font-medium text-soc-text">Service temporarily unavailable</p><p className="mt-1 font-mono text-xs text-soc-muted">The platform is reconnecting automatically. Monitoring continues in the background.</p></div>{onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded border border-soc-border bg-soc-panel px-3 py-1.5 text-xs font-medium text-soc-text hover:border-soc-primary"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Retry</button>}</div>;
  }
  if (status === 'stale') {
    return <div><div role="status" className="mb-2 flex items-center justify-between rounded border border-soc-warning/30 bg-soc-warning/5 px-3 py-2 text-[11px] text-soc-muted"><span>Service temporarily unavailable. Reconnecting automatically.</span>{onRetry && <button type="button" onClick={onRetry} className="text-soc-text underline">Retry</button>}</div>{typeof children === 'function' ? children() : children}</div>;
  }
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return typeof children === 'function' ? children() : children;
}
