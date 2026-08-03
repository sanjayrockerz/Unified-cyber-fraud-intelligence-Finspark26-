import React, { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import Timeline from '../components/Timeline';
import EmptyState from '../components/common/EmptyState';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

// GET /threats (api/main.py, cyber_threat_engine.get_all_threats) responds with
// { threats: [...] }, where each item carries threat_name / threat_category / an
// UPPERCASE severity / an ISO-8601 timestamp / user_id / device_id -- not the
// event_type / lowercase severity / space-separated timestamp / ip shape that
// Timeline.jsx (shared with other pages) was written against. Map the real
// response onto Timeline's existing contract here instead of changing the
// shared component.
function mapThreatToTimelineEvent(threat) {
  return {
    // Timeline does evt.timestamp.split(' ')[1] to show a clock time, so give it
    // a space-separated "YYYY-MM-DD HH:MM:SS" string instead of raw ISO-8601.
    timestamp: (threat.timestamp || '').replace('T', ' ').split('.')[0],
    event_type: threat.threat_name || threat.threat_category || 'unknown_event',
    severity: (threat.severity || 'low').toLowerCase(),
    user_id: threat.user_id,
    ip: threat.device_id,
  };
}

export default function TelemetryPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/threats`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('threats fetch failed');
        return res.json();
      })
      .then((data) => {
        const threats = Array.isArray(data) ? data : data.threats ?? [];
        setEvents(threats.map(mapThreatToTimelineEvent));
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-soc-primary animate-pulse" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
              SIEM Cyber Telemetry Stream
            </h1>
            <span className="text-xs text-soc-muted">Live cyber-threat events from the fraud decision pipeline</span>
          </div>
        </div>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4">
        {status === 'error' ? (
          <EmptyState title="Telemetry unavailable" description="Could not reach the threat feed." />
        ) : (
          <Timeline events={events} />
        )}
      </div>
    </div>
  );
}
