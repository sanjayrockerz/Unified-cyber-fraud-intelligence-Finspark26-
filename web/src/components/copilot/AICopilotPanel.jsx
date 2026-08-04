import React, { useMemo, useState } from 'react';
import { Activity, Bot, Briefcase, CheckCircle2, FileText, GitBranch, ListChecks, Send, ShieldAlert, ShieldCheck, Timer, Waypoints, X } from 'lucide-react';
import InvestigationCard from '../common/InvestigationCard';
import { API_BASE } from '../../platformAuth';

const EMPTY = 'Not observed in the current authenticated telemetry.';
const SECTION_KEYS = {
  'executive summary': 'summary', 'incident classification': 'classification', 'current adaptive trust': 'trust',
  'threat severity': 'severity', 'observed evidence': 'evidence', 'correlated signals': 'signals',
  'timeline summary': 'timeline', 'business impact': 'impact', 'recommended analyst actions': 'actions',
  'confidence score': 'confidence', 'supporting platform references': 'references',
};

function cleanText(value) {
  return String(value || '').replace(/```[\s\S]*?```/g, '').replace(/^\s*[#>*-]+\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
}

function normalizeResponse(raw, context = {}) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const source = raw.investigation || raw.data || raw;
    if (source.summary || source.executive_summary) return { ...source, summary: source.summary || source.executive_summary };
  }
  const text = cleanText(raw);
  const result = { summary: text || EMPTY };
  let current = 'summary';
  text.split('\n').forEach((line) => {
    const normalized = line.trim().replace(/[:：]$/, '').toLowerCase();
    const key = SECTION_KEYS[normalized];
    if (key) { current = key; if (!result[key]) result[key] = ''; return; }
    if (line.trim()) result[current] = [result[current], line.trim()].filter(Boolean).join(' ');
  });
  return {
    ...result,
    classification: result.classification || context.classification,
    trust: result.trust || context.trust,
    severity: result.severity || context.severity,
  };
}

function Section({ value }) {
  const text = cleanText(value) || EMPTY;
  return <p className="whitespace-pre-wrap">{text}</p>;
}

export default function AICopilotPanel({ activeContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contextLabel = useMemo(() => activeContext?.session_id || activeContext?.user_id || 'Current investigation', [activeContext]);
  const quickActions = [
    ['Assess current investigation', 'Provide an evidence-based investigation assessment'],
    ['Summarize active threats', 'Summarize observed active threats and business impact'],
    ['Review trust changes', 'Explain the current adaptive trust state and contributing signals'],
    ['Prepare executive brief', 'Prepare an executive incident brief from current platform telemetry'],
  ];

  const sendMessage = async (requested) => {
    const prompt = (requested || input).trim();
    if (!prompt || loading) return;
    setInput(''); setError(null); setLoading(true);
    const userMessage = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
    const history = [...messages, userMessage];
    setMessages(history);
    try {
      const response = await fetch(`${API_BASE}/api/copilot/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, context: activeContext }) });
      if (!response.ok) throw new Error(`Copilot unavailable (${response.status})`);
      const body = await response.json();
      const payload = body.data || body;
      setMessages([...history, { role: 'model', investigation: normalizeResponse(payload.investigation || payload.response || payload, activeContext), timestamp: new Date().toISOString() }]);
    } catch (requestError) {
      setError(requestError.message);
      setMessages(history);
    } finally { setLoading(false); }
  };

  const renderList = (value) => <Section value={Array.isArray(value) ? value.map((item) => `• ${cleanText(item)}`).join('\n') : value} />;

  return <div className="flex h-full flex-col border-l border-soc-border bg-soc-bg text-soc-text">
    <header className="flex items-center justify-between border-b border-soc-border bg-soc-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-3"><span className="rounded-lg border border-soc-primary/30 bg-soc-primary/10 p-2"><Bot className="h-4 w-4 text-soc-primary" aria-hidden="true" /></span><div className="min-w-0"><h2 className="truncate text-sm font-bold">AI Investigation Workspace</h2><p className="truncate text-[10px] text-soc-muted">Evidence-grounded analyst support · {contextLabel}</p></div></div>
      <span className="inline-flex items-center gap-1.5 rounded border border-soc-success/30 bg-soc-success/10 px-2 py-1 text-[9px] font-mono font-bold uppercase text-soc-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soc-success" /> Ready</span>
    </header>
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Investigation actions">
        {quickActions.map(([label, prompt]) => <button key={label} type="button" onClick={() => sendMessage(prompt)} className="flex items-center gap-2 rounded-lg border border-soc-border bg-soc-surface px-3 py-2 text-left text-[11px] font-semibold text-soc-secondary transition hover:border-soc-primary hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><Activity className="h-3.5 w-3.5 text-soc-primary" aria-hidden="true" />{label}</button>)}
      </div>
      {messages.length === 0 && !loading && <div className="rounded-xl border border-dashed border-soc-border bg-soc-surface/50 p-6 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-soc-success" aria-hidden="true" /><h3 className="mt-3 text-sm font-semibold">Investigation workspace ready</h3><p className="mx-auto mt-1 max-w-md text-xs text-soc-muted">Ask for an assessment to populate evidence, trust, timeline, impact, and recommended actions from the current backend context.</p></div>}
      {error && <div role="alert" className="flex items-center justify-between rounded-lg border border-soc-danger/30 bg-soc-danger/10 p-3 text-xs text-soc-danger"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}
      {messages.filter((message) => message.role === 'user').map((message, index) => <div key={`user-${index}`} className="ml-auto max-w-[88%] rounded-lg border border-soc-border bg-soc-panel px-3 py-2 text-xs"><div className="mb-1 flex items-center justify-between gap-3 text-[10px] text-soc-muted"><span className="font-semibold">Analyst request</span><time>{new Date(message.timestamp).toLocaleTimeString()}</time></div>{cleanText(message.content)}</div>)}
      {messages.filter((message) => message.role === 'model').map((message, index) => { const item = message.investigation || {}; return <div key={`model-${index}`} className="space-y-3">
        <InvestigationCard title="Executive Summary" icon={Briefcase} timestamp={new Date(message.timestamp).toLocaleTimeString()}><Section value={item.summary} /></InvestigationCard>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><InvestigationCard title="Incident Classification" icon={ShieldAlert} status={item.severity || 'Observed'}><Section value={item.classification} /></InvestigationCard><InvestigationCard title="Current Adaptive Trust" icon={ShieldCheck}><Section value={item.trust} /></InvestigationCard><InvestigationCard title="Threat Severity" icon={Activity}><Section value={item.severity} /></InvestigationCard><InvestigationCard title="Confidence Score" icon={CheckCircle2}><Section value={item.confidence} /></InvestigationCard></div>
        <InvestigationCard title="Observed Evidence" icon={FileText}><Section value={item.evidence} /></InvestigationCard><InvestigationCard title="Correlated Signals" icon={Waypoints}><Section value={item.signals} /></InvestigationCard><InvestigationCard title="Timeline Summary" icon={Timer}><Section value={item.timeline} /></InvestigationCard><InvestigationCard title="Business Impact" icon={Briefcase}><Section value={item.impact} /></InvestigationCard><InvestigationCard title="Recommended Analyst Actions" icon={ListChecks}><Section value={item.actions} /></InvestigationCard><InvestigationCard title="Supporting Platform References" icon={GitBranch}><Section value={item.references} /></InvestigationCard>
      </div>; })}
      {loading && <div className="space-y-3" aria-label="Loading investigation assessment"><div className="h-20 animate-pulse rounded-xl bg-soc-panel" /><div className="grid grid-cols-2 gap-3"><div className="h-20 animate-pulse rounded-xl bg-soc-panel" /><div className="h-20 animate-pulse rounded-xl bg-soc-panel" /></div><div className="h-24 animate-pulse rounded-xl bg-soc-panel" /></div>}
    </div>
    <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="border-t border-soc-border bg-soc-surface p-3"><label htmlFor="copilot-investigation-query" className="sr-only">Ask the investigation workspace</label><div className="flex items-center gap-2 rounded-lg border border-soc-border bg-soc-bg px-3 py-2 focus-within:border-soc-primary"><input id="copilot-investigation-query" value={input} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-soc-text outline-none placeholder:text-soc-muted" placeholder="Ask about evidence, trust, timeline, or impact" /><button type="submit" disabled={loading} aria-label="Submit investigation question" className="rounded bg-soc-primary p-2 text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" aria-hidden="true" /></button></div><p className="mt-1.5 text-center text-[9px] text-soc-muted">Verify all indicators against the supporting platform references before taking action.</p></form>
  </div>;
}
