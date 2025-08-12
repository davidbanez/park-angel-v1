import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { ClientAuthService } from '../../services/authService';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  const { 
    signIn, 
    signInWithGoogle, 
    signInWithFacebook, 
    signInWithBiometrics,
    biometricAvailable,
    biometricEnabled,
    biometricTypes
  } = useAuth();

  useEffect(() => {
    checkBiometricAvailability();
  }, [biometricAvailable, biometricEnabled]);

  const checkBiometricAvailability = () => {
    if (biometricAvailable && biometricEnabled) {
      setShowBiometric(true);
      setBiometricType(ClientAuthService.getBiometricTypeDisplayName(biometricTypes));
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithBiometrics();
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Biometric Login Failed', result.error || 'Authentication failed');
      }
    } catch (error: any) {
      Alert.alert('Biometric Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert('Google Login Failed', result.error || 'Authentication failed');
      }
      // OAuth will redirect and handle success automatically
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithFacebook();
      if (!result.success) {
        Alert.alert('Facebook Login Failed', result.error || 'Authentication failed');
      }
      // OAuth will redirect and handle success automatically
    } catch (error: any) {
      Alert.alert('Facebook Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-600">
            Sign in to your Park Angel account
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity className="self-end">
              <Text className="text-primary-500 font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Biometric Login Button */}
        {showBiometric && (
          <TouchableOpacity
            onPress={handleBiometricLogin}
            disabled={loading}
            className={`py-4 px-8 rounded-xl mb-4 border-2 ${
              loading ? 'border-gray-300 bg-gray-100' : 'border-primary-500 bg-white'
            }`}
          >
            <Text className={`text-lg font-semibold text-center ${
              loading ? 'text-gray-400' : 'text-primary-500'
            }`}>
              {loading ? 'Authenticating...' : `Sign in with ${biometricType}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`py-4 px-8 rounded-xl mb-6 ${
            loading ? 'bg-gray-300' : 'bg-primary-500'
          }`}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Social Login */}
        <View className="mb-8">
          <Text className="text-gray-500 text-center mb-4">Or continue with</Text>
          
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              onPress={handleGoogleLogin}
              disabled={loading}
              className={`flex-1 border rounded-xl py-3 flex-row justify-center items-center ${
                loading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
              }`}
            >
              <Text className={`font-medium ml-2 ${
                loading ? 'text-gray-400' : 'text-gray-700'
              }`}>
                Google
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleFacebookLogin}
              disabled={loading}
              className={`flex-1 border rounded-xl py-3 flex-row justify-center items-center ${
                loading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
              }`}
            >
              <Text className={`font-medium ml-2 ${
                loading ? 'text-gray-400' : 'text-gray-700'
              }`}>
                Facebook
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-primary-500 font-medium">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}