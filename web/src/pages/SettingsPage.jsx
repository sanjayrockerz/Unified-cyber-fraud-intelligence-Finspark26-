import React, { useEffect, useState } from 'react';
import { Sliders, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function SettingsPage() {
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [challengeThreshold, setChallengeThreshold] = useState(50);
  const [windowSeconds, setWindowSeconds] = useState(300);
  const [status, setStatus] = useState('loading');
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/settings/policy`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load policy settings.');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setBlockThreshold(data.block_threshold);
        setChallengeThreshold(data.challenge_threshold);
        setWindowSeconds(data.window_seconds);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const response = await fetch(`${API_BASE}/settings/policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_threshold: Number(blockThreshold),
          challenge_threshold: Number(challengeThreshold),
          window_seconds: Number(windowSeconds),
        }),
      });
      if (!response.ok) throw new Error('Could not save policy settings.');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sliders className="w-6 h-6 text-soc-primary" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
              Risk Engine Policy & Threshold Tuning
            </h1>
            <span className="text-xs text-soc-muted">Adjust cutoffs for BLOCK, CHALLENGE, and Cyber Compromise Windows</span>
          </div>
        </div>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 max-w-2xl space-y-4">
        {status === 'loading' && <p className="text-xs text-soc-muted">Loading saved policy…</p>}
        {status === 'error' && <p className="text-xs text-soc-danger">Could not load saved policy — showing defaults.</p>}

        <div>
          <label className="text-xs font-mono text-soc-muted flex justify-between mb-1">
            <span>BLOCK Verdict Cutoff Threshold (Score ≥ N):</span>
            <span className="text-soc-danger font-bold font-mono tabular-nums">{blockThreshold}/100</span>
          </label>
          <input type="range" min="60" max="95" value={blockThreshold} onChange={(e) => setBlockThreshold(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="text-xs font-mono text-soc-muted flex justify-between mb-1">
            <span>CHALLENGE Verdict Cutoff Threshold (Score ≥ N):</span>
            <span className="text-soc-warning font-bold font-mono tabular-nums">{challengeThreshold}/100</span>
          </label>
          <input type="range" min="30" max="65" value={challengeThreshold} onChange={(e) => setChallengeThreshold(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="text-xs font-mono text-soc-muted flex justify-between mb-1">
            <span>Cyber Compromise Correlation Window:</span>
            <span className="text-soc-primary font-bold font-mono tabular-nums">{windowSeconds} seconds</span>
          </label>
          <input type="range" min="60" max="900" step="30" value={windowSeconds} onChange={(e) => setWindowSeconds(e.target.value)} className="w-full" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={`px-4 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-colors mt-4 disabled:opacity-60 ${
              saveState === 'error'
                ? 'bg-soc-danger text-soc-onDanger hover:bg-soc-danger'
                : 'bg-soc-primary text-soc-onPrimary hover:bg-soc-primary'
            }`}
          >
            {saveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saveState === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : saveState === 'error' ? <AlertCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Error — try again' : 'Save Policy Configuration'}</span>
          </button>
          {saveState === 'error' && <p className="text-xs text-soc-danger">Failed to save settings. Please try again.</p>}
          <p className="text-[10px] text-soc-dim">
            Saved for this session — the running risk engine currently uses its own compiled thresholds and does not read these values.
          </p>
        </div>
      </div>
    </div>
  );
}

