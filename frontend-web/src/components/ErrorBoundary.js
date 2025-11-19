import React from 'react';

/**
 * ErrorBoundary Component
 * Catches React errors and displays a fallback UI instead of crashing
 * Helps with graceful error handling across the application
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
            <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <summary className="cursor-pointer font-semibold text-gray-700">Error details</summary>
              <pre className="mt-2 text-xs overflow-auto">{this.state.error && this.state.error.toString()}</pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
