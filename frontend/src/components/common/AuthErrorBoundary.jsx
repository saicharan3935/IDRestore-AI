import React, { Component } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

/**
 * AuthErrorBoundary
 * Enterprise-grade React Error Boundary protecting the authentication UI shell.
 * Prevents component rendering or lifecycle errors from unmounting the tree or causing a black screen.
 */
export class AuthErrorBoundary extends Component {
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
    // Log diagnostics safely in development — NEVER log user credentials, tokens, or passwords!
    console.error('[AuthErrorBoundary] Caught render exception:', {
      message: error?.message,
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
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      // Default Obsidian Futurism Recoverable Error Card
      return (
        <div className="w-full bg-[#101820]/95 backdrop-blur-2xl border border-[#FF5C5C]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#F8FAFC] font-mono select-none">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C5C]/15 border border-[#FF5C5C]/50 flex items-center justify-center text-[#FF5C5C]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-[#F8FAFC]">
                AUTHENTICATION INTERFACE RECOVERED
              </h2>
              <span className="text-[10px] text-[#94A3B8] tracking-widest uppercase">
                ERROR BOUNDARY CONTAINMENT ACTIVE
              </span>
            </div>
          </div>

          <div className="mb-6 p-3.5 rounded-xl bg-[#0B1117] border border-[#22323D] text-xs text-[#94A3B8] space-y-1.5">
            <p className="text-[#FF5C5C] font-semibold">
              {this.state.error?.message || 'An unexpected rendering error occurred during tab transition.'}
            </p>
            <p className="text-[10px] text-[#94A3B8]">
              The authentication shell has preserved your session state. You can safely retry or switch back to the Sign In interface.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center justify-center space-x-2 shadow-cyan-strong"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RETRY OPERATION</span>
            </button>

            {this.props.onGoSignIn && (
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  this.props.onGoSignIn();
                }}
                className="py-2.5 px-4 rounded-xl text-xs text-[#DCE7EC] hover:text-[#00E5FF] bg-[#17232C] hover:bg-[#22323D] border border-[#22323D] transition-all flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK TO SIGN IN</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
