import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Platform } from '../utils/platform';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  if (Platform.isNative()) {
    const { View, Text, TouchableOpacity } = require('react-native');
    
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <View className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <Text className="text-red-800 text-lg font-semibold mb-2">
            Something went wrong
          </Text>
          <Text className="text-red-600 text-sm mb-4">
            {error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={onRetry}
            className="bg-primary-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium text-center">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <div className="flex-1 flex justify-center items-center p-6 bg-white min-h-screen">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h2 className="text-red-800 text-lg font-semibold mb-2">
          Something went wrong
        </h2>
        <p className="text-red-600 text-sm mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={onRetry}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};