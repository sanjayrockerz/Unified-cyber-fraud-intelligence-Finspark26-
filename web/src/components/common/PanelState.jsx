import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * Renders the loading / error / empty branch for a panel backed by useResource,
 * and only yields to `children` once there is real data to show.
 *
 * Usage:
 *   <PanelState status={status} error={error} onRetry={reload} isEmpty={!items.length}>
 *     {() => <RealContent />}
 *   </PanelState>
 */
export default function PanelState({
  status,
  error,
  onRetry,
  isEmpty = false,
  loadingLabel = 'Loading…',
  emptyTitle = 'Nothing to show',
  emptyDescription = 'No records matched this case.',
  children,
}) {
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-soc-border bg-soc-surface p-6 text-xs text-soc-muted">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-soc-primary" />
        <span className="font-mono">{loadingLabel}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-soc-danger/40 bg-soc-danger/5 p-6 text-center"
      >
        <AlertTriangle aria-hidden="true" className="h-5 w-5 text-soc-danger" />
        <div>
          <p className="text-sm font-medium text-soc-text">This panel could not load</p>
          <p className="mt-1 font-mono text-xs text-soc-muted">
            {error?.message || 'The request failed.'}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded border border-soc-border bg-soc-panel px-3 py-1.5 text-xs font-medium text-soc-text transition-colors hover:border-soc-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return typeof children === 'function' ? children() : children;
}
