import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You could log to a monitoring service here
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-xl bg-white border border-red-200 rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-gray-700 mb-4">An error occurred while rendering the page.</p>
            {this.state.error && (
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-64">{String(this.state.error)}</pre>
            )}
            {this.state.info && this.state.info.componentStack && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-gray-600">Stack trace</summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">{this.state.info.componentStack}</pre>
              </details>
            )}
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
