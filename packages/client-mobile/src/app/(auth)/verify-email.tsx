import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { user, isEmailVerified, sendEmailVerification } = useAuth();

  useEffect(() => {
    // Redirect if email is already verified
    if (isEmailVerified) {
      router.replace('/(tabs)');
    }
  }, [isEmailVerified]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      const result = await sendEmailVerification();
      if (result.success) {
        Alert.alert('Success', 'Verification email sent! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Skip Verification?',
      'You can verify your email later in settings. Some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(tabs)') },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8 justify-center">
        {/* Header */}
        <View className="mb-8 text-center">
          <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Verify Your Email
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            We've sent a verification link to:
          </Text>
          <Text className="text-primary-500 font-semibold text-center mb-6">
            {user?.email}
          </Text>
          <Text className="text-gray-600 text-center">
            Please check your email and click the verification link to activate your account.
          </Text>
        </View>

        {/* Resend Button */}
        <TouchableOpacity
          onPress={handleResendVerification}
          disabled={loading || countdown > 0}
          className={`py-4 px-8 rounded-xl mb-4 ${
            loading || countdown > 0 ? 'bg-gray-300' : 'bg-primary-500'
          }`}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {loading 
              ? 'Sending...' 
              : countdown > 0 
                ? `Resend in ${countdown}s` 
                : 'Resend Verification Email'
            }
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkipForNow}
          className="py-4 px-8 rounded-xl border border-gray-300 mb-6"
        >
          <Text className="text-gray-700 text-lg font-semibold text-center">
            Skip for Now
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View className="mt-8">
          <Text className="text-sm text-gray-500 text-center mb-2">
            Didn't receive the email?
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            Check your spam folder or try resending the verification email.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}