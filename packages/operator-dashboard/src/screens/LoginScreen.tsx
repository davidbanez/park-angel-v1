import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';
import { Platform } from '../components/utils/platform';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { signIn, verifyOTP, isLoading, error, clearError } = useAuthStore();

  const handleSignIn = async () => {
    clearError();
    
    try {
      await signIn(email, password);
      setShowOTP(true);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleOTPVerification = async () => {
    clearError();
    
    try {
      await verifyOTP(email, otp);
    } catch (error) {
      console.error('OTP verification error:', error);
    }
  };

  if (!Platform.isNative()) {
    return null; // This component is only for mobile
  }

  const { View, Text, ScrollView, KeyboardAvoidingView } = require('react-native');

  return (
    <KeyboardAvoidingView className="flex-1 bg-gradient-to-br from-primary-50 to-primary-100">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>
        <View className="w-full max-w-md mx-auto">
          <View className="text-center mb-8">
            <View className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Text className="text-white font-bold text-2xl">PA</Text>
            </View>
            <Text className="text-3xl font-bold text-secondary-900 mb-2">
              Park Angel Operator
            </Text>
            <Text className="text-secondary-600">
              Sign in to manage your parking operations
            </Text>
          </View>

          <Card padding="lg">
            {!showOTP ? (
              <View className="space-y-4">
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  required
                />
                
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  type="password"
                  required
                />

                {error && (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <Text className="text-red-600 text-sm">{error}</Text>
                  </View>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  onPress={handleSignIn}
                  className="w-full"
                >
                  Sign In
                </Button>
              </View>
            ) : (
              <View className="space-y-4">
                <View className="text-center mb-4">
                  <Text className="text-xl font-semibold text-secondary-900 mb-2">
                    Verify Your Account
                  </Text>
                  <Text className="text-secondary-600 text-sm">
                    We've sent a verification code to {email}
                  </Text>
                </View>

                <Input
                  label="Verification Code"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit code"
                  required
                />

                {error && (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <Text className="text-red-600 text-sm">{error}</Text>
                  </View>
                )}

                <View className="flex-row space-x-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onPress={() => setShowOTP(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    onPress={handleOTPVerification}
                    className="flex-1"
                  >
                    Verify
                  </Button>
                </View>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};