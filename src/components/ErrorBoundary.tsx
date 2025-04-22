import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to console with more details
    console.group('Application Error Details');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // If there's a custom fallback, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use our enhanced error UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Something went wrong</h2>
            </div>
            
            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                We're sorry, but there was an error loading this page.
              </p>
              
              {this.state.error && (
                <div className="bg-red-50 p-3 rounded-md text-sm text-red-800 font-mono overflow-auto">
                  {this.state.error.toString()}
                </div>
              )}
              
              <p className="text-gray-600 text-sm">
                Please try one of the options below to resolve the issue:
              </p>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                onClick={this.handleRefresh}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2"
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                asChild
                className="flex items-center justify-center gap-2"
              >
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>If this error persists, please contact the conference technical team at isbmunconference@gmail.com</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
