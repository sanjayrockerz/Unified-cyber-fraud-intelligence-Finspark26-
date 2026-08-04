import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuantumTrustPanel from './QuantumTrustPanel';

// Envelope shapes captured verbatim from production. The API wraps every
// response in {success, data, meta, errors}. A dict payload is ALSO flattened
// onto the envelope, but a list payload cannot be -- so /quantum/inventory and
// /quantum/recommendations expose their arrays only under `data`. Assigning the
// whole envelope to state made `inventory.filter(...)` throw and took the entire
// panel down to the ErrorBoundary ("Service temporarily unavailable").
const READINESS_PAYLOAD = {
  readiness_score: 68.0,
  readiness_level: 'MODERATE',
  crypto_agility_status: 'PARTIALLY_ENABLED',
  total_crypto_assets: 5,
  quantum_resistant_assets: 1,
  legacy_deprecated_assets: 1,
  high_risk_assets: 3,
  certificates_expiring_90d: 3,
  pqc_adoption_percent: 20.0,
  assessment_timestamp: '2026-08-04 14:19:05 IST',
};
const INVENTORY_PAYLOAD = [
  { id: 'ASSET_001', name: 'Core Banking CBS Gateway TLS', type: 'API Endpoint', public_key_algo: 'RSA-2048', key_exchange: 'ECDHE_RSA', digital_signature: 'RSA-PSS-SHA256', tls_version: 'TLS 1.3', cert_expiry_days: 88, crypto_library: 'OpenSSL 3.1.2', pqc_status: 'HYBRID_READY', quantum_risk: 'HIGH' },
  { id: 'ASSET_002', name: 'Analyst Console mTLS', type: 'Internal Service', public_key_algo: 'ML-KEM-768', key_exchange: 'ML-KEM', digital_signature: 'ML-DSA-65', tls_version: 'TLS 1.3', cert_expiry_days: 210, crypto_library: 'liboqs 0.10', pqc_status: 'PQC_NATIVE', quantum_risk: 'LOW' },
];
const RECOMMENDATIONS_PAYLOAD = [
  { id: 'REC_001', title: 'Migrate Core Banking Gateway from RSA-2048 to ML-KEM-768 Hybrid', priority: 'HIGH', target_system: 'Core Banking CBS Gateway TLS (ASSET_001)', action: 'Deploy hybrid key exchange', estimated_complexity: 'MEDIUM', estimated_time_days: 45, business_impact: 'Low', security_benefit: 'HNDL mitigation' },
];

const envelope = (payload) => ({
  success: true,
  data: payload,
  meta: { request_id: 'test' },
  errors: [],
  // A dict payload is additionally flattened onto the envelope by the API;
  // a list payload is not. Mirror that exactly.
  ...(Array.isArray(payload) ? {} : payload),
});

function mockQuantumApi() {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const path = String(url);
    const body = path.includes('/quantum/readiness') ? envelope(READINESS_PAYLOAD)
      : path.includes('/quantum/assessment') ? envelope({ readiness_summary: READINESS_PAYLOAD, cryptographic_profile: {}, risk_distribution: {} })
      : path.includes('/quantum/inventory') ? envelope(INVENTORY_PAYLOAD)
      : path.includes('/quantum/recommendations') ? envelope(RECOMMENDATIONS_PAYLOAD)
      : envelope({});
    return { ok: true, status: 200, json: async () => body };
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe('QuantumTrustPanel', () => {
  it('renders the readiness posture instead of crashing on the response envelope', async () => {
    mockQuantumApi();
    render(<QuantumTrustPanel />);
    expect(await screen.findByText(/QUANTUM READINESS SCORE/i)).toBeInTheDocument();
    expect(screen.getByText('MODERATE')).toBeInTheDocument();
    expect(screen.getByText('PARTIALLY_ENABLED')).toBeInTheDocument();
  });

  it('reads the inventory and recommendation arrays out of the envelope data key', async () => {
    mockQuantumApi();
    const { container } = render(<QuantumTrustPanel />);
    await screen.findByText(/QUANTUM READINESS SCORE/i);
    // Tab badges are driven by inventory.length / recommendations.length --
    // both were undefined while the raw envelope sat in state.
    await waitFor(() => {
      expect(container.textContent).toContain('Crypto Inventory');
      expect(container.textContent).toContain('PQC Migration');
    });
    expect(screen.getByText('Crypto Inventory').closest('button').textContent).toContain('2');
    expect(screen.getByText('PQC Migration').closest('button').textContent).toContain('1');
  });

  it('survives a list endpoint that returns a bare array with no envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const path = String(url);
      const body = path.includes('/quantum/readiness') ? envelope(READINESS_PAYLOAD)
        : path.includes('/quantum/assessment') ? envelope({ readiness_summary: READINESS_PAYLOAD })
        : path.includes('/quantum/inventory') ? INVENTORY_PAYLOAD
        : path.includes('/quantum/recommendations') ? RECOMMENDATIONS_PAYLOAD
        : envelope({});
      return { ok: true, status: 200, json: async () => body };
    }));
    render(<QuantumTrustPanel />);
    expect(await screen.findByText(/QUANTUM READINESS SCORE/i)).toBeInTheDocument();
    expect(screen.getByText('Crypto Inventory').closest('button').textContent).toContain('2');
  });

  it('does not crash when a list endpoint fails and returns an error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const path = String(url);
      if (path.includes('/quantum/inventory') || path.includes('/quantum/recommendations')) {
        return { ok: false, status: 500, json: async () => ({ success: false, data: null, errors: [{ code: 'BOOM' }] }) };
      }
      const body = path.includes('/quantum/readiness') ? envelope(READINESS_PAYLOAD) : envelope({ readiness_summary: READINESS_PAYLOAD });
      return { ok: true, status: 200, json: async () => body };
    }));
    render(<QuantumTrustPanel />);
    expect(await screen.findByText(/QUANTUM READINESS SCORE/i)).toBeInTheDocument();
    expect(screen.getByText('Crypto Inventory').closest('button').textContent).toContain('0');
  });
});
