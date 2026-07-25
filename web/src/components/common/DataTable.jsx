import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Loader2, RefreshCw, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import EmptyState from './EmptyState';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');
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
  renderExpandedRow = null, // Optional render function for expandable details
}) {
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(columns.find((column) => column.sortable !== false)?.key ? `-${columns.find((column) => column.sortable !== false).key}` : '');
  const [result, setResult] = useState({ items: [], page: 1, page_size: pageSize, total: 0, total_pages: 0 });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  
  // Expanded row tracking state
  const [expandedRows, setExpandedRows] = useState({});

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

  const toggleRowExpand = (rowId, e) => {
    e.stopPropagation(); // Stop row click propagation
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  if (status === 'loading' && !result.items.length) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center border border-soc-border bg-soc-surface rounded-lg text-sm text-soc-muted">
        <Loader2 className="h-6 w-6 animate-spin text-soc-primary mb-2" />
        <span className="font-mono text-xs">Streaming Ledger Records...</span>
      </div>
    );
  }

  if (status === 'error') {
    return <EmptyState title="Table unavailable" description={error} />;
  }

  if (!result.items.length) {
    return <EmptyState title={emptyLabel || 'No matching records'} />;
  }

  return (
    <div className="border border-soc-border bg-soc-surface rounded-lg overflow-hidden shadow-lg hover:border-soc-primary/40 transition-all duration-300">
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar relative">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs table-layout-fixed">
          <thead className="sticky top-0 z-10 bg-soc-panel border-b border-soc-border text-[10px] uppercase tracking-[0.12em] font-mono font-black text-soc-muted">
            <tr>
              {/* Expand Trigger Header */}
              {renderExpandedRow && <th className="w-10 px-3 py-3 border-b border-soc-border"></th>}
              {columns.map((column) => {
                const sortable = column.sortable !== false;
                return (
                  <th key={column.key} aria-sort={sortable ? sortDirection(column.key) : undefined} className={`px-4 py-3 font-semibold ${column.className || ''}`}>
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 text-left hover:text-white transition-colors focus-visible:outline-none"
                      >
                        <span>{column.label}</span>
                        <ChevronsUpDown className="h-3 w-3 text-soc-primary" />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-soc-border/40 font-mono tabular-nums">
            {result.items.map((row, index) => {
              const rowId = getRowId(row, index);
              const isExpanded = !!expandedRows[rowId];
              return (
                <React.Fragment key={rowId}>
                  <tr
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') onRowClick(row); } : undefined}
                    className={`text-soc-text transition-all duration-200 border-l-2 ${
                      isExpanded 
                        ? 'bg-soc-panel/40 border-soc-primary' 
                        : 'border-transparent hover:bg-soc-panel/30 hover:border-soc-border'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {/* Expand Trigger Cell */}
                    {renderExpandedRow && (
                      <td className="px-3 py-2.5 align-middle">
                        <button
                          type="button"
                          onClick={(e) => toggleRowExpand(rowId, e)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-soc-border bg-soc-panel/50 text-soc-muted hover:border-soc-primary hover:text-white transition-all"
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-2.5 align-middle truncate max-w-[200px] font-mono text-[11px] ${column.className || ''}`}>
                        {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Expanded detail row */}
                  {renderExpandedRow && isExpanded && (
                    <tr className="bg-[#0b1019] border-l-2 border-soc-primary">
                      <td colSpan={columns.length + 1} className="p-4 border-b border-soc-border/60">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-soc-border px-4 py-3 text-xs text-soc-muted sm:flex-row sm:items-center sm:justify-between bg-soc-panel/35">
        <span className="font-mono tabular-nums">{result.total.toLocaleString()} records · page {result.page} of {Math.max(result.total_pages, 1)}</span>
        <div className="flex items-center gap-2">
          {status === 'loading' && <RefreshCw className="h-3.5 w-3.5 animate-spin text-soc-primary" />}
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-soc-border text-soc-muted enabled:hover:border-soc-primary enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= result.total_pages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-soc-border text-soc-muted enabled:hover:border-soc-primary enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
