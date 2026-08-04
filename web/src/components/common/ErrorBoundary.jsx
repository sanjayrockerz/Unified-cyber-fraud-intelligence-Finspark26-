import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, failedAt: null };
    this.retryTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, failedAt: new Date().toISOString() };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught render error:', error, info);
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.handleReset();
    }
    if (this.state.hasError && !this.retryTimer) {
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.handleReset();
      }, 2500);
    }
  }

  handleReset = () => {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.setState({ hasError: false, error: null, failedAt: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-soc-warning/40 bg-soc-surface p-6 text-center">
        <AlertTriangle aria-hidden="true" className="h-8 w-8 text-soc-warning" />
        <p className="text-sm font-semibold text-soc-text">Service temporarily unavailable</p>
        <p className="max-w-md text-xs text-soc-muted">The platform is reconnecting automatically. Monitoring continues in the background.</p>
        <p className="text-[11px] text-soc-muted">Last successful update: unavailable</p>
        <button type="button" onClick={this.handleReset} className="mt-2 inline-flex items-center gap-2 rounded border border-soc-border px-3 py-1.5 text-xs font-semibold text-soc-text hover:border-soc-primary">
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Retry
        </button>
        <a href="/" className="text-xs text-soc-primary hover:underline">Return to Overview</a>
      </div>
    );
  }
}
