import React, { useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

import useResource, { API_BASE } from '../../lib/useResource';
import PanelState from '../common/PanelState';
import { formatTimestamp } from '../../lib/verdict';

const LABELS = [
  { value: 'CONFIRMED_FRAUD', label: 'Confirmed fraud', tone: 'text-soc-danger' },
  { value: 'FALSE_POSITIVE', label: 'False positive', tone: 'text-soc-warning' },
  { value: 'INCONCLUSIVE', label: 'Inconclusive', tone: 'text-soc-muted' },
];

/**
 * Analyst outcome label, persisted against the case.
 *
 * The label is stored for real and survives a reload. What it does NOT do is
 * trigger retraining -- nothing consumes the queue yet, and the panel says so
 * rather than implying a pipeline that does not exist.
 */
export default function LearningLoop({ caseId }) {
  const labelPath = caseId ? `/cases/${encodeURIComponent(caseId)}/label` : null;
  const { data, status, error, reload } = useResource(labelPath);

  const [selected, setSelected] = useState('CONFIRMED_FRAUD');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const recorded = data?.label;

  const submitLabel = async () => {
    if (!labelPath) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`${API_BASE}${labelPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: selected, analyst: 'Analyst_04' }),
      });
      if (!response.ok) throw new Error(`Could not record the label (HTTP ${response.status})`);
      reload();
    } catch (requestError) {
      setSaveError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-soc-border bg-soc-panel p-4 shadow-lg">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-soc-border pb-3">
        <div className="flex items-center gap-2">
          <RefreshCw aria-hidden="true" className="h-4 w-4 text-soc-success" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-soc-text">
              Case outcome label
            </h3>
            <p className="text-[11px] text-soc-muted">
              Recorded for supervised retraining datasets
            </p>
          </div>
        </div>
        <span className="rounded border border-soc-warning/30 bg-soc-warning/10 px-2 py-0.5 text-[10px] text-soc-warning">
          Stored only — no retraining job consumes this queue yet
        </span>
      </header>

      <PanelState
        status={status}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the recorded label…"
      >
        {() =>
          recorded ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-soc-success/30 bg-soc-success/10 p-3">
              <div className="flex items-center gap-2 text-soc-success">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-mono text-xs font-bold">{recorded.label}</p>
                  <p className="mt-0.5 text-[10px] text-soc-muted">
                    {recorded.analyst} · {formatTimestamp(recorded.recorded_at)}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-soc-muted">
                {data.queue_depth} case{data.queue_depth === 1 ? '' : 's'} labelled
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <fieldset>
                <legend className="sr-only">Case outcome</legend>
                <div className="flex flex-wrap items-center gap-4">
                  {LABELS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 text-xs"
                    >
                      <input
                        type="radio"
                        name={`case-label-${caseId}`}
                        value={option.value}
                        checked={selected === option.value}
                        onChange={(event) => setSelected(event.target.value)}
                      />
                      <span className={`font-semibold ${option.tone}`}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={submitLabel}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded bg-soc-success px-4 py-1.5 text-xs font-bold text-soc-onPrimary shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                )}
                <span>{isSaving ? 'Recording…' : 'Record outcome'}</span>
              </button>

              {saveError && (
                <p role="alert" className="font-mono text-[11px] text-soc-danger">
                  {saveError}
                </p>
              )}
            </div>
          )
        }
      </PanelState>
    </section>
  );
}
