import React, { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import Ledger from '../components/Ledger';
import EmptyState from '../components/common/EmptyState';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function BankingPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/transactions?page=1&page_size=25&sort=-timestamp`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('transactions fetch failed');
        return res.json();
      })
      .then((data) => {
        setEvents(data.items ?? []);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto select-none">
      <div className="bg-soc-surface border border-soc-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-soc-primary" />
          <div>
            <h1 className="text-base font-mono font-bold text-soc-text uppercase tracking-wider">
              Core Banking System (CBS) Transaction Inspector
            </h1>
            <span className="text-xs text-soc-muted">Live transaction ledger & beneficiary mule cluster detection</span>
          </div>
        </div>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4">
        {status === 'error' ? (
          <EmptyState title="Ledger unavailable" description="Could not reach the transaction feed." />
        ) : (
          <Ledger events={events} />
        )}
      </div>
    </div>
  );
}
