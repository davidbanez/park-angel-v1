import { supabase } from '@park-angel/shared/src/lib/supabase';
import type { Location, ParkingSpot, Coordinates } from '@park-angel/shared/src/types/parking';


export interface ParkingSearchParams {
  location: Coordinates;
  radius: number; // in kilometers
  type?: ('hosted' | 'street' | 'facility')[];
  startTime?: Date;
  endTime?: Date;
  vehicleType?: string;
}

export interface SpotAvailability {
  spotId: string;
  date: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    price: number;
  }[];
}

export class ParkingService {
  /**
   * Search for parking spots near a location
   */
  static async searchParkingSpots(params: ParkingSearchParams): Promise<ParkingSpot[]> {
    try {
      let query = supabase
        .from('parking_spots')
        .select(`
          *,
          zone:zones!inner(
            *,
            section:sections!inner(
              *,
              location:locations!inner(*)
            )
          )
        `)
        .eq('status', 'available');

      // Filter by parking type if specified
      if (params.type && params.type.length > 0) {
        query = query.in('zone.section.location.type', params.type);
      }

      // Add geographic filtering using PostGIS functions
      // This is a simplified version - in production you'd use proper geographic queries
      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Filter by distance (simplified - in production use PostGIS)
      const filteredSpots = data?.filter(spot => {
        const distance = this.calculateDistance(
          params.location,
          spot.coordinates
        );
        return distance <= params.radius;
      }) || [];

      return filteredSpots;
    } catch (error) {
      console.error('Error searching parking spots:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific parking spot
   */
  static async getParkingSpotDetails(spotId: string): Promise<ParkingSpot | null> {
    try {
      const { data, error } = await supabase
        .from('parking_spots')
        .select(`
          *,
          zone:zones!inner(
            *,
            section:sections!inner(
              *,
              location:locations!inner(*)
            )
          )
        `)
        .eq('id', spotId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching parking spot details:', error);
      return null;
    }
  }

  /**
   * Get availability calendar for a parking spot
   */
  static async getSpotAvailability(
    spotId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SpotAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('spotId', spotId)
        .gte('startTime', startDate.toISOString())
        .lte('endTime', endDate.toISOString())
        .in('status', ['confirmed', 'active']);

      if (error) throw error;

      // Generate availability calendar
      const availability: SpotAvailability[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayBookings = data?.filter(booking => {
          const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
          return bookingDate === dateStr;
        }) || [];

        // Generate hourly time slots for the day
        const timeSlots = this.generateTimeSlots(currentDate, dayBookings);

        availability.push({
          spotId,
          date: dateStr,
          timeSlots
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availability;
    } catch (error) {
      console.error('Error fetching spot availability:', error);
      throw error;
    }
  }

  /**
   * Search locations with autocomplete
   */
  static async searchLocations(query: string): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .or(`name.ilike.%${query}%,address->street.ilike.%${query}%,address->city.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  /**
   * Get real-time occupancy updates for parking spots
   */
  static subscribeToOccupancyUpdates(
    spotIds: string[],
    callback: (updates: { spotId: string; status: string }[]) => void
  ) {
    return supabase
      .channel('parking-occupancy')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parking_spots',
          filter: `id=in.(${spotIds.join(',')})`
        },
        (payload) => {
          callback([{
            spotId: payload.new.id,
            status: payload.new.status
          }]);
        }
      )
      .subscribe();
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate hourly time slots for availability
   */
  private static generateTimeSlots(date: Date, bookings: { startTime: string; endTime: string }[]) {
    const slots = [];
    const startHour = 0;
    const endHour = 24;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if this slot conflicts with any booking
      const isAvailable = !bookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        isAvailable,
        price: 50 // Base price - would be calculated from pricing rules
      });
    }

    return slots;
  }
}