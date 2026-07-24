import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data available', description = 'Try adjusting the current filters or generate a synthetic demo universe.' }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center border border-dashed border-soc-border p-6 text-center">
      <Inbox aria-hidden="true" className="h-6 w-6 text-soc-muted" strokeWidth={1.5} />
      <h3 className="mt-3 text-sm font-medium text-soc-text">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-soc-muted">{description}</p>
    </div>
  );
}
