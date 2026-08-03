import { useCallback, useEffect, useState } from 'react';

export const API_BASE =
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

/**
 * Fetch one JSON resource with explicit loading / empty / error states.
 *
 * There is deliberately no "default data" parameter. When a request fails the
 * hook reports the failure and the caller renders an error state -- a
 * production surface must never silently fall back to a fabricated record.
 *
 * `path` may be null to skip fetching (e.g. before a case id is known).
 */
export default function useResource(path, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(path && !skip ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!path || skip) {
      setStatus('idle');
      setData(null);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      setStatus('loading');
      setError(null);
      try {
        const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw Object.assign(
            new Error(detail?.detail || `Request failed (HTTP ${response.status})`),
            { status: response.status },
          );
        }
        const body = await response.json();
        if (!active) return;
        setData(body);
        setStatus('ready');
      } catch (requestError) {
        if (requestError.name === 'AbortError' || !active) return;
        setError(requestError);
        setStatus('error');
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [path, skip, reloadToken]);

  return { data, status, error, reload };
}
