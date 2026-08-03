// The decision engine speaks a richer vocabulary than the dashboard's
// ALLOW / CHALLENGE / BLOCK triad: core_platform/decision_runtime.py emits
// BLOCK_TRANSACTION, REQUIRE_FACE_AUTHENTICATION, REQUIRE_BIOMETRIC and ALLOW.
// Passing those strings straight into VerdictHero renders "AWAITING DECISION"
// for a genuine block, so every consumer normalises through here first.

const ENGINE_TO_VERDICT = {
  ALLOW: 'ALLOW',
  CHALLENGE: 'CHALLENGE',
  BLOCK: 'BLOCK',
  BLOCK_TRANSACTION: 'BLOCK',
  REQUIRE_BIOMETRIC: 'CHALLENGE',
  REQUIRE_FACE_AUTHENTICATION: 'CHALLENGE',
  REQUIRE_STEP_UP: 'CHALLENGE',
};

/**
 * Map an engine action onto ALLOW / CHALLENGE / BLOCK.
 * Returns null for an unknown or absent action so callers can render an
 * honest "awaiting decision" state rather than assuming a severity.
 */
export function normalizeVerdict(action) {
  if (!action) return null;
  return ENGINE_TO_VERDICT[String(action).toUpperCase()] ?? null;
}

export const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const severityTone = {
  CRITICAL: 'text-soc-danger',
  HIGH: 'text-soc-warning',
  MEDIUM: 'text-soc-info',
  LOW: 'text-soc-muted',
};

export const severityChip = {
  CRITICAL: 'border-soc-danger/40 bg-soc-danger/10 text-soc-danger',
  HIGH: 'border-soc-warning/40 bg-soc-warning/10 text-soc-warning',
  MEDIUM: 'border-soc-info/40 bg-soc-info/10 text-soc-info',
  LOW: 'border-soc-border bg-soc-panel text-soc-muted',
};

export function compareBySeverity(a, b) {
  const left = SEVERITY_ORDER[a?.severity] ?? 99;
  const right = SEVERITY_ORDER[b?.severity] ?? 99;
  if (left !== right) return left - right;
  return Number(b?.score || 0) - Number(a?.score || 0);
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? inr.format(amount) : '—';
}

export function formatTimestamp(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}
