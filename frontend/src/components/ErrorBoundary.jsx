import React from 'react';
import { AlertOctagon, RotateCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('UI crash caught by ErrorBoundary:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.handleReset();
    }
  }

  handleReset() {
    this.setState({ error: null, info: null });
  }

  render() {
    const { error, info } = this.state;
    const { children } = this.props;
    if (!error) return children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-lg bg-white rounded-panel border border-rose-200 shadow-panel p-6 text-center">
          <span className="inline-flex w-11 h-11 rounded-xl bg-rose-50 text-rose-600 items-center justify-center mb-3">
            <AlertOctagon size={22} />
          </span>
          <h1 className="text-lg font-extrabold text-slate-900">Something went wrong on this screen</h1>
          <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">
            The view failed to render. Your data is safe. Retry, or return to the command center.
          </p>
          <pre className="mt-3 max-h-32 overflow-auto text-left text-[11px] leading-relaxed text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2.5 whitespace-pre-wrap break-words">
            {String(error?.message || error)}
            {info?.componentStack ? `\n${info.componentStack.slice(0, 400)}` : ''}
          </pre>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors cursor-pointer"
            >
              <RotateCw size={14} /> Retry
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-bold transition-colors cursor-pointer"
            >
              <Home size={14} /> Command center
            </button>
          </div>
        </div>
      </div>
    );
  }
}
