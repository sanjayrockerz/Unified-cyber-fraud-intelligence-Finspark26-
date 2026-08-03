import React from 'react';

import ResponseOrchestrator from '../../fabric/ResponseOrchestrator';
import BlastRadiusAnalysis from '../../fabric/BlastRadiusAnalysis';
import AnalystCollaboration from '../../fabric/AnalystCollaboration';
import LearningLoop from '../../fabric/LearningLoop';
import InvestigationIntelligencePanel from '../InvestigationIntelligencePanel';
import SimilarIncidentSearch from '../../fabric/SimilarIncidentSearch';

export default function ResponseTab({ caseId, transaction, evaluation, downloadCertInReport }) {
  return (
    <div className="flex flex-col gap-4">
      <ResponseOrchestrator
        caseId={caseId}
        transaction={transaction}
        onDownloadReport={downloadCertInReport}
      />
      <BlastRadiusAnalysis caseId={caseId} />
      <InvestigationIntelligencePanel caseId={caseId} activeTxn={transaction} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AnalystCollaboration caseId={caseId} />
        </div>
        <div className="lg:col-span-5">
          <LearningLoop caseId={caseId} />
        </div>
      </div>

      <SimilarIncidentSearch caseId={caseId} />
    </div>
  );
}
