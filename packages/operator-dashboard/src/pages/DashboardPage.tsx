import React, { useEffect, useState } from 'react';
import { useOperatorStore } from '../stores/operatorStore';
import { Card } from '../components/shared/Card';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { TransactionComparisonChart } from '../components/dashboard/TransactionComparisonChart';
import { ParkingUtilizationDisplay } from '../components/dashboard/ParkingUtilizationDisplay';
import { NotificationCenter } from '../components/dashboard/NotificationCenter';
import { UserEngagementAnalytics } from '../components/dashboard/UserEngagementAnalytics';

export const DashboardPage: React.FC = () => {
  const { 
    operatorData, 
    metrics, 
    fetchMetrics, 
    fetchOperatorData,
    isLoading, 
    error 
  } = useOperatorStore();
  
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchOperatorData();
  }, [fetchOperatorData]);

  useEffect(() => {
    if (operatorData) {
      fetchMetrics(timeRange);
    }
  }, [operatorData, timeRange, fetchMetrics]);

  if (isLoading && !operatorData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">
            Welcome back, {operatorData?.company_name || 'Operator'}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-white rounded-lg border border-secondary-200 p-1">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Revenue</p>
                <p className="text-2xl font-bold text-secondary-900">
                  ₱{metrics?.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">
                +{metrics?.revenueGrowth || 0}%
              </span>
              <span className="text-secondary-600 text-sm ml-1">from last {timeRange}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Bookings</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {metrics?.totalBookings?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-blue-600 text-sm font-medium">
                +{metrics?.bookingGrowth || 0}%
              </span>
              <span className="text-secondary-600 text-sm ml-1">from last {timeRange}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Active Spots</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {metrics?.activeSpots || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">🅿️</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-purple-600 text-sm font-medium">
                {metrics?.occupiedSpots || 0} occupied
              </span>
              <span className="text-secondary-600 text-sm ml-1">right now</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {((metrics?.occupancyRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">📊</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-orange-600 text-sm font-medium">
                +{metrics?.occupancyGrowth || 0}%
              </span>
              <span className="text-secondary-600 text-sm ml-1">from last {timeRange}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Comparison Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Transaction Comparison
            </h3>
            <TransactionComparisonChart 
              timeRange={timeRange}
              operatorId={operatorData?.id}
            />
          </div>
        </Card>

        {/* Parking Utilization */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Parking Spot Utilization
            </h3>
            <ParkingUtilizationDisplay 
              operatorId={operatorData?.id}
            />
          </div>
        </Card>
      </div>

      {/* User Engagement and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement Analytics */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              User Engagement Analytics
            </h3>
            <UserEngagementAnalytics 
              operatorId={operatorData?.id}
              timeRange={timeRange}
            />
          </div>
        </Card>

        {/* Notification Center */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Recent Notifications
            </h3>
            <NotificationCenter 
              operatorId={operatorData?.id}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};