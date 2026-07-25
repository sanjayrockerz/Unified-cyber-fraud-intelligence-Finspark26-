import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, BarChart3, Building2, ChevronLeft, Code2, FileBarChart2, FlaskConical,
  LayoutDashboard, Menu, Network, Radio, Settings, ShieldAlert, Users, Workflow,
  Pin, Zap, Clock, Keyboard, ShieldCheck
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const groups = [
  {
    label: 'Fraud Operations',
    items: [
      { to: '/operations', label: 'Operations Center', icon: Activity },
      { to: '/cases', label: 'Cases', icon: FileBarChart2 },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/investigation', label: 'Investigation', icon: Workflow },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/reports', label: 'Reports', icon: FileBarChart2 },
      { to: '/sessions', label: 'Session Intelligence', icon: Radio },
      { to: '/graph', label: 'Graph Runtime', icon: Network },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/executive', label: 'Executive Command Center', icon: LayoutDashboard },
      { to: '/telemetry', label: 'Telemetry', icon: Activity },
      { to: '/banking', label: 'Banking', icon: Building2 },
      { to: '/synthetic-lab', label: 'Synthetic Lab', icon: FlaskConical },
      { to: '/developer', label: 'SDK Runtime', icon: Code2 },
    ],
  },
];

// Flat list lookup of all navigation links to dynamically populate pinned list
const allNavItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/operations', label: 'Operations Center', icon: Activity },
  { to: '/cases', label: 'Cases', icon: FileBarChart2 },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/investigation', label: 'Investigation', icon: Workflow },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/sessions', label: 'Session Intelligence', icon: Radio },
  { to: '/graph', label: 'Graph Runtime', icon: Network },
  { to: '/executive', label: 'Executive Command Center', icon: LayoutDashboard },
  { to: '/telemetry', label: 'Telemetry', icon: Activity },
  { to: '/banking', label: 'Banking', icon: Building2 },
  { to: '/synthetic-lab', label: 'Synthetic Lab', icon: FlaskConical },
  { to: '/developer', label: 'SDK Runtime', icon: Code2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function DirectNavLink({ to, label, icon: Icon, end = false, collapsed, isPinned, onTogglePin }) {
  return (
    <div className="group/nav relative flex items-center justify-between hover:bg-soc-panel/20 pr-2">
      <NavLink
        end={end}
        to={to}
        title={label}
        className={({ isActive }) => `flex-1 flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold transition-all border-l-2 ${
          isActive
            ? 'border-soc-primary bg-soc-primary/10 text-white shadow-inner font-bold'
            : 'border-transparent text-soc-muted hover:text-white hover:translate-x-0.5'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-soc-primary" strokeWidth={2} />
        {!collapsed && <span>{label}</span>}
      </NavLink>

      {/* Pin toggle button on hover */}
      {!collapsed && onTogglePin && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin(to);
          }}
          className={`opacity-0 group-hover/nav:opacity-100 p-1 text-soc-muted hover:text-white hover:bg-soc-panel/60 rounded transition-all ${
            isPinned ? 'opacity-90 text-soc-primary animate-pulse' : ''
          }`}
          title={isPinned ? 'Remove from favorites' : 'Pin to favorites'}
        >
          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-soc-primary text-soc-primary' : ''}`} />
        </button>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar();
  
  // Stored state for pinned paths
  const [pinnedPaths, setPinnedPaths] = useState(() => {
    try {
      const stored = localStorage.getItem('pinned-favorites');
      return stored ? JSON.parse(stored) : ['/', '/operations', '/cases'];
    } catch {
      return ['/', '/operations', '/cases'];
    }
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncSidebar = () => setIsCollapsed(mediaQuery.matches);
    syncSidebar();
    mediaQuery.addEventListener('change', syncSidebar);
    return () => mediaQuery.removeEventListener('change', syncSidebar);
  }, [setIsCollapsed]);

  const togglePin = (path) => {
    setPinnedPaths((prev) => {
      let next;
      if (prev.includes(path)) {
        next = prev.filter((p) => p !== path);
      } else {
        next = [...prev, path];
      }
      localStorage.setItem('pinned-favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleSimulateAttack = () => {
    // Custom event to trigger a mock incident in the system
    const event = new CustomEvent('simulate-attack', {
      detail: {
        threat_name: 'Simulated Ransomware Vector',
        severity: 'CRITICAL',
        evidence: 'Suspicious connection to known C2 server in St. Petersburg',
        timestamp: new Date().toLocaleTimeString()
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <aside
      aria-label="Primary navigation"
      className={`${
        isCollapsed ? 'w-[4.5rem]' : 'w-64'
      } flex min-w-0 shrink-0 flex-col border-r border-soc-border bg-soc-surface transition-[width] duration-300 ease-in-out z-10`}
    >
      {/* Brand logo & header */}
      <div className="flex h-[72px] items-center gap-3 border-b border-soc-border px-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-soc-primary/15 text-soc-primary border border-soc-primary/30">
            <ShieldCheck className="h-5 w-5 text-soc-primary" strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-mono text-sm font-black tracking-widest text-white leading-tight">FUZEN AI</span>
              <span className="text-[9px] font-mono tracking-wider text-soc-muted">v2.4.1-prod</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Body */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4 no-scrollbar">
        {/* Pinned Section */}
        {!isCollapsed && (
          <div className="px-3 mb-2 flex items-center gap-1.5 text-[10px] tracking-[0.15em] font-mono font-bold text-soc-primary uppercase">
            <Pin className="h-3 w-3" />
            <span>Pinned Favorites</span>
          </div>
        )}
        <div className="space-y-0.5">
          {pinnedPaths.map((path) => {
            const item = allNavItems.find((n) => n.to === path);
            if (!item) return null;
            return (
              <DirectNavLink
                key={`pinned-${path}`}
                to={item.to}
                label={item.label}
                icon={item.icon}
                end={item.to === '/'}
                collapsed={isCollapsed}
                isPinned={true}
                onTogglePin={togglePin}
              />
            );
          })}
          {!isCollapsed && pinnedPaths.length === 0 && (
            <p className="px-3 py-2 text-[10px] text-soc-muted font-mono italic">
              No favorites pinned. Hover links to pin.
            </p>
          )}
        </div>

        {/* Groups */}
        {groups.map((group) => (
          <div key={group.label} className="space-y-1.5 pt-2">
            {!isCollapsed && (
              <span className="px-3 text-[10px] tracking-[0.15em] font-mono font-bold text-soc-muted/70 uppercase">
                {group.label}
              </span>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <DirectNavLink 
                  key={item.to} 
                  to={item.to} 
                  label={item.label} 
                  icon={item.icon} 
                  collapsed={isCollapsed}
                  isPinned={pinnedPaths.includes(item.to)}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Recent Investigations (Expanded only) */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-soc-border/50 space-y-2">
            <span className="px-3 flex items-center gap-1.5 text-[10px] tracking-[0.15em] font-mono font-bold text-soc-muted/70 uppercase">
              <Clock className="h-3 w-3" />
              <span>Recent Investigations</span>
            </span>
            <div className="px-3 space-y-1">
              <a
                href="/investigation/CASE-2026-8942"
                className="flex items-center justify-between text-[11px] font-mono text-soc-muted hover:text-white transition-colors"
              >
                <span>CASE-8942</span>
                <span className="px-1 bg-soc-danger/15 text-soc-danger rounded border border-soc-danger/30 text-[9px] font-bold">CRITICAL</span>
              </a>
              <a
                href="/investigation/CASE-2026-2104"
                className="flex items-center justify-between text-[11px] font-mono text-soc-muted hover:text-white transition-colors"
              >
                <span>CASE-2104</span>
                <span className="px-1 bg-soc-warning/15 text-soc-warning rounded border border-soc-warning/30 text-[9px] font-bold">HIGH</span>
              </a>
            </div>
          </div>
        )}

        {/* Quick Actions (Expanded only) */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-soc-border/50 space-y-2">
            <span className="px-3 flex items-center gap-1.5 text-[10px] tracking-[0.15em] font-mono font-bold text-soc-muted/70 uppercase">
              <Zap className="h-3 w-3 text-soc-warning" />
              <span>Simulations</span>
            </span>
            <div className="px-3 space-y-1.5">
              <button
                type="button"
                onClick={handleSimulateAttack}
                className="w-full text-left px-2.5 py-1.5 bg-soc-panel hover:bg-soc-panel/80 text-[11px] font-medium text-white border border-soc-border rounded transition-all hover:border-soc-primary flex items-center gap-2 hover:shadow-[0_0_10px_rgba(109,94,248,0.1)]"
              >
                <Zap className="h-3.5 w-3.5 text-soc-warning" />
                <span>Simulate Cyber Event</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-soc-border bg-soc-surface/50 p-2">
        <DirectNavLink 
          to="/settings" 
          label="Settings" 
          icon={Settings} 
          collapsed={isCollapsed} 
          isPinned={pinnedPaths.includes('/settings')}
          onTogglePin={togglePin}
        />
        {!isCollapsed && (
          <div className="px-3.5 py-2 text-[10px] text-soc-muted flex items-center gap-1.5 font-mono">
            <Keyboard className="h-3.5 w-3.5" />
            <span>Shortcuts: <kbd className="bg-soc-panel px-1 py-0.5 border border-soc-border rounded">⌘K</kbd></span>
          </div>
        )}
      </div>

      {/* Collapse Trigger Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center gap-3 border-t border-soc-border px-3.5 py-3.5 text-xs text-soc-muted transition-colors hover:bg-soc-panel hover:text-white"
      >
        {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {!isCollapsed && <span className="font-semibold">Collapse Navigation</span>}
      </button>
    </aside>
  );
}
