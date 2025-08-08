import { createClient } from '@supabase/supabase-js';
import { ParkingSpot, SpotStatus } from '../models/location';
import { Booking, BookingStatus } from '../models/booking';
import { VehicleType } from '../types';
import { 
  SpotAvailabilityService, 
  AvailabilitySearchCriteria, 
  SpotReservationData, 
  SpotOccupancyInfo, 
  LocationOccupancyInfo 
} from './parking-management';

export class SpotAvailabilityServiceImpl implements SpotAvailabilityService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async checkAvailability(spotId: string, startTime: Date, endTime: Date): Promise<boolean> {
    // Check if spot exists and is not in maintenance
    const { data: spot, error: spotError } = await this.supabase
      .from('parking_spots')
      .select('status')
      .eq('id', spotId)
      .single();

    if (spotError || !spot) return false;
    if (spot.status === 'maintenance') return false;

    // Check for overlapping bookings
    const { data: overlappingBookings, error: bookingError } = await this.supabase
      .from('bookings')
      .select('id')
      .eq('spot_id', spotId)
      .in('status', ['confirmed', 'active'])
      .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`);

    if (bookingError) throw new Error(`Failed to check availability: ${bookingError.message}`);

    return overlappingBookings.length === 0;
  }

  async getAvailableSpots(criteria: AvailabilitySearchCriteria): Promise<ParkingSpot[]> {
    let query = this.supabase
      .from('parking_spots')
      .select(`
        *,
        zones!inner (
          *,
          sections!inner (
            *,
            locations!inner (*)
          )
        )
      `)
      .neq('status', 'maintenance');

    // Apply location filters
    if (criteria.locationId) {
      query = query.eq('zones.sections.locations.id', criteria.locationId);
    }
    if (criteria.sectionId) {
      query = query.eq('zones.sections.id', criteria.sectionId);
    }
    if (criteria.zoneId) {
      query = query.eq('zones.id', criteria.zoneId);
    }

    // Apply vehicle type filter
    if (criteria.vehicleType) {
      query = query.eq('type', criteria.vehicleType);
    }

    // Apply amenities filter
    if (criteria.amenities && criteria.amenities.length > 0) {
      query = query.contains('amenities', criteria.amenities);
    }

    const { data: spots, error } = await query;

    if (error) throw new Error(`Failed to get available spots: ${error.message}`);

    // Filter out spots with overlapping bookings
    const availableSpots: ParkingSpot[] = [];
    
    for (const spotData of spots) {
      const isAvailable = await this.checkAvailability(
        spotData.id, 
        criteria.startTime, 
        criteria.endTime
      );
      
      if (isAvailable) {
        const spot = this.mapToSpotModel(spotData);
        
        // Apply price filter if specified
        if (criteria.maxPrice) {
          // This would require pricing calculation - simplified for now
          const effectivePrice = await this.getSpotPrice(spot.id, criteria.startTime, criteria.endTime);
          if (effectivePrice <= criteria.maxPrice) {
            availableSpots.push(spot);
          }
        } else {
          availableSpots.push(spot);
        }
      }
    }

    return availableSpots;
  }

  async reserveSpot(spotId: string, reservationData: SpotReservationData): Promise<void> {
    // Check availability first
    const isAvailable = await this.checkAvailability(
      spotId, 
      reservationData.startTime, 
      reservationData.endTime
    );

    if (!isAvailable) {
      throw new Error('Spot is not available for the requested time period');
    }

    // Update spot status to reserved
    const { error } = await this.supabase
      .from('parking_spots')
      .update({ 
        status: 'reserved',
        updated_at: new Date().toISOString()
      })
      .eq('id', spotId);

    if (error) throw new Error(`Failed to reserve spot: ${error.message}`);

    // Create a temporary reservation record (this could be a separate table)
    const { error: reservationError } = await this.supabase
      .from('spot_reservations')
      .insert({
        spot_id: spotId,
        user_id: reservationData.userId,
        start_time: reservationData.startTime.toISOString(),
        end_time: reservationData.endTime.toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes to complete booking
      });

    if (reservationError) {
      // Rollback spot status if reservation creation fails
      await this.supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('id', spotId);
      
      throw new Error(`Failed to create reservation: ${reservationError.message}`);
    }
  }

  async releaseSpot(spotId: string): Promise<void> {
    // Update spot status to available
    const { error } = await this.supabase
      .from('parking_spots')
      .update({ 
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', spotId);

    if (error) throw new Error(`Failed to release spot: ${error.message}`);

    // Remove any temporary reservations
    await this.supabase
      .from('spot_reservations')
      .delete()
      .eq('spot_id', spotId);
  }

  async getSpotOccupancy(spotId: string): Promise<SpotOccupancyInfo> {
    // Get current spot status
    const { data: spot, error: spotError } = await this.supabase
      .from('parking_spots')
      .select('status')
      .eq('id', spotId)
      .single();

    if (spotError || !spot) throw new Error('Spot not found');

    // Get current active booking
    const { data: currentBooking } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('spot_id', spotId)
      .eq('status', 'active')
      .single();

    // Get next upcoming booking
    const { data: nextBookings } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('spot_id', spotId)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1);

    const nextBooking = nextBookings && nextBookings.length > 0 ? nextBookings[0] : undefined;

    // Calculate available until time
    let availableUntil: Date | undefined;
    if (spot.status === 'available' && nextBooking) {
      availableUntil = new Date(nextBooking.start_time);
    } else if (currentBooking) {
      availableUntil = new Date(currentBooking.end_time);
    }

    return {
      spotId,
      status: spot.status as SpotStatus,
      currentBooking: currentBooking ? this.mapToBookingModel(currentBooking) : undefined,
      nextBooking: nextBooking ? this.mapToBookingModel(nextBooking) : undefined,
      availableUntil
    };
  }

  async getLocationOccupancy(locationId: string): Promise<LocationOccupancyInfo> {
    // Get all spots in the location with their current status
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

    if (error) throw new Error(`Failed to get location occupancy: ${error.message}`);

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

  private async getSpotPrice(spotId: string, startTime: Date, endTime: Date): Promise<number> {
    // Simplified price calculation - in real implementation, this would use the pricing service
    // For now, return a default price
    return 50; // PHP 50 per hour
  }

  private mapToSpotModel(data: any): ParkingSpot {
    // This should match the mapping in LocationManagementService
    const { ParkingSpot } = require('../models/location');
    const { Coordinates } = require('../models/value-objects');
    
    return new ParkingSpot(
      data.id,
      data.zone_id,
      data.number,
      data.type as VehicleType,
      data.status as SpotStatus,
      new Coordinates(data.coordinates.lat, data.coordinates.lng),
      data.amenities || [],
      undefined, // pricing would be resolved separately
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  private mapToBookingModel(data: any): Booking {
    // This should match the mapping in BookingService
    const { Booking } = require('../models/booking');
    const { UserId, Money, TimeRange } = require('../models/value-objects');
    
    return new Booking(
      data.id,
      new UserId(data.user_id),
      data.spot_id,
      data.vehicle_id,
      new TimeRange(new Date(data.start_time), new Date(data.end_time)),
      data.status as BookingStatus,
      data.payment_status,
      new Money(data.amount),
      data.discounts || [],
      new Money(data.vat_amount),
      new Money(data.total_amount),
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }
}

// Utility functions for availability checking
export class AvailabilityUtils {
  static isTimeSlotAvailable(
    existingBookings: { start_time: Date; end_time: Date }[],
    requestedStart: Date,
    requestedEnd: Date
  ): boolean {
    return !existingBookings.some(booking => 
      this.timeRangesOverlap(
        booking.start_time,
        booking.end_time,
        requestedStart,
        requestedEnd
      )
    );
  }

  static timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  static getAvailableTimeSlots(
    existingBookings: { start_time: Date; end_time: Date }[],
    searchStart: Date,
    searchEnd: Date,
    minimumDuration: number = 60 // minutes
  ): { start: Date; end: Date }[] {
    const availableSlots: { start: Date; end: Date }[] = [];
    
    // Sort bookings by start time
    const sortedBookings = existingBookings
      .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

    let currentTime = new Date(searchStart);

    for (const booking of sortedBookings) {
      // If there's a gap before this booking
      if (currentTime < booking.start_time) {
        const gapDuration = booking.start_time.getTime() - currentTime.getTime();
        if (gapDuration >= minimumDuration * 60 * 1000) {
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(booking.start_time)
          });
        }
      }
      
      // Move current time to after this booking
      currentTime = new Date(Math.max(currentTime.getTime(), booking.end_time.getTime()));
    }

    // Check for availability after the last booking
    if (currentTime < searchEnd) {
      const remainingDuration = searchEnd.getTime() - currentTime.getTime();
      if (remainingDuration >= minimumDuration * 60 * 1000) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(searchEnd)
        });
      }
    }

    return availableSlots;
  }

  static calculateOptimalSpotRecommendations(
    availableSpots: ParkingSpot[],
    userPreferences: {
      preferredAmenities?: string[];
      maxWalkingDistance?: number;
      priceWeight?: number; // 0-1, how much price matters
      convenienceWeight?: number; // 0-1, how much convenience matters
    },
    userLocation?: { latitude: number; longitude: number }
  ): ParkingSpot[] {
    // Score each spot based on user preferences
    const scoredSpots = availableSpots.map(spot => {
      let score = 0;
      
      // Amenity score
      if (userPreferences.preferredAmenities) {
        const matchingAmenities = spot.amenities.filter(amenity =>
          userPreferences.preferredAmenities!.includes(amenity)
        );
        score += (matchingAmenities.length / userPreferences.preferredAmenities.length) * 30;
      }
      
      // Distance score (if user location provided)
      if (userLocation && userPreferences.maxWalkingDistance) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          spot.coordinates.latitude,
          spot.coordinates.longitude
        );
        
        if (distance <= userPreferences.maxWalkingDistance) {
          score += (1 - (distance / userPreferences.maxWalkingDistance)) * 40;
        }
      }
      
      // Add base convenience score
      score += 30;
      
      return { spot, score };
    });

    // Sort by score (highest first) and return spots
    return scoredSpots
      .sort((a, b) => b.score - a.score)
      .map(item => item.spot);
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}