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
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to error tracking service (if available)
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { axiomErrorTracking?: { capture: (e: Error) => void } })
        .axiomErrorTracking
    ) {
      (
        window as unknown as { axiomErrorTracking: { capture: (e: Error) => void } }
      ).axiomErrorTracking.capture(error);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FAFAF8] text-[#1C1C1A] p-8 font-sys select-none">
          <div className="glass-panel p-12 max-w-lg text-center space-y-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-bh-red font-bold">
              System Halt // Error Boundary
            </span>
            <h1 className="font-human text-3xl font-bold tracking-tight">
              An unexpected error has occurred
            </h1>
            <p className="font-sys text-sm text-neutral-500 leading-relaxed">
              {this.state.error?.message ||
                'An unknown runtime error interrupted the workspace execution.'}
            </p>
            {this.state.errorInfo && (
              <details className="text-left bg-neutral-100 rounded p-4 text-xs font-mono text-neutral-600">
                <summary className="cursor-pointer font-bold">View stack trace</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider hover:bg-neutral-300 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-black text-white font-mono text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                Restart Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
