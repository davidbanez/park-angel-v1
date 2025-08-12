import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo */}
        <View className="mb-12">
          <View className="w-32 h-32 bg-primary-500 rounded-full justify-center items-center mb-6">
            <Text className="text-white text-4xl font-bold">PA</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 text-center">
            Park Angel
          </Text>
          <Text className="text-lg text-gray-600 text-center mt-2">
            Find, Reserve & Pay for Parking
          </Text>
        </View>

        {/* Features */}
        <View className="mb-12 space-y-4">
          <View className="flex-row items-center">
            <View className="w-6 h-6 bg-primary-500 rounded-full mr-3" />
            <Text className="text-gray-700">Find parking spots near you</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-6 h-6 bg-primary-500 rounded-full mr-3" />
            <Text className="text-gray-700">Reserve in advance or park now</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-6 h-6 bg-primary-500 rounded-full mr-3" />
            <Text className="text-gray-700">Secure payments & navigation</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-4">
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity className="bg-primary-500 py-4 px-8 rounded-xl">
              <Text className="text-white text-lg font-semibold text-center">
                Get Started
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="border border-primary-500 py-4 px-8 rounded-xl">
              <Text className="text-primary-500 text-lg font-semibold text-center">
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Terms */}
        <Text className="text-sm text-gray-500 text-center mt-8 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}