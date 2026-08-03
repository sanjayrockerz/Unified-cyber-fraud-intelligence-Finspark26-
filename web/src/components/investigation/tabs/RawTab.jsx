import React, { lazy, Suspense } from 'react';
import { Atom } from 'lucide-react';

import FraudDevToolsInspector from '../../runtime/FraudDevToolsInspector';
import CollapsibleSection from '../../common/CollapsibleSection';

// Quantum posture fires four /quantum/* requests on mount, and is adjacent to
// rather than part of the fraud/cyber decision. It stays collapsed and lazy.
const QuantumTrustPanel = lazy(() => import('../../quantum/QuantumTrustPanel'));

export default function RawTab({ transaction, evaluation }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[420px]">
        <FraudDevToolsInspector activeTxn={transaction} evaluation={evaluation} />
      </div>

      <CollapsibleSection
        title="Quantum Trust Posture"
        description="TLS cipher-suite readiness and HNDL exposure"
        icon={Atom}
      >
        <Suspense
          fallback={<div className="p-4 font-mono text-xs text-soc-muted">Loading posture…</div>}
        >
          <QuantumTrustPanel />
        </Suspense>
      </CollapsibleSection>
    </div>
  );
}
