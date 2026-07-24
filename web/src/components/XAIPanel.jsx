import React from 'react';

export default function XAIPanel({ evaluation }) {
  if (!evaluation) return null;
  const { shap_features, counterfactual_sentence } = evaluation;

  return (
    <div className="bg-soc-panel rounded-xl border border-soc-border overflow-hidden shrink-0">
      <div className="p-3 border-b border-soc-border bg-soc-overlay/20">
        <h2 className="font-semibold text-soc-muted text-sm">Explainability (XAI)</h2>
      </div>
      <div className="p-4 flex gap-6">
        
        <div className="flex-1">
          <h4 className="text-xs uppercase text-soc-muted mb-3 font-semibold">Top Contributing Features (SHAP)</h4>
          <div className="space-y-2">
            {shap_features?.map((f, i) => {
              const impact = f.impact;
              const width = Math.min(100, Math.max(5, Math.abs(impact) * 20)); // scale for demo visualization
              const isPositive = impact > 0;
              return (
                <div key={i} className="flex items-center text-xs">
                  <div className="w-32 truncate text-soc-muted mr-2" title={f.feature}>{f.feature}</div>
                  <div className="flex-1 flex items-center">
                    {!isPositive && <div className="flex-1 flex justify-end"><div className="h-1.5 bg-soc-success rounded-l" style={{ width: `${width}%` }}></div></div>}
                    {isPositive && <div className="flex-1"></div>}
                    <div className="w-px h-3 bg-soc-panel mx-1"></div>
                    {isPositive && <div className="flex-1"><div className="h-1.5 bg-soc-danger rounded-r" style={{ width: `${width}%` }}></div></div>}
                    {!isPositive && <div className="flex-1"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {counterfactual_sentence && (
          <div className="flex-1 border-l border-soc-border pl-6 flex flex-col justify-center">
            <h4 className="text-xs uppercase text-soc-muted mb-2 font-semibold text-soc-primary">Quantum-Ready Counterfactual</h4>
            <div className="text-sm text-soc-muted italic leading-relaxed border-l-2 border-soc-primary pl-3">
              "{counterfactual_sentence.replace('Counterfactual: ', '')}"
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

