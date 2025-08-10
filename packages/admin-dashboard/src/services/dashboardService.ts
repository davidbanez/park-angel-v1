import { SupabaseClient } from '@supabase/supabase-js';
import {
  DashboardMetrics,
  OperatorPerformance,
  ParkingUtilization,
  RevenueMetrics,
  TransactionMetrics,
  CriticalNotification,
  SystemHealth,
  DashboardFilters,
  PerformanceMetric,
  RealtimeUpdate,
} from '../types/dashboard';

export interface DashboardService {
  getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics>;
  getOperatorPerformance(filters?: DashboardFilters): Promise<OperatorPerformance[]>;
  getParkingUtilization(filters?: DashboardFilters): Promise<ParkingUtilization[]>;
  getRevenueMetrics(filters?: DashboardFilters): Promise<RevenueMetrics>;
  getTransactionMetrics(filters?: DashboardFilters): Promise<TransactionMetrics>;
  getCriticalNotifications(limit?: number): Promise<CriticalNotification[]>;
  getSystemHealth(): Promise<SystemHealth>;
  getPerformanceMetrics(): Promise<PerformanceMetric[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  subscribeToRealtimeUpdates(callback: (update: RealtimeUpdate) => void): () => void;
}

export class DashboardServiceImpl implements DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
    try {
      const dateFilter = filters?.dateRange || {
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
      };

      // Get active operators count
      const { data: operators, error: operatorsError } = await this.supabase
        .from('operators')
        .select('id')
        .eq('status', 'active');

      if (operatorsError) throw operatorsError;

      // Get total parking spots
      const { data: spots, error: spotsError } = await this.supabase
        .from('parking_spots')
        .select('id');

      if (spotsError) throw spotsError;

      // Get today's transactions
      const { data: transactions, error: transactionsError } = await this.supabase
        .from('payment_transactions')
        .select('id, amount')
        .gte('created_at', dateFilter.startDate.toISOString())
        .lte('created_at', dateFilter.endDate.toISOString())
        .eq('status', 'completed');

      if (transactionsError) throw transactionsError;

      // Get occupancy data
      const { data: occupancyData, error: occupancyError } = await this.supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('status', 'active');

      if (occupancyError) throw occupancyError;

      // Get total users
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id')
        .eq('status', 'active');

      if (usersError) throw usersError;

      // Get active bookings
      const { data: activeBookings, error: bookingsError } = await this.supabase
        .from('bookings')
        .select('id')
        .eq('status', 'active');

      if (bookingsError) throw bookingsError;

      // Calculate metrics
      const todayRevenue = (transactions || []).reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
      const totalSpots = spots?.length || 0;
      const occupiedSpots = occupancyData?.length || 0;
      const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

      // Calculate average session duration
      const completedBookings = await this.getCompletedBookingsToday();
      const averageSessionDuration = this.calculateAverageSessionDuration(completedBookings);

      return {
        activeOperators: operators?.length || 0,
        totalParkingSpots: totalSpots,
        todayTransactions: transactions?.length || 0,
        todayRevenue,
        occupancyRate,
        averageSessionDuration,
        totalUsers: users?.length || 0,
        activeBookings: activeBookings?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  async getOperatorPerformance(filters?: DashboardFilters): Promise<OperatorPerformance[]> {
    try {
      const dateFilter = filters?.dateRange || {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date(),
      };

      const { data: operators, error } = await this.supabase
        .from('operators')
        .select(`
          id,
          name,
          status,
          revenue_shares (
            total_amount,
            operator_share,
            calculated_at
          ),
          locations (
            id,
            parking_spots (
              id,
              bookings (
                id,
                start_time,
                end_time,
                status
              )
            )
          ),
          violation_reports (
            id,
            created_at
          )
        `)
        .gte('revenue_shares.calculated_at', dateFilter.startDate.toISOString())
        .lte('revenue_shares.calculated_at', dateFilter.endDate.toISOString());

      if (error) throw error;

      return (operators || []).map((operator: any) => {
        const revenueShares = Array.isArray(operator.revenue_shares) ? operator.revenue_shares : [];
        const totalRevenue = revenueShares.reduce((sum: number, rs: any) => sum + (Number(rs.operator_share) || 0), 0);
        const transactionCount = revenueShares.length;
        const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Calculate occupancy rate
        const locations = Array.isArray(operator.locations) ? operator.locations : [];
        const allSpots = locations.flatMap((l: any) => Array.isArray(l.parking_spots) ? l.parking_spots : []);
        const totalSpots = allSpots.length;
        const occupiedSpots = allSpots.filter((spot: any) => 
          Array.isArray(spot.bookings) && spot.bookings.some((b: any) => b.status === 'active')
        ).length;
        const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

        // Get violation reports count
        const violationReports = Array.isArray(operator.violation_reports) ? operator.violation_reports.length : 0;

        return {
          operatorId: String(operator.id || ''),
          operatorName: String(operator.name || ''),
          totalRevenue,
          transactionCount,
          averageTransactionValue,
          occupancyRate,
          customerSatisfaction: 4.2, // TODO: Calculate from ratings
          responseTime: 120, // TODO: Calculate from performance metrics
          violationReports,
          status: String(operator.status || 'inactive') as 'active' | 'inactive' | 'suspended',
        };
      });
    } catch (error) {
      console.error('Error fetching operator performance:', error);
      throw error;
    }
  }

  async getParkingUtilization(filters?: DashboardFilters): Promise<ParkingUtilization[]> {
    try {
      const { data: locations, error } = await this.supabase
        .from('locations')
        .select(`
          id,
          name,
          type,
          sections (
            zones (
              parking_spots (
                id,
                bookings (
                  id,
                  start_time,
                  end_time,
                  status,
                  payment_transactions (
                    amount
                  )
                )
              )
            )
          )
        `);

      if (error) throw error;

      return (locations || []).map((location: any) => {
        const sections = Array.isArray(location.sections) ? location.sections : [];
        const allSpots = sections.flatMap((s: any) => {
          const zones = Array.isArray(s.zones) ? s.zones : [];
          return zones.flatMap((z: any) => Array.isArray(z.parking_spots) ? z.parking_spots : []);
        });

        const totalSpots = allSpots.length;
        const occupiedSpots = allSpots.filter((spot: any) => 
          Array.isArray(spot.bookings) && spot.bookings.some((b: any) => b.status === 'active')
        ).length;

        const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

        // Calculate revenue
        const revenue = allSpots.reduce((sum: number, spot: any) => {
          const bookings = Array.isArray(spot.bookings) ? spot.bookings : [];
          const spotRevenue = bookings.reduce((spotSum: number, booking: any) => {
            const transactions = Array.isArray(booking.payment_transactions) ? booking.payment_transactions : [];
            const bookingRevenue = transactions.reduce((txSum: number, tx: any) => 
              txSum + Math.abs(Number(tx.amount) || 0), 0);
            return spotSum + bookingRevenue;
          }, 0);
          return sum + spotRevenue;
        }, 0);

        // Calculate average session duration
        const completedBookings = allSpots.flatMap((spot: any) => {
          const bookings = Array.isArray(spot.bookings) ? spot.bookings : [];
          return bookings.filter((b: any) => b.status === 'completed');
        });
        const averageSessionDuration = this.calculateAverageSessionDuration(completedBookings);

        return {
          locationId: String(location.id || ''),
          locationName: String(location.name || ''),
          locationType: String(location.type || 'street') as 'hosted' | 'street' | 'facility',
          totalSpots,
          occupiedSpots,
          occupancyRate,
          averageSessionDuration,
          revenue,
          peakHours: ['09:00', '12:00', '18:00'], // TODO: Calculate from booking data
        };
      });
    } catch (error) {
      console.error('Error fetching parking utilization:', error);
      throw error;
    }
  }

  async getRevenueMetrics(filters?: DashboardFilters): Promise<RevenueMetrics> {
    try {
      const dateFilter = filters?.dateRange || {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };

      const { data: revenueShares, error } = await this.supabase
        .from('revenue_shares')
        .select(`
          total_amount,
          park_angel_share,
          operator_share,
          host_share,
          calculated_at,
          payment_transactions (
            bookings (
              parking_spots (
                zones (
                  sections (
                    locations (type)
                  )
                )
              )
            )
          )
        `)
        .gte('calculated_at', dateFilter.startDate.toISOString())
        .lte('calculated_at', dateFilter.endDate.toISOString());

      if (error) throw error;

      const totalRevenue = (revenueShares || []).reduce((sum, rs: any) => sum + (Number(rs.total_amount) || 0), 0);
      const parkAngelShare = (revenueShares || []).reduce((sum, rs: any) => sum + (Number(rs.park_angel_share) || 0), 0);
      const operatorShare = (revenueShares || []).reduce((sum, rs: any) => sum + (Number(rs.operator_share) || 0), 0);
      const hostShare = (revenueShares || []).reduce((sum, rs: any) => sum + (Number(rs.host_share) || 0), 0);
      const transactionCount = revenueShares?.length || 0;
      const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      // Calculate revenue by type
      const revenueByType = {
        hosted: 0,
        street: 0,
        facility: 0,
      };

      (revenueShares || []).forEach((rs: any) => {
        const locationType = rs.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations?.type;
        if (locationType && Object.prototype.hasOwnProperty.call(revenueByType, locationType)) {
          revenueByType[locationType as keyof typeof revenueByType] += Number(rs.total_amount) || 0;
        }
      });

      // Calculate monthly trend
      const monthlyTrend = this.calculateMonthlyRevenueTrend(revenueShares || []);

      return {
        totalRevenue,
        parkAngelShare,
        operatorShare,
        hostShare,
        transactionCount,
        averageTransactionValue,
        revenueByType,
        monthlyTrend,
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      throw error;
    }
  }

  async getTransactionMetrics(filters?: DashboardFilters): Promise<TransactionMetrics> {
    try {
      const dateFilter = filters?.dateRange || {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
      };

      const { data: transactions, error } = await this.supabase
        .from('payment_transactions')
        .select('id, amount, status, payment_method, created_at')
        .gte('created_at', dateFilter.startDate.toISOString())
        .lte('created_at', dateFilter.endDate.toISOString());

      if (error) throw error;

      const totalTransactions = transactions?.length || 0;
      const successfulTransactions = transactions?.filter(t => t.status === 'completed').length || 0;
      const failedTransactions = transactions?.filter(t => t.status === 'failed').length || 0;
      const pendingTransactions = transactions?.filter(t => t.status === 'pending').length || 0;

      const averageAmount = totalTransactions > 0 
        ? (transactions || []).reduce((sum, t: any) => sum + Math.abs(Number(t.amount) || 0), 0) / totalTransactions 
        : 0;

      // Calculate payment method stats
      const paymentMethodMap = new Map();
      (transactions || []).forEach((t: any) => {
        const method = String(t.payment_method || 'unknown');
        if (!paymentMethodMap.has(method)) {
          paymentMethodMap.set(method, { count: 0, totalAmount: 0 });
        }
        const stats = paymentMethodMap.get(method);
        stats.count += 1;
        stats.totalAmount += Math.abs(Number(t.amount) || 0);
      });

      const paymentMethods = Array.from(paymentMethodMap.entries()).map(([method, stats]) => ({
        method,
        count: stats.count,
        percentage: totalTransactions > 0 ? (stats.count / totalTransactions) * 100 : 0,
        totalAmount: stats.totalAmount,
      }));

      // Calculate hourly distribution
      const hourlyDistribution = this.calculateHourlyDistribution(transactions || []);

      return {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        averageAmount,
        paymentMethods,
        hourlyDistribution,
      };
    } catch (error) {
      console.error('Error fetching transaction metrics:', error);
      throw error;
    }
  }

  async getCriticalNotifications(limit = 10): Promise<CriticalNotification[]> {
    try {
      const { data: notifications, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('is_critical', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (notifications || []).map((n: any) => ({
        id: String(n.id || ''),
        type: String(n.type || 'system_error') as 'violation' | 'system_error' | 'payment_failure' | 'operator_issue' | 'security_alert',
        title: String(n.title || ''),
        message: String(n.message || ''),
        severity: String(n.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        timestamp: new Date(n.created_at || Date.now()),
        isRead: Boolean(n.is_read),
        actionRequired: Boolean(n.action_required),
        relatedEntityId: n.related_entity_id ? String(n.related_entity_id) : undefined,
        relatedEntityType: n.related_entity_type ? String(n.related_entity_type) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching critical notifications:', error);
      return [];
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Check API status by making a simple query
      const apiStart = Date.now();
      const { error: apiError } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);
      const apiResponseTime = Date.now() - apiStart;

      const apiStatus = apiError ? 'down' : (apiResponseTime > 1000 ? 'degraded' : 'operational');

      // Check database status
      const dbStart = Date.now();
      const { error: dbError } = await this.supabase
        .from('system_health')
        .select('*')
        .limit(1);
      const dbResponseTime = Date.now() - dbStart;

      const databaseStatus = dbError ? 'error' : (dbResponseTime > 500 ? 'slow' : 'healthy');

      return {
        apiStatus,
        databaseStatus,
        paymentGatewayStatus: 'connected', // TODO: Check actual payment gateway status
        realtimeStatus: 'active', // TODO: Check realtime connection status
        lastUpdated: new Date(),
        responseTime: Math.max(apiResponseTime, dbResponseTime),
        uptime: 99.9, // TODO: Calculate actual uptime
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        apiStatus: 'down',
        databaseStatus: 'error',
        paymentGatewayStatus: 'error',
        realtimeStatus: 'error',
        lastUpdated: new Date(),
        responseTime: 0,
        uptime: 0,
      };
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      const { data: metrics, error } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;

      return (metrics || []).map((m: any) => ({
        feature: String(m.feature || ''),
        averageResponseTime: Number(m.average_response_time) || 0,
        p95ResponseTime: Number(m.p95_response_time) || 0,
        errorRate: Number(m.error_rate) || 0,
        slaTarget: Number(m.sla_target) || 0,
        slaStatus: String(m.sla_status || 'met') as 'met' | 'warning' | 'breach',
        lastUpdated: new Date(m.last_updated || Date.now()),
      }));
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  subscribeToRealtimeUpdates(callback: (update: RealtimeUpdate) => void): () => void {
    const channels = [
      // Subscribe to metrics updates
      this.supabase
        .channel('dashboard_metrics')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'payment_transactions' },
          (payload) => {
            callback({
              type: 'metrics',
              data: payload,
              timestamp: new Date(),
            });
          }
        )
        .subscribe(),

      // Subscribe to notifications
      this.supabase
        .channel('dashboard_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            callback({
              type: 'notification',
              data: payload.new,
              timestamp: new Date(),
            });
          }
        )
        .subscribe(),

      // Subscribe to system health updates
      this.supabase
        .channel('system_health')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'system_health' },
          (payload) => {
            callback({
              type: 'system_health',
              data: payload,
              timestamp: new Date(),
            });
          }
        )
        .subscribe(),
    ];

    // Return cleanup function
    return () => {
      channels.forEach(channel => {
        this.supabase.removeChannel(channel);
      });
    };
  }

  // Private helper methods

  private async getCompletedBookingsToday(): Promise<any[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const { data: bookings } = await this.supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('status', 'completed')
      .gte('end_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString());

    return bookings || [];
  }

  private calculateAverageSessionDuration(bookings: any[]): number {
    if (bookings.length === 0) return 0;

    const totalDuration = bookings.reduce((sum, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    return Math.round(totalDuration / bookings.length / (1000 * 60)); // Return in minutes
  }

  private calculateMonthlyRevenueTrend(revenueShares: any[]): any[] {
    const monthlyMap = new Map();

    revenueShares.forEach((rs: any) => {
      const date = new Date(rs.calculated_at || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          revenue: 0,
          transactionCount: 0,
          growth: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey);
      if (monthData) {
        monthData.revenue += Number(rs.total_amount) || 0;
        monthData.transactionCount += 1;
      }
    });

    const sortedMonths = Array.from(monthlyMap.values()).sort((a: any, b: any) => a.month.localeCompare(b.month));

    // Calculate growth rates
    for (let i = 1; i < sortedMonths.length; i++) {
      const current = sortedMonths[i] as any;
      const previous = sortedMonths[i - 1] as any;
      current.growth = previous.revenue > 0 
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
        : 0;
    }

    return sortedMonths;
  }

  private calculateHourlyDistribution(transactions: any[]): any[] {
    const hourlyMap = new Map();

    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, {
        hour,
        transactionCount: 0,
        revenue: 0,
      });
    }

    transactions.forEach((transaction: any) => {
      const hour = new Date(transaction.created_at || Date.now()).getHours();
      const hourData = hourlyMap.get(hour);
      if (hourData) {
        hourData.transactionCount += 1;
        hourData.revenue += Math.abs(Number(transaction.amount) || 0);
      }
    });

    return Array.from(hourlyMap.values());
  }
}