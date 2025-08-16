import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import type { 
  HostEarnings, 
  HostAnalytics, 
  HostPayout,
  HostedListing 
} from '@park-angel/shared/types';

interface HostDashboardProps {
  hostId: string;
  earnings: HostEarnings;
  analytics: HostAnalytics;
  payouts: HostPayout[];
  listings: HostedListing[];
  onRefresh: () => Promise<void>;
}

export default function HostDashboard({
  hostId,
  earnings,
  analytics,
  payouts,
  listings,
  onRefresh,
}: HostDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const screenWidth = Dimensions.get('window').width;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getEarningsChangePercentage = () => {
    if (earnings.lastMonth === 0) return earnings.thisMonth > 0 ? 100 : 0;
    return ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100;
  };

  const renderEarningsCard = () => (
    <View className="bg-white rounded-xl p-6 mx-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</Text>
      
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-primary-600">
            {formatCurrency(earnings.totalEarnings)}
          </Text>
          <Text className="text-gray-600">Total Earnings</Text>
        </View>
        
        <View className="items-end">
          <Text className="text-lg font-semibold text-gray-900">
            {formatCurrency(earnings.thisMonth)}
          </Text>
          <Text className="text-gray-600">This Month</Text>
          
          <View className={`mt-1 px-2 py-1 rounded-full ${
            getEarningsChangePercentage() >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs font-medium ${
              getEarningsChangePercentage() >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              {getEarningsChangePercentage() >= 0 ? '+' : ''}
              {getEarningsChangePercentage().toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="flex-1 items-center py-3 border-r border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            {earnings.completedBookings}
          </Text>
          <Text className="text-gray-600 text-sm">Bookings</Text>
        </View>
        
        <View className="flex-1 items-center py-3 border-r border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            {earnings.averageRating.toFixed(1)}⭐
          </Text>
          <Text className="text-gray-600 text-sm">Rating</Text>
        </View>
        
        <View className="flex-1 items-center py-3">
          <Text className="text-lg font-semibold text-gray-900">
            {(earnings.occupancyRate * 100).toFixed(1)}%
          </Text>
          <Text className="text-gray-600 text-sm">Occupancy</Text>
        </View>
      </View>
    </View>
  );

  const renderEarningsChart = () => {
    const chartData = {
      labels: analytics.earnings.byMonth.slice(-6).map(item => 
        item.month.substring(0, 3)
      ),
      datasets: [{
        data: analytics.earnings.byMonth.slice(-6).map(item => item.amount),
        strokeWidth: 2,
      }],
    };

    return (
      <View className="bg-white rounded-xl p-6 mx-4 mb-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-900">Earnings Trend</Text>
          
          <View className="flex-row bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                className={`px-3 py-1 rounded-md ${
                  selectedPeriod === period ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text className={`text-sm font-medium ${
                  selectedPeriod === period ? 'text-primary-600' : 'text-gray-600'
                }`}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {chartData.labels.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#7c3aed',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        ) : (
          <View className="h-48 justify-center items-center">
            <Text className="text-gray-500">No earnings data available</Text>
          </View>
        )}
      </View>
    );
  };

  const renderListingsOverview = () => (
    <View className="bg-white rounded-xl p-6 mx-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Your Listings</Text>
      
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 items-center py-3 border-r border-gray-200">
          <Text className="text-2xl font-bold text-primary-600">
            {listings.length}
          </Text>
          <Text className="text-gray-600 text-sm">Total Listings</Text>
        </View>
        
        <View className="flex-1 items-center py-3 border-r border-gray-200">
          <Text className="text-2xl font-bold text-green-600">
            {listings.filter(l => l.isActive).length}
          </Text>
          <Text className="text-gray-600 text-sm">Active</Text>
        </View>
        
        <View className="flex-1 items-center py-3">
          <Text className="text-2xl font-bold text-gray-600">
            {listings.filter(l => !l.isActive).length}
          </Text>
          <Text className="text-gray-600 text-sm">Inactive</Text>
        </View>
      </View>

      {listings.length > 0 && (
        <View className="space-y-3">
          {listings.slice(0, 3).map((listing) => (
            <View key={listing.id} className="flex-row items-center justify-between py-2">
              <View className="flex-1">
                <Text className="font-medium text-gray-900" numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {formatCurrency(listing.pricing.baseRate)}/hour
                </Text>
              </View>
              
              <View className="items-end">
                <View className={`px-2 py-1 rounded-full ${
                  listing.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    listing.isActive ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {listing.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  ⭐ {listing.rating.toFixed(1)} ({listing.totalReviews})
                </Text>
              </View>
            </View>
          ))}
          
          {listings.length > 3 && (
            <TouchableOpacity className="py-2">
              <Text className="text-primary-600 font-medium text-center">
                View All {listings.length} Listings
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderRecentPayouts = () => (
    <View className="bg-white rounded-xl p-6 mx-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Payouts</Text>
      
      {payouts.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-gray-500 text-center">
            No payouts yet. Start earning by getting bookings!
          </Text>
        </View>
      ) : (
        <View className="space-y-3">
          {payouts.slice(0, 5).map((payout) => (
            <View key={payout.id} className="flex-row items-center justify-between py-2">
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  {formatCurrency(payout.netAmount)}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {new Date(payout.createdAt).toLocaleDateString()}
                </Text>
              </View>
              
              <View className={`px-3 py-1 rounded-full ${
                payout.status === 'processed' 
                  ? 'bg-green-100' 
                  : payout.status === 'pending'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}>
                <Text className={`text-xs font-medium ${
                  payout.status === 'processed' 
                    ? 'text-green-800' 
                    : payout.status === 'pending'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
          
          {payouts.length > 5 && (
            <TouchableOpacity className="py-2">
              <Text className="text-primary-600 font-medium text-center">
                View All Payouts
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View className="bg-white rounded-xl p-6 mx-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
      
      <View className="flex-row space-x-3">
        <TouchableOpacity className="flex-1 bg-primary-500 py-3 px-4 rounded-lg">
          <Text className="text-white font-medium text-center">+ New Listing</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-1 bg-gray-100 py-3 px-4 rounded-lg">
          <Text className="text-gray-700 font-medium text-center">View Messages</Text>
        </TouchableOpacity>
      </View>
      
      <View className="flex-row space-x-3 mt-3">
        <TouchableOpacity className="flex-1 bg-gray-100 py-3 px-4 rounded-lg">
          <Text className="text-gray-700 font-medium text-center">Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-1 bg-gray-100 py-3 px-4 rounded-lg">
          <Text className="text-gray-700 font-medium text-center">Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6">
          <View className="px-4 mb-6">
            <Text className="text-2xl font-bold text-gray-900">Host Dashboard</Text>
            <Text className="text-gray-600">
              Welcome back! Here's how your listings are performing.
            </Text>
          </View>

          {renderEarningsCard()}
          {renderEarningsChart()}
          {renderListingsOverview()}
          {renderRecentPayouts()}
          {renderQuickActions()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}