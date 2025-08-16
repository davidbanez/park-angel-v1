import React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7C3AED',
    primaryContainer: '#EDE9FE',
    secondary: '#8B5CF6',
    secondaryContainer: '#F3F4F6',
    tertiary: '#A855F7',
    surface: '#FFFFFF',
    surfaceVariant: '#F9FAFB',
    background: '#F3F4F6',
    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#374151',
    onBackground: '#111827',
    outline: '#D1D5DB',
    outlineVariant: '#E5E7EB',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
}