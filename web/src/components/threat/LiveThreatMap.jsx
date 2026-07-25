import React, { useState, useEffect } from 'react';
import { ShieldAlert, Globe, Server, Activity } from 'lucide-react';

const targets = [
  { id: 'mumbai', name: 'Mumbai (SBI Hub)', x: 580, y: 200, ip: '10.220.14.89' },
  { id: 'new_york', name: 'New York (BofA Hub)', x: 200, y: 150, ip: '172.16.8.44' },
];

const attackOrigins = [
  { id: 'ru', name: 'St. Petersburg, RU', x: 480, y: 95, ip: '185.112.144.11', type: 'Mule Account Botnet', risk: 98, target: 'mumbai', color: '#EF4444' },
  { id: 'cn', name: 'Shenzhen, CN', x: 630, y: 130, ip: '119.24.88.102', type: 'Impossible Travel IP', risk: 92, target: 'new_york', color: '#F59E0B' },
  { id: 'br', name: 'São Paulo, BR', x: 280, y: 310, ip: '179.48.22.14', type: 'Phishing Reverse Proxy', risk: 84, target: 'mumbai', color: '#F59E0B' },
  { id: 'kp', name: 'Pyongyang, KP', x: 660, y: 125, ip: '175.45.176.4', type: 'Swift Transfer Hijack', risk: 99, target: 'new_york', color: '#EF4444' },
];

export default function LiveThreatMap() {
  const [activeAttacks, setActiveAttacks] = useState(attackOrigins);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [throughput, setThroughput] = useState(842);

  // Animate the transaction throughput metric to make the dashboard feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughput((prev) => {
        const delta = Math.floor(Math.random() * 21) - 10;
        return Math.max(750, Math.min(950, prev + delta));
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Listen for simulated attack events triggered from the sidebar
  useEffect(() => {
    const handleSimulatedAttack = (e) => {
      const { threat_name, severity, evidence } = e.detail;
      // Add a dynamic simulation attack path on the fly
      const newAttack = {
        id: `sim_${Date.now()}`,
        name: 'Simulated Target',
        x: 480 + (Math.random() * 60 - 30),
        y: 95 + (Math.random() * 60 - 30),
        ip: '109.22.84.155',
        type: threat_name,
        risk: severity === 'CRITICAL' ? 99 : 88,
        target: Math.random() > 0.5 ? 'mumbai' : 'new_york',
        color: '#EF4444'
      };
      setActiveAttacks((prev) => [newAttack, ...prev.slice(0, 4)]);
      
      // Flash threat ticker info
      setTimeout(() => {
        setActiveAttacks((prev) => prev.filter((a) => a.id !== newAttack.id));
      }, 8000);
    };

    window.addEventListener('simulate-attack', handleSimulatedAttack);
    return () => window.removeEventListener('simulate-attack', handleSimulatedAttack);
  }, []);

  return (
    <div className="flex flex-col h-full border border-soc-border bg-soc-surface rounded-lg shadow-lg overflow-hidden transition-all hover:border-soc-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-soc-border px-4 py-3 bg-soc-panel/55">
        <div className="flex items-center gap-2">
          <Globe className="h-4.5 w-4.5 text-soc-primary" />
          <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider">Live Threat Map</h3>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Active Sensors</span>
          </div>
          <span className="text-soc-muted">|</span>
          <span className="text-white">{throughput} txn/s</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 bg-[#090d16] min-h-[260px] overflow-hidden p-2 flex items-center justify-center">
        {/* Grid Overlay Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(41,53,72,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(41,53,72,0.07)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <svg viewBox="0 0 800 400" className="w-full h-auto max-h-[320px] select-none relative z-10">
          <defs>
            {/* Pulsing Gradient for Bezier Arcs */}
            <linearGradient id="attackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#6D5EF8" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Continents outlines - Cyber theme */}
          {/* North America */}
          <path d="M 60,80 L 140,80 L 220,110 L 260,160 L 210,170 L 170,210 L 120,170 L 60,110 Z" fill="rgba(22, 35, 55, 0.4)" stroke="rgba(41, 53, 72, 0.6)" strokeWidth="1.5" />
          {/* South America */}
          <path d="M 210,210 L 250,230 L 270,300 L 250,370 L 220,380 L 200,320 L 190,260 Z" fill="rgba(22, 35, 55, 0.4)" stroke="rgba(41, 53, 72, 0.6)" strokeWidth="1.5" />
          {/* Eurasia + Africa */}
          <path d="M 340,110 L 420,80 L 520,60 L 660,70 L 740,100 L 760,180 L 680,240 L 580,230 L 500,260 L 450,210 L 370,160 Z" fill="rgba(22, 35, 55, 0.4)" stroke="rgba(41, 53, 72, 0.6)" strokeWidth="1.5" />
          {/* Africa details */}
          <path d="M 370,190 L 450,210 L 480,270 L 450,330 L 410,340 L 370,250 Z" fill="rgba(22, 35, 55, 0.4)" stroke="rgba(41, 53, 72, 0.6)" strokeWidth="1.5" />
          {/* Australia */}
          <path d="M 680,290 L 740,290 L 750,340 L 690,350 Z" fill="rgba(22, 35, 55, 0.4)" stroke="rgba(41, 53, 72, 0.6)" strokeWidth="1.5" />
          {/* Greenland */}
          <path d="M 260,40 L 320,40 L 300,70 Z" fill="rgba(22, 35, 55, 0.4)" stroke="rgba(41, 53, 72, 0.6)" strokeWidth="1.5" />

          {/* Curved Attack Paths (Bezier Curves) */}
          {activeAttacks.map((origin) => {
            const dest = targets.find((t) => t.id === origin.target);
            if (!dest) return null;

            // Generate control point coordinates for curvature
            const midX = (origin.x + dest.x) / 2;
            const midY = (origin.y + dest.y) / 2 - 60; // Curve upward

            return (
              <g key={origin.id}>
                {/* Background trace line */}
                <path
                  d={`M ${origin.x},${origin.y} Q ${midX},${midY} ${dest.x},${dest.y}`}
                  fill="none"
                  stroke="rgba(109, 94, 248, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="4, 4"
                />

                {/* Animated dash attack line */}
                <path
                  d={`M ${origin.x},${origin.y} Q ${midX},${midY} ${dest.x},${dest.y}`}
                  fill="none"
                  stroke={origin.risk > 95 ? 'url(#attackGrad)' : 'rgba(245, 158, 11, 0.7)'}
                  strokeWidth="2.5"
                  strokeDasharray="15, 20"
                  style={{
                    strokeDashoffset: '400',
                    animation: 'attack-flow 4s linear infinite',
                  }}
                />
              </g>
            );
          })}

          {/* Target Nodes (Bank Headquarters) */}
          {targets.map((target) => (
            <g key={target.id}>
              {/* Inner dot */}
              <circle cx={target.x} cy={target.y} r="5" fill="#10B981" />
              {/* Ping Ring 1 */}
              <circle
                cx={target.x}
                cy={target.y}
                r="12"
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                opacity="0.6"
                className="animate-ping"
                style={{ animationDuration: '3s' }}
              />
              {/* Ping Ring 2 */}
              <circle
                cx={target.x}
                cy={target.y}
                r="22"
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                opacity="0.3"
                className="animate-ping"
                style={{ animationDuration: '4s' }}
              />
            </g>
          ))}

          {/* Attack Origin Nodes */}
          {activeAttacks.map((origin) => (
            <g
              key={origin.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(origin)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Core threat dot */}
              <circle cx={origin.x} cy={origin.y} r="4.5" fill={origin.color} />
              {/* Outer pulsing ring */}
              <circle
                cx={origin.x}
                cy={origin.y}
                r="10"
                fill="none"
                stroke={origin.color}
                strokeWidth="1.5"
                opacity="0.5"
                className="animate-pulse"
              />
            </g>
          ))}
        </svg>

        {/* Hover Information HUD overlay */}
        {hoveredNode && (
          <div className="absolute top-3 left-3 z-20 w-52 bg-[#101827]/95 border border-soc-primary/40 p-2.5 rounded shadow-2xl font-mono text-[10px] text-soc-text backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-soc-border pb-1.5 mb-1.5">
              <span className="font-black text-white">{hoveredNode.name}</span>
              <span className="px-1 py-0.2 bg-soc-danger/10 border border-soc-danger/40 text-soc-danger rounded font-bold">
                {hoveredNode.risk} RISK
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-soc-muted">IP Source:</span><span className="text-white">{hoveredNode.ip}</span></div>
              <div className="flex justify-between"><span className="text-soc-muted">Type:</span><span className="text-white text-right break-words max-w-[120px]">{hoveredNode.type}</span></div>
              <div className="flex justify-between"><span className="text-soc-muted">Target:</span><span className="text-emerald-400">SBI IN</span></div>
            </div>
          </div>
        )}

        {/* Live Attack Coordinates Ticker overlay (bottom left) */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex flex-col gap-1">
          <div className="px-2 py-1 bg-soc-surface/85 border border-soc-border rounded backdrop-blur-sm text-[9px] font-mono text-soc-muted">
            <span className="text-soc-danger font-black animate-pulse mr-1.5">●</span>
            <span>Target: Mumbai Banking Core</span>
          </div>
        </div>
      </div>

      {/* Origin Details Table */}
      <div className="border-t border-soc-border bg-soc-panel/40 p-3">
        <span className="text-[9px] font-mono font-bold tracking-wider text-soc-muted uppercase block mb-2">
          Flagged Attack Vectors
        </span>
        <div className="space-y-1.5">
          {activeAttacks.map((origin) => (
            <div
              key={origin.id}
              className="flex items-center justify-between font-mono text-[10px] bg-[#0c121e]/80 border border-soc-border/50 px-2 py-1.5 hover:border-soc-primary/40 rounded transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: origin.color }} />
                <span className="text-white font-bold">{origin.ip}</span>
                <span className="text-soc-muted">({origin.name.split(',')[1].trim()})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-soc-muted max-w-[140px] truncate">{origin.type}</span>
                <span
                  className={`px-1 py-0.2 rounded font-black border text-[9px] ${
                    origin.risk >= 95
                      ? 'bg-soc-danger/15 border-soc-danger/40 text-soc-danger'
                      : 'bg-soc-warning/15 border-soc-warning/40 text-soc-warning'
                  }`}
                >
                  {origin.risk}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inject Keyframe animation style dynamically */}
      <style>{`
        @keyframes attack-flow {
          0% {
            stroke-dashoffset: 400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
