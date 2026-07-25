import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught render error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-soc-danger/40 bg-soc-surface p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-soc-danger" />
        <p className="text-sm font-semibold text-soc-text">This panel hit an unexpected error.</p>
        <p className="max-w-md text-xs text-soc-muted">
          The rest of the platform is still running — you can retry this view or navigate elsewhere.
        </p>
        <details className="max-w-md text-left text-[11px] text-soc-dim">
          <summary className="cursor-pointer">Technical details</summary>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">{String(this.state.error?.message || this.state.error)}</pre>
        </details>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-2 inline-flex items-center gap-2 rounded border border-soc-border px-3 py-1.5 text-xs font-semibold text-soc-text hover:border-soc-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reload this view
        </button>
        <a href="/" className="text-xs text-soc-primary hover:underline">Return to Overview</a>
      </div>
    );
  }
}
