import React, { useEffect } from 'react';
import { useOperatorStore } from '../stores/operatorStore';
import { Card } from '../components/shared/Card';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { operatorData, metrics, fetchMetrics, isLoading, error } = useOperatorStore();

  useEffect(() => {
    if (operatorData) {
      fetchMetrics();
    }
  }, [operatorData, fetchMetrics]);

  if (isLoading) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">
            Welcome back, {operatorData?.company_name}
          </p>
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
                  ₱{metrics?.totalRevenue.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+12.5%</span>
              <span className="text-secondary-600 text-sm ml-1">from last week</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Bookings</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {metrics?.totalBookings.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-blue-600 text-sm font-medium">+8.2%</span>
              <span className="text-secondary-600 text-sm ml-1">from last week</span>
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
              <span className="text-purple-600 text-sm font-medium">+2</span>
              <span className="text-secondary-600 text-sm ml-1">new spots</span>
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
              <span className="text-orange-600 text-sm font-medium">+5.3%</span>
              <span className="text-secondary-600 text-sm ml-1">from last week</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Additional Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Revenue Trend
            </h3>
            <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
              <p className="text-secondary-600">Chart will be implemented in next task</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-secondary-600">New booking at Zone A-1</p>
                <span className="text-xs text-secondary-400 ml-auto">2 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-secondary-600">Payment received ₱150</p>
                <span className="text-xs text-secondary-400 ml-auto">5 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-sm text-secondary-600">Spot B-3 maintenance completed</p>
                <span className="text-xs text-secondary-400 ml-auto">15 min ago</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};