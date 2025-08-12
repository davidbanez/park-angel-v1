import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@park-angel/shared/lib/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Handle OAuth callback
      if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token as string,
          refresh_token: params.refresh_token as string,
        });

        if (error) {
          console.error('OAuth callback error:', error);
          router.replace('/(auth)/login');
          return;
        }

        // Redirect to main app
        router.replace('/(tabs)');
      } else {
        // No tokens found, redirect to login
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-gray-600">Completing sign in...</Text>
      </View>
    </SafeAreaView>
  );
}