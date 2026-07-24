import React from 'react';
import EmptyState from './EmptyState';

export default function LiveFeed({ items = [], renderItem, limit = 500, title = 'Live activity' }) {
  const visibleItems = items.slice(0, limit);
  if (!visibleItems.length) return <EmptyState title={`No ${title.toLowerCase()} yet`} description="The feed will populate as the authenticated replay stream emits events." />;

  return (
    <section aria-label={title} className="divide-y divide-soc-border border border-soc-border bg-soc-surface">
      {visibleItems.map((item, index) => <React.Fragment key={item.id || item.event_id || item.txn_id || index}>{renderItem(item, index)}</React.Fragment>)}
      {items.length > limit && <p className="px-4 py-3 text-center text-xs text-soc-muted">+{items.length - limit} earlier events retained outside the rendered window</p>}
    </section>
  );
}
