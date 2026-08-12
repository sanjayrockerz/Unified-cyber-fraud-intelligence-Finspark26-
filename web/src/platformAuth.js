// Keep the dashboard usable when Vercel was deployed without the VITE variable.
// VITE_API_BASE still wins, while this is the public Render service used by the
// repository's deployment configuration.
const API_BASE = import.meta.env.VITE_API_BASE
  || window.__FUSION_CONFIG__?.apiBase
  || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://risk-engine-api-o2kl.onrender.com');
const rawFetch = window.fetch.bind(window);
let accessToken = window.__FUSION_CONFIG__?.accessToken || '';
let expiresAt = 0;
let refreshPromise = null;

function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number(payload.exp || 0);
  } catch {
    return 0;
  }
}

function validateRuntimeConfig() {
  if (!API_BASE) throw new Error('A dashboard API URL is required');
  if (!import.meta.env.DEV && !API_BASE.startsWith('https://')) {
    throw new Error('Production dashboard API must use HTTPS');
  }
}

function requestToken() {
  // The client secret is held by the deployment's server-side token proxy.
  if (import.meta.env.DEV) {
    return rawFetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: import.meta.env.VITE_DEV_CLIENT_ID,
        client_secret: import.meta.env.VITE_DEV_CLIENT_SECRET,
      }),
    });
  }
  return rawFetch('/api/token', { method: 'POST' });
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
      accessToken = body.access_token;
      expiresAt = body.expires_at;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

export function installAuthenticatedFetch() {
  window.fetch = async (input, init = {}) => {
    await bootstrapPlatformAuth();
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    let response = await rawFetch(input, { ...init, headers });
    if (response.status === 401) {
      await bootstrapPlatformAuth(true);
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await rawFetch(input, { ...init, headers });
    }
    return response;
  };
}

export function authenticatedWebSocketUrl(url) {
  validateRuntimeConfig();
  if (!accessToken || tokenExpiry(accessToken) <= Math.floor(Date.now() / 1000)) {
    throw new Error('Platform authentication has expired');
  }
  const parsed = new URL(url);
  if (!import.meta.env.DEV && parsed.protocol !== 'wss:') {
    throw new Error('Production dashboard WebSocket must use WSS');
  }
  return parsed.toString();
}

export function authenticatedWebSocketProtocols() {
  validateRuntimeConfig();
  if (!accessToken || tokenExpiry(accessToken) <= Math.floor(Date.now() / 1000)) {
    throw new Error('Platform authentication has expired');
  }
  return [`Bearer.${accessToken}`];
}

export { API_BASE };
