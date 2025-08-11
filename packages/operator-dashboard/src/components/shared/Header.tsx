import React from 'react';
import { Platform } from '../utils/platform';
import { useAuthStore } from '../../stores/authStore';
import { useOperatorStore } from '../../stores/operatorStore';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { operatorData } = useOperatorStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (Platform.isNative()) {
    const { View, Text, TouchableOpacity } = require('react-native');
    
    return (
      <View className="bg-primary-500 px-4 py-3 flex-row justify-between items-center">
        <View>
          <Text className="text-white text-lg font-semibold">
            Park Angel Operator
          </Text>
          {operatorData && (
            <Text className="text-primary-100 text-sm">
              {operatorData.company_name}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-primary-600 px-3 py-1 rounded-lg"
        >
          <Text className="text-white text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 px-6 py-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PA</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-secondary-900">
                Park Angel Operator
              </h1>
              {operatorData && (
                <p className="text-sm text-secondary-600">
                  {operatorData.company_name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-secondary-900">
              {user?.email}
            </p>
            <p className="text-xs text-secondary-600">Operator</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};