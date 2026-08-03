import React, { Suspense, useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

/**
 * Progressive-disclosure wrapper for heavy panels.
 *
 * Two flags, deliberately not one:
 *   hasOpened — children are not rendered at all until the first expand, so a
 *               collapsed section costs zero network calls and zero JS (its
 *               lazy chunk is never requested).
 *   isOpen    — after the first expand the subtree STAYS MOUNTED; collapsing
 *               only hides it.
 *
 * The mount-once behaviour is the point. Unmounting on collapse would re-fire
 * /trust-passport/{id} and /investigation/analyse every time a user toggled a
 * section, and would wipe AICopilotPanel's chat history (it holds `messages` in
 * local state with no persistence).
 */
export default function CollapsibleSection({
  title,
  description,
  icon: Icon = Layers,
  defaultOpen = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);

  const toggle = () => {
    setIsOpen((open) => {
      if (!open) setHasOpened(true);
      return !open;
    });
  };

  return (
    <section className="bg-soc-surface border border-soc-border rounded-xl overflow-hidden shadow-lg">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="w-full p-3.5 flex items-center justify-between gap-4 bg-soc-panel hover:bg-soc-border/50 text-left transition-colors font-mono text-xs font-bold text-soc-text"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon aria-hidden="true" className="w-4 h-4 shrink-0 text-soc-primary" />
          <span className="truncate">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {description && (
            <span className="hidden sm:inline text-[10px] font-normal text-soc-muted">{description}</span>
          )}
          <span className="text-[10px] text-soc-muted">{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen
            ? <ChevronUp aria-hidden="true" className="w-4 h-4 text-soc-dim" />
            : <ChevronDown aria-hidden="true" className="w-4 h-4 text-soc-dim" />}
        </span>
      </button>

      {hasOpened && (
        <div className={isOpen ? 'border-t border-soc-border p-4' : 'hidden'}>
          <Suspense
            fallback={<div className="p-4 font-mono text-xs text-soc-muted">Loading panel…</div>}
          >
            {children}
          </Suspense>
        </div>
      )}
    </section>
  );
}
