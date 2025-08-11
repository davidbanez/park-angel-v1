import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { DynamicPricingServiceImpl } from '../../../../shared/src/services/dynamic-pricing';
import { createClient } from '@supabase/supabase-js';

interface DynamicPricingDashboardProps {
  locationId: string;
  operatorId: string;
}

interface PricingMetrics {
  currentOccupancy: number;
  averageRate: number;
  totalRevenue: number;
  bookingsToday: number;
  priceAdjustments: {
    level: string;
    name: string;
    baseRate: number;
    currentRate: number;
    adjustment: number;
    reason: string;
  }[];
}

interface OccupancyLevel {
  range: string;
  multiplier: number;
  description: string;
  color: string;
}

export const DynamicPricingDashboard: React.FC<DynamicPricingDashboardProps> = ({
  locationId
}) => {
  const [metrics, setMetrics] = useState<PricingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!
  );

  const occupancyLevels: OccupancyLevel[] = [
    {
      range: '90%+',
      multiplier: 1.5,
      description: '50% price increase - High demand',
      color: 'text-red-600 bg-red-50'
    },
    {
      range: '75-89%',
      multiplier: 1.25,
      description: '25% price increase - Medium-high demand',
      color: 'text-orange-600 bg-orange-50'
    },
    {
      range: '50-74%',
      multiplier: 1.1,
      description: '10% price increase - Medium demand',
      color: 'text-yellow-600 bg-yellow-50'
    },
    {
      range: '26-49%',
      multiplier: 1.0,
      description: 'No adjustment - Normal demand',
      color: 'text-green-600 bg-green-50'
    },
    {
      range: '≤25%',
      multiplier: 0.9,
      description: '10% discount - Low demand',
      color: 'text-blue-600 bg-blue-50'
    }
  ];

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [locationId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Get current occupancy
      const { data: occupancyData, error: occupancyError } = await supabase
        .from('parking_spots')
        .select(`
          status,
          zones!inner (
            sections!inner (
              locations!inner (
                id
              )
            )
          )
        `)
        .eq('zones.sections.locations.id', locationId);

      if (occupancyError) throw occupancyError;

      const totalSpots = occupancyData.length;
      const occupiedSpots = occupancyData.filter(s => 
        s.status === 'occupied' || s.status === 'reserved'
      ).length;
      const currentOccupancy = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

      // Get today's bookings and revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          total_amount,
          parking_spots!inner (
            zones!inner (
              sections!inner (
                locations!inner (
                  id
                )
              )
            )
          )
        `)
        .eq('parking_spots.zones.sections.locations.id', locationId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .eq('payment_status', 'paid');

      if (bookingsError) throw bookingsError;

      const totalRevenue = bookingsData.reduce((sum, booking) => 
        sum + parseFloat(booking.total_amount), 0
      );
      const bookingsToday = bookingsData.length;
      const averageRate = bookingsToday > 0 ? totalRevenue / bookingsToday : 0;

      // Get pricing adjustments (mock data for now)
      const priceAdjustments = [
        {
          level: 'Location',
          name: 'Main Location',
          baseRate: 50,
          currentRate: 50 * (currentOccupancy >= 90 ? 1.5 : currentOccupancy >= 75 ? 1.25 : currentOccupancy >= 50 ? 1.1 : currentOccupancy <= 25 ? 0.9 : 1.0),
          adjustment: currentOccupancy >= 90 ? 50 : currentOccupancy >= 75 ? 25 : currentOccupancy >= 50 ? 10 : currentOccupancy <= 25 ? -10 : 0,
          reason: `${currentOccupancy.toFixed(1)}% occupancy`
        }
      ];

      setMetrics({
        currentOccupancy,
        averageRate,
        totalRevenue,
        bookingsToday,
        priceAdjustments
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing metrics');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentOccupancyLevel = (occupancy: number): OccupancyLevel => {
    if (occupancy >= 90) return occupancyLevels[0];
    if (occupancy >= 75) return occupancyLevels[1];
    if (occupancy >= 50) return occupancyLevels[2];
    if (occupancy >= 26) return occupancyLevels[3];
    return occupancyLevels[4];
  };

  if (loading && !metrics) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dynamic pricing dashboard...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadMetrics}>Try Again</Button>
        </div>
      </Card>
    );
  }

  if (!metrics) return null;

  const currentLevel = getCurrentOccupancyLevel(metrics.currentOccupancy);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Current Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.currentOccupancy.toFixed(1)}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${currentLevel.color}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Average Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{metrics.averageRate.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{metrics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Bookings Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.bookingsToday}
                </p>
              </div>
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Pricing Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Pricing Status</h3>
            <Button onClick={loadMetrics} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          <div className={`p-4 rounded-lg ${currentLevel.color} mb-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">
                  Occupancy Level: {currentLevel.range}
                </h4>
                <p className="text-sm">{currentLevel.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {currentLevel.multiplier}x
                </p>
                <p className="text-sm">Multiplier</p>
              </div>
            </div>
          </div>

          {metrics.priceAdjustments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Active Price Adjustments</h4>
              {metrics.priceAdjustments.map((adjustment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {adjustment.level}: {adjustment.name}
                    </p>
                    <p className="text-sm text-gray-600">{adjustment.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ₱{adjustment.baseRate} → ₱{adjustment.currentRate.toFixed(2)}
                    </p>
                    <p className={`text-sm ${adjustment.adjustment > 0 ? 'text-red-600' : adjustment.adjustment < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {adjustment.adjustment > 0 ? '+' : ''}{adjustment.adjustment}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Occupancy-Based Pricing Rules */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dynamic Pricing Rules
          </h3>
          <div className="space-y-3">
            {occupancyLevels.map((level, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${
                  level.range === currentLevel.range
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {level.range} Occupancy
                    </p>
                    <p className="text-sm text-gray-600">{level.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {level.multiplier}x
                    </p>
                    {level.range === currentLevel.range && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Pricing Recommendations */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pricing Recommendations
          </h3>
          <div className="space-y-3">
            {metrics.currentOccupancy > 80 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-orange-800">High Demand Alert</h4>
                    <p className="text-sm text-orange-700">
                      Consider increasing prices during peak hours to optimize revenue and manage demand.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.currentOccupancy < 30 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Low Occupancy</h4>
                    <p className="text-sm text-blue-700">
                      Consider promotional pricing or marketing campaigns to increase bookings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.currentOccupancy >= 30 && metrics.currentOccupancy <= 80 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">Optimal Occupancy</h4>
                    <p className="text-sm text-green-700">
                      Current occupancy levels are optimal. Monitor trends and adjust as needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};