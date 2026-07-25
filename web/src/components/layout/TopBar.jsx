import React, { useEffect, useState } from 'react';
import { Bell, Cpu, Moon, Search, Sun, ShieldCheck, Terminal, Users, AlertTriangle, Briefcase } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export default function TopBar({ quantumData }) {
  const { openSearch } = useSearch();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [freshness, setFreshness] = useState(0);

  // Live freshness counter that counts up and resets on global threat update event
  useEffect(() => {
    const timer = setInterval(() => {
      setFreshness((prev) => prev + 1);
    }, 1000);

    const handleThreatsUpdate = () => {
      setFreshness(0);
    };

    window.addEventListener('threats-updated', handleThreatsUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('threats-updated', handleThreatsUpdate);
    };
  }, []);

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-soc-border bg-soc-surface px-6 shadow-md transition-all z-20">
      
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-soc-primary/30 bg-soc-primary/10 shadow-[0_0_15px_rgba(109,94,248,0.15)]">
          <Terminal className="h-5 w-5 text-soc-primary animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-soc-success"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-sm font-black tracking-wider text-white">FUSION AI SOC</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-soc-primary font-bold">Command Center</span>
        </div>
      </div>

      {/* Operational Metrics Panel */}
      <div className="hidden lg:flex items-center gap-6 border-l border-r border-soc-border px-6 h-full flex-1 mx-6 overflow-x-auto no-scrollbar">
        {/* Environment */}
        <div className="flex flex-col min-w-[90px]">
          <span className="text-[9px] uppercase tracking-[0.1em] text-soc-muted font-bold">Environment</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-soc-success animate-pulse" />
            <span className="font-mono text-xs font-bold text-white">Production</span>
          </div>
        </div>

        {/* Engine Status */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[9px] uppercase tracking-[0.1em] text-soc-muted font-bold">Engine Status</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-soc-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-mono text-xs font-bold">Healthy</span>
          </div>
        </div>

        {/* Data Freshness */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[9px] uppercase tracking-[0.1em] text-soc-muted font-bold">Data Freshness</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-soc-primary font-mono text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-soc-primary"></span>
            </span>
            <span>{freshness} sec</span>
          </div>
        </div>

        {/* Analysts Online */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[9px] uppercase tracking-[0.1em] text-soc-muted font-bold">Analysts Online</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-blue-400 font-mono text-xs font-bold">
            <Users className="h-3.5 w-3.5" />
            <span>14</span>
          </div>
        </div>

        {/* Current Alerts */}
        <div className="flex flex-col min-w-[90px]">
          <span className="text-[9px] uppercase tracking-[0.1em] text-soc-muted font-bold">Current Alerts</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-soc-danger font-mono text-xs font-bold">
            <AlertTriangle className="h-3.5 w-3.5 animate-bounce" />
            <span>8</span>
          </div>
        </div>

        {/* Open Cases */}
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[9px] uppercase tracking-[0.1em] text-soc-muted font-bold">Open Cases</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-soc-quantum font-mono text-xs font-bold">
            <Briefcase className="h-3.5 w-3.5" />
            <span>17</span>
          </div>
        </div>
      </div>

      {/* Utilities, Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* PQC Banner (if available) */}
        {quantumData && (
          <div title={quantumData.hndl_details} className="hidden xl:flex items-center gap-2 border border-soc-quantum/40 bg-soc-quantum/10 px-3 py-1.5 font-mono text-[10px] text-soc-quantum rounded">
            <Cpu className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
            <span>PQC: {quantumData.vulnerable_percent}% exposed</span>
          </div>
        )}

        {/* Search */}
        <button
          type="button"
          onClick={openSearch}
          className="flex h-9 items-center gap-2 rounded-md border border-soc-border bg-soc-bg px-3 text-xs text-soc-muted transition-all hover:border-soc-primary hover:text-white"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden border border-soc-border bg-soc-panel px-1 py-0.5 font-mono text-[9px] text-soc-muted sm:inline rounded">⌘K</kbd>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light or dark theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-soc-border text-soc-muted transition-all hover:border-soc-primary hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-soc-warning" /> : <Moon className="h-4 w-4 text-soc-primary" />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-soc-border text-soc-muted transition-all hover:border-soc-primary hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-soc-danger px-1 font-mono text-[9px] font-semibold text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 border-l border-soc-border pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-soc-primary/30 bg-soc-primary/10 text-soc-primary shadow-sm hover:border-soc-primary cursor-pointer transition-all">
            <span className="font-mono text-xs font-bold">A4</span>
          </div>
          <div className="hidden flex-col xl:flex">
            <span className="font-mono text-xs text-white font-semibold">Analyst_04</span>
            <span className="text-[9px] text-soc-muted">Tier 2 SOC</span>
          </div>
        </div>

      </div>

    </header>
  );
}
