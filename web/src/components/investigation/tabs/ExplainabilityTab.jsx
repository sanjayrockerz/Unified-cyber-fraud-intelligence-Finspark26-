import React from 'react';

import XAIWorkspace from '../XAIWorkspace';
import EvidenceLocker from '../EvidenceLocker';

export default function ExplainabilityTab({
  caseId,
  transaction,
  evaluation,
  downloadCertInReport,
}) {
  return (
    <div className="flex flex-col gap-4">
      <XAIWorkspace caseId={caseId} />
      <EvidenceLocker
        currentTxn={transaction}
        evaluation={evaluation}
        onDownloadReport={downloadCertInReport}
      />
    </div>
  );
}
