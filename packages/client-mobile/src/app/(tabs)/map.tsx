import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Parking Map
        </Text>
        <Text className="text-gray-600 text-center px-6">
          Interactive map with parking spots will be implemented here
        </Text>
      </View>
    </SafeAreaView>
  );
}