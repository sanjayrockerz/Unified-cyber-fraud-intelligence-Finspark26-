import React, { useState } from 'react';
import { ShieldAlert, FileText, CheckCircle2, Lock, Sparkles, Download, MessageSquare } from 'lucide-react';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function EvidenceLocker({ currentTxn, evaluation, onDownloadReport }) {
  // The note starts empty. Pre-filling it with a conclusion put words in the
  // analyst's mouth about a transfer that was not necessarily the one on screen.
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionExecuted, setDecisionExecuted] = useState(null);

  // Artifacts are the evidence this case actually has, in the order it arrived.
  const artifacts = [
    ...(evaluation?.threats ?? []).map((threat) => ({
      key: threat.threat_id,
      tone: 'bg-soc-danger',
      label: `Threat: ${threat.threat_name}`,
      meta: threat.severity,
    })),
    currentTxn && {
      key: currentTxn.txn_id,
      tone: 'bg-soc-warning',
      label: `Txn ${currentTxn.txn_id}: ${currency.format(Number(currentTxn.amount || 0))} (${currentTxn.nameOrig} → ${currentTxn.nameDest})`,
      meta: currentTxn.timestamp,
    },
    ...(evaluation?.graph?.findings ?? []).map((finding, index) => ({
      key: `graph-${index}`,
      tone: 'bg-soc-quantum',
      label: `Graph: ${finding.finding_type} (${finding.entities?.length ?? 0} entities)`,
      meta: finding.severity,
    })),
  ].filter(Boolean);

  const handleAction = (actionType) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setDecisionExecuted(actionType);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="bg-soc-panel border border-soc-border rounded-xl p-4 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-soc-border pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-soc-primary" />
            <h3 className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider">
              Analyst Evidence Locker & Decision Execution
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-soc-surface text-soc-muted border border-soc-border">
            CERT-In 6-Hour Compliance Queue
          </span>
        </div>

        {/* Pinned Evidence Checklist */}
        <div className="space-y-2 mb-4">
          <span className="text-[10px] font-mono uppercase text-soc-dim">Pinned Case Artifacts</span>

          {artifacts.length === 0 ? (
            <p className="p-2 rounded bg-soc-surface border border-soc-border text-xs font-mono text-soc-muted">
              No evidence recorded for this case yet.
            </p>
          ) : (
            artifacts.map((artifact) => (
              <div
                key={artifact.key}
                className="p-2 rounded bg-soc-surface border border-soc-border flex items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`w-2 h-2 shrink-0 rounded-full ${artifact.tone}`}></span>
                  <span className="truncate text-soc-text">{artifact.label}</span>
                </div>
                <span className="shrink-0 text-soc-dim text-[10px]">{artifact.meta}</span>
              </div>
            ))
          )}
        </div>

        {/* Analyst Notes Editor */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono uppercase text-soc-dim">
            <MessageSquare className="w-3 h-3" />
            <span>Analyst Rationale Log</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-soc-surface border border-soc-border rounded p-2 text-xs font-mono text-soc-text focus:outline-none focus:border-soc-primary"
            placeholder="Enter analyst justification notes here..."
          />
        </div>
      </div>

      {/* Decision Execution Bar */}
      <div>
        {decisionExecuted ? (
          <div className="p-3 bg-soc-success/10 border border-soc-success/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-soc-success" />
              <span className="text-xs font-mono font-bold text-soc-success">
                CASE RESOLVED: {decisionExecuted} EXECUTION RECORDED
              </span>
            </div>
            <button
              onClick={onDownloadReport}
              className="px-3 py-1 bg-soc-primary hover:bg-soc-primary text-soc-onPrimary rounded text-xs font-mono flex items-center gap-1.5 transition-colors shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CERT-In PDF</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('BLOCK & INTERCEPT')}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-soc-danger hover:bg-soc-danger text-soc-onPrimary rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-950/40"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isSubmitting ? 'ENFORCING...' : 'CONFIRM BLOCK'}</span>
              </button>

              <button
                onClick={() => handleAction('CHALLENGE MFA')}
                disabled={isSubmitting}
                className="px-3 py-2 bg-soc-warning hover:bg-soc-warning text-soc-onPrimary rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>STEP-UP MFA</span>
              </button>

              <button
                onClick={onDownloadReport}
                className="px-3 py-2 bg-soc-surface hover:bg-soc-border border border-soc-border text-soc-text rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                title="Generate CERT-In PDF Report"
              >
                <FileText className="w-4 h-4 text-soc-primary" />
                <span>CERT-In PDF</span>
              </button>
            </div>
            <p className="text-[10px] text-soc-dim mt-1">Simulated action — no live enforcement call is made.</p>
          </div>
        )}
      </div>
    </div>
  );
}

