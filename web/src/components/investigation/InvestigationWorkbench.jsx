import React, { useState, useEffect, useRef } from 'react';
import { authenticatedWebSocketUrl } from '../../platformAuth';
import { 
  ShieldAlert, 
  User, 
  Clock, 
  RefreshCw, 
  FileText, 
  Lock, 
  Sparkles, 
  Layers, 
  Radio, 
  Landmark, 
  Cpu, 
  Terminal, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Download,
  Zap,
  Users,
  History,
  ShieldCheck
} from 'lucide-react';

import EnterpriseBadge from '../common/EnterpriseBadge';
import RiskScoreGauge from '../common/RiskScoreGauge';
import Neo4jGraphStudio from '../graph/Neo4jGraphStudio';
import EvidenceLocker from './EvidenceLocker';
import XAIWorkspace from './XAIWorkspace';
import TimelineEvent from '../timeline/TimelineEvent';
import TransactionTable from '../tables/TransactionTable';
import FraudDevToolsInspector from '../runtime/FraudDevToolsInspector';
import NarrativeAIStoryteller from '../runtime/NarrativeAIStoryteller';

// Fusion Response Fabric Modules
import ResponseOrchestrator from '../fabric/ResponseOrchestrator';
import BlastRadiusAnalysis from '../fabric/BlastRadiusAnalysis';
import TrustFabric from '../fabric/TrustFabric';
import SimilarIncidentSearch from '../fabric/SimilarIncidentSearch';
import AnalystCollaboration from '../fabric/AnalystCollaboration';
import LearningLoop from '../fabric/LearningLoop';
import DigitalTwinBaseline from '../fabric/DigitalTwinBaseline';
import SessionTrustPassportPanel from '../trust/SessionTrustPassportPanel';
import InvestigationIntelligencePanel from './InvestigationIntelligencePanel';
import QuantumTrustPanel from '../quantum/QuantumTrustPanel';
import VerdictHero from '../common/VerdictHero';


const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');


const WS_BASE = API_BASE.replace(/^http/, 'ws');

export default function InvestigationWorkbench({ caseId = 'CASE-2026-8942' }) {
  const [cyberEvents, setCyberEvents] = useState([]);
  const [cbsTransactions, setCbsTransactions] = useState([]);
  const [currentTxn, setCurrentTxn] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('orchestrator');

  const wsRef = useRef(null);

  const sessionId = evaluation?.session_id || currentTxn?.session_id || 'SESS_9921_CRITICAL';

  useEffect(() => {
    startSynchronizedReplay();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [caseId]);

  const startSynchronizedReplay = () => {
    setCyberEvents([]);
    setCbsTransactions([]);
    setCurrentTxn(null);
    setEvaluation(null);
    setIsPlaying(true);

    if (wsRef.current) wsRef.current.close();
    wsRef.current = new WebSocket(authenticatedWebSocketUrl(`${WS_BASE}/ws/stream`));

    wsRef.current.onmessage = async (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.msg_type === 'status') return;

        if (data.msg_type === 'cyber_event') {
          setCyberEvents(prev => [data, ...prev]);
        }

        if (data.msg_type === 'transaction') {
          setCurrentTxn(data);
          setCbsTransactions(prev => [data, ...prev]);

          const res = await fetch(`${API_BASE}/evaluate/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await res.json();
          setEvaluation(result);

          const newNodes = [
            { id: data.nameOrig, group: 'user', val: 22, name: 'Sender: ' + data.nameOrig, color: '#3B82F6', pagerank: '0.0042' },
            { id: data.nameDest, group: 'account', val: 30, name: 'Receiver: ' + data.nameDest, isMule: true, color: '#EF4444', pagerank: '0.0450' }
          ];
          const newLinks = [
            { source: data.nameOrig, target: data.nameDest, label: 'TRANSFER' }
          ];

          if (data.dest_mule_cluster_id) {
            newNodes.push({ id: data.dest_mule_cluster_id, group: 'mule_ring', val: 35, name: 'Mule Cluster: ' + data.dest_mule_cluster_id, isMule: true, color: '#DC2626' });
            newLinks.push({ source: data.nameDest, target: data.dest_mule_cluster_id, label: 'belongs_to' });

            for (let i = 1; i <= 5; i++) {
              const muleId = `mule_acc_${i}`;
              newNodes.push({ id: muleId, group: 'account', val: 15, name: 'Mule Account: ' + muleId, isMule: true, color: '#EF4444' });
              newLinks.push({ source: data.dest_mule_cluster_id, target: muleId, label: 'ring_member' });
            }
          }
          setGraphData({ nodes: newNodes, links: newLinks });
        }
      } catch (e) {
        console.error("Stream evaluation error:", e);
      }
    };
  };

  const handleDownloadCertInReport = async () => {
    // Fall back to the same demo payload every other panel on this page already uses
    // (activeTxnPayload/activeEvalPayload below) so the button stays live even before
    // a real transaction has arrived over the replay WebSocket.
    const txn = currentTxn || activeTxnPayload;
    const evalResult = evaluation || activeEvalPayload;
    if (!txn || !evalResult) return;
    try {
      const res = await fetch(`${API_BASE}/report/cert-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txn_id: txn.txn_id || 'txn_demo_999',
          user_id: txn.user_id || 'usr_abc',
          amount: txn.amount || 750000.0,
          reasons: evalResult.reasons || ["High risk transaction"],
          score: evalResult.score || 94.0
        })
      });
      if (!res.ok) throw new Error(`Report generation failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CERT-In_Report_${txn.txn_id || 'CASE'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CERT-In report download error:", e);
    }
  };

  const activeTxnPayload = currentTxn || {
    txn_id: 'txn_demo_999',
    user_id: 'usr_abc',
    nameOrig: 'ACC_ABC_123',
    nameDest: 'ACC_MULE_NEW',
    amount: 750000.0,
    type: 'TRANSFER',
    ip: '185.15.2.22',
    device_id: 'dev_9999',
    cyber_compromise_in_window: true,
    dest_mule_cluster_id: 'cluster_alpha'
  };

  const activeEvalPayload = evaluation || {
    action: 'BLOCK',
    score: 94.0,
    reasons: [
      "High baseline fraud probability (Tabular Score: 0.82)",
      "Recent cyber compromise detected (Login from unusual IP prior to transfer)",
      "Beneficiary is part of a known mule cluster (cluster_alpha)"
    ],
    shap_features: [
      { feature: "log_amount", impact: 1.2 },
      { feature: "cyber_flag", impact: 2.1 },
      { feature: "dest_balance_ratio", impact: 0.8 },
      { feature: "time_since_last_txn", impact: -0.4 }
    ],
    counterfactual_sentence: "Counterfactual: With no prior cyber compromise, score = 61 -> CHALLENGE, not BLOCK."
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 max-w-[1850px] mx-auto select-none font-sans text-soc-text">

      <VerdictHero
        verdict={activeEvalPayload.action}
        score={activeEvalPayload.score}
        reason={activeEvalPayload.counterfactual_sentence || activeEvalPayload.reasons?.[0] || 'No explanation available for this decision yet.'}
        timestamp={currentTxn?.timestamp}
      />

      {/* 1. TOP METADATA & REPLAY CONTROL STRIP */}
      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex min-w-0 items-center gap-4">
          <div className="p-3 bg-soc-danger/10 border border-soc-danger/30 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-soc-danger animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-soc-bg border border-soc-border text-soc-muted">
                FUSION INVESTIGATION WORKBENCH #{caseId}
              </span>
              <span className="text-xs font-mono text-soc-dim">Incident SLA: 03m 22s Remaining</span>
            </div>
            <h1 className="mt-0.5 flex flex-wrap items-center gap-3 text-lg font-mono font-black tracking-wide text-soc-text">
              ACCOUNT TAKEOVER & INR 7.5L UPI FRAUD TRANSFER
              <EnterpriseBadge action={activeEvalPayload.action} score={activeEvalPayload.score} size="sm" />
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 font-mono text-xs">
          <div className="hidden xl:flex flex-col border-r border-soc-border pr-6">
            <span className="text-[10px] text-soc-dim uppercase">Target Customer</span>
            <span className="font-bold text-soc-text">usr_abc (ACC_ABC_123)</span>
          </div>

          <div className="hidden xl:flex flex-col border-r border-soc-border pr-6">
            <span className="text-[10px] text-soc-dim uppercase">Assigned SOC Specialist</span>
            <span className="font-bold text-soc-primary">Analyst_04 (Tier-3)</span>
          </div>

          <div className="flex items-center gap-2 bg-soc-bg border border-soc-border px-3 py-1.5 rounded-lg shadow-inner">
            <button onClick={startSynchronizedReplay} className="p-1 text-soc-primary hover:text-soc-primary transition-colors" title="Restart Replay">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 text-soc-text hover:text-soc-onPrimary transition-colors">
              {isPlaying ? <Pause className="w-4 h-4 text-soc-warning" /> : <Play className="w-4 h-4 text-soc-success" />}
            </button>
            <span className="text-[11px] text-soc-muted">Replay: <strong className="text-soc-text">10:00:40 IST</strong></span>
          </div>

          <button onClick={handleDownloadCertInReport} className="px-3.5 py-2 bg-soc-primary hover:bg-soc-primary text-soc-onPrimary rounded-lg font-bold flex items-center gap-2 transition-colors shadow">
            <Download className="w-4 h-4" />
            <span>CERT-In PDF</span>
          </button>
        </div>
      </div>

      {/* 2. NARRATIVE AI STORYTELLER */}
      <NarrativeAIStoryteller activeTxn={activeTxnPayload} evaluation={activeEvalPayload} />

      {/* 3. DIGITAL TWIN CUSTOMER BASELINE */}
      <DigitalTwinBaseline userId={activeTxnPayload.user_id} />

      {/* 3.5. PRE-TRANSACTION SESSION TRUST PASSPORT */}
      <SessionTrustPassportPanel sessionId={sessionId} activeTxn={activeTxnPayload} />

      {/* 3.8. INVESTIGATION INTELLIGENCE LAYER */}
      <InvestigationIntelligencePanel caseId={caseId} activeTxn={activeTxnPayload} />

      {/* 3.9. FUSION QUANTUM TRUST LAYER */}
      <QuantumTrustPanel />


      {/* 4. MAIN THREE-PANE OPERATIONAL WORKSPACE */}


      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">
        
        {/* LEFT PANEL: CYBER SIEM TELEMETRY (3/12) */}
        <div className="min-w-0 lg:col-span-3 bg-soc-surface border border-soc-border rounded-xl p-3 flex flex-col h-[520px] shadow-lg">
          <div className="flex items-center justify-between border-b border-soc-border pb-2 mb-3">
            <span className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-soc-danger" />
              <span>1. SIEM Cyber Telemetry</span>
            </span>
            <span className="text-[10px] font-mono text-soc-danger bg-soc-danger/10 px-1.5 py-0.5 rounded border border-soc-danger/30">
              {cyberEvents.length} Alerts
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <TimelineEvent events={cyberEvents.length > 0 ? cyberEvents : [
              { timestamp: "2026-07-16 10:00:00", event_type: "impossible_travel_login", user_id: "usr_abc", ip: "185.15.2.22", severity: "critical", km_from_baseline: 4500 },
              { timestamp: "2026-07-16 09:58:12", event_type: "new_device_mfa_cookie_reuse", user_id: "usr_abc", ip: "185.15.2.22", severity: "medium", km_from_baseline: 12 }
            ]} />
          </div>
        </div>

        {/* CENTER PANEL: CUSTOMER 360 & NEO4J THREAT GRAPH STUDIO (6/12) */}
        <div className="min-w-0 lg:col-span-6 flex flex-col gap-4 h-[520px]">
          <div className="flex-1 bg-soc-surface border border-soc-border rounded-xl overflow-hidden shadow-lg">
            <Neo4jGraphStudio graphData={graphData} />
          </div>
        </div>

        {/* RIGHT PANEL: CORE BANKING LEDGER (3/12) */}
        <div className="min-w-0 lg:col-span-3 bg-soc-surface border border-soc-border rounded-xl p-3 flex flex-col h-[520px] shadow-lg">
          <div className="flex items-center justify-between border-b border-soc-border pb-2 mb-3">
            <span className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-soc-primary" />
              <span>2. Core Banking Ledger</span>
            </span>
            <span className="text-[10px] font-mono text-soc-primary bg-soc-primary/10 px-1.5 py-0.5 rounded border border-soc-primary/30">
              {cbsTransactions.length} Txns
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <TransactionTable events={cbsTransactions.length > 0 ? cbsTransactions : [
              { timestamp: "2026-07-16 10:00:40", txn_id: "txn_demo_999", type: "TRANSFER", amount: 750000.0, nameOrig: "ACC_ABC_123", nameDest: "ACC_MULE_NEW" }
            ]} />
          </div>
        </div>
      </div>

      {/* 5. RESPONSE ORCHESTRATOR & BLAST RADIUS ANALYSIS */}
      <ResponseOrchestrator activeCase={activeEvalPayload} onDownloadReport={handleDownloadCertInReport} />
      <BlastRadiusAnalysis activeTxn={activeTxnPayload} />

      {/* 6. TRUST FABRIC & SIMILAR INCIDENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <TrustFabric activeTxn={activeTxnPayload} evaluation={activeEvalPayload} />
        </div>
        <div className="lg:col-span-6">
          <SimilarIncidentSearch activeCase={caseId} />
        </div>
      </div>


      {/* 7. COLLABORATION SUITE & MLOPS LEARNING LOOP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <AnalystCollaboration caseId={caseId} />
        </div>
        <div className="lg:col-span-5">
          <LearningLoop caseId={caseId} />
        </div>
      </div>

      {/* 8. SHAP & COUNTERFACTUAL XAI WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <XAIWorkspace evaluation={activeEvalPayload} />
        </div>
        <div className="lg:col-span-5">
          <EvidenceLocker currentTxn={activeTxnPayload} evaluation={activeEvalPayload} onDownloadReport={handleDownloadCertInReport} />
        </div>
      </div>

      {/* 9. FRAUD DEVTOOLS INSPECTOR */}
      <div className="h-[360px]">
        <FraudDevToolsInspector activeTxn={activeTxnPayload} evaluation={activeEvalPayload} />
      </div>

    </div>
  );
}

