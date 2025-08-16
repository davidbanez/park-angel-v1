import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useHostData, useHostOnboarding } from '../hooks/useHostedParking';
import { 
  HostOnboarding, 
  HostDashboard, 
  ListingManagement, 
  HostMessaging 
} from '../components/host';
import type { HostOnboardingData } from '@park-angel/shared/types';

type HostView = 'welcome' | 'onboarding' | 'dashboard' | 'listings' | 'messages';

export default function HostScreen() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<HostView>('welcome');
  const [hostId, setHostId] = useState<string | null>(null);
  
  const { 
    profile, 
    listings, 
    earnings, 
    analytics, 
    payouts, 
    conversations,
    isLoading,
    refetch 
  } = useHostData(hostId);
  
  const { completeOnboarding, isLoading: onboardingLoading } = useHostOnboarding();

  useEffect(() => {
    // Check if user is already a host
    if (user?.user_type === 'host' && profile) {
      setHostId(profile.id);
      setCurrentView('dashboard');
    }
  }, [user, profile]);

  const handleStartHosting = () => {
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = async (data: HostOnboardingData) => {
    try {
      const newProfile = await completeOnboarding(data);
      setHostId(newProfile.id);
      setCurrentView('dashboard');
      Alert.alert(
        'Application Submitted!',
        'Your host application has been submitted for review. You\'ll receive an email notification once approved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit host application. Please try again.');
    }
  };

  const handleOnboardingCancel = () => {
    setCurrentView('welcome');
  };

  const renderWelcomeScreen = () => (
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
            
            <TouchableOpacity 
              className="bg-primary-500 py-3 px-6 rounded-lg"
              onPress={handleStartHosting}
            >
              <Text className="text-white font-semibold text-center">
                Start Hosting
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4 items-center justify-center">
                <Text className="text-white font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Easy Setup</Text>
                <Text className="text-gray-600">Complete verification and list your space in minutes</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4 items-center justify-center">
                <Text className="text-white font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Flexible Pricing</Text>
                <Text className="text-gray-600">Set your own rates and availability schedule</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4 items-center justify-center">
                <Text className="text-white font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Secure Payments</Text>
                <Text className="text-gray-600">Get paid automatically with 60% revenue share</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-primary-500 rounded-full mr-4 items-center justify-center">
                <Text className="text-white font-bold">4</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Guest Communication</Text>
                <Text className="text-gray-600">Chat with guests and manage bookings easily</Text>
              </View>
            </View>
          </View>

          <View className="mt-8 bg-gray-50 rounded-xl p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              How much can you earn?
            </Text>
            <Text className="text-gray-600 mb-4">
              Hosts in your area typically earn ₱500-2,000 per month per parking space.
            </Text>
            <View className="bg-white rounded-lg p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Average hourly rate:</Text>
                <Text className="font-semibold text-gray-900">₱50-150</Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Your share (60%):</Text>
                <Text className="font-semibold text-primary-600">₱30-90/hour</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Monthly potential:</Text>
                <Text className="font-semibold text-green-600">₱500-2,000</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderHostDashboard = () => {
    if (!hostId || !earnings || !analytics) return null;

    return (
      <View className="flex-1">
        <View className="bg-white border-b border-gray-200">
          <SafeAreaView>
            <View className="flex-row justify-between items-center px-4 py-3">
              <Text className="text-xl font-bold text-gray-900">Host Dashboard</Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className={`px-3 py-1 rounded-full ${
                    currentView === 'dashboard' ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setCurrentView('dashboard')}
                >
                  <Text className={`text-sm font-medium ${
                    currentView === 'dashboard' ? 'text-white' : 'text-gray-700'
                  }`}>
                    Dashboard
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`px-3 py-1 rounded-full ${
                    currentView === 'listings' ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setCurrentView('listings')}
                >
                  <Text className={`text-sm font-medium ${
                    currentView === 'listings' ? 'text-white' : 'text-gray-700'
                  }`}>
                    Listings
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`px-3 py-1 rounded-full ${
                    currentView === 'messages' ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setCurrentView('messages')}
                >
                  <Text className={`text-sm font-medium ${
                    currentView === 'messages' ? 'text-white' : 'text-gray-700'
                  }`}>
                    Messages
                    {conversations.some(c => c.unreadCount > 0) && (
                      <Text className="ml-1">•</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {currentView === 'dashboard' && (
          <HostDashboard
            hostId={hostId}
            earnings={earnings}
            analytics={analytics}
            payouts={payouts}
            listings={listings}
            onRefresh={refetch}
          />
        )}

        {currentView === 'listings' && (
          <ListingManagement
            hostId={hostId}
            listings={listings}
            onCreateListing={async (data) => {
              // This would use the useCreateListing hook
              console.log('Create listing:', data);
            }}
            onUpdateListing={async (data) => {
              // This would use the useUpdateListing hook
              console.log('Update listing:', data);
            }}
            onDeleteListing={async (listingId) => {
              // This would use the useDeleteListing hook
              console.log('Delete listing:', listingId);
            }}
            onToggleStatus={async (listingId, isActive) => {
              // This would use the useToggleListingStatus hook
              console.log('Toggle status:', listingId, isActive);
            }}
          />
        )}

        {currentView === 'messages' && (
          <HostMessaging
            hostId={hostId}
            conversations={conversations}
            onSendMessage={async (conversationId, content) => {
              // This would use the useSendMessage hook
              console.log('Send message:', conversationId, content);
            }}
            onMarkAsRead={async (conversationId) => {
              // This would use the useMarkMessagesAsRead hook
              console.log('Mark as read:', conversationId);
            }}
            onRefresh={refetch}
          />
        )}
      </View>
    );
  };

  // Show loading state
  if (isLoading || onboardingLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  // Show onboarding flow
  if (currentView === 'onboarding') {
    return (
      <HostOnboarding
        onComplete={handleOnboardingComplete}
        onCancel={handleOnboardingCancel}
      />
    );
  }

  // Show host dashboard if user is already a host
  if (user?.user_type === 'host' && profile) {
    return renderHostDashboard();
  }

  // Show welcome screen for new users
  return renderWelcomeScreen();
}