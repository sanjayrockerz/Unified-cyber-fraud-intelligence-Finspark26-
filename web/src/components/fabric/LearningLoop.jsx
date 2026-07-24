import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function LearningLoop({ caseId }) {
  const [feedback, setFeedback] = useState('CONFIRMED_FRAUD');
  const [isQueued, setIsQueued] = useState(false);

  const handleSubmitFeedback = () => {
    setIsQueued(true);
  };

  return (
    <div className="bg-soc-panel border border-soc-border rounded-xl p-4 shadow-lg select-none font-mono text-xs">
      <div className="flex items-center justify-between border-b border-soc-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-soc-success" />
          <div>
            <h3 className="font-bold text-soc-text text-xs uppercase tracking-wider">
              Continuous Model Learning Loop â€” Closed Case Feedback
            </h3>
            <span className="text-[10px] text-soc-muted">
              Label closed cases to queue dataset updates for supervised model retraining
            </span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-soc-success/10 text-soc-success border border-soc-success/30">
          MLOps REVIEW QUEUE
        </span>
      </div>

      {!isQueued ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="feedback"
                value="CONFIRMED_FRAUD"
                checked={feedback === 'CONFIRMED_FRAUD'}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <span className="text-soc-danger font-bold">Confirmed Fraud (Label True Positive)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="feedback"
                value="FALSE_POSITIVE"
                checked={feedback === 'FALSE_POSITIVE'}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <span className="text-soc-warning font-bold">False Positive (Label Clean Baseline)</span>
            </label>
          </div>

          <button
            onClick={handleSubmitFeedback}
            className="px-4 py-1.5 bg-soc-success hover:bg-soc-success text-soc-onPrimary rounded font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Feedback to Retraining Queue</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-soc-success/10 border border-soc-success/30 rounded-lg flex items-center justify-between text-soc-success font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>CASE LABEL RECORDED: QUEUED FOR MODEL RETRAIN REVIEW</span>
          </div>
          <span className="text-[10px] text-soc-success">Queue ID: ML_LABEL_8842</span>
        </div>
      )}
    </div>
  );
}

