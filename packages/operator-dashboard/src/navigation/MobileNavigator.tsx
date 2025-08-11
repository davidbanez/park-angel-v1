import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';

// Import icons (will be implemented later)
import { DashboardIcon, ParkingIcon, PricingIcon, CustomersIcon, ReportsIcon } from '../components/icons';

// Pages
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ParkingManagementScreen } from '../screens/ParkingManagementScreen';
import { PricingManagementScreen } from '../screens/PricingManagementScreen';
import { CustomerManagementScreen } from '../screens/CustomerManagementScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#a855f7',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <DashboardIcon color={color} size={size} />,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Parking"
        component={ParkingManagementScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ParkingIcon color={color} size={size} />,
          title: 'Parking',
        }}
      />
      <Tab.Screen
        name="Pricing"
        component={PricingManagementScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <PricingIcon color={color} size={size} />,
          title: 'Pricing',
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomerManagementScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <CustomersIcon color={color} size={size} />,
          title: 'Customers',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ReportsIcon color={color} size={size} />,
          title: 'Reports',
        }}
      />
    </Tab.Navigator>
  );
};

export const MobileNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};