import React from 'react';

export default function Timeline({ events }) {
  if (!events.length) return <div className="text-sm text-soc-muted text-center mt-10">Listening for cyber events...</div>;

  return (
    <div className="flex flex-col gap-3">
      {events.map((evt, i) => (
        <div key={i} className={`p-3 rounded-lg border-l-4 ${evt.severity === 'critical' ? 'border-soc-danger bg-soc-danger/10' : evt.severity === 'medium' ? 'border-soc-warning bg-soc-warning/10' : 'border-soc-primary bg-soc-primary/10'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-mono text-soc-muted">{evt.timestamp.split(' ')[1]}</span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${evt.severity === 'critical' ? 'bg-soc-danger text-soc-onPrimary' : evt.severity === 'medium' ? 'bg-soc-warning text-soc-onWarning' : 'bg-soc-primary text-soc-onPrimary'}`}>
              {evt.severity}
            </span>
          </div>
          <div className="text-sm font-semibold text-soc-muted">{evt.event_type.replace(/_/g, ' ').toUpperCase()}</div>
          <div className="text-xs text-soc-muted mt-1 flex flex-col">
            <span>User: <span className="text-soc-muted font-mono">{evt.user_id}</span></span>
            <span>IP: <span className="text-soc-muted font-mono">{evt.ip}</span></span>
            {evt.km_from_baseline > 100 && <span className="text-soc-danger mt-1">Travel: {evt.km_from_baseline} km</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

