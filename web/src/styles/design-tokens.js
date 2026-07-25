/**
 * Fuzen AI Centralized Design System Tokens
 * Strictly conforms to professional security operations center design systems.
 */

export const colors = {
  bgCanvas: '#05070d',       // App background, near-black navy
  bgSurface: '#0b0e17',      // Sidebar, header, right rail background
  bgElevated: '#10141f',     // Cards, main panels
  bgElevated2: '#151a28',    // Nested cards, highlighted rows
  borderSubtle: '#1e2433',   // Primary light border line
  borderStrong: '#2a3244',   // Stronger outline border

  textPrimary: '#e8eaf0',    // Bright primary white-gray text
  textSecondary: '#9aa2b8',  // Subtitle/neutral text
  textMuted: '#5c6478',      // Inactive/muted text

  accent: '#38bdf8',         // Primary sky blue
  accentSoft: 'rgba(56, 189, 248, 0.1)', // 10% tint active bg

  severityCritical: '#f0455a',
  severityHigh: '#f5943c',
  severityMedium: '#f2c94c',
  severityLow: '#3ecf8e',

  severityCriticalSoft: 'rgba(240, 69, 90, 0.1)',
  severityHighSoft: 'rgba(245, 148, 60, 0.1)',
  severityLowSoft: 'rgba(62, 207, 142, 0.1)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  layoutMd: '32px',
  layoutLg: '48px',
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
};

export const shadows = {
  depth1: '0 0 0 1px #1e2433',
  depth2: '0 0 0 1px #2a3244',
  glowAccent: '0 0 8px rgba(56, 189, 248, 0.15)',
};

export const typography = {
  fontSans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",

  sizes: {
    display: '28px',
    h1: '20px',
    h2: '16px',
    h3: '14px',
    h4: '12px',
    body: '13px',
    caption: '11px',
    label: '11px',
    helper: '10px',
  },

  letterSpacing: {
    wide: '0.05em',
    tight: '-0.01em',
  },
};

export const animations = {
  transitionFast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionNormal: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const riskColors = {
  critical: colors.severityCritical,
  high: colors.severityHigh,
  medium: colors.severityMedium,
  low: colors.severityLow,
};
