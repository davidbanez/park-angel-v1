import { createClient } from '@supabase/supabase-js';
import {
  RevenueShare,
  RevenueShareConfig,
  DEFAULT_REVENUE_SHARE_CONFIG,
  PaymentTransaction,
} from '../types/payment';

export interface RevenueShareService {
  calculateRevenueShare(transactionId: string): Promise<RevenueShare>;
  getRevenueShareConfig(parkingType: string): Promise<RevenueShareConfig>;
  updateRevenueShareConfig(parkingType: string, config: RevenueShareConfig): Promise<void>;
  getOperatorEarnings(operatorId: string, startDate?: Date, endDate?: Date): Promise<OperatorEarnings>;
  getHostEarnings(hostId: string, startDate?: Date, endDate?: Date): Promise<HostEarnings>;
  getParkAngelRevenue(startDate?: Date, endDate?: Date): Promise<ParkAngelRevenue>;
}

export interface OperatorEarnings {
  operatorId: string;
  totalRevenue: number;
  operatorShare: number;
  parkAngelShare: number;
  transactionCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    streetParking: number;
    facilityParking: number;
  };
}

export interface HostEarnings {
  hostId: string;
  totalRevenue: number;
  hostShare: number;
  parkAngelShare: number;
  transactionCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    hostedParking: number;
  };
}

export interface ParkAngelRevenue {
  totalRevenue: number;
  operatorRevenue: number;
  hostRevenue: number;
  directRevenue: number;
  transactionCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    streetParking: number;
    facilityParking: number;
    hostedParking: number;
  };
}

export class RevenueShareServiceImpl implements RevenueShareService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async calculateRevenueShare(transactionId: string): Promise<RevenueShare> {
    try {
      // Get transaction details
      const { data: transaction, error: transactionError } = await this.supabase
        .from('payment_transactions')
        .select(`
          *,
          bookings (
            *,
            parking_spots (
              *,
              zones (
                *,
                sections (
                  *,
                  locations (
                    *,
                    users!locations_operator_id_fkey (id, user_type)
                  )
                )
              )
            )
          )
        `)
        .eq('id', transactionId)
        .single();

      if (transactionError || !transaction) {
        throw new Error('Transaction not found');
      }

      const booking = transaction.bookings;
      const location = booking.parking_spots.zones.sections.locations;
      const parkingType = location.type;

      // Get revenue share configuration
      const config = await this.getRevenueShareConfig(parkingType);

      // Calculate shares
      const totalAmount = Math.abs(transaction.amount);
      const parkAngelShare = (totalAmount * config.parkAngelPercentage) / 100;
      
      let operatorShare = 0;
      let hostShare = 0;

      if (parkingType === 'hosted') {
        hostShare = (totalAmount * (config.hostPercentage || 0)) / 100;
      } else {
        operatorShare = (totalAmount * (config.operatorPercentage || 0)) / 100;
      }

      const revenueShare: RevenueShare = {
        id: `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId,
        operatorId: parkingType !== 'hosted' ? location.operator_id : undefined,
        hostId: parkingType === 'hosted' ? location.operator_id : undefined,
        totalAmount,
        parkAngelShare,
        operatorShare: operatorShare > 0 ? operatorShare : undefined,
        hostShare: hostShare > 0 ? hostShare : undefined,
        sharePercentage: config.parkAngelPercentage,
        calculatedAt: new Date(),
      };

      // Store revenue share calculation
      const { data, error } = await this.supabase
        .from('revenue_shares')
        .insert({
          id: revenueShare.id,
          transaction_id: revenueShare.transactionId,
          operator_id: revenueShare.operatorId,
          host_id: revenueShare.hostId,
          total_amount: revenueShare.totalAmount,
          park_angel_share: revenueShare.parkAngelShare,
          operator_share: revenueShare.operatorShare,
          host_share: revenueShare.hostShare,
          share_percentage: revenueShare.sharePercentage,
          calculated_at: revenueShare.calculatedAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store revenue share: ${error.message}`);
      }

      return revenueShare;
    } catch (error) {
      console.error('Error calculating revenue share:', error);
      throw error;
    }
  }

  async getRevenueShareConfig(parkingType: string): Promise<RevenueShareConfig> {
    try {
      const { data, error } = await this.supabase
        .from('revenue_share_configs')
        .select('*')
        .eq('parking_type', parkingType)
        .single();

      if (error || !data) {
        // Return default configuration if not found
        return DEFAULT_REVENUE_SHARE_CONFIG[parkingType] || DEFAULT_REVENUE_SHARE_CONFIG.street;
      }

      return {
        parkingType: data.parking_type,
        parkAngelPercentage: data.park_angel_percentage,
        operatorPercentage: data.operator_percentage,
        hostPercentage: data.host_percentage,
      };
    } catch (error) {
      console.error('Error fetching revenue share config:', error);
      // Return default configuration on error
      return DEFAULT_REVENUE_SHARE_CONFIG[parkingType] || DEFAULT_REVENUE_SHARE_CONFIG.street;
    }
  }

  async updateRevenueShareConfig(parkingType: string, config: RevenueShareConfig): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('revenue_share_configs')
        .upsert({
          parking_type: parkingType,
          park_angel_percentage: config.parkAngelPercentage,
          operator_percentage: config.operatorPercentage,
          host_percentage: config.hostPercentage,
          updated_at: new Date(),
        });

      if (error) {
        throw new Error(`Failed to update revenue share config: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating revenue share config:', error);
      throw error;
    }
  }

  async getOperatorEarnings(
    operatorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OperatorEarnings> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const { data, error } = await this.supabase
        .from('revenue_shares')
        .select(`
          *,
          payment_transactions (
            *,
            bookings (
              *,
              parking_spots (
                *,
                zones (
                  *,
                  sections (
                    *,
                    locations (type)
                  )
                )
              )
            )
          )
        `)
        .eq('operator_id', operatorId)
        .gte('calculated_at', start.toISOString())
        .lte('calculated_at', end.toISOString());

      if (error) {
        throw new Error(`Failed to fetch operator earnings: ${error.message}`);
      }

      const earnings = data || [];
      const totalRevenue = earnings.reduce((sum, share) => sum + share.total_amount, 0);
      const operatorShare = earnings.reduce((sum, share) => sum + (share.operator_share || 0), 0);
      const parkAngelShare = earnings.reduce((sum, share) => sum + share.park_angel_share, 0);

      // Calculate breakdown by parking type
      const streetParking = earnings
        .filter(share => {
          const location = share.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'street';
        })
        .reduce((sum, share) => sum + (share.operator_share || 0), 0);

      const facilityParking = earnings
        .filter(share => {
          const location = share.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'facility';
        })
        .reduce((sum, share) => sum + (share.operator_share || 0), 0);

      return {
        operatorId,
        totalRevenue,
        operatorShare,
        parkAngelShare,
        transactionCount: earnings.length,
        period: { startDate: start, endDate: end },
        breakdown: {
          streetParking,
          facilityParking,
        },
      };
    } catch (error) {
      console.error('Error fetching operator earnings:', error);
      throw error;
    }
  }

  async getHostEarnings(
    hostId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HostEarnings> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const { data, error } = await this.supabase
        .from('revenue_shares')
        .select('*')
        .eq('host_id', hostId)
        .gte('calculated_at', start.toISOString())
        .lte('calculated_at', end.toISOString());

      if (error) {
        throw new Error(`Failed to fetch host earnings: ${error.message}`);
      }

      const earnings = data || [];
      const totalRevenue = earnings.reduce((sum, share) => sum + share.total_amount, 0);
      const hostShare = earnings.reduce((sum, share) => sum + (share.host_share || 0), 0);
      const parkAngelShare = earnings.reduce((sum, share) => sum + share.park_angel_share, 0);

      return {
        hostId,
        totalRevenue,
        hostShare,
        parkAngelShare,
        transactionCount: earnings.length,
        period: { startDate: start, endDate: end },
        breakdown: {
          hostedParking: hostShare,
        },
      };
    } catch (error) {
      console.error('Error fetching host earnings:', error);
      throw error;
    }
  }

  async getParkAngelRevenue(
    startDate?: Date,
    endDate?: Date
  ): Promise<ParkAngelRevenue> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const { data, error } = await this.supabase
        .from('revenue_shares')
        .select(`
          *,
          payment_transactions (
            *,
            bookings (
              *,
              parking_spots (
                *,
                zones (
                  *,
                  sections (
                    *,
                    locations (type)
                  )
                )
              )
            )
          )
        `)
        .gte('calculated_at', start.toISOString())
        .lte('calculated_at', end.toISOString());

      if (error) {
        throw new Error(`Failed to fetch Park Angel revenue: ${error.message}`);
      }

      const revenues = data || [];
      const totalRevenue = revenues.reduce((sum, share) => sum + share.park_angel_share, 0);
      const operatorRevenue = revenues.reduce((sum, share) => sum + (share.operator_share || 0), 0);
      const hostRevenue = revenues.reduce((sum, share) => sum + (share.host_share || 0), 0);
      const directRevenue = totalRevenue; // Park Angel's share is the direct revenue

      // Calculate breakdown by parking type
      const streetParking = revenues
        .filter(share => {
          const location = share.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'street';
        })
        .reduce((sum, share) => sum + share.park_angel_share, 0);

      const facilityParking = revenues
        .filter(share => {
          const location = share.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'facility';
        })
        .reduce((sum, share) => sum + share.park_angel_share, 0);

      const hostedParking = revenues
        .filter(share => {
          const location = share.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'hosted';
        })
        .reduce((sum, share) => sum + share.park_angel_share, 0);

      return {
        totalRevenue,
        operatorRevenue,
        hostRevenue,
        directRevenue,
        transactionCount: revenues.length,
        period: { startDate: start, endDate: end },
        breakdown: {
          streetParking,
          facilityParking,
          hostedParking,
        },
      };
    } catch (error) {
      console.error('Error fetching Park Angel revenue:', error);
      throw error;
    }
  }
}