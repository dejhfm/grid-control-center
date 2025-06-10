
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
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
    console.error('ErrorBoundary caught an error:', {
      component: this.props.componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 border border-red-200 rounded-lg bg-red-50">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Fehler in {this.props.componentName || 'Komponente'}
          </h3>
          <p className="text-sm text-red-600 mb-4 text-center">
            {this.state.error?.message || 'Ein unbekannter Fehler ist aufgetreten'}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
            size="sm"
          >
            Erneut versuchen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
