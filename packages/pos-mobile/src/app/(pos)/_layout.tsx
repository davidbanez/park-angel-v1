import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function POSLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: '#7C3AED',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: 'Parking',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="local-parking" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="violations"
        options={{
          title: 'Violations',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="report-problem" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cash"
        options={{
          title: 'Cash',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="attach-money" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}