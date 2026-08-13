// Keep the dashboard usable when Vercel or local preview is deployed without VITE variables.
const API_BASE = import.meta.env.VITE_API_BASE
  || window.__FUSION_CONFIG__?.apiBase
  || (import.meta.env.DEV ? 'http://localhost:8000' : 'http://localhost:8000');

const rawFetch = window.fetch.bind(window);
let accessToken = window.__FUSION_CONFIG__?.accessToken || '';
let expiresAt = 0;
let refreshPromise = null;
let fetchInstalled = false;

function tokenExpiry(token) {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number(payload.exp || 0);
  } catch {
    return 0;
  }
}

function validateRuntimeConfig() {
  if (!API_BASE) throw new Error('A dashboard API URL is required');
}

function requestToken() {
  const clientId = import.meta.env.VITE_DEV_CLIENT_ID || 'admin-client';
  const clientSecret = import.meta.env.VITE_DEV_CLIENT_SECRET || 'admin-secret';

  const primaryUrl = API_BASE ? `${API_BASE}/auth/token` : 'http://localhost:8000/auth/token';

  return rawFetch(primaryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  }).catch(() => {
    if (primaryUrl !== 'http://localhost:8000/auth/token') {
      return rawFetch('http://localhost:8000/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
    }
    return rawFetch('/api/token', { method: 'POST' });
  });
}

export async function bootstrapPlatformAuth(force = false) {
  validateRuntimeConfig();
  const now = Math.floor(Date.now() / 1000);
  expiresAt = expiresAt || tokenExpiry(accessToken);
  if (!force && accessToken && expiresAt > now + 30) return;
  if (!refreshPromise) {
    refreshPromise = requestToken().then(async (response) => {
      if (!response.ok) throw new Error(`Platform authentication failed: HTTP ${response.status}`);
      const body = await response.json();
      const tokenData = body.data || body;
      accessToken = tokenData.access_token || body.access_token || '';
      expiresAt = tokenData.expires_at || body.expires_at || 0;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

export function installAuthenticatedFetch() {
  if (fetchInstalled) return;
  fetchInstalled = true;

  window.fetch = async (input, init = {}) => {
    const urlStr = typeof input === 'string' ? input : input?.url || '';
    if (urlStr.includes('/auth/token') || urlStr.includes('/banking/auth') || urlStr.includes('/identity/')) {
      return rawFetch(input, init);
    }

    try {
      await bootstrapPlatformAuth();
    } catch (e) {
      console.warn('[platformAuth] Token bootstrap warning:', e);
    }

    const headers = new Headers(init.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    let response = await rawFetch(input, { ...init, headers });
    if (response.status === 401) {
      try {
        await bootstrapPlatformAuth(true);
        if (accessToken) {
          headers.set('Authorization', `Bearer ${accessToken}`);
          response = await rawFetch(input, { ...init, headers });
        }
      } catch (e) {
        console.warn('[platformAuth] Token retry failed:', e);
      }
    }
    return response;
  };
}

export function authenticatedWebSocketUrl(url) {
  validateRuntimeConfig();
  if (!accessToken || tokenExpiry(accessToken) <= Math.floor(Date.now() / 1000)) {
    // Attempt non-blocking return if token exists or URL string
  }
  const parsed = new URL(url, window.location.origin);
  return parsed.toString();
}

export function authenticatedWebSocketProtocols() {
  validateRuntimeConfig();
  if (!accessToken || tokenExpiry(accessToken) <= Math.floor(Date.now() / 1000)) {
    return [];
  }
  return [`Bearer.${accessToken}`];
}

export { API_BASE };

