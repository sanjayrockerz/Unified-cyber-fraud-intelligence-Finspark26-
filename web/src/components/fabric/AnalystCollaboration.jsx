import React, { useState } from 'react';
import { Loader2, Send, Users } from 'lucide-react';

import useResource, { API_BASE } from '../../lib/useResource';
import PanelState from '../common/PanelState';
import { formatTimestamp } from '../../lib/verdict';

const ANALYST = 'Analyst_04';

/**
 * Case notes, persisted server-side against the case.
 *
 * Notes are read from and written to /cases/{id}/notes. An empty thread stays
 * empty -- it is not pre-populated with a conversation that never happened.
 */
export default function AnalystCollaboration({ caseId }) {
  const notesPath = caseId ? `/cases/${encodeURIComponent(caseId)}/notes` : null;
  const { data, status, error, reload } = useResource(notesPath);

  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const notes = data?.items ?? [];

  const postNote = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !notesPath) return;

    setIsPosting(true);
    setPostError(null);
    try {
      const response = await fetch(`${API_BASE}${notesPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: ANALYST, text }),
      });
      if (!response.ok) throw new Error(`Could not save the note (HTTP ${response.status})`);
      setDraft('');
      reload();
    } catch (saveError) {
      setPostError(saveError.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <section className="rounded-xl border border-soc-border bg-soc-panel p-4 shadow-lg">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-soc-border pb-3">
        <div className="flex items-center gap-2">
          <Users aria-hidden="true" className="h-4 w-4 text-soc-primary" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-soc-text">
              Case notes
            </h3>
            <p className="text-[11px] text-soc-muted">Saved against this case for the next analyst</p>
          </div>
        </div>
        {status === 'ready' && (
          <span className="font-mono text-[10px] text-soc-dim">
            {notes.length} note{notes.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      <div className="mb-3 max-h-[180px] overflow-y-auto pr-1">
        <PanelState
          status={status}
          error={error}
          onRetry={reload}
          isEmpty={notes.length === 0}
          loadingLabel="Loading case notes…"
          emptyTitle="No notes yet"
          emptyDescription="Nothing has been recorded on this case. Add the first note below."
        >
          {() => (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note.note_id}
                  className="space-y-1 rounded-lg border border-soc-border bg-soc-surface p-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-mono font-bold text-soc-primary">{note.author}</span>
                    <span className="font-mono text-soc-dim">
                      {formatTimestamp(note.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-5 text-soc-text">{note.text}</p>
                </li>
              ))}
            </ul>
          )}
        </PanelState>
      </div>

      <form onSubmit={postNote} className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`case-note-${caseId}`}>
          Add an investigation note
        </label>
        <input
          id={`case-note-${caseId}`}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an investigation note…"
          disabled={!caseId || isPosting}
          className="h-9 flex-1 rounded border border-soc-border bg-soc-bg px-3 font-mono text-xs text-soc-text placeholder-soc-dim focus:border-soc-primary focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isPosting}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded bg-soc-primary px-3 text-xs font-bold text-soc-onPrimary shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPosting ? (
            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          <span>{isPosting ? 'Saving' : 'Post'}</span>
        </button>
      </form>
      {postError && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-soc-danger">
          {postError}
        </p>
      )}
    </section>
  );
}
