import React, { useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, RefreshCw, Layers, ShieldAlert } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// 100-ENTITY SYNTHETIC FRAUD INTELLIGENCE GRAPH
// 20 Users · 25 Accounts (8 mule) · 5 Mule Clusters · 20 IP Addresses
// 15 Devices · 10 Merchant Nodes · 5 VPN Exit Nodes
// 130+ edges covering TRANSFER, LOGIN, DEVICE_USED, BELONGS_TO, VPN_EXIT etc.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_GRAPH = (() => {
  const nodes = [];
  const links = [];

  // ── 5 Mule Clusters (hub nodes) ───────────────────────────────────────────
  const clusters = [
    { id: 'CLUSTER_ALPHA', label: 'Mule Cluster α (26 rings)', pagerank: '0.0821', betweenness: '0.412' },
    { id: 'CLUSTER_BETA',  label: 'Mule Cluster β (18 rings)', pagerank: '0.0744', betweenness: '0.381' },
    { id: 'CLUSTER_GAMMA', label: 'Mule Cluster γ (12 rings)', pagerank: '0.0612', betweenness: '0.290' },
    { id: 'CLUSTER_DELTA', label: 'Mule Cluster δ (8 rings)',  pagerank: '0.0530', betweenness: '0.215' },
    { id: 'CLUSTER_ZETA',  label: 'Mule Cluster ζ (6 rings)',  pagerank: '0.0481', betweenness: '0.188' },
  ];
  clusters.forEach(c => nodes.push({
    id: c.id, group: 'mule_ring', val: 40,
    name: c.label, color: '#DC2626',
    pagerank: c.pagerank, betweenness: c.betweenness, isMule: true,
  }));

  // ── 20 Legitimate Users ───────────────────────────────────────────────────
  const userNames = [
    'Rajesh Kumar','Priya Sharma','Arjun Mehta','Sneha Iyer','Vikram Singh',
    'Ananya Das','Rohit Verma','Kavya Nair','Suresh Patel','Divya Joshi',
    'Manish Gupta','Pooja Reddy','Kiran Rao','Aarav Kapoor','Deepa Menon',
    'Sanjay Tiwari','Meera Pillai','Nitin Chandra','Lata Bose','Arun Kumar',
  ];
  userNames.forEach((name, i) => {
    const uid = `USR_${String(i + 1).padStart(3, '0')}`;
    nodes.push({
      id: uid, group: 'user', val: 22,
      name: `User: ${name}`, color: '#3B82F6',
      pagerank: (0.003 + Math.random() * 0.008).toFixed(4),
      betweenness: (Math.random() * 0.05).toFixed(3),
      isMule: false,
    });
  });

  // ── 25 Bank Accounts (8 are mule accounts) ───────────────────────────────
  for (let i = 1; i <= 25; i++) {
    const isMule = i <= 8;
    const clusterParent = clusters[Math.floor((i - 1) / 2) % clusters.length];
    nodes.push({
      id: `ACC_${String(i).padStart(4, '0')}`,
      group: isMule ? 'mule_account' : 'account',
      val: isMule ? 20 : 14,
      name: isMule ? `Mule Account #${i}` : `Bank Account #${i}`,
      color: isMule ? '#EF4444' : '#10B981',
      pagerank: isMule
        ? (0.010 + Math.random() * 0.035).toFixed(4)
        : (0.001 + Math.random() * 0.005).toFixed(4),
      betweenness: isMule
        ? (0.05 + Math.random() * 0.15).toFixed(3)
        : (Math.random() * 0.02).toFixed(3),
      isMule,
      clusterParent: isMule ? clusterParent.id : null,
    });
    if (isMule) links.push({ source: `ACC_${String(i).padStart(4, '0')}`, target: clusterParent.id, label: 'belongs_to' });
  }

  // ── 20 IP Addresses (6 suspicious / VPN / TOR) ───────────────────────────
  const ips = [
    { ip: '185.15.2.22',   suspicious: true,  label: 'TOR Exit Node'   },
    { ip: '91.108.4.1',    suspicious: true,  label: 'VPN (Russia)'    },
    { ip: '103.217.49.2',  suspicious: true,  label: 'VPN (Romania)'   },
    { ip: '45.33.48.61',   suspicious: true,  label: 'Proxy Server'    },
    { ip: '198.54.117.10', suspicious: true,  label: 'DataCenter IP'   },
    { ip: '176.67.168.30', suspicious: true,  label: 'Anonymous Proxy' },
    { ip: '117.21.4.5',    suspicious: false, label: 'Residential'     },
    { ip: '59.183.2.100',  suspicious: false, label: 'Residential'     },
    { ip: '122.15.67.3',   suspicious: false, label: 'Residential'     },
    { ip: '49.32.78.9',    suspicious: false, label: 'Residential'     },
    { ip: '111.90.3.55',   suspicious: false, label: 'Residential'     },
    { ip: '203.88.142.7',  suspicious: false, label: 'Residential'     },
    { ip: '157.44.9.12',   suspicious: false, label: 'Mobile ISP'      },
    { ip: '116.75.34.22',  suspicious: false, label: 'Mobile ISP'      },
    { ip: '182.64.55.11',  suspicious: false, label: 'Mobile ISP'      },
    { ip: '27.56.33.44',   suspicious: false, label: 'Corporate'       },
    { ip: '14.232.11.8',   suspicious: false, label: 'Corporate'       },
    { ip: '8.8.0.100',     suspicious: false, label: 'Corporate'       },
    { ip: '172.217.5.110', suspicious: false, label: 'CDN Relay'       },
    { ip: '1.1.1.100',     suspicious: false, label: 'CDN Relay'       },
  ];
  ips.forEach(({ ip, suspicious, label }) => {
    nodes.push({
      id: `IP_${ip}`, group: 'ip', val: suspicious ? 18 : 12,
      name: `IP ${ip} — ${label}`,
      color: suspicious ? '#F59E0B' : '#64748B',
      pagerank: (0.001 + Math.random() * 0.004).toFixed(4),
      betweenness: (Math.random() * 0.03).toFixed(3),
      isMule: false, suspicious,
    });
  });

  // ── 15 Devices ────────────────────────────────────────────────────────────
  const deviceModels = [
    'iPhone 15 Pro','Samsung S24','OnePlus 12','Redmi Note 13',
    'Pixel 8 Pro','Oppo Reno 10','Vivo X90','Realme GT5',
    'Motorola Edge 40','Nokia G60','iPad Pro','Lenovo Tab',
    'Windows PC','MacBook Pro','Linux Workstation',
  ];
  deviceModels.forEach((model, i) => {
    const isNew = i < 5;
    nodes.push({
      id: `DEV_${String(i + 1).padStart(3, '0')}`,
      group: 'device', val: isNew ? 16 : 11,
      name: `${model}${isNew ? ' [NEW]' : ''}`,
      color: '#8B5CF6',
      pagerank: (0.001 + Math.random() * 0.003).toFixed(4),
      betweenness: (Math.random() * 0.02).toFixed(3),
      isMule: false, isNewDevice: isNew,
    });
  });

  // ── 10 Merchant / Beneficiary Nodes ──────────────────────────────────────
  const merchants = [
    'Amazon Pay','Flipkart Pay','Paytm Merchant','PhonePe Biz',
    'Google Pay Biz','HDFC Merchant','SBI POS','ICICI POS',
    'Axis NetBanking','Razorpay Gateway',
  ];
  merchants.forEach((m, i) => {
    nodes.push({
      id: `MER_${String(i + 1).padStart(3, '0')}`,
      group: 'merchant', val: 13,
      name: `Merchant: ${m}`,
      color: '#06B6D4',
      pagerank: (0.002 + Math.random() * 0.006).toFixed(4),
      betweenness: (Math.random() * 0.04).toFixed(3),
      isMule: false,
    });
  });

  // ── 5 VPN Exit Nodes (separate from IP nodes) ─────────────────────────────
  const vpns = [
    'VPN_EXIT_RU_01','VPN_EXIT_RO_02','VPN_EXIT_CN_03','VPN_EXIT_UA_04','VPN_EXIT_TR_05',
  ];
  vpns.forEach((vpn, i) => {
    nodes.push({
      id: vpn, group: 'vpn', val: 20,
      name: `VPN Exit: ${vpn.replace('VPN_EXIT_', '')}`,
      color: '#F97316',
      pagerank: (0.004 + Math.random() * 0.008).toFixed(4),
      betweenness: (0.05 + Math.random() * 0.12).toFixed(3),
      isMule: false, suspicious: true,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EDGES
  // ─────────────────────────────────────────────────────────────────────────

  // Users ↔ Accounts (each user owns 1-2 accounts)
  const userIds = userNames.map((_, i) => `USR_${String(i + 1).padStart(3, '0')}`);
  const accIds  = Array.from({ length: 25 }, (_, i) => `ACC_${String(i + 1).padStart(4, '0')}`);

  userIds.forEach((uid, i) => {
    links.push({ source: uid, target: accIds[i % 25], label: 'owns' });
    if (i % 3 === 0) links.push({ source: uid, target: accIds[(i + 5) % 25], label: 'co_signatory' });
  });

  // Fraud transfers: Users → mule accounts
  [0, 2, 4, 6, 8, 10, 12, 14].forEach((ui, li) => {
    links.push({ source: userIds[ui], target: accIds[li % 8], label: `TRANSFER ₹${(Math.random() * 10 + 1).toFixed(1)}L` });
  });

  // More cross-transfers between accounts
  [[0,3],[1,5],[3,7],[5,1],[2,6],[7,4],[0,6],[1,7]].forEach(([a, b]) => {
    links.push({ source: accIds[a], target: accIds[b], label: 'TRANSFER' });
  });

  // Mule accounts feed clusters (already done above) + inter-cluster
  links.push({ source: 'CLUSTER_ALPHA', target: 'CLUSTER_BETA',  label: 'shares_mule' });
  links.push({ source: 'CLUSTER_BETA',  target: 'CLUSTER_GAMMA', label: 'shares_mule' });
  links.push({ source: 'CLUSTER_DELTA', target: 'CLUSTER_ALPHA', label: 'shares_mule' });

  // Users login from IPs
  const suspIPs = ips.filter(ip => ip.suspicious).map(ip => `IP_${ip.ip}`);
  const cleanIPs = ips.filter(ip => !ip.suspicious).map(ip => `IP_${ip.ip}`);

  userIds.forEach((uid, i) => {
    links.push({ source: uid, target: cleanIPs[i % cleanIPs.length], label: 'login_baseline' });
    if (i < 6) links.push({ source: uid, target: suspIPs[i % suspIPs.length], label: 'login_anomaly' });
  });

  // Users → Devices
  const devIds = deviceModels.map((_, i) => `DEV_${String(i + 1).padStart(3, '0')}`);
  userIds.forEach((uid, i) => {
    links.push({ source: uid, target: devIds[i % 15], label: 'device_used' });
    if (i < 5) links.push({ source: uid, target: devIds[(i + 1) % 15], label: 'new_device' });
  });

  // Suspicious IPs → VPN Exit Nodes
  suspIPs.forEach((ip, i) => {
    links.push({ source: ip, target: vpns[i % vpns.length], label: 'via_vpn' });
  });

  // VPN → Clusters
  vpns.forEach((vpn, i) => {
    links.push({ source: vpn, target: clusters[i % clusters.length].id, label: 'commands' });
  });

  // Accounts → Merchants (normal spending)
  accIds.slice(8).forEach((acc, i) => {
    links.push({ source: acc, target: `MER_${String((i % 10) + 1).padStart(3, '0')}`, label: 'payment' });
  });

  // Mule accounts → Merchants (cash-out)
  accIds.slice(0, 8).forEach((acc, i) => {
    links.push({ source: acc, target: `MER_${String((i % 5) + 1).padStart(3, '0')}`, label: 'cashout_attempt' });
  });

  // Devices → IPs (device location signals)
  devIds.forEach((dev, i) => {
    links.push({ source: dev, target: cleanIPs[i % cleanIPs.length], label: 'seen_at' });
    if (i < 5) links.push({ source: dev, target: suspIPs[i % suspIPs.length], label: 'seen_at_suspicious' });
  });

  return { nodes, links };
})();

export default function Neo4jGraphStudio({ graphData, onNodeClick, allowDemoFallback = false, emptyMessage = 'No graph data for this selection.' }) {
  const fgRef = useRef();
  const graphContainerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightMule, setHighlightMule] = useState(true);
  const [filterGroup, setFilterGroup] = useState('all');
  const [graphDimensions, setGraphDimensions] = useState({ width: 0, height: 0 });

  // `allowDemoFallback` is opt-in. Surfaces that are showing a specific case
  // (the investigation workspace) must never render DEMO_GRAPH, because a
  // fabricated mule ring beside a real case id reads as that case's network.
  // Standalone exploratory surfaces may still opt in.
  const hasLiveData = graphData && graphData.nodes && graphData.nodes.length > 0;
  const showDemo = !hasLiveData && allowDemoFallback;
  const baseData = hasLiveData ? graphData : (showDemo ? DEMO_GRAPH : { nodes: [], links: [] });

  // Apply group filter
  const activeData = filterGroup === 'all'
    ? baseData
    : {
        nodes: baseData.nodes.filter(n => n.group === filterGroup || n.isMule),
        links: baseData.links.filter(l => {
          const src = typeof l.source === 'object' ? l.source.id : l.source;
          const tgt = typeof l.target === 'object' ? l.target.id : l.target;
          const srcNode = baseData.nodes.find(n => n.id === src);
          const tgtNode = baseData.nodes.find(n => n.id === tgt);
          return srcNode && tgtNode;
        }),
      };

  // ── Dimension measurement ────────────────────────────────────────────────
  const measureDimensions = useCallback(() => {
    const container = graphContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setGraphDimensions({ width: Math.floor(width), height: Math.floor(height) });
    }
  }, []);

  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;
    measureDimensions();
    const t1 = setTimeout(measureDimensions, 50);
    const t2 = setTimeout(measureDimensions, 200);
    const t3 = setTimeout(measureDimensions, 600);
    const observer = new ResizeObserver(measureDimensions);
    observer.observe(container);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      observer.disconnect();
    };
  }, [measureDimensions]);

  // Auto-fit on data change
  useEffect(() => {
    if (fgRef.current && graphDimensions.width > 0) {
      setTimeout(() => fgRef.current?.zoomToFit(800, 40), 600);
    }
  }, [activeData, graphDimensions]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(2.8, 800);
    }
    if (onNodeClick) onNodeClick(node);
  };

  const handleResetZoom = () => fgRef.current?.zoomToFit(800, 40);

  // ── Canvas node painter ───────────────────────────────────────────────────
  const paintNode = useCallback((node, ctx, globalScale) => {
    const radius = (node.val || 14) / 2;
    const isSelected = selectedNode && selectedNode.id === node.id;

    // Outer glow for mule/suspicious
    if ((node.isMule && highlightMule) || node.suspicious) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.isMule ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)';
      ctx.fill();
    }

    // Node body
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    if (node.isMule && highlightMule) {
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 16;
    } else if (node.suspicious) {
      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = node.color || '#3B82F6';
      ctx.shadowColor = node.color || '#3B82F6';
      ctx.shadowBlur = isSelected ? 20 : 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = isSelected ? 2 / globalScale : 1 / globalScale;
    ctx.stroke();

    // Label (always show for large nodes, only at zoom for small ones)
    const fontSize = Math.max(6, 10 / globalScale);
    if (globalScale > 0.8 || node.val >= 30) {
      const shortId = (node.id || '').length > 12 ? node.id.slice(0, 12) + '…' : node.id;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(248,250,252,0.9)';
      ctx.fillText(shortId, node.x, node.y + radius + 2);
    }
  }, [highlightMule, selectedNode]);

  const groupOptions = [
    { key: 'all',          label: 'All',        color: '#94A3B8' },
    { key: 'user',         label: 'Users',      color: '#3B82F6' },
    { key: 'account',      label: 'Accounts',   color: '#10B981' },
    { key: 'mule_account', label: 'Mules',      color: '#EF4444' },
    { key: 'ip',           label: 'IPs',        color: '#F59E0B' },
    { key: 'device',       label: 'Devices',    color: '#8B5CF6' },
    { key: 'merchant',     label: 'Merchants',  color: '#06B6D4' },
    { key: 'vpn',          label: 'VPN Exits',  color: '#F97316' },
  ];

  const muleCount   = baseData.nodes.filter(n => n.isMule).length;
  const suspIpCount = baseData.nodes.filter(n => n.suspicious && n.group === 'ip').length;

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#07101C] border border-soc-border rounded-xl overflow-hidden flex flex-col">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-b border-soc-border bg-[#101827] px-4 py-2.5 shrink-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Layers className="w-4 h-4 text-soc-primary" />
          <span className="text-xs font-mono font-bold text-soc-text uppercase tracking-wider">
            Neo4j Threat Graph Visualizer
          </span>
          {showDemo && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              DEMO · {baseData.nodes.length} nodes
            </span>
          )}
          {!hasLiveData && !showDemo && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-soc-panel border border-soc-border text-soc-muted">
              NO GRAPH DATA
            </span>
          )}
          {hasLiveData && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
              ● LIVE · {baseData.nodes.length} nodes
            </span>
          )}
          {/* Threat stats pills */}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
            {muleCount} Mule Entities
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            {suspIpCount} Suspicious IPs
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setHighlightMule(h => !h)}
            className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              highlightMule
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-soc-bg border-soc-border text-soc-muted'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Mule Highlight</span>
          </button>

          <div className="flex items-center bg-soc-bg border border-soc-border rounded p-0.5">
            <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 400)} className="p-1 text-soc-muted hover:text-soc-text" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 400)} className="p-1 text-soc-muted hover:text-soc-text" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={handleResetZoom} className="p-1 text-soc-muted hover:text-soc-text border-l border-soc-border ml-1 pl-1" title="Reset Camera"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* ── Group Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0c1420] border-b border-soc-border/50 shrink-0 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-mono text-soc-muted uppercase mr-1 shrink-0">Filter:</span>
        {groupOptions.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilterGroup(key)}
            className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              filterGroup === key
                ? 'border-white/40 text-soc-text bg-white/10'
                : 'border-soc-border text-soc-muted hover:text-soc-text'
            }`}
            style={filterGroup === key ? { borderColor: color, color } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Canvas area ─────────────────────────────────────────────────── */}
      <div ref={graphContainerRef} className="relative flex-1 min-h-0 overflow-hidden bg-[#07101C]">

        {baseData.nodes.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 p-6 text-center">
            <Layers aria-hidden="true" className="h-6 w-6 text-soc-muted" strokeWidth={1.5} />
            <p className="text-sm font-medium text-soc-text">No connected entities</p>
            <p className="max-w-sm text-xs leading-5 text-soc-muted">{emptyMessage}</p>
          </div>
        ) : graphDimensions.width > 0 && graphDimensions.height > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            width={graphDimensions.width}
            height={graphDimensions.height}
            graphData={activeData}
            backgroundColor="#07101C"
            nodeRelSize={6}
            linkWidth={l => (l.label && l.label.includes('TRANSFER')) ? 2.5 : 1}
            linkColor={l => (l.label && l.label.includes('TRANSFER'))
              ? 'rgba(239,68,68,0.7)'
              : 'rgba(80,100,160,0.35)'}
            linkDirectionalParticles={l => (l.label && (l.label.includes('TRANSFER') || l.label.includes('cashout'))) ? 4 : 1}
            linkDirectionalParticleSpeed={0.007}
            linkDirectionalParticleColor={l => (l.label && l.label.includes('TRANSFER')) ? '#EF4444' : '#6d5ef8'}
            linkDirectionalParticleWidth={2}
            nodeCanvasObject={paintNode}
            onNodeClick={handleNodeClick}
            cooldownTicks={200}
            d3AlphaDecay={0.015}
            d3VelocityDecay={0.35}
            nodeLabel={node => `${node.name || node.id}\nPageRank: ${node.pagerank || 'N/A'}`}
            linkLabel={link => link.label || ''}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-soc-muted font-mono text-xs">
              <svg className="w-8 h-8 animate-spin text-soc-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Initializing graph engine…</span>
            </div>
          </div>
        )}

        {/* ── Selected node inspector ──────────────────────────────────── */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72 bg-[#101827]/95 border border-soc-border p-3.5 rounded-lg shadow-2xl backdrop-blur-md z-20">
            <div className="flex items-start justify-between border-b border-soc-border pb-2 mb-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-soc-dim">Entity Inspection</span>
                <h4 className="text-xs font-mono font-bold text-soc-primary truncate">{selectedNode.id}</h4>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-soc-dim hover:text-soc-text text-xs shrink-0 ml-2">✕</button>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-soc-muted shrink-0">Type:</span>
                <span className="text-soc-text capitalize text-right">{selectedNode.group || 'Account'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-soc-muted shrink-0">Name:</span>
                <span className="text-soc-text text-right truncate max-w-[170px]">{selectedNode.name || selectedNode.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-soc-muted shrink-0">PageRank:</span>
                <span className="text-soc-text">{selectedNode.pagerank ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-soc-muted shrink-0">Betweenness:</span>
                <span className="text-soc-text">{selectedNode.betweenness ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-soc-muted shrink-0">Mule Flag:</span>
                <span className={selectedNode.isMule ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {selectedNode.isMule ? '⚠ FLAGGED RING' : '✓ CLEAN'}
                </span>
              </div>
              {selectedNode.suspicious && (
                <div className="flex justify-between gap-2">
                  <span className="text-soc-muted shrink-0">IP Risk:</span>
                  <span className="text-amber-400 font-bold">HIGH RISK</span>
                </div>
              )}
              {selectedNode.clusterParent && (
                <div className="flex justify-between gap-2">
                  <span className="text-soc-muted shrink-0">Cluster:</span>
                  <span className="text-red-400 font-bold truncate">{selectedNode.clusterParent}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <div className="absolute bottom-3 left-3 bg-[#101827]/90 border border-soc-border px-3 py-2 rounded-md backdrop-blur-sm z-10 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono max-w-[320px]">
          {[
            { color: '#3B82F6', label: 'User' },
            { color: '#10B981', label: 'Account' },
            { color: '#EF4444', label: 'Mule', pulse: true },
            { color: '#DC2626', label: 'Cluster', pulse: true },
            { color: '#F59E0B', label: 'Susp. IP' },
            { color: '#8B5CF6', label: 'Device' },
            { color: '#06B6D4', label: 'Merchant' },
            { color: '#F97316', label: 'VPN Exit' },
            { color: '#64748B', label: 'Clean IP' },
          ].map(({ color, label, pulse }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full inline-block ${pulse ? 'animate-pulse' : ''}`} style={{ backgroundColor: color }} />
              <span className={pulse ? 'text-red-400' : 'text-soc-muted'}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Stats badge ─────────────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 bg-[#101827]/80 border border-soc-border px-2.5 py-1.5 rounded text-[10px] font-mono text-soc-muted z-10 space-y-0.5">
          <div>{activeData.nodes.length} nodes · {activeData.links.length} edges</div>
          <div className="text-red-400">{activeData.nodes.filter(n => n.isMule).length} mule entities</div>
        </div>
      </div>
    </div>
  );
}
