// Vercel serverless function. Mints a short-lived platform access token for the
// dashboard SPA. The client_id/secret pair lives only in Vercel's server-side
// environment (FUSION_DASHBOARD_CLIENT_ID / FUSION_DASHBOARD_CLIENT_SECRET) and
// is never shipped to the browser bundle.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiBase = process.env.FUSION_API_BASE;
  const clientId = process.env.FUSION_DASHBOARD_CLIENT_ID;
  const clientSecret = process.env.FUSION_DASHBOARD_CLIENT_SECRET;
  if (!apiBase || !clientId || !clientSecret) {
    res.status(500).json({ error: 'Missing FUSION_API_BASE/FUSION_DASHBOARD_CLIENT_ID/FUSION_DASHBOARD_CLIENT_SECRET' });
    return;
  }

  try {
    const upstream = await fetch(`${apiBase}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    const body = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json(body);
      return;
    }
    res.status(200).json({ access_token: body.access_token, expires_at: body.expires_at });
  } catch (error) {
    res.status(502).json({ error: 'Failed to reach backend', detail: error.message });
  }
}
