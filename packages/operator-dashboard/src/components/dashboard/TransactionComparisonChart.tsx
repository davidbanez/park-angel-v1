import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TransactionData {
  date: string;
  revenue: number;
  bookings: number;
  averageValue: number;
}

interface TransactionComparisonChartProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
  operatorId?: string;
}

export const TransactionComparisonChart: React.FC<TransactionComparisonChartProps> = ({
  timeRange,
  operatorId,
}) => {
  const [data, setData] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorId) return;

    const fetchTransactionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call - in real implementation, this would fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate mock data based on time range
        const mockData = generateMockData(timeRange);
        setData(mockData);
      } catch (err) {
        setError('Failed to load transaction data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionData();
  }, [timeRange, operatorId]);

  const generateMockData = (range: string): TransactionData[] => {
    const now = new Date();
    const data: TransactionData[] = [];

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

      const bookings = Math.floor(Math.random() * 50) + 10;
      const averageValue = Math.floor(Math.random() * 100) + 50;
      const revenue = bookings * averageValue;

      data.push({
        date: dateFormat(date),
        revenue,
        bookings,
        averageValue,
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

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxBookings = Math.max(...data.map(d => d.bookings));

  return (
    <div className="space-y-4">
      {/* Chart Legend */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          <span className="text-secondary-600">Revenue</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-secondary-600">Bookings</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {data.map((item, index) => {
            const revenueHeight = (item.revenue / maxRevenue) * 100;
            const bookingsHeight = (item.bookings / maxBookings) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                {/* Bars */}
                <div className="w-full flex justify-center space-x-1 items-end" style={{ height: '160px' }}>
                  {/* Revenue Bar */}
                  <div
                    className="bg-primary-500 rounded-t-sm transition-all duration-300 hover:bg-primary-600"
                    style={{
                      height: `${revenueHeight}%`,
                      width: '40%',
                      minHeight: '2px',
                    }}
                    title={`Revenue: ₱${item.revenue.toLocaleString()}`}
                  />
                  {/* Bookings Bar */}
                  <div
                    className="bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                    style={{
                      height: `${bookingsHeight}%`,
                      width: '40%',
                      minHeight: '2px',
                    }}
                    title={`Bookings: ${item.bookings}`}
                  />
                </div>
                {/* Date Label */}
                <span className="text-xs text-secondary-500 text-center">
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-secondary-200">
        <div className="text-center">
          <p className="text-sm text-secondary-600">Total Revenue</p>
          <p className="text-lg font-semibold text-secondary-900">
            ₱{data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-secondary-600">Total Bookings</p>
          <p className="text-lg font-semibold text-secondary-900">
            {data.reduce((sum, item) => sum + item.bookings, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-secondary-600">Avg. Value</p>
          <p className="text-lg font-semibold text-secondary-900">
            ₱{Math.round(
              data.reduce((sum, item) => sum + item.averageValue, 0) / data.length
            )}
          </p>
        </div>
      </div>
    </div>
  );
};