import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, History, LayoutList, RotateCcw } from 'lucide-react';

import Modal from '../common/Modal';
import InvestigationQueuePicker from './InvestigationQueuePicker';
import { useCase } from '../../context/CaseContext';
import { formatAmount, severityChip } from '../../lib/verdict';

/**
 * Persistent case identity + switcher for the investigation workspace.
 *
 * Two jobs:
 *  1. Always say which case is open, so no one has to wonder.
 *  2. When the case was resumed rather than chosen, say so in as many words --
 *     an auto-selected case that looks chosen is the bug this whole page had.
 */
export default function CaseSwitcher({ caseId, caseRecord, resumed = false }) {
  const navigate = useNavigate();
  const { recentCases } = useCase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const otherRecents = recentCases.filter((entry) => entry.caseId !== caseId);
  const severity = caseRecord?.severity;

  const goTo = (nextCaseId) => {
    setIsMenuOpen(false);
    setIsQueueOpen(false);
    if (nextCaseId !== caseId) navigate(`/investigation/${nextCaseId}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-soc-border bg-soc-surface px-4 py-3">
        <div className="relative flex min-w-0 items-center gap-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex min-w-0 items-center gap-2 rounded-lg border border-soc-border bg-soc-panel px-3 py-2 text-left transition-colors hover:border-soc-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"
          >
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-soc-primary transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            />
            <span className="truncate font-mono text-sm font-bold text-soc-text">{caseId}</span>
          </button>

          {severity && (
            <span
              className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                severityChip[severity] || severityChip.LOW
              }`}
            >
              {severity}
            </span>
          )}
          {caseRecord?.status && (
            <span className="font-mono text-[11px] uppercase text-soc-muted">
              {caseRecord.status}
            </span>
          )}
          {caseRecord?.amount != null && (
            <span className="font-mono text-sm font-semibold tabular-nums text-soc-text">
              {formatAmount(caseRecord.amount)}
            </span>
          )}

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-soc-border bg-soc-surface shadow-2xl"
            >
              <p className="flex items-center gap-1.5 border-b border-soc-border bg-soc-panel px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-soc-muted">
                <History aria-hidden="true" className="h-3 w-3" />
                Recently opened
              </p>
              {otherRecents.length === 0 ? (
                <p className="px-3 py-3 text-xs text-soc-muted">
                  No other cases opened yet in this browser.
                </p>
              ) : (
                <ul>
                  {otherRecents.map((entry) => (
                    <li key={entry.caseId}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => goTo(entry.caseId)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-soc-panel/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-soc-primary"
                      >
                        <span className="truncate font-mono text-xs text-soc-text">
                          {entry.caseId}
                        </span>
                        {entry.severity && (
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                              severityChip[entry.severity] || severityChip.LOW
                            }`}
                          >
                            {entry.severity}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsQueueOpen(true);
                }}
                className="flex w-full items-center gap-2 border-t border-soc-border px-3 py-2.5 text-left text-xs font-medium text-soc-primary transition-colors hover:bg-soc-panel/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-soc-primary"
              >
                <LayoutList aria-hidden="true" className="h-3.5 w-3.5" />
                Browse all open cases
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsQueueOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded border border-soc-border bg-soc-panel px-3 py-2 text-xs font-medium text-soc-text transition-colors hover:border-soc-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"
        >
          <LayoutList aria-hidden="true" className="h-3.5 w-3.5 text-soc-primary" />
          Switch case
        </button>
      </div>

      {resumed && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-soc-info/40 bg-soc-info/10 px-3 py-2">
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-soc-info" />
          <p className="text-xs text-soc-text">
            Resumed <span className="font-mono font-semibold">{caseId}</span> — the last case you
            opened. You did not select it on this visit.
          </p>
          <button
            type="button"
            onClick={() => setIsQueueOpen(true)}
            className="text-xs font-semibold text-soc-primary underline underline-offset-2 transition-colors hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"
          >
            Pick a different case
          </button>
        </div>
      )}

      <Modal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        title="Switch investigation"
        maxWidth="max-w-3xl"
      >
        <InvestigationQueuePicker
          title="Open a different case"
          description={`Currently investigating ${caseId}. Selecting a case below moves this workspace to it.`}
          onSelect={() => setIsQueueOpen(false)}
        />
      </Modal>
    </div>
  );
}
