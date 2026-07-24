/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: 'rgb(var(--soc-bg-primary) / <alpha-value>)',
          surface: 'rgb(var(--soc-bg-surface) / <alpha-value>)',
          panel: 'rgb(var(--soc-bg-panel) / <alpha-value>)',
          elevated: 'rgb(var(--soc-bg-elevated) / <alpha-value>)',
          border: 'rgb(var(--soc-border-subtle) / <alpha-value>)',
          borderStrong: 'rgb(var(--soc-border-default) / <alpha-value>)',
          borderHover: 'rgb(var(--soc-border-hover) / <alpha-value>)',
          text: 'rgb(var(--soc-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--soc-text-secondary) / <alpha-value>)',
          dim: 'rgb(var(--soc-text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--soc-text-inverse) / <alpha-value>)',
          onPrimary: 'rgb(var(--soc-text-on-primary) / <alpha-value>)',
          onWarning: 'rgb(var(--soc-text-on-warning) / <alpha-value>)',
          primary: 'rgb(var(--soc-brand-primary) / <alpha-value>)',
          primaryHover: 'rgb(var(--soc-brand-hover) / <alpha-value>)',
          success: 'rgb(var(--soc-status-success) / <alpha-value>)',
          warning: 'rgb(var(--soc-status-warning) / <alpha-value>)',
          danger: 'rgb(var(--soc-status-danger) / <alpha-value>)',
          info: 'rgb(var(--soc-status-info) / <alpha-value>)',
          quantum: 'rgb(var(--soc-status-quantum) / <alpha-value>)',
          overlay: 'rgb(var(--soc-overlay) / <alpha-value>)'
        }
      }
    },
  },
  plugins: [],
}

