
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mobileErrorLogger } from '@/utils/mobileErrorLogger';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to mobile error logger for better mobile debugging
    try {
      mobileErrorLogger.logExternalError({
        type: 'javascript',
        message: `React Error Boundary: ${error.message}`,
        stack: error.stack,
        url: window.location.href
      });
    } catch (logError) {
      console.error('Failed to log to mobile error logger:', logError);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Enhanced error UI with detailed error information
      return (
        <div className="min-h-svh flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              We've encountered an unexpected error. Here are the details to help with troubleshooting:
            </p>
            
            {/* Platform Information */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Platform Info</h3>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <div>User Agent: {navigator.userAgent}</div>
                <div>Platform: {navigator.platform}</div>
                <div>URL: {window.location.href}</div>
                <div>Time: {new Date().toISOString()}</div>
              </div>
            </div>
            
            {/* Error Details */}
            {this.state.error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Error Details</h3>
                <div className="text-xs font-mono text-red-700 dark:text-red-400 mb-2">
                  <strong>Message:</strong> {this.state.error.message}
                </div>
                <div className="text-xs font-mono text-red-700 dark:text-red-400 mb-2">
                  <strong>Name:</strong> {this.state.error.name}
                </div>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-red-800 dark:text-red-300 cursor-pointer">
                      Stack Trace (click to expand)
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-400 mt-2 whitespace-pre-wrap overflow-auto max-h-40 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            {/* Component Info */}
            {this.state.errorInfo && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Component Stack</h3>
                <pre className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh page
              </Button>
              <Button 
                variant="outline"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
