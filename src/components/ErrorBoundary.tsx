import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props!: Props;
  public state: State;
  public setState!: (state: any) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div style={{ color: 'white', padding: '20px', backgroundColor: '#141414', height: '100vh' }}>
          <h2>Application Error</h2>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: '8px 16px', marginTop: '10px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
