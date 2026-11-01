import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-6 bg-[#f0f2f5] dark:bg-[#111b21] text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
            Unable to display this chat
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering issue occurred while opening this conversation.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reload Chat</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
