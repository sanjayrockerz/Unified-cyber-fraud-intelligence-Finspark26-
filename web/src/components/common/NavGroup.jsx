import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

export default function NavGroup({ label, icon: Icon, items, collapsed }) {
  const { pathname } = useLocation();
  const isActiveGroup = items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const [isOpen, setIsOpen] = useState(!collapsed || isActiveGroup);

  useEffect(() => {
    if (isActiveGroup) setIsOpen(true);
  }, [isActiveGroup]);

  useEffect(() => {
    if (collapsed && !isActiveGroup) setIsOpen(false);
    if (!collapsed) setIsOpen(true);
  }, [collapsed, isActiveGroup]);

  return (
    <div className="relative">
      <button type="button" aria-label={collapsed ? label : undefined} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-medium text-soc-muted transition-colors hover:bg-soc-panel hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary ${isActiveGroup ? 'text-soc-text' : ''}`}>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && <><span className="flex-1">{label}</span><ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></>}
      </button>
      {isOpen && (
        <div className={collapsed ? 'absolute left-full top-0 z-50 ml-2 w-56 border border-soc-border bg-soc-surface p-2 shadow-2xl' : 'mt-1 space-y-1'}>
          {items.map((item) => {
            const ItemIcon = item.icon;
            return <NavLink key={item.to} to={item.to} title={item.label} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary ${isActive ? 'bg-soc-primary text-soc-onPrimary' : 'text-soc-muted hover:bg-soc-panel hover:text-soc-text'}`}><ItemIcon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />{!collapsed && item.label}{collapsed && <span>{item.label}</span>}</NavLink>;
          })}
        </div>
      )}
    </div>
  );
}
