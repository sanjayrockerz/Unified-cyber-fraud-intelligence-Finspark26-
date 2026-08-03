import React, { useRef } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import InvestigationWorkbench from '../components/investigation/InvestigationWorkbench';
import InvestigationQueuePicker from '../components/investigation/InvestigationQueuePicker';
import { useCase } from '../context/CaseContext';

/**
 * Resolves which case the investigation workspace should open.
 *
 * The rule, in order:
 *   1. A case id in the URL wins. It is the only source of truth, so deep links
 *      and browser history behave.
 *   2. No case id, but this analyst has opened one before -> redirect to it and
 *      flag the visit as resumed, so the workspace can say why it is showing
 *      that case rather than presenting it as a deliberate choice.
 *   3. No case id and no history -> open nothing. Show the queue and ask.
 *
 * What this replaces: a hardcoded `caseId || 'CASE-2026-8942'`, which pointed at
 * a case that does not exist in the store at all.
 */
export default function InvestigationPage() {
  const { caseId } = useParams();
  const location = useLocation();
  const { lastCase } = useCase();

  // Read once per mount. Reading it live would make the redirect below depend on
  // the value it is about to write.
  const resumeCandidate = useRef(lastCase?.caseId ?? null).current;
  const resumed = Boolean(location.state?.resumed);

  // Recording the visit is deliberately left to the workbench, which only does
  // it once the case has actually resolved. Recording it here would remember a
  // case id that 404s and then resume into that dead end on the next visit.

  if (caseId) {
    return <InvestigationWorkbench caseId={caseId} resumed={resumed} />;
  }

  if (resumeCandidate) {
    return (
      <Navigate to={`/investigation/${resumeCandidate}`} replace state={{ resumed: true }} />
    );
  }

  return <InvestigationQueuePicker />;
}
