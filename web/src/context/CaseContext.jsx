import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// This store holds only what the analyst actually did: which cases they opened,
// most recent first. It seeds nothing. An empty history is a real state that the
// Investigation route handles by showing a queue picker -- it must never be
// papered over with a default case id.

const RECENTS_KEY = 'investigation:recent-cases';
const MAX_RECENTS = 5;

function readRecents() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((entry) => entry && entry.caseId) : [];
  } catch {
    return [];
  }
}

function writeRecents(entries) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable -- in-memory state still works for this session */
  }
}

const CaseContext = createContext({
  recentCases: [],
  lastCase: null,
  pushRecent: () => {},
  clearRecents: () => {},
  selectCase: () => {},
});

export function CaseProvider({ children }) {
  const [recentCases, setRecentCases] = useState(readRecents);

  const pushRecent = useCallback((entry) => {
    if (!entry?.caseId) return;
    setRecentCases((previous) => {
      const next = [
        { ...entry, openedAt: new Date().toISOString() },
        ...previous.filter((item) => item.caseId !== entry.caseId),
      ].slice(0, MAX_RECENTS);
      writeRecents(next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecentCases([]);
    writeRecents([]);
  }, []);

  // Kept for ThreatIntelligenceDashboard, which records a case the analyst
  // pivoted to from a threat. It is the same action as opening one.
  const selectCase = useCallback((caseId) => pushRecent({ caseId }), [pushRecent]);

  const value = useMemo(
    () => ({
      recentCases,
      lastCase: recentCases[0] || null,
      pushRecent,
      clearRecents,
      selectCase,
    }),
    [recentCases, pushRecent, clearRecents, selectCase],
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  return useContext(CaseContext);
}
