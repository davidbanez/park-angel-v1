import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

// Icons (we'll create these as simple components for now)
const MapIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 rounded ${focused ? 'bg-primary-500' : 'bg-gray-400'}`} />
);

const BookingsIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 rounded ${focused ? 'bg-primary-500' : 'bg-gray-400'}`} />
);

const HostIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 rounded ${focused ? 'bg-primary-500' : 'bg-gray-400'}`} />
);

const ProfileIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 rounded ${focused ? 'bg-primary-500' : 'bg-gray-400'}`} />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: MapIcon,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: BookingsIcon,
        }}
      />
      <Tabs.Screen
        name="host"
        options={{
          title: 'Host',
          tabBarIcon: HostIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tabs>
  );
}