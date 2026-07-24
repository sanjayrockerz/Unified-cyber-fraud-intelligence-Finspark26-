import React, { useEffect, useMemo, useState } from 'react';
import { Code2, Copy, Download, RefreshCw, Smartphone, Wifi } from 'lucide-react';
import { API_BASE, authenticatedWebSocketUrl } from '../platformAuth';

export default function DeveloperPlatformPage() {
  const [pairing, setPairing] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [synthetic, setSynthetic] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      const [deviceResponse, sessionResponse] = await Promise.all([
        fetch(`${API_BASE}/device/connected`),
        fetch(`${API_BASE}/device/sessions`),
      ]);
      if (!deviceResponse.ok || !sessionResponse.ok) throw new Error('Operations Center request failed');
      setDevices((await deviceResponse.json()).devices || []);
      setSessions((await sessionResponse.json()).sessions || []);
    } catch (requestError) { setError(requestError.message); }
  };

  const generatePairing = async () => {
    setError(null);
    const response = await fetch(`${API_BASE}/device/pair`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) throw new Error(`Pairing generation failed: HTTP ${response.status}`);
    setPairing((await response.json()).pairing);
  };
  const startSynthetic = async () => {
    const response = await fetch(`${API_BASE}/synthetic/universe/start_scenario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: 'account_takeover', speed_multiplier: 4 }) });
    if (!response.ok) throw new Error(`Synthetic lab failed: HTTP ${response.status}`);
    setSynthetic((await response.json()).state);
  };
  const downloadArtifact = async (path, filename) => {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => { refresh(); const timer = setInterval(refresh, 3000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let socket;
    try {
      socket = new WebSocket(authenticatedWebSocketUrl(`${API_BASE.replace(/^http/, 'ws')}/ws/stream`));
      socket.onmessage = (message) => setEvents((current) => [JSON.parse(message.data), ...current].slice(0, 80));
    } catch (socketError) { setError(socketError.message); }
    return () => socket?.close();
  }, []);

  const pairingText = useMemo(() => pairing ? JSON.stringify(pairing) : '', [pairing]);
  return <div className="p-5 space-y-5 font-mono text-xs">
    <header className="flex items-center justify-between bg-soc-surface border border-soc-border rounded-xl p-4">
      <div className="flex items-center gap-3"><Code2 className="w-6 h-6 text-soc-info" /><div><h1 className="font-bold text-soc-text uppercase">Fusion Developer Portal</h1><p className="text-soc-muted">Pair APKs and watch the live Operations Center.</p></div></div>
      <button onClick={refresh} className="p-2 border border-soc-border rounded text-soc-muted"><RefreshCw className="w-4 h-4" /></button>
    </header>
    {error && <div className="text-soc-danger">{error}</div>}
    <section className="grid lg:grid-cols-3 gap-4">
      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 space-y-3"><h2 className="font-bold text-soc-text">Developer Downloads</h2><button onClick={() => downloadArtifact('/download/apk', 'fusion-risk-os-demo.apk').catch((e) => setError(e.message))} className="flex items-center gap-2 text-soc-info"><Download className="w-4 h-4" />Download APK</button><button onClick={() => downloadArtifact('/download/sdk', 'fusion-sdk-reference.md').catch((e) => setError(e.message))} className="flex items-center gap-2 text-soc-info"><Download className="w-4 h-4" />Download SDK reference</button></div>
      <div className="lg:col-span-2 bg-soc-surface border border-soc-border rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><h2 className="font-bold text-soc-text">Device Pairing</h2><button onClick={() => generatePairing().catch((e) => setError(e.message))} className="px-3 py-2 bg-soc-info text-soc-muted rounded font-bold">Generate Pairing QR</button></div>{pairing ? <><pre className="bg-soc-panel p-3 rounded text-soc-success whitespace-pre-wrap break-all">{pairingText}</pre><button onClick={() => navigator.clipboard?.writeText(pairingText)} className="flex items-center gap-2 text-soc-info"><Copy className="w-4 h-4" />Copy QR payload</button><p className="text-soc-muted">Encode this JSON as a QR code. It contains only temporary pairing configuration.</p></> : <p className="text-soc-muted">Generate a five-minute pairing payload for a fresh APK.</p>}</div>
    </section>
    <section className="bg-soc-surface border border-soc-warning/30 rounded-xl p-4 flex items-center justify-between"><div><h2 className="font-bold text-soc-warning">Synthetic Data Lab</h2><p className="text-soc-muted">Synthetic sessions use the same pipeline and remain visually marked; they never appear as live devices.</p>{synthetic && <p className="text-soc-warning mt-2">{synthetic.status} Â· {synthetic.scenario_id} Â· speed Ã—{synthetic.speed_multiplier}</p>}</div><button onClick={() => startSynthetic().catch((e) => setError(e.message))} className="px-3 py-2 border border-soc-warning text-soc-warning rounded">Start Synthetic Sessions</button></section>
    <section className="grid lg:grid-cols-2 gap-4"><LiveTable title="Connected Devices" icon={<Smartphone className="w-4 h-4" />} rows={devices} empty="No live APKs paired yet." /><LiveTable title="Active Sessions" icon={<Wifi className="w-4 h-4" />} rows={sessions} empty="No authenticated sessions yet." /></section>
    <section className="bg-soc-surface border border-soc-border rounded-xl p-4"><h2 className="font-bold text-soc-text mb-3">Live Event Stream</h2><pre className="max-h-72 overflow-auto text-soc-success whitespace-pre-wrap">{events.length ? events.map((event, index) => `${index + 1}. ${JSON.stringify(event)}`).join('\n') : 'Waiting for authenticated pipeline eventsâ€¦'}</pre></section>
  </div>;
}

function LiveTable({ title, icon, rows, empty }) {
  return <div className="bg-soc-surface border border-soc-border rounded-xl p-4"><h2 className="font-bold text-soc-text mb-3 flex items-center gap-2">{icon}{title} <span className="text-soc-info">{rows.length}</span></h2>{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.device_id || row.session_id} className="border border-soc-border rounded p-3"><div className="flex justify-between text-soc-text"><span>{row.model || row.user_id || row.device_id}</span><span className="text-soc-success">{row.status || row.connection}</span></div><div className="text-soc-muted mt-1">Device: {row.device_id || 'â€”'} Â· Session: {row.session_id || 'â€”'} Â· User: {row.user_id || 'â€”'}</div><div className="text-soc-muted">Last event: {row.last_event || 'â€”'} Â· Threats: {row.threat_count ?? 0}</div></div>)}</div> : <p className="text-soc-muted">{empty}</p>}</div>;
}

