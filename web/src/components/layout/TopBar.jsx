import React from 'react';
import { Bell, Cpu, Moon, Search, Sun } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export default function TopBar({ quantumData }) {
  const { openSearch } = useSearch();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-soc-border bg-soc-surface px-4 sm:px-6">
      <button type="button" onClick={openSearch} className="flex h-10 min-w-0 flex-1 items-center justify-between border border-soc-border bg-soc-bg px-3 text-left text-sm text-soc-muted transition-colors hover:border-soc-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary sm:max-w-xl">
        <span className="flex min-w-0 items-center gap-2"><Search aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="truncate">Search alerts, entities, accounts, and cases…</span></span>
        <kbd className="ml-3 hidden border border-soc-border bg-soc-panel px-1.5 py-0.5 font-mono text-[10px] text-soc-muted sm:inline">⌘ K</kbd>
      </button>

      <div className="hidden items-center gap-2 text-xs text-soc-muted lg:flex"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-soc-success" />Live system health</div>

      <div className="ml-auto flex items-center gap-2">
        {quantumData && <div title={quantumData.hndl_details} className="hidden items-center gap-2 border border-soc-quantum/40 bg-soc-quantum/10 px-3 py-2 font-mono text-xs text-soc-quantum xl:flex"><Cpu aria-hidden="true" className="h-3.5 w-3.5" />PQC posture: {quantumData.vulnerable_percent}% exposed</div>}
        <button type="button" onClick={toggleTheme} aria-label="Toggle light or dark theme" className="inline-flex h-10 w-10 items-center justify-center border border-soc-border text-soc-muted transition-colors hover:border-soc-primary hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary">
          {theme === 'dark' ? <Sun aria-hidden="true" className="h-4 w-4 text-soc-warning" /> : <Moon aria-hidden="true" className="h-4 w-4 text-soc-primary" />}
        </button>
        <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative inline-flex h-10 w-10 items-center justify-center border border-soc-border text-soc-muted transition-colors hover:border-soc-primary hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary">
          <Bell aria-hidden="true" className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-soc-danger px-1 font-mono text-[10px] font-semibold text-soc-onPrimary">{unreadCount}</span>}
        </button>
        <div className="hidden items-center gap-2 border-l border-soc-border pl-3 sm:flex"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-soc-primary/15 font-mono text-xs font-semibold text-soc-primary">A4</span><span className="hidden font-mono text-xs text-soc-text xl:block">Analyst_04</span></div>
      </div>
    </header>
  );
}
