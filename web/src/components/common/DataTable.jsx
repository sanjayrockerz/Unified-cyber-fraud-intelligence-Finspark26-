import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Loader2, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8001' : '');
const EMPTY_FILTERS = {};

export default function DataTable({
  endpoint,
  columns,
  query = '',
  filters = EMPTY_FILTERS,
  onRowClick,
  onResult,
  emptyLabel,
  getRowId = (row, index) => row.id || row.case_id || row.customer_id || row.txn_id || index,
  pageSize = 50,
}) {
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(columns.find((column) => column.sortable !== false)?.key ? `-${columns.find((column) => column.sortable !== false).key}` : '');
  const [result, setResult] = useState({ items: [], page: 1, page_size: pageSize, total: 0, total_pages: 0 });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => setPage(1), [endpoint, deferredQuery, filterKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), sort, q: deferredQuery });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    async function loadPage() {
      setStatus('loading');
      setError('');
      try {
        const response = await fetch(`${API_BASE}${endpoint}?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load table data.');
        const nextResult = await response.json();
        setResult(nextResult);
        onResult?.(nextResult);
        setStatus('ready');
      } catch (loadError) {
        if (loadError.name === 'AbortError') return;
        setError(loadError.message || 'Could not load table data.');
        setStatus('error');
      }
    }

    loadPage();
    return () => controller.abort();
  }, [endpoint, page, pageSize, sort, deferredQuery, filterKey]);

  const toggleSort = (key) => {
    setPage(1);
    setSort((currentSort) => currentSort === key ? `-${key}` : key);
  };

  const sortDirection = (key) => (sort.replace('-', '') === key ? (sort.startsWith('-') ? 'descending' : 'ascending') : 'none');

  if (status === 'loading' && !result.items.length) {
    return <div className="flex min-h-48 items-center justify-center border border-soc-border text-sm text-soc-muted"><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Loading data…</div>;
  }

  if (status === 'error') {
    return <EmptyState title="Table unavailable" description={error} />;
  }

  if (!result.items.length) {
    return <EmptyState title={emptyLabel || 'No matching records'} />;
  }

  return (
    <div className="border border-soc-border bg-soc-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-soc-panel text-[11px] uppercase tracking-[0.08em] text-soc-muted">
            <tr>
              {columns.map((column) => {
                const sortable = column.sortable !== false;
                return (
                  <th key={column.key} aria-sort={sortable ? sortDirection(column.key) : undefined} className={`border-b border-soc-border px-4 py-3 font-medium ${column.className || ''}`}>
                    {sortable ? <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><span>{column.label}</span><ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5" /></button> : column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-soc-border/70 font-mono tabular-nums">
            {result.items.map((row, index) => (
              <tr key={getRowId(row, index)} tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined} onKeyDown={onRowClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') onRowClick(row); } : undefined} className={onRowClick ? 'cursor-pointer text-soc-text transition-colors hover:bg-soc-panel focus-visible:bg-soc-panel focus-visible:outline-none' : 'text-soc-text'}>
                {columns.map((column) => <td key={column.key} className={`px-4 py-3 align-middle ${column.className || ''}`}>{column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-soc-border px-4 py-3 text-xs text-soc-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono tabular-nums">{result.total.toLocaleString()} records · page {result.page} of {Math.max(result.total_pages, 1)}</span>
        <div className="flex items-center gap-2">
          {status === 'loading' && <RefreshCw aria-label="Refreshing table" className="h-3.5 w-3.5 animate-spin text-soc-primary" />}
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))} className="inline-flex h-8 w-8 items-center justify-center border border-soc-border text-soc-muted enabled:hover:border-soc-primary enabled:hover:text-soc-text disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next page" disabled={page >= result.total_pages} onClick={() => setPage((currentPage) => currentPage + 1)} className="inline-flex h-8 w-8 items-center justify-center border border-soc-border text-soc-muted enabled:hover:border-soc-primary enabled:hover:text-soc-text disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </footer>
    </div>
  );
}
