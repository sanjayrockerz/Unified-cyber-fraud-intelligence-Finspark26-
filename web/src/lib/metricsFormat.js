/**
 * Shared formatting for reported fusion metrics.
 *
 * Extracted from AnalyticsPage so that every surface reporting the same
 * numbers formats them identically. Per CLAUDE.md, metrics honesty is a scoring
 * criterion — divergent rounding or an inconsistent "uplift" sign between two
 * pages showing the same /metrics/evaluate payload would be a real defect.
 */

/**
 * Threshold below which a delta is treated as "flat" rather than a genuine move
 * in either direction — avoids describing FP-noise-sized wiggles as a win or a
 * regression.
 */
export const FLAT_EPSILON = 0.0005;

export const formatPct = (val) => `${(val * 100).toFixed(2)}%`;

export const formatF = (val) => val.toFixed(3);

export const getUplift = (base, fusion, isPct) => {
  const diff = fusion - base;
  return isPct
    ? `${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(2)}%`
    : `${diff >= 0 ? '+' : ''}${diff.toFixed(3)}`;
};

/**
 * Direction word derived purely from the sign of an actual delta — never a
 * hardcoded direction.
 */
export const deltaWord = (delta) => {
  if (delta > FLAT_EPSILON) return 'improves';
  if (delta < -FLAT_EPSILON) return 'declines';
  return 'holds steady';
};
