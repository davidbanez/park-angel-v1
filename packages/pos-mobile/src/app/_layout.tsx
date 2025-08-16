import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import 'react-native-url-polyfill/auto';

import { AuthProvider } from '../providers/AuthProvider';
import { POSProvider } from '../providers/POSProvider';
import { OfflineProvider } from '../providers/OfflineProvider';
import { ThemeProvider } from '../providers/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <OfflineProvider>
              <AuthProvider>
                <POSProvider>
                  <Stack
                    screenOptions={{
                      headerStyle: {
                        backgroundColor: '#7C3AED',
                      },
                      headerTintColor: '#fff',
                      headerTitleStyle: {
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    <Stack.Screen 
                      name="index" 
                      options={{ 
                        title: 'Park Angel POS',
                        headerShown: false 
                      }} 
                    />
                    <Stack.Screen 
                      name="(auth)" 
                      options={{ 
                        headerShown: false 
                      }} 
                    />
                    <Stack.Screen 
                      name="(pos)" 
                      options={{ 
                        headerShown: false 
                      }} 
                    />
                  </Stack>
                  <StatusBar style="light" backgroundColor="#7C3AED" />
                  <Toast />
                </POSProvider>
              </AuthProvider>
            </OfflineProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}