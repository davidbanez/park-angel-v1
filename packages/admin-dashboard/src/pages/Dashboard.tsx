import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/Card';
import { Chart, MetricCard } from '../components/ui/Chart';
import { NotificationCenter } from '../components/NotificationCenter';
import { DashboardServiceImpl } from '../services/dashboardService';
import { supabase } from '../../../shared/src/lib/supabase';
import {
  DashboardMetrics,
  OperatorPerformance,
  ParkingUtilization,
  RevenueMetrics,
  TransactionMetrics,
  SystemHealth,
  PerformanceMetric,
  DashboardFilters,
} from '../types/dashboard';

const dashboardService = new DashboardServiceImpl(supabase as any);

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [operatorPerformance, setOperatorPerformance] = useState<
    OperatorPerformance[]
  >([]);
  const [parkingUtilization, setParkingUtilization] = useState<
    ParkingUtilization[]
  >([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(
    null
  );
  const [transactionMetrics, setTransactionMetrics] =
    useState<TransactionMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<DashboardFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate: new Date(),
    },
    refreshInterval: 30, // 30 seconds
  });

  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh
    const interval = setInterval(
      loadDashboardData,
      filters.refreshInterval * 1000
    );

    // Subscribe to real-time updates
    const unsubscribe = dashboardService.subscribeToRealtimeUpdates(update => {
      if (update.type === 'metrics') {
        // Refresh metrics when new data comes in
        loadDashboardData();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        metricsData,
        operatorData,
        utilizationData,
        revenueData,
        transactionData,
        healthData,
        performanceData,
      ] = await Promise.all([
        dashboardService.getDashboardMetrics(filters),
        dashboardService.getOperatorPerformance(filters),
        dashboardService.getParkingUtilization(filters),
        dashboardService.getRevenueMetrics(filters),
        dashboardService.getTransactionMetrics(filters),
        dashboardService.getSystemHealth(),
        dashboardService.getPerformanceMetrics(),
      ]);

      setMetrics(metricsData);
      setOperatorPerformance(operatorData);
      setParkingUtilization(utilizationData);
      setRevenueMetrics(revenueData);
      setTransactionMetrics(transactionData);
      setSystemHealth(healthData);
      setPerformanceMetrics(performanceData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'connected':
      case 'active':
        return 'text-green-600';
      case 'degraded':
      case 'slow':
      case 'warning':
        return 'text-yellow-600';
      case 'down':
      case 'error':
      case 'disconnected':
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !metrics) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-red-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>Error</h3>
            <div className='mt-2 text-sm text-red-700'>
              <p>{error}</p>
            </div>
            <div className='mt-4'>
              <button
                onClick={loadDashboardData}
                className='bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200'
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <p className='mt-2 text-gray-600'>
            Real-time overview of Park Angel system performance
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <NotificationCenter dashboardService={dashboardService} />
          <div className='text-sm text-gray-500'>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Active Operators'
          value={metrics?.activeOperators || 0}
          icon={
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
          }
          color='purple'
        />
        <MetricCard
          title='Total Parking Spots'
          value={metrics?.totalParkingSpots || 0}
          icon={
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
              />
            </svg>
          }
          color='green'
        />
        <MetricCard
          title="Today's Transactions"
          value={metrics?.todayTransactions || 0}
          icon={
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              />
            </svg>
          }
          color='blue'
        />
        <MetricCard
          title="Today's Revenue"
          value={formatCurrency(metrics?.todayRevenue || 0)}
          icon={
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          }
          color='yellow'
        />
      </div>

      {/* Additional Metrics Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Occupancy Rate'
          value={formatPercentage(metrics?.occupancyRate || 0)}
          color='green'
        />
        <MetricCard
          title='Avg Session Duration'
          value={`${metrics?.averageSessionDuration || 0}m`}
          color='blue'
        />
        <MetricCard
          title='Total Users'
          value={metrics?.totalUsers || 0}
          color='purple'
        />
        <MetricCard
          title='Active Bookings'
          value={metrics?.activeBookings || 0}
          color='yellow'
        />
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueMetrics && (
              <Chart
                type='line'
                data={{
                  labels: revenueMetrics.monthlyTrend.map(m => m.month),
                  datasets: [
                    {
                      label: 'Revenue',
                      data: revenueMetrics.monthlyTrend.map(m => m.revenue),
                      borderColor: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      fill: true,
                    },
                  ],
                }}
                height={250}
              />
            )}
          </CardContent>
        </Card>

        {/* Transaction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionMetrics && (
              <Chart
                type='doughnut'
                data={{
                  labels: ['Successful', 'Failed', 'Pending'],
                  datasets: [
                    {
                      label: 'Transactions',
                      data: [
                        transactionMetrics.successfulTransactions,
                        transactionMetrics.failedTransactions,
                        transactionMetrics.pendingTransactions,
                      ],
                      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    },
                  ],
                }}
                height={250}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operator Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Operator
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Revenue
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Transactions
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Occupancy Rate
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Response Time
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {operatorPerformance.slice(0, 5).map(operator => (
                  <tr key={operator.operatorId}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {operator.operatorName}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {formatCurrency(operator.totalRevenue)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {operator.transactionCount}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {formatPercentage(operator.occupancyRate)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {operator.responseTime}s
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          operator.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {operator.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Health and Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {systemHealth && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>API Status</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(systemHealth.apiStatus)}`}
                  >
                    {systemHealth.apiStatus}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Database</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(systemHealth.databaseStatus)}`}
                  >
                    {systemHealth.databaseStatus}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Payment Gateway</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(systemHealth.paymentGatewayStatus)}`}
                  >
                    {systemHealth.paymentGatewayStatus}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Real-time</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(systemHealth.realtimeStatus)}`}
                  >
                    {systemHealth.realtimeStatus}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Response Time</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {systemHealth.responseTime}ms
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Uptime</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {systemHealth.uptime}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {performanceMetrics.slice(0, 6).map(metric => (
                <div
                  key={metric.feature}
                  className='flex items-center justify-between'
                >
                  <div>
                    <span className='text-sm text-gray-600'>
                      {metric.feature}
                    </span>
                    <div className='text-xs text-gray-500'>
                      Target: {metric.slaTarget}ms
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-medium text-gray-900'>
                      {metric.averageResponseTime}ms
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        metric.slaStatus === 'met'
                          ? 'text-green-600'
                          : metric.slaStatus === 'warning'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {metric.slaStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parking Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Parking Utilization by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Location
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total Spots
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Occupied
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Occupancy Rate
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {parkingUtilization.slice(0, 10).map(location => (
                  <tr key={location.locationId}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {location.locationName}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.locationType === 'hosted'
                            ? 'bg-purple-100 text-purple-800'
                            : location.locationType === 'street'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {location.locationType}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {location.totalSpots}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {location.occupiedSpots}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='text-sm text-gray-900 mr-2'>
                          {formatPercentage(location.occupancyRate)}
                        </div>
                        <div className='w-16 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-purple-600 h-2 rounded-full'
                            style={{
                              width: `${Math.min(location.occupancyRate, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {formatCurrency(location.revenue)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
