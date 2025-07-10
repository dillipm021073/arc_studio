import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Viewer Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">3D View Error</h2>
        <p className="text-gray-400 text-sm mb-4">
          {error?.message || 'Something went wrong with the 3D visualization. This might be due to WebGL compatibility issues.'}
        </p>
        <div className="space-y-2">
          <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <div className="text-xs text-gray-500">
            Consider switching to 2D view if the problem persists
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;