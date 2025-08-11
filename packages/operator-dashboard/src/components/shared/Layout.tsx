import React from 'react';
import { Platform } from '../utils/platform';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  if (Platform.isNative()) {
    // Mobile layout is handled by navigation
    const { View } = require('react-native');
    return (
      <View className="flex-1 bg-secondary-50">
        {children}
      </View>
    );
  }

  // Web layout with sidebar
  return (
    <div className="min-h-screen bg-secondary-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};