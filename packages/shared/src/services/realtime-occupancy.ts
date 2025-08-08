import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { ParkingSpot, SpotStatus } from '../models/location';
import { LocationOccupancyInfo } from './parking-management';
import { RealtimeOccupancyService } from './parking-management';

export class RealtimeOccupancyServiceImpl implements RealtimeOccupancyService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private spotSubscriptions: Map<string, Set<(spot: ParkingSpot) => void>> = new Map();
  private locationSubscriptions: Map<string, Set<(occupancy: LocationOccupancyInfo) => void>> = new Map();

  constructor(private supabase: ReturnType<typeof createClient>) {}

  subscribeToSpotUpdates(spotId: string, callback: (spot: ParkingSpot) => void): () => void {
    // Add callback to spot subscriptions
    if (!this.spotSubscriptions.has(spotId)) {
      this.spotSubscriptions.set(spotId, new Set());
    }
    this.spotSubscriptions.get(spotId)!.add(callback);

    // Create or reuse channel for this spot
    const channelName = `spot-${spotId}`;
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'parking_spots',
            filter: `id=eq.${spotId}`
          },
          async (payload) => {
            await this.handleSpotUpdate(spotId, payload);
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.spotSubscriptions.get(spotId);
      if (callbacks) {
        callbacks.delete(callback);
        
        // If no more callbacks, unsubscribe from channel
        if (callbacks.size === 0) {
          this.spotSubscriptions.delete(spotId);
          const channel = this.channels.get(channelName);
          if (channel) {
            this.supabase.removeChannel(channel);
            this.channels.delete(channelName);
          }
        }
      }
    };
  }

  subscribeToLocationUpdates(
    locationId: string, 
    callback: (occupancy: LocationOccupancyInfo) => void
  ): () => void {
    // Add callback to location subscriptions
    if (!this.locationSubscriptions.has(locationId)) {
      this.locationSubscriptions.set(locationId, new Set());
    }
    this.locationSubscriptions.get(locationId)!.add(callback);

    // Create or reuse channel for this location
    const channelName = `location-${locationId}`;
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'parking_spots',
            filter: `zones.sections.locations.id=eq.${locationId}`
          },
          async (payload) => {
            await this.handleLocationUpdate(locationId, payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          async (payload) => {
            // Check if booking affects this location
            if (payload.new && payload.new.spot_id) {
              const affectsLocation = await this.checkIfBookingAffectsLocation(
                payload.new.spot_id,
                locationId
              );
              if (affectsLocation) {
                await this.handleLocationUpdate(locationId, payload);
              }
            }
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.locationSubscriptions.get(locationId);
      if (callbacks) {
        callbacks.delete(callback);
        
        // If no more callbacks, unsubscribe from channel
        if (callbacks.size === 0) {
          this.locationSubscriptions.delete(locationId);
          const channel = this.channels.get(channelName);
          if (channel) {
            this.supabase.removeChannel(channel);
            this.channels.delete(channelName);
          }
        }
      }
    };
  }

  async updateSpotStatus(spotId: string, status: SpotStatus): Promise<void> {
    const { error } = await this.supabase
      .from('parking_spots')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', spotId);

    if (error) throw new Error(`Failed to update spot status: ${error.message}`);

    // The realtime subscription will handle notifying subscribers
  }

  async broadcastOccupancyUpdate(locationId: string): Promise<void> {
    // Calculate current occupancy
    const occupancyInfo = await this.calculateLocationOccupancy(locationId);
    
    // Broadcast to all location subscribers
    const callbacks = this.locationSubscriptions.get(locationId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(occupancyInfo);
        } catch (error) {
          console.error('Error in occupancy callback:', error);
        }
      });
    }

    // Also broadcast via Supabase channel for external subscribers
    const channel = this.channels.get(`location-${locationId}`);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'occupancy_update',
        payload: occupancyInfo
      });
    }
  }

  private async handleSpotUpdate(spotId: string, payload: any): Promise<void> {
    try {
      // Get updated spot data
      const { data: spotData, error } = await this.supabase
        .from('parking_spots')
        .select('*')
        .eq('id', spotId)
        .single();

      if (error || !spotData) {
        console.error('Failed to get updated spot data:', error);
        return;
      }

      const updatedSpot = this.mapToSpotModel(spotData);

      // Notify all spot subscribers
      const callbacks = this.spotSubscriptions.get(spotId);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(updatedSpot);
          } catch (error) {
            console.error('Error in spot update callback:', error);
          }
        });
      }

      // Also trigger location update if needed
      const locationId = await this.getLocationIdForSpot(spotId);
      if (locationId) {
        await this.broadcastOccupancyUpdate(locationId);
      }

    } catch (error) {
      console.error('Error handling spot update:', error);
    }
  }

  private async handleLocationUpdate(locationId: string, payload: any): Promise<void> {
    try {
      await this.broadcastOccupancyUpdate(locationId);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  private async checkIfBookingAffectsLocation(spotId: string, locationId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('parking_spots')
      .select(`
        zones!inner (
          sections!inner (
            locations!inner (
              id
            )
          )
        )
      `)
      .eq('id', spotId)
      .eq('zones.sections.locations.id', locationId)
      .single();

    return !error && !!data;
  }

  private async getLocationIdForSpot(spotId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('parking_spots')
      .select(`
        zones!inner (
          sections!inner (
            locations!inner (
              id
            )
          )
        )
      `)
      .eq('id', spotId)
      .single();

    if (error || !data) return null;
    return data.zones.sections.locations.id;
  }

  private async calculateLocationOccupancy(locationId: string): Promise<LocationOccupancyInfo> {
    const { data: spots, error } = await this.supabase
      .from('parking_spots')
      .select(`
        id,
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

    if (error) throw new Error(`Failed to calculate occupancy: ${error.message}`);

    const totalSpots = spots.length;
    const availableSpots = spots.filter(s => s.status === 'available').length;
    const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
    const reservedSpots = spots.filter(s => s.status === 'reserved').length;
    const maintenanceSpots = spots.filter(s => s.status === 'maintenance').length;
    
    const occupancyRate = totalSpots > 0 ? ((occupiedSpots + reservedSpots) / totalSpots) * 100 : 0;

    return {
      locationId,
      totalSpots,
      availableSpots,
      occupiedSpots,
      reservedSpots,
      maintenanceSpots,
      occupancyRate,
      lastUpdated: new Date()
    };
  }

  private mapToSpotModel(data: any): ParkingSpot {
    const { ParkingSpot } = require('../models/location');
    const { Coordinates } = require('../models/value-objects');
    
    return new ParkingSpot(
      data.id,
      data.zone_id,
      data.number,
      data.type,
      data.status as SpotStatus,
      new Coordinates(data.coordinates.lat, data.coordinates.lng),
      data.amenities || [],
      undefined, // pricing would be resolved separately
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  // Cleanup method to remove all subscriptions
  cleanup(): void {
    // Remove all channels
    this.channels.forEach(channel => {
      this.supabase.removeChannel(channel);
    });
    
    // Clear all maps
    this.channels.clear();
    this.spotSubscriptions.clear();
    this.locationSubscriptions.clear();
  }
}

// Occupancy analytics and insights
export class OccupancyAnalytics {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async getOccupancyTrends(
    locationId: string, 
    dateRange: { start: Date; end: Date },
    granularity: 'hour' | 'day' | 'week' = 'hour'
  ): Promise<OccupancyTrend[]> {
    // This would require a time-series table to store historical occupancy data
    // For now, we'll calculate from booking data
    
    const { data: bookings, error } = await this.supabase
      .from('bookings')
      .select(`
        start_time,
        end_time,
        status,
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
      .gte('start_time', dateRange.start.toISOString())
      .lte('end_time', dateRange.end.toISOString())
      .in('status', ['confirmed', 'active', 'completed']);

    if (error) throw new Error(`Failed to get occupancy trends: ${error.message}`);

    // Group bookings by time periods
    const trends = this.groupBookingsByTimePeriod(bookings, granularity, dateRange);
    
    return trends;
  }

  async getPeakHours(locationId: string, dateRange: { start: Date; end: Date }): Promise<PeakHour[]> {
    const trends = await this.getOccupancyTrends(locationId, dateRange, 'hour');
    
    // Sort by occupancy rate and return top hours
    return trends
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 10)
      .map(trend => ({
        hour: new Date(trend.timestamp).getHours(),
        dayOfWeek: new Date(trend.timestamp).getDay(),
        occupancyRate: trend.occupancyRate,
        averageBookings: trend.totalBookings
      }));
  }

  async getOccupancyForecast(
    locationId: string, 
    forecastDays: number = 7
  ): Promise<OccupancyForecast[]> {
    // Get historical data for the same period in previous weeks
    const historicalWeeks = 4;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (historicalWeeks * 7 * 24 * 60 * 60 * 1000));

    const historicalTrends = await this.getOccupancyTrends(
      locationId, 
      { start: startDate, end: endDate }, 
      'hour'
    );

    // Simple forecasting based on historical averages
    const forecast: OccupancyForecast[] = [];
    const now = new Date();

    for (let day = 0; day < forecastDays; day++) {
      const forecastDate = new Date(now.getTime() + (day * 24 * 60 * 60 * 1000));
      const dayOfWeek = forecastDate.getDay();

      for (let hour = 0; hour < 24; hour++) {
        // Find historical data for same day of week and hour
        const historicalData = historicalTrends.filter(trend => {
          const trendDate = new Date(trend.timestamp);
          return trendDate.getDay() === dayOfWeek && trendDate.getHours() === hour;
        });

        const averageOccupancy = historicalData.length > 0
          ? historicalData.reduce((sum, trend) => sum + trend.occupancyRate, 0) / historicalData.length
          : 50; // Default to 50% if no historical data

        forecast.push({
          timestamp: new Date(forecastDate.getFullYear(), forecastDate.getMonth(), forecastDate.getDate(), hour),
          predictedOccupancyRate: Math.round(averageOccupancy),
          confidence: Math.min(95, historicalData.length * 20) // Higher confidence with more data
        });
      }
    }

    return forecast;
  }

  async getOccupancyAlerts(locationId: string): Promise<OccupancyAlert[]> {
    const currentOccupancy = await this.getCurrentOccupancy(locationId);
    const alerts: OccupancyAlert[] = [];

    // High occupancy alert (>90%)
    if (currentOccupancy.occupancyRate > 90) {
      alerts.push({
        type: 'high_occupancy',
        severity: 'warning',
        message: `Location is ${currentOccupancy.occupancyRate.toFixed(1)}% occupied`,
        timestamp: new Date(),
        locationId
      });
    }

    // Low occupancy alert (<20%)
    if (currentOccupancy.occupancyRate < 20) {
      alerts.push({
        type: 'low_occupancy',
        severity: 'info',
        message: `Location has low occupancy: ${currentOccupancy.occupancyRate.toFixed(1)}%`,
        timestamp: new Date(),
        locationId
      });
    }

    // Maintenance spots alert
    if (currentOccupancy.maintenanceSpots > 0) {
      alerts.push({
        type: 'maintenance_required',
        severity: 'warning',
        message: `${currentOccupancy.maintenanceSpots} spots are under maintenance`,
        timestamp: new Date(),
        locationId
      });
    }

    return alerts;
  }

  private async getCurrentOccupancy(locationId: string): Promise<LocationOccupancyInfo> {
    const occupancyService = new RealtimeOccupancyServiceImpl(this.supabase);
    // This would use the method from RealtimeOccupancyService
    // For now, we'll implement it directly
    
    const { data: spots, error } = await this.supabase
      .from('parking_spots')
      .select(`
        id,
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

    if (error) throw new Error(`Failed to get current occupancy: ${error.message}`);

    const totalSpots = spots.length;
    const availableSpots = spots.filter(s => s.status === 'available').length;
    const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
    const reservedSpots = spots.filter(s => s.status === 'reserved').length;
    const maintenanceSpots = spots.filter(s => s.status === 'maintenance').length;
    
    const occupancyRate = totalSpots > 0 ? ((occupiedSpots + reservedSpots) / totalSpots) * 100 : 0;

    return {
      locationId,
      totalSpots,
      availableSpots,
      occupiedSpots,
      reservedSpots,
      maintenanceSpots,
      occupancyRate,
      lastUpdated: new Date()
    };
  }

  private groupBookingsByTimePeriod(
    bookings: any[], 
    granularity: 'hour' | 'day' | 'week',
    dateRange: { start: Date; end: Date }
  ): OccupancyTrend[] {
    const trends: Map<string, { bookings: any[]; timestamp: Date }> = new Map();

    // Initialize time periods
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      const key = this.getTimePeriodKey(current, granularity);
      trends.set(key, { bookings: [], timestamp: new Date(current) });
      
      // Increment by granularity
      switch (granularity) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
      }
    }

    // Group bookings into time periods
    for (const booking of bookings) {
      const startTime = new Date(booking.start_time);
      const key = this.getTimePeriodKey(startTime, granularity);
      
      if (trends.has(key)) {
        trends.get(key)!.bookings.push(booking);
      }
    }

    // Convert to trend objects
    return Array.from(trends.values()).map(({ bookings, timestamp }) => ({
      timestamp,
      totalBookings: bookings.length,
      occupancyRate: this.calculateOccupancyRateForPeriod(bookings, timestamp, granularity)
    }));
  }

  private getTimePeriodKey(date: Date, granularity: 'hour' | 'day' | 'week'): string {
    switch (granularity) {
      case 'hour':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      case 'day':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      default:
        return date.toISOString();
    }
  }

  private calculateOccupancyRateForPeriod(
    bookings: any[], 
    timestamp: Date, 
    granularity: 'hour' | 'day' | 'week'
  ): number {
    // Simplified calculation - in reality, this would need to account for
    // the total number of spots and the actual time overlap
    
    // For now, return a percentage based on booking count
    // This would need to be more sophisticated in a real implementation
    const maxBookingsPerPeriod = 100; // Assume max 100 bookings per period
    return Math.min(100, (bookings.length / maxBookingsPerPeriod) * 100);
  }
}

// Data types for occupancy analytics
export interface OccupancyTrend {
  timestamp: Date;
  totalBookings: number;
  occupancyRate: number;
}

export interface PeakHour {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  occupancyRate: number;
  averageBookings: number;
}

export interface OccupancyForecast {
  timestamp: Date;
  predictedOccupancyRate: number;
  confidence: number; // 0-100
}

export interface OccupancyAlert {
  type: 'high_occupancy' | 'low_occupancy' | 'maintenance_required' | 'system_error';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  locationId: string;
}