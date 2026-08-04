import React, { useState, useEffect } from 'react';
import { Search, User, Shield, Server, CreditCard, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '../../lib/useResource';
import { formatAmount } from '../../lib/verdict';

// Search hits the real collections. It previously served a fixed list of seven
// entities whose "open" links all pointed at a case that does not exist.
const COLLECTIONS = [
  {
    endpoint: '/cases',
    type: 'case',
    toResult: (row) => ({
      id: row.case_id,
      label: `Case: ${row.case_id}`,
      sub: `${row.severity || 'UNCLASSIFIED'} · ${row.status || 'UNASSIGNED'} · score ${row.score}`,
      route: `/investigation/${row.case_id}`,
    }),
  },
  {
    endpoint: '/customers',
    type: 'user',
    toResult: (row) => ({
      id: row.customer_id,
      label: `Customer: ${row.name || row.full_name || row.customer_id}`,
      sub: `${row.customer_id}${row.primary_account ? ` · ${row.primary_account}` : ''}`,
      route: '/customers',
    }),
  },
  {
    endpoint: '/transactions',
    type: 'transaction',
    toResult: (row) => ({
      id: row.txn_id,
      label: `Txn: ${row.txn_id}`,
      sub: `${formatAmount(row.amount)} · ${row.nameOrig} → ${row.nameDest}`,
      route: '/banking',
    }),
  },
];

export default function UniversalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const responses = await Promise.all(
          COLLECTIONS.map(async ({ endpoint, type, toResult }) => {
            const url = `${API_BASE}${endpoint}?page_size=5&q=${encodeURIComponent(query.trim())}`;
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) return [];
            const body = await response.json();
            return (body.items ?? []).map((row) => ({ type, ...toResult(row) }));
          }),
        );
        setResults(responses.flat());
      } catch (error) {
        if (error.name !== 'AbortError') setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleSelect = (route) => {
    navigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-soc-overlay/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-soc-surface border border-soc-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-soc-border bg-soc-panel">
          <Search className="w-5 h-5 text-soc-muted mr-3" />
          <input
            type="text"
            placeholder="Search Customer, Account, UPI, IP, Device, Txn ID, Mule Cluster... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-soc-text placeholder-soc-dim font-mono text-sm focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 text-soc-muted hover:text-soc-text rounded-md hover:bg-soc-border/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase text-soc-dim">
            <span>
              {query.trim() === '' ? 'Cases, customers and transactions' : `Results (${results.length})`}
            </span>
            {isSearching && <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin text-soc-primary" />}
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-soc-muted text-sm font-mono">
              {isSearching
                ? 'Searching…'
                : `No matching records found${query.trim() ? ` for "${query}"` : ''}`}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(item.route)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-soc-panel cursor-pointer transition-colors border border-transparent hover:border-soc-border group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-soc-bg border border-soc-border text-soc-primary group-hover:text-soc-onPrimary group-hover:border-soc-primary transition-colors">
                      {item.type === 'user' && <User className="w-4 h-4" />}
                      {item.type === 'case' && <Shield className="w-4 h-4 text-soc-danger" />}
                      {item.type === 'transaction' && <CreditCard className="w-4 h-4 text-soc-warning" />}
                    </div>
                    <div>
                      <div className="text-sm font-mono font-semibold text-soc-text group-hover:text-soc-primary">
                        {item.label}
                      </div>
                      <div className="text-xs text-soc-muted">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-soc-dim group-hover:text-soc-primary group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-soc-panel/50 border-t border-soc-border text-[11px] text-soc-dim font-mono">
          <span>Navigate with <kbd className="px-1 py-0.5 bg-soc-bg border border-soc-border rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-soc-bg border border-soc-border rounded">↓</kbd></span>
          <span>Open with <kbd className="px-1 py-0.5 bg-soc-bg border border-soc-border rounded">↵ Enter</kbd></span>
          <span>Close with <kbd className="px-1 py-0.5 bg-soc-bg border border-soc-border rounded">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}

