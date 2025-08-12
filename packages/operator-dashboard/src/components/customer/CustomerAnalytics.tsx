import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { customerManagementService } from '../../../../shared/src/services/customer-management';
import type { CustomerAnalytics, CustomerProfile } from '../../../../shared/src/types/user';

interface CustomerAnalyticsProps {
  operatorId: string;
  customer?: CustomerProfile;
}

export const CustomerAnalyticsComponent: React.FC<CustomerAnalyticsProps> = ({ 
  operatorId, 
  customer 
}) => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [operatorId, customer?.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAnalytics = await customerManagementService.getCustomerAnalytics(
        operatorId, 
        customer?.id
      );
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageSpending = () => {
    if (analytics.length === 0) return 0;
    const totalSpent = analytics.reduce((sum, a) => sum + a.totalSpent, 0);
    const totalBookings = analytics.reduce((sum, a) => sum + a.totalBookings, 0);
    return totalBookings > 0 ? totalSpent / totalBookings : 0;
  };

  const getTopCustomers = () => {
    return [...analytics]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  };

  const getLoyaltyScoreDistribution = () => {
    const distribution = { low: 0, medium: 0, high: 0 };
    analytics.forEach(a => {
      if (a.loyaltyScore < 30) distribution.low++;
      else if (a.loyaltyScore < 70) distribution.medium++;
      else distribution.high++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-secondary-600">Loading analytics...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error loading analytics</p>
          <p className="text-secondary-600 mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  if (customer) {
    // Single customer analytics
    const customerAnalytics = analytics.find(a => a.customerId === customer.id);
    
    if (!customerAnalytics) {
      return (
        <Card>
          <div className="p-6 text-center">
            <div className="text-secondary-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-secondary-900 mb-2">No Analytics Data</h4>
            <p className="text-secondary-600">No analytics data available for this customer yet.</p>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-6">Customer Analytics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{customerAnalytics.totalBookings}</div>
              <div className="text-sm text-secondary-600">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${customerAnalytics.totalSpent.toFixed(2)}</div>
              <div className="text-sm text-secondary-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${customerAnalytics.totalBookings > 0 ? (customerAnalytics.totalSpent / customerAnalytics.totalBookings).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-secondary-600">Avg per Booking</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{customerAnalytics.loyaltyScore}</div>
              <div className="text-sm text-secondary-600">Loyalty Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-secondary-900 mb-3">Customer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Customer Since:</span>
                  <span className="font-medium">{customerAnalytics.customerSince.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Last Booking:</span>
                  <span className="font-medium">
                    {customerAnalytics.lastBookingDate?.toLocaleDateString() || 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Session:</span>
                  <span className="font-medium">
                    {customerAnalytics.averageSessionDuration ? `${customerAnalytics.averageSessionDuration} min` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-secondary-900 mb-3">Favorite Locations</h4>
              {customerAnalytics.favoriteLocations.length > 0 ? (
                <div className="space-y-1">
                  {customerAnalytics.favoriteLocations.slice(0, 5).map((locationId) => (
                    <div key={locationId} className="text-sm text-secondary-600">
                      Location {locationId}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary-600">No favorite locations yet</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Overall analytics dashboard
  const totalCustomers = analytics.length;
  const totalBookings = analytics.reduce((sum, a) => sum + a.totalBookings, 0);
  const totalRevenue = analytics.reduce((sum, a) => sum + a.totalSpent, 0);
  const averageSpending = calculateAverageSpending();
  const topCustomers = getTopCustomers();
  const loyaltyDistribution = getLoyaltyScoreDistribution();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{totalCustomers}</div>
            <div className="text-sm text-secondary-600">Total Customers</div>
          </div>
        </Card>
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalBookings}</div>
            <div className="text-sm text-secondary-600">Total Bookings</div>
          </div>
        </Card>
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-secondary-600">Total Revenue</div>
          </div>
        </Card>
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">${averageSpending.toFixed(2)}</div>
            <div className="text-sm text-secondary-600">Avg per Booking</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Customers by Spending</h3>
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((analytics, index) => (
                  <div key={analytics.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-secondary-900">Customer {analytics.customerId.slice(0, 8)}...</div>
                        <div className="text-xs text-secondary-600">{analytics.totalBookings} bookings</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      ${analytics.totalSpent.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-600 text-center py-4">No customer data available</p>
            )}
          </div>
        </Card>

        {/* Loyalty Score Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Loyalty Score Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-sm text-secondary-700">Low (0-29)</span>
                </div>
                <span className="text-sm font-medium">{loyaltyDistribution.low} customers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm text-secondary-700">Medium (30-69)</span>
                </div>
                <span className="text-sm font-medium">{loyaltyDistribution.medium} customers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-sm text-secondary-700">High (70-100)</span>
                </div>
                <span className="text-sm font-medium">{loyaltyDistribution.high} customers</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};