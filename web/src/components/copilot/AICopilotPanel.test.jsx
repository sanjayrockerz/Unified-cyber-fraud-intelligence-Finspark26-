import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './AICopilotPanel';

// Shapes captured verbatim from GET/POST /api/copilot/chat in production
// (source: grounded_backend_state). The grounded fallback returns structured
// telemetry, not prose -- rendering it with String(value) produced
// "[object Object],[object Object]" in every evidence card.
const EVIDENCE = [
  {
    txn_id: 'txn_syn_269170',
    timestamp: '2026-08-04 20:06:45',
    user_id: 'usr_000087',
    amount: 64109.01,
    type: 'UPI',
    channel: 'UPI_GATEWAY',
    cyber_compromise_in_window: false,
    dest_mule_cluster_id: null,
    decision: 'ALLOW',
    tenant_id: 'TENANT_FUSB_001',
  },
];
const SIGNALS = [
  {
    threat_id: 'THR_9B4E9C71',
    threat_name: 'High-Value Velocity Surge Transaction Risk',
    threat_category: 'Transaction Threats',
    severity: 'CRITICAL',
    confidence: null,
    evidence: [{ field: 'user_id', observed_value: 'usr_000076' }],
  },
];
const IMPACT = { blocked_amount: 7842845.06, affected_cases: 15 };
const REFERENCES = { tenant_state: 'SQLite and threat engine', graph: '56 nodes / 53 relationships' };

describe('Section', () => {
  it('never renders raw [object Object] for structured telemetry', () => {
    for (const value of [EVIDENCE, SIGNALS, IMPACT, REFERENCES, [IMPACT]]) {
      const { container, unmount } = render(<Section value={value} />);
      expect(container.textContent).not.toContain('[object Object]');
      unmount();
    }
  });

  it('surfaces the identifying fields of each evidence row', () => {
    render(<Section value={EVIDENCE} />);
    expect(screen.getByText('txn_syn_269170')).toBeInTheDocument();
    expect(screen.getByText('ALLOW')).toBeInTheDocument();
    expect(screen.getByText('usr_000087')).toBeInTheDocument();
  });

  it('titles a threat signal by name and shows its severity', () => {
    render(<Section value={SIGNALS} />);
    expect(screen.getByText('High-Value Velocity Surge Transaction Risk')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders a plain object as labelled key/value rows with formatted numbers', () => {
    render(<Section value={IMPACT} />);
    expect(screen.getByText('Blocked Amount')).toBeInTheDocument();
    expect(screen.getByText('7,842,845.06')).toBeInTheDocument();
    expect(screen.getByText('Affected Cases')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders a list of strings as separate items, not a comma-joined blob', () => {
    const actions = ['Review observed evidence', 'Validate adaptive trust context'];
    const { container } = render(<Section value={actions} />);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.textContent).not.toContain('evidence,Validate');
  });

  it('still renders plain strings and falls back when empty', () => {
    const { container: text } = render(<Section value="CRITICAL" />);
    expect(text.textContent).toBe('CRITICAL');
    const { container: empty } = render(<Section value={[]} />);
    expect(empty.textContent).toContain('Not observed');
  });

  it('omits null-valued fields rather than printing null', () => {
    const { container } = render(<Section value={EVIDENCE} />);
    expect(container.textContent).not.toContain('null');
    expect(container.textContent).not.toContain('Dest Mule Cluster Id');
  });
});
