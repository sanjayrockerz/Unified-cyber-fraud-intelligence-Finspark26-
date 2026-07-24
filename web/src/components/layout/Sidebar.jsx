import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, BarChart3, Building2, ChevronLeft, Code2, FileBarChart2, FlaskConical,
  GitBranch, LayoutDashboard, Menu, Network, Radio, Settings, ShieldAlert, Users, Workflow,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import NavGroup from '../common/NavGroup';

const groups = [
  {
    label: 'Fraud Operations', icon: ShieldAlert,
    items: [
      { to: '/operations', label: 'Operations Center', icon: Activity },
      { to: '/cases', label: 'Cases', icon: FileBarChart2 },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/investigation', label: 'Investigation', icon: Workflow },
    ],
  },
  {
    label: 'Intelligence', icon: BarChart3,
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/reports', label: 'Reports', icon: FileBarChart2 },
      { to: '/sessions', label: 'Session Intelligence', icon: Radio },
      { to: '/graph', label: 'Graph Runtime', icon: Network },
    ],
  },
  {
    label: 'Platform', icon: Building2,
    items: [
      { to: '/executive', label: 'Executive Command Center', icon: LayoutDashboard },
      { to: '/telemetry', label: 'Telemetry', icon: Activity },
      { to: '/banking', label: 'Banking', icon: Building2 },
      { to: '/synthetic-lab', label: 'Synthetic Lab', icon: FlaskConical },
      { to: '/developer', label: 'SDK Runtime', icon: Code2 },
    ],
  },
];

function DirectNavLink({ to, label, icon: Icon, end = false, collapsed }) {
  return (
    <NavLink end={end} to={to} title={label} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary ${isActive ? 'bg-soc-primary text-soc-onPrimary' : 'text-soc-muted hover:bg-soc-panel hover:text-soc-text'}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {!collapsed && label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncSidebar = () => setIsCollapsed(mediaQuery.matches);
    syncSidebar();
    mediaQuery.addEventListener('change', syncSidebar);
    return () => mediaQuery.removeEventListener('change', syncSidebar);
  }, [setIsCollapsed]);
  return (
    <aside aria-label="Primary navigation" className={`${isCollapsed ? 'w-[4.5rem]' : 'w-64'} flex min-w-0 shrink-0 flex-col border-r border-soc-border bg-soc-surface transition-[width] duration-200`}>
      <div className="flex h-16 items-center gap-3 border-b border-soc-border px-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-soc-primary/15 text-soc-primary"><ShieldAlert aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} /></div>
        {!isCollapsed && <span className="min-w-0 font-mono text-sm font-semibold tracking-wide text-soc-text">FUSION RISK OS</span>}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
        <DirectNavLink to="/" label="Overview" icon={LayoutDashboard} end collapsed={isCollapsed} />
        {groups.map((group) => <NavGroup key={group.label} {...group} collapsed={isCollapsed} />)}
        <div className="border-t border-soc-border pt-2">
          <DirectNavLink to="/settings" label="Settings" icon={Settings} collapsed={isCollapsed} />
        </div>
      </nav>

      <button type="button" onClick={toggleSidebar} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="flex items-center gap-3 border-t border-soc-border px-3 py-3 text-xs text-soc-muted transition-colors hover:bg-soc-panel hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary">
        {isCollapsed ? <Menu aria-hidden="true" className="h-4 w-4" /> : <ChevronLeft aria-hidden="true" className="h-4 w-4" />}
        {!isCollapsed && 'Collapse'}
      </button>
    </aside>
  );
}
