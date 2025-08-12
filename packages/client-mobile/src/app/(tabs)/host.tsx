import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Become a Host
          </Text>
          
          <View className="bg-primary-50 rounded-xl p-6 mb-6">
            <Text className="text-lg font-semibold text-primary-900 mb-2">
              Earn Money from Your Parking Space
            </Text>
            <Text className="text-primary-700 mb-4">
              List your unused parking space and start earning passive income
            </Text>
            
            <TouchableOpacity className="bg-primary-500 py-3 px-6 rounded-lg">
              <Text className="text-white font-semibold text-center">
                Start Hosting
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4" />
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Easy Setup</Text>
                <Text className="text-gray-600">List your space in minutes</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4" />
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Flexible Pricing</Text>
                <Text className="text-gray-600">Set your own rates and availability</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4" />
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Secure Payments</Text>
                <Text className="text-gray-600">Get paid automatically after each booking</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}