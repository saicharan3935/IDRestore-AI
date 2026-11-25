import React, { Component } from 'react';
import { AlertCircle, RefreshCw, RotateCcw, ShieldAlert, FileX } from 'lucide-react';

/**
 * WorkspaceErrorBoundary
 * Enterprise React Error Boundary protecting the workspace tabs (Restoration, Analysis, etc.).
 * Guarantees that an uncaught render or component lifecycle error will NEVER blank the screen.
 */
export class WorkspaceErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[WorkspaceErrorBoundary] Caught exception:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      return (
        <div className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-[#101820]/95 backdrop-blur-2xl border border-[#FF5C5C]/40 shadow-2xl text-[#F8FAFC] font-mono select-none text-left">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C5C]/15 border border-[#FF5C5C]/50 flex items-center justify-center text-[#FF5C5C]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-[#F8FAFC] uppercase">
                {this.props.title || 'WORKSPACE COMPONENT RECOVERED'}
              </h2>
              <span className="text-[10px] text-[#94A3B8] tracking-widest uppercase">
                ERROR BOUNDARY CONTAINMENT ACTIVE &bull; SYSTEM STABLE
              </span>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-[#0B1117] border border-[#22323D] text-xs text-[#94A3B8] space-y-2">
            <p className="text-[#FF5C5C] font-semibold">
              {this.state.error?.message || 'An unexpected rendering error occurred while loading this view.'}
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              The application shell remains fully functional. You can reset this component or upload another image safely.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="py-2.5 px-5 rounded-xl text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center space-x-2 shadow-cyan-strong active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RETRY / RELOAD WORKSPACE</span>
            </button>

            {this.props.onClear && (
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  this.props.onClear();
                }}
                className="py-2.5 px-4 rounded-xl text-xs text-[#DCE7EC] hover:text-[#00FFA3] bg-[#17232C] hover:bg-[#22323D] border border-[#22323D] transition-all flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET UPLOADED IMAGE</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WorkspaceErrorBoundary;
