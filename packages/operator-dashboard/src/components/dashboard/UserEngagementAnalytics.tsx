import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface EngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bookingConversionRate: number;
  customerSatisfactionScore: number;
  topUserSegments: UserSegment[];
  engagementTrends: EngagementTrend[];
}

interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface EngagementTrend {
  date: string;
  activeUsers: number;
  sessionDuration: number;
  bookings: number;
}

interface UserEngagementAnalyticsProps {
  operatorId?: string;
  timeRange: 'day' | 'week' | 'month' | 'year';
}

export const UserEngagementAnalytics: React.FC<UserEngagementAnalyticsProps> = ({
  operatorId,
  timeRange,
}) => {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorId) return;

    const fetchEngagementData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call - in real implementation, this would fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 900));

        // Generate mock data based on time range
        const mockMetrics: EngagementMetrics = {
          totalUsers: 1247,
          activeUsers: 892,
          newUsers: 156,
          returningUsers: 736,
          averageSessionDuration: 8.5, // minutes
          bookingConversionRate: 0.68,
          customerSatisfactionScore: 4.3,
          topUserSegments: [
            { name: 'Regular Commuters', count: 425, percentage: 47.7, color: 'bg-blue-500' },
            { name: 'Occasional Visitors', count: 267, percentage: 29.9, color: 'bg-green-500' },
            { name: 'Business Travelers', count: 134, percentage: 15.0, color: 'bg-purple-500' },
            { name: 'Event Attendees', count: 66, percentage: 7.4, color: 'bg-orange-500' },
          ],
          engagementTrends: generateTrendData(timeRange),
        };

        setMetrics(mockMetrics);
      } catch (err) {
        setError('Failed to load engagement data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEngagementData();
  }, [operatorId, timeRange]);

  const generateTrendData = (range: string): EngagementTrend[] => {
    const data: EngagementTrend[] = [];
    const now = new Date();
    
    let periods: number;
    let dateFormat: (date: Date) => string;

    switch (range) {
      case 'day':
        periods = 24;
        dateFormat = (date) => date.getHours().toString().padStart(2, '0') + ':00';
        break;
      case 'week':
        periods = 7;
        dateFormat = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'month':
        periods = 30;
        dateFormat = (date) => date.getDate().toString();
        break;
      case 'year':
        periods = 12;
        dateFormat = (date) => date.toLocaleDateString('en-US', { month: 'short' });
        break;
      default:
        periods = 7;
        dateFormat = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      
      switch (range) {
        case 'day':
          date.setHours(date.getHours() - i);
          break;
        case 'week':
          date.setDate(date.getDate() - i);
          break;
        case 'month':
          date.setDate(date.getDate() - i);
          break;
        case 'year':
          date.setMonth(date.getMonth() - i);
          break;
      }

      data.push({
        date: dateFormat(date),
        activeUsers: Math.floor(Math.random() * 200) + 50,
        sessionDuration: Math.floor(Math.random() * 10) + 5,
        bookings: Math.floor(Math.random() * 50) + 10,
      });
    }

    return data;
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Active Users</p>
              <p className="text-xl font-bold text-secondary-900">
                {metrics.activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm">👥</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-green-600 text-xs font-medium">
              +{Math.round((metrics.newUsers / metrics.totalUsers) * 100)}%
            </span>
            <span className="text-secondary-500 text-xs ml-1">new users</span>
          </div>
        </div>

        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Avg. Session</p>
              <p className="text-xl font-bold text-secondary-900">
                {metrics.averageSessionDuration}m
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm">⏱️</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-green-600 text-xs font-medium">
              {(metrics.bookingConversionRate * 100).toFixed(1)}%
            </span>
            <span className="text-secondary-500 text-xs ml-1">conversion</span>
          </div>
        </div>
      </div>

      {/* User Segments */}
      <div>
        <h5 className="text-sm font-medium text-secondary-900 mb-3">User Segments</h5>
        <div className="space-y-2">
          {metrics.topUserSegments.map((segment, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-700">{segment.name}</span>
                  <span className="text-secondary-500">{segment.count}</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${segment.color}`}
                    style={{ width: `${segment.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Trend */}
      <div>
        <h5 className="text-sm font-medium text-secondary-900 mb-3">Engagement Trend</h5>
        <div className="relative h-32">
          <div className="absolute inset-0 flex items-end justify-between space-x-1">
            {metrics.engagementTrends.map((trend, index) => {
              const maxUsers = Math.max(...metrics.engagementTrends.map(t => t.activeUsers));
              const height = (trend.activeUsers / maxUsers) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                  <div
                    className="bg-primary-500 rounded-t-sm transition-all duration-300 hover:bg-primary-600"
                    style={{
                      height: `${height}%`,
                      width: '80%',
                      minHeight: '2px',
                    }}
                    title={`${trend.activeUsers} active users`}
                  />
                  <span className="text-xs text-secondary-500 text-center">
                    {trend.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Satisfaction */}
      <div className="bg-secondary-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary-600">Customer Satisfaction</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.floor(metrics.customerSatisfactionScore)
                        ? 'text-yellow-400'
                        : 'text-secondary-300'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="text-lg font-bold text-secondary-900">
                {metrics.customerSatisfactionScore.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-secondary-500">Based on</p>
            <p className="text-sm font-medium text-secondary-700">
              {Math.floor(metrics.totalUsers * 0.3)} reviews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};