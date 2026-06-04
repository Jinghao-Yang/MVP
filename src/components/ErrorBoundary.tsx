/* ================================================
   FILE: src/components/ErrorBoundary.tsx
   ================================================ */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('System Halt Caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FAFAF8] text-[#1C1C1A] p-8 font-sys select-none">
          <div className="glass-panel p-12 max-w-lg text-center space-y-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--bh-red)] font-bold">
              System Halt // Error Boundary
            </span>
            <h1 className="font-human text-3xl font-bold tracking-tight">
              An unexpected error has occurred
            </h1>
            <p className="font-sys text-sm text-neutral-500 leading-relaxed">
              {this.state.error?.message ||
                'An unknown runtime error interrupted the workspace execution.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white font-mono text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Restart Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
