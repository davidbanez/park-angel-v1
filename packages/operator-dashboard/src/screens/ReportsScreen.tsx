import React from 'react';
import { Card } from '../components/shared/Card';
import { Platform } from '../components/utils/platform';

export const ReportsScreen: React.FC = () => {
  if (!Platform.isNative()) {
    return null;
  }

  const { View, Text, ScrollView } = require('react-native');

  return (
    <ScrollView className="flex-1 bg-secondary-50">
      <View className="p-4">
        <Card>
          <View className="p-6 items-center">
            <View className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Text className="text-orange-600 text-2xl">📈</Text>
            </View>
            <Text className="text-lg font-semibold text-secondary-900 mb-2 text-center">
              Reports & Analytics
            </Text>
            <Text className="text-secondary-600 mb-4 text-center">
              This feature will be implemented in the next task.
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};