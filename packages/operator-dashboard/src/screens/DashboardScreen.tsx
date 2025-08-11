import React, { useEffect } from 'react';
import { useOperatorStore } from '../stores/operatorStore';
import { Card } from '../components/shared/Card';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Platform } from '../components/utils/platform';

export const DashboardScreen: React.FC = () => {
  const { operatorData, metrics, fetchMetrics, isLoading, error } = useOperatorStore();

  useEffect(() => {
    if (operatorData) {
      fetchMetrics();
    }
  }, [operatorData, fetchMetrics]);

  if (!Platform.isNative()) {
    return null; // This component is only for mobile
  }

  const { View, Text, ScrollView } = require('react-native');

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <LoadingSpinner size="lg" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 p-4">
        <View className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Text className="text-red-600">{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-secondary-50">
      <View className="p-4 space-y-6">
        <View>
          <Text className="text-2xl font-bold text-secondary-900">Dashboard</Text>
          <Text className="text-secondary-600 mt-1">
            Welcome back, {operatorData?.company_name}
          </Text>
        </View>

        {/* Metrics Cards */}
        <View className="space-y-4">
          <View className="flex-row space-x-4">
            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm font-medium text-secondary-600">Total Revenue</Text>
                      <Text className="text-xl font-bold text-secondary-900">
                        ₱{metrics?.totalRevenue.toLocaleString() || '0'}
                      </Text>
                    </View>
                    <View className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Text className="text-green-600">💰</Text>
                    </View>
                  </View>
                  <View className="mt-2">
                    <Text className="text-green-600 text-sm font-medium">+12.5%</Text>
                  </View>
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm font-medium text-secondary-600">Total Bookings</Text>
                      <Text className="text-xl font-bold text-secondary-900">
                        {metrics?.totalBookings.toLocaleString() || '0'}
                      </Text>
                    </View>
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Text className="text-blue-600">📅</Text>
                    </View>
                  </View>
                  <View className="mt-2">
                    <Text className="text-blue-600 text-sm font-medium">+8.2%</Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          <View className="flex-row space-x-4">
            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm font-medium text-secondary-600">Active Spots</Text>
                      <Text className="text-xl font-bold text-secondary-900">
                        {metrics?.activeSpots || '0'}
                      </Text>
                    </View>
                    <View className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Text className="text-purple-600">🅿️</Text>
                    </View>
                  </View>
                  <View className="mt-2">
                    <Text className="text-purple-600 text-sm font-medium">+2 new</Text>
                  </View>
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm font-medium text-secondary-600">Occupancy</Text>
                      <Text className="text-xl font-bold text-secondary-900">
                        {((metrics?.occupancyRate || 0) * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Text className="text-orange-600">📊</Text>
                    </View>
                  </View>
                  <View className="mt-2">
                    <Text className="text-orange-600 text-sm font-medium">+5.3%</Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <Card>
          <View className="p-4">
            <Text className="text-lg font-semibold text-secondary-900 mb-4">
              Recent Activity
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-center space-x-3">
                <View className="w-2 h-2 bg-green-500 rounded-full"></View>
                <Text className="text-sm text-secondary-600 flex-1">New booking at Zone A-1</Text>
                <Text className="text-xs text-secondary-400">2 min ago</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <View className="w-2 h-2 bg-blue-500 rounded-full"></View>
                <Text className="text-sm text-secondary-600 flex-1">Payment received ₱150</Text>
                <Text className="text-xs text-secondary-400">5 min ago</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <View className="w-2 h-2 bg-orange-500 rounded-full"></View>
                <Text className="text-sm text-secondary-600 flex-1">Spot B-3 maintenance completed</Text>
                <Text className="text-xs text-secondary-400">15 min ago</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};