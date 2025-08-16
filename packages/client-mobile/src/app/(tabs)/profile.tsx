import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { ClientAuthService } from '../../services/authService';
import VehicleManagement from '../../components/profile/VehicleManagement';
import TransactionHistory from '../../components/profile/TransactionHistory';
import CustomerSupport from '../../components/profile/CustomerSupport';
import NotificationPreferences from '../../components/profile/NotificationPreferences';
import AIRecommendations from '../../components/profile/AIRecommendations';

type ProfileSection = 'profile' | 'vehicles' | 'transactions' | 'support' | 'notifications' | 'ai' | 'discount';

export default function ProfileScreen() {
  const { 
    user, 
    signOut, 
    isEmailVerified, 
    biometricAvailable, 
    biometricEnabled, 
    biometricTypes,
    enableBiometricAuth,
    disableBiometricAuth,
    sendEmailVerification,
    updateProfile
  } = useAuth();

  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [biometricToggle, setBiometricToggle] = useState(biometricEnabled);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    setBiometricToggle(biometricEnabled);
  }, [biometricEnabled]);

  const loadProfile = async () => {
    try {
      const result = await ClientAuthService.getUserProfile();
      if (result.success && result.profile) {
        setProfile({
          firstName: result.profile.first_name || '',
          lastName: result.profile.last_name || '',
          phone: result.profile.phone || '',
          dateOfBirth: result.profile.date_of_birth || '',
          address: result.profile.address || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const result = await updateProfile(profile);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value && !biometricEnabled) {
      // Enable biometric auth
      Alert.prompt(
        'Enable Biometric Authentication',
        'Please enter your password to enable biometric authentication:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async (password) => {
              if (password && user?.email) {
                const result = await enableBiometricAuth(user.email, password);
                if (result.success) {
                  Alert.alert('Success', 'Biometric authentication enabled');
                } else {
                  Alert.alert('Error', result.error || 'Failed to enable biometric auth');
                  setBiometricToggle(false);
                }
              }
            },
          },
        ],
        'secure-text'
      );
    } else if (!value && biometricEnabled) {
      // Disable biometric auth
      Alert.alert(
        'Disable Biometric Authentication',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setBiometricToggle(true) },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              const result = await disableBiometricAuth();
              if (result.success) {
                Alert.alert('Success', 'Biometric authentication disabled');
              } else {
                Alert.alert('Error', result.error || 'Failed to disable biometric auth');
                setBiometricToggle(true);
              }
            },
          },
        ]
      );
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    try {
      const result = await sendEmailVerification();
      if (result.success) {
        Alert.alert('Success', 'Verification email sent! Please check your inbox.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { id: 'profile', title: 'Profile Settings', icon: 'person', description: 'Manage your personal information' },
    { id: 'vehicles', title: 'My Vehicles', icon: 'car', description: 'Manage your registered vehicles' },
    { id: 'transactions', title: 'Transaction History', icon: 'receipt', description: 'View your payment history' },
    { id: 'discount', title: 'Discount Application', icon: 'pricetag', description: 'Apply for Senior/PWD discounts' },
    { id: 'support', title: 'Customer Support', icon: 'help-circle', description: 'Get help from our support team' },
    { id: 'notifications', title: 'Notifications', icon: 'notifications', description: 'Manage notification preferences' },
    { id: 'ai', title: 'AI Recommendations', icon: 'bulb', description: 'Smart parking suggestions' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'vehicles':
        return <VehicleManagement />;
      case 'transactions':
        return <TransactionHistory />;
      case 'support':
        return <CustomerSupport />;
      case 'notifications':
        return <NotificationPreferences />;
      case 'ai':
        return <AIRecommendations />;
      case 'discount':
        return (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="pricetag-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4 mb-2">Discount Application</Text>
            <Text className="text-gray-400 text-center mb-6">
              Apply for Senior Citizen or PWD discounts
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/discount-application')}
              className="bg-purple-500 py-3 px-6 rounded-xl"
            >
              <Text className="text-white font-semibold">Apply for Discount</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return renderProfileSettings();
    }
  };

  const renderProfileSettings = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Email Verification Status */}
      {!isEmailVerified && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <Text className="text-yellow-800 font-medium mb-2">Email Not Verified</Text>
          <Text className="text-yellow-700 text-sm mb-3">
            Please verify your email address to access all features.
          </Text>
          <TouchableOpacity
            onPress={handleSendVerification}
            disabled={loading}
            className="bg-yellow-500 py-2 px-4 rounded-lg"
          >
            <Text className="text-white font-medium text-center">
              {loading ? 'Sending...' : 'Send Verification Email'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profile Form */}
      <View className="space-y-4 mb-8">
        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-gray-700 font-medium mb-2">First Name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="First name"
              value={profile.firstName}
              onChangeText={(text) => setProfile({ ...profile, firstName: text })}
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 font-medium mb-2">Last Name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Last name"
              value={profile.lastName}
              onChangeText={(text) => setProfile({ ...profile, lastName: text })}
            />
          </View>
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-500 bg-gray-50"
            value={user?.email || ''}
            editable={false}
          />
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-2">Phone</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
            placeholder="Phone number"
            value={profile.phone}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-2">Date of Birth</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
            placeholder="YYYY-MM-DD"
            value={profile.dateOfBirth}
            onChangeText={(text) => setProfile({ ...profile, dateOfBirth: text })}
          />
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-2">Address</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
            placeholder="Your address"
            value={profile.address}
            onChangeText={(text) => setProfile({ ...profile, address: text })}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Update Profile Button */}
      <TouchableOpacity
        onPress={handleUpdateProfile}
        disabled={loading}
        className={`py-4 px-8 rounded-xl mb-8 ${
          loading ? 'bg-gray-300' : 'bg-purple-500'
        }`}
      >
        <Text className="text-white text-lg font-semibold text-center">
          {loading ? 'Updating...' : 'Update Profile'}
        </Text>
      </TouchableOpacity>

      {/* Security Settings */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">Security</Text>
        
        {/* Biometric Authentication */}
        {biometricAvailable && (
          <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">
                {ClientAuthService.getBiometricTypeDisplayName(biometricTypes)}
              </Text>
              <Text className="text-gray-600 text-sm">
                Use biometric authentication to sign in
              </Text>
            </View>
            <Switch
              value={biometricToggle}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
              thumbColor={biometricToggle ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        )}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="py-4 px-8 rounded-xl border border-red-300 bg-red-50 mb-8"
      >
        <Text className="text-red-600 text-lg font-semibold text-center">
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {activeSection === 'profile' ? (
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="bg-white px-6 py-8 mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Profile</Text>
            <Text className="text-gray-600">Manage your account and preferences</Text>
          </View>

          {/* Menu Items */}
          <View className="px-6">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setActiveSection(item.id as ProfileSection)}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200 flex-row items-center"
              >
                <View className="bg-purple-100 p-3 rounded-xl mr-4">
                  <Ionicons name={item.icon as any} size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          {/* Back Header */}
          <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row items-center">
            <TouchableOpacity
              onPress={() => setActiveSection('profile')}
              className="mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              {menuItems.find(item => item.id === activeSection)?.title}
            </Text>
          </View>

          {/* Content */}
          <View className="flex-1 px-6 py-6">
            {renderContent()}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}