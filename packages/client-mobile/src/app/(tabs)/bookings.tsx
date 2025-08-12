import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            My Bookings
          </Text>
          
          <View className="bg-gray-50 rounded-xl p-6 mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Active Booking
            </Text>
            <Text className="text-gray-600">
              No active parking sessions
            </Text>
          </View>

          <View className="bg-gray-50 rounded-xl p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Recent Bookings
            </Text>
            <Text className="text-gray-600">
              Your booking history will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}