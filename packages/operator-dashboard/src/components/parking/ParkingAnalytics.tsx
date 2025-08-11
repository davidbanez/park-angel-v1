import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import type { Location } from '../../../../shared/src/types/parking';

interface ParkingAnalyticsProps {
  locations: Location[];
  selectedLocationId: string;
}

interface AnalyticsData {
  occupancyTrends: {
    date: string;
    occupancyRate: number;
    totalBookings: number;
    revenue: number;
  }[];
  vehicleTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  peakHours: {
    hour: number;
    occupancyRate: number;
    bookings: number;
  }[];
  sectionPerformance: {
    sectionName: string;
    occupancyRate: number;
    revenue: number;
    totalSpots: number;
  }[];
  monthlyStats: {
    totalBookings: number;
    totalRevenue: number;
    averageOccupancy: number;
    uniqueUsers: number;
  };
}

export const ParkingAnalytics: React.FC<ParkingAnalyticsProps> = ({
  locations,
  selectedLocationId
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performance' | 'insights'>('overview');

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  // Mock data generation for demonstration
  const generateMockAnalyticsData = (): AnalyticsData => {
    const occupancyTrends = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      occupancyRate: 60 + Math.random() * 30,
      totalBookings: Math.floor(50 + Math.random() * 100),
      revenue: Math.floor(5000 + Math.random() * 10000)
    }));

    const vehicleTypeDistribution = [
      { type: 'car', count: 450, percentage: 75 },
      { type: 'motorcycle', count: 90, percentage: 15 },
      { type: 'suv', count: 36, percentage: 6 },
      { type: 'van', count: 18, percentage: 3 },
      { type: 'truck', count: 6, percentage: 1 }
    ];

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      occupancyRate: hour >= 8 && hour <= 18 ? 70 + Math.random() * 20 : 30 + Math.random() * 40,
      bookings: hour >= 8 && hour <= 18 ? Math.floor(20 + Math.random() * 30) : Math.floor(5 + Math.random() * 15)
    }));

    const sectionPerformance = selectedLocation?.sections.map(section => ({
      sectionName: section.name,
      occupancyRate: 60 + Math.random() * 30,
      revenue: Math.floor(10000 + Math.random() * 20000),
      totalSpots: section.zones.reduce((total, zone) => total + zone.spots.length, 0)
    })) || [];

    const monthlyStats = {
      totalBookings: 2450,
      totalRevenue: 245000,
      averageOccupancy: 72.5,
      uniqueUsers: 1850
    };

    return {
      occupancyTrends,
      vehicleTypeDistribution,
      peakHours,
      sectionPerformance,
      monthlyStats
    };
  };

  const loadAnalyticsData = async () => {
    if (!selectedLocationId) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(generateMockAnalyticsData());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedLocationId, dateRange]);

  const exportData = (format: 'csv' | 'pdf') => {
    // TODO: Implement data export functionality
    alert(`Exporting analytics data as ${format.toUpperCase()}...`);
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'truck': return '🚛';
      case 'van': return '🚐';
      case 'suv': return '🚙';
      default: return '🚗';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'performance', label: 'Performance', icon: '🎯' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ] as const;

  if (!selectedLocationId) {
    return (
      <Card>
        <div className='p-8 text-center'>
          <div className='text-4xl mb-4'>📊</div>
          <h3 className='text-lg font-medium text-secondary-900 mb-2'>
            Select a Location
          </h3>
          <p className='text-secondary-600'>
            Choose a location to view detailed parking analytics and insights.
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <div className='p-8 text-center'>
          <div className='text-4xl mb-4'>❌</div>
          <h3 className='text-lg font-medium text-secondary-900 mb-2'>
            No Analytics Data
          </h3>
          <p className='text-secondary-600'>
            Unable to load analytics data for this location.
          </p>
        </div>
      </Card>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className='space-y-6'>
            {/* Monthly Stats */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <div className='p-4 text-center'>
                  <div className='text-2xl font-bold text-primary-600'>
                    {analyticsData.monthlyStats.totalBookings.toLocaleString()}
                  </div>
                  <div className='text-sm text-secondary-600'>Total Bookings</div>
                </div>
              </Card>
              <Card>
                <div className='p-4 text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {formatCurrency(analyticsData.monthlyStats.totalRevenue)}
                  </div>
                  <div className='text-sm text-secondary-600'>Total Revenue</div>
                </div>
              </Card>
              <Card>
                <div className='p-4 text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {analyticsData.monthlyStats.averageOccupancy.toFixed(1)}%
                  </div>
                  <div className='text-sm text-secondary-600'>Avg Occupancy</div>
                </div>
              </Card>
              <Card>
                <div className='p-4 text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {analyticsData.monthlyStats.uniqueUsers.toLocaleString()}
                  </div>
                  <div className='text-sm text-secondary-600'>Unique Users</div>
                </div>
              </Card>
            </div>

            {/* Vehicle Type Distribution */}
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
                  Vehicle Type Distribution
                </h3>
                <div className='space-y-3'>
                  {analyticsData.vehicleTypeDistribution.map((item) => (
                    <div key={item.type} className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <span className='text-xl'>{getVehicleTypeIcon(item.type)}</span>
                        <span className='capitalize font-medium'>{item.type}</span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-primary-600 h-2 rounded-full'
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium w-12 text-right'>
                          {item.percentage}%
                        </span>
                        <span className='text-sm text-secondary-600 w-16 text-right'>
                          ({item.count})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        );

      case 'trends':
        return (
          <div className='space-y-6'>
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
                  Occupancy Trends (Last 30 Days)
                </h3>
                <div className='h-64 flex items-end space-x-1'>
                  {analyticsData.occupancyTrends.slice(-14).map((data, index) => (
                    <div key={index} className='flex-1 flex flex-col items-center'>
                      <div
                        className='w-full bg-primary-600 rounded-t'
                        style={{ height: `${(data.occupancyRate / 100) * 200}px` }}
                        title={`${data.occupancyRate.toFixed(1)}% on ${data.date}`}
                      ></div>
                      <div className='text-xs text-secondary-600 mt-1 transform -rotate-45'>
                        {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
                  Peak Hours Analysis
                </h3>
                <div className='h-48 flex items-end space-x-1'>
                  {analyticsData.peakHours.map((data) => (
                    <div key={data.hour} className='flex-1 flex flex-col items-center'>
                      <div
                        className={`w-full rounded-t ${
                          data.occupancyRate > 80 ? 'bg-red-500' :
                          data.occupancyRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${(data.occupancyRate / 100) * 150}px` }}
                        title={`${data.occupancyRate.toFixed(1)}% at ${data.hour}:00`}
                      ></div>
                      <div className='text-xs text-secondary-600 mt-1'>
                        {data.hour.toString().padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        );

      case 'performance':
        return (
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
                Section Performance
              </h3>
              <div className='space-y-4'>
                {analyticsData.sectionPerformance.map((section) => (
                  <div key={section.sectionName} className='border border-gray-200 rounded-lg p-4'>
                    <div className='flex justify-between items-center mb-3'>
                      <h4 className='font-medium text-secondary-900'>{section.sectionName}</h4>
                      <span className='text-sm text-secondary-600'>
                        {section.totalSpots} spots
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-4'>
                      <div className='text-center'>
                        <div className='text-lg font-bold text-blue-600'>
                          {section.occupancyRate.toFixed(1)}%
                        </div>
                        <div className='text-xs text-secondary-600'>Occupancy</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-lg font-bold text-green-600'>
                          {formatCurrency(section.revenue)}
                        </div>
                        <div className='text-xs text-secondary-600'>Revenue</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-lg font-bold text-purple-600'>
                          {formatCurrency(section.revenue / section.totalSpots)}
                        </div>
                        <div className='text-xs text-secondary-600'>Per Spot</div>
                      </div>
                    </div>
                    <div className='mt-3'>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full'
                          style={{ width: `${section.occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case 'insights':
        return (
          <div className='space-y-6'>
            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
                  📊 Key Insights
                </h3>
                <div className='space-y-4'>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start space-x-3'>
                      <span className='text-blue-600 text-xl'>💡</span>
                      <div>
                        <h4 className='font-medium text-blue-900'>Peak Usage Pattern</h4>
                        <p className='text-blue-700 text-sm mt-1'>
                          Your busiest hours are between 9 AM and 5 PM with 85% average occupancy. 
                          Consider implementing dynamic pricing during these hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                    <div className='flex items-start space-x-3'>
                      <span className='text-green-600 text-xl'>📈</span>
                      <div>
                        <h4 className='font-medium text-green-900'>Revenue Opportunity</h4>
                        <p className='text-green-700 text-sm mt-1'>
                          Cars represent 75% of your bookings but only 60% of revenue. 
                          Optimizing car spot pricing could increase revenue by 15%.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                    <div className='flex items-start space-x-3'>
                      <span className='text-yellow-600 text-xl'>⚠️</span>
                      <div>
                        <h4 className='font-medium text-yellow-900'>Underutilized Areas</h4>
                        <p className='text-yellow-700 text-sm mt-1'>
                          Some sections show consistently low occupancy rates. 
                          Consider promotional pricing or repurposing these areas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                    <div className='flex items-start space-x-3'>
                      <span className='text-purple-600 text-xl'>🎯</span>
                      <div>
                        <h4 className='font-medium text-purple-900'>Customer Retention</h4>
                        <p className='text-purple-700 text-sm mt-1'>
                          You have 1,850 unique users this month with an average of 1.3 bookings per user. 
                          Loyalty programs could increase repeat bookings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
                  🎯 Recommendations
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-start space-x-3'>
                    <span className='text-primary-600 font-bold'>1.</span>
                    <p className='text-secondary-700'>
                      Implement time-based pricing with higher rates during peak hours (9 AM - 5 PM)
                    </p>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <span className='text-primary-600 font-bold'>2.</span>
                    <p className='text-secondary-700'>
                      Create promotional packages for motorcycle parking to increase utilization
                    </p>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <span className='text-primary-600 font-bold'>3.</span>
                    <p className='text-secondary-700'>
                      Launch a loyalty program offering discounts after 5 bookings per month
                    </p>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <span className='text-primary-600 font-bold'>4.</span>
                    <p className='text-secondary-700'>
                      Consider adding EV charging stations to premium spots for higher revenue
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-xl font-semibold text-secondary-900'>
            Parking Analytics - {selectedLocation?.name}
          </h2>
          <p className='text-secondary-600 mt-1'>
            Detailed analytics and insights for your parking operations
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
          >
            <option value='7d'>Last 7 days</option>
            <option value='30d'>Last 30 days</option>
            <option value='90d'>Last 3 months</option>
            <option value='1y'>Last year</option>
          </select>
          <Button
            variant='outline'
            onClick={() => exportData('csv')}
          >
            📊 Export CSV
          </Button>
          <Button
            variant='outline'
            onClick={() => exportData('pdf')}
          >
            📄 Export PDF
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='mt-6'>
        {renderTabContent()}
      </div>
    </div>
  );
};