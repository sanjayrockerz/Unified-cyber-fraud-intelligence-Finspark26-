import { useCallback, useEffect, useState } from 'react';

export const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const resourceCache = new Map();
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_REFRESH_MS = 30000;

export default function useResource(path, { skip = false, timeoutMs = DEFAULT_TIMEOUT_MS, refreshMs = DEFAULT_REFRESH_MS } = {}) {
  const cached = path ? resourceCache.get(path) : null;
  const [data, setData] = useState(cached?.data ?? null);
  const [status, setStatus] = useState(path && !skip ? (cached ? 'stale' : 'loading') : 'idle');
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cached?.updatedAt ?? null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!path || skip) {
      setStatus('idle');
      setData(null);
      setError(null);
      return undefined;
    }
    let active = true;
    let activeController = null;
    const load = async () => {
      const controller = new AbortController();
      activeController = controller;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      setStatus((current) => (data ? 'stale' : current === 'ready' ? 'stale' : 'loading'));
      setError(null);
      try {
        const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw Object.assign(new Error(detail?.detail || `Request failed (HTTP ${response.status})`), { status: response.status });
        }
        const body = await response.json();
        if (!active) return;
        const updatedAt = new Date().toISOString();
        resourceCache.set(path, { data: body, updatedAt });
        setData(body);
        setLastUpdated(updatedAt);
        setStatus('ready');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.name === 'AbortError' ? new Error('Request timed out; retrying automatically.') : requestError);
        setStatus(data ? 'stale' : 'error');
      } finally {
        clearTimeout(timeout);
      }
    };
    load();
    const timer = setInterval(load, refreshMs);
    return () => {
      active = false;
      activeController?.abort();
      clearInterval(timer);
    };
  }, [path, skip, reloadToken, timeoutMs, refreshMs]);

  return { data, status, error, reload, lastUpdated };
}
