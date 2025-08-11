import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/components/shared/ErrorBoundary';
import { MobileNavigator } from './src/navigation/MobileNavigator';
import './src/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#a855f7" />
        <MobileNavigator />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}