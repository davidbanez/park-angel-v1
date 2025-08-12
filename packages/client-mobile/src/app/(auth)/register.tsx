import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Basic password strength validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      Alert.alert(
        'Weak Password', 
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, firstName, lastName);
      Alert.alert(
        'Success',
        'Account created! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert('Google Sign Up Failed', result.error || 'Authentication failed');
      }
      // OAuth will redirect and handle success automatically
    } catch (error: any) {
      Alert.alert('Google Sign Up Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithFacebook();
      if (!result.success) {
        Alert.alert('Facebook Sign Up Failed', result.error || 'Authentication failed');
      }
      // OAuth will redirect and handle success automatically
    } catch (error: any) {
      Alert.alert('Facebook Sign Up Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </Text>
          <Text className="text-gray-600">
            Join Park Angel and start parking smarter
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4 mb-8">
          <View className="flex-row space-x-4">
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-2">First Name</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
                autoComplete="given-name"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-2">Last Name</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
                autoComplete="family-name"
              />
            </View>
          </View>

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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />
            <Text className="text-gray-500 text-sm mt-1">
              Must be at least 8 characters with uppercase, lowercase, and number
            </Text>
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className={`py-4 px-8 rounded-xl mb-6 ${
            loading ? 'bg-gray-300' : 'bg-primary-500'
          }`}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Social Login */}
        <View className="mb-8">
          <Text className="text-gray-500 text-center mb-4">Or continue with</Text>
          
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              onPress={handleGoogleSignUp}
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
              onPress={handleFacebookSignUp}
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

        {/* Terms */}
        <Text className="text-sm text-gray-500 text-center mb-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Text>

        {/* Sign In Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-primary-500 font-medium">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}