// Vercel serverless function for the dashboard's short-lived platform token.
// Keep the client secret in Vercel environment variables; it must never enter
// the browser bundle or the QR pairing payload.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiBase = process.env.FUSION_API_BASE?.replace(/\/$/, '');
  const clientId = process.env.FUSION_DASHBOARD_CLIENT_ID;
  const clientSecret = process.env.FUSION_DASHBOARD_CLIENT_SECRET;
  if (!apiBase || !clientId || !clientSecret) {
    res.status(503).json({ error: 'Dashboard authentication is not configured' });
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
      res.status(upstream.status).json({ error: 'Dashboard authentication failed', detail: body.detail || body.error });
      return;
    }
    res.status(200).json({ access_token: body.access_token, expires_at: body.expires_at });
  } catch (error) {
    res.status(502).json({ error: 'Failed to reach backend', detail: error.message });
  }
}
