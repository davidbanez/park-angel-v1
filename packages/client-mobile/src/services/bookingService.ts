import { supabase } from '@park-angel/shared/src/lib/supabase';
import type { 
  Booking, 
  AppliedDiscount
} from '@park-angel/shared/src/types/booking';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';

export interface CreateBookingParams {
  spotId: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  paymentMethodId?: string;
  discounts?: AppliedDiscount[];
}

export interface BookingCalculation {
  baseAmount: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  discounts: AppliedDiscount[];
}

export interface ExtendBookingParams {
  bookingId: string;
  newEndTime: Date;
  paymentMethodId?: string;
}

export class BookingService {
  /**
   * Calculate booking cost with discounts and VAT
   */
  static async calculateBookingCost(
    spotId: string,
    startTime: Date,
    endTime: Date,
    vehicleType: string,
    discounts: AppliedDiscount[] = []
  ): Promise<BookingCalculation> {
    try {
      // Get spot pricing information
      const { data: spot, error: spotError } = await supabase
        .from('parking_spots')
        .select(`
          *,
          zone:zones!inner(
            *,
            pricing_configs(*),
            section:sections!inner(
              *,
              pricing_configs(*),
              location:locations!inner(
                *,
                pricing_configs(*)
              )
            )
          )
        `)
        .eq('id', spotId)
        .single();

      if (spotError) throw spotError;

      // Calculate duration in hours
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

      // Get applicable pricing (spot > zone > section > location)
      const pricing = this.getApplicablePricing(spot, vehicleType, startTime);
      const baseAmount = pricing.baseRate * durationHours;

      // Apply discounts
      let discountAmount = 0;
      const appliedDiscounts: AppliedDiscount[] = [];

      for (const discount of discounts) {
        const discountValue = (baseAmount * discount.percentage) / 100;
        discountAmount += discountValue;
        
        appliedDiscounts.push({
          ...discount,
          amount: discountValue
        });
      }

      const discountedAmount = Math.max(0, baseAmount - discountAmount);

      // Calculate VAT (12% in Philippines, exempt for senior/PWD)
      const hasVATExemptDiscount = appliedDiscounts.some(d => d.isVATExempt);
      const vatRate = hasVATExemptDiscount ? 0 : 0.12;
      const vatAmount = discountedAmount * vatRate;

      const totalAmount = discountedAmount + vatAmount;

      return {
        baseAmount: Math.round(baseAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        discounts: appliedDiscounts
      };
    } catch (error) {
      console.error('Error calculating booking cost:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  static async createBooking(params: CreateBookingParams): Promise<Booking> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get vehicle information for pricing calculation
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('type')
        .eq('id', params.vehicleId)
        .single();

      if (vehicleError) throw vehicleError;

      // Calculate booking cost
      const calculation = await this.calculateBookingCost(
        params.spotId,
        params.startTime,
        params.endTime,
        vehicle.type,
        params.discounts
      );

      // Create booking record
      const bookingData = {
        userId: user.id,
        spotId: params.spotId,
        vehicleId: params.vehicleId,
        startTime: params.startTime.toISOString(),
        endTime: params.endTime.toISOString(),
        status: 'pending',
        paymentStatus: 'pending',
        amount: calculation.baseAmount,
        discounts: calculation.discounts,
        vatAmount: calculation.vatAmount,
        totalAmount: calculation.totalAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      return booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(
    status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  ): Promise<Booking[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('bookings')
        .select(`
          *,
          spot:parking_spots!inner(
            *,
            zone:zones!inner(
              *,
              section:sections!inner(
                *,
                location:locations!inner(*)
              )
            )
          ),
          vehicle:vehicles!inner(*)
        `)
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Get active booking
   */
  static async getActiveBooking(): Promise<Booking | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          spot:parking_spots!inner(
            *,
            zone:zones!inner(
              *,
              section:sections!inner(
                *,
                location:locations!inner(*)
              )
            )
          ),
          vehicle:vehicles!inner(*)
        `)
        .eq('userId', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching active booking:', error);
      return null;
    }
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Extend booking time
   */
  static async extendBooking(params: ExtendBookingParams): Promise<Booking> {
    try {
      // Get current booking
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', params.bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate additional cost for extension
      const originalEndTime = new Date(currentBooking.endTime);
      const extensionCost = await this.calculateBookingCost(
        currentBooking.spotId,
        originalEndTime,
        params.newEndTime,
        'car', // Would need to get from vehicle
        []
      );

      // Update booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          endTime: params.newEndTime.toISOString(),
          amount: currentBooking.amount + extensionCost.baseAmount,
          vatAmount: currentBooking.vatAmount + extensionCost.vatAmount,
          totalAmount: currentBooking.totalAmount + extensionCost.totalAmount,
          updatedAt: new Date().toISOString()
        })
        .eq('id', params.bookingId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create extension record
      await supabase
        .from('booking_extensions')
        .insert({
          bookingId: params.bookingId,
          originalEndTime: originalEndTime.toISOString(),
          newEndTime: params.newEndTime.toISOString(),
          additionalAmount: extensionCost.baseAmount,
          additionalVAT: extensionCost.vatAmount,
          totalAdditionalAmount: extensionCost.totalAmount,
          createdAt: new Date().toISOString()
        });

      return updatedBooking;
    } catch (error) {
      console.error('Error extending booking:', error);
      throw error;
    }
  }

  /**
   * Start parking session
   */
  static async startParkingSession(bookingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'active',
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting parking session:', error);
      throw error;
    }
  }

  /**
   * Complete parking session
   */
  static async completeParkingSession(bookingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing parking session:', error);
      throw error;
    }
  }

  /**
   * Check if spot is available for booking
   */
  static async isSpotAvailable(
    spotId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('spotId', spotId)
        .in('status', ['confirmed', 'active'])
        .or(`and(startTime.lte.${endTime.toISOString()},endTime.gte.${startTime.toISOString()})`);

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking spot availability:', error);
      return false;
    }
  }

  /**
   * Subscribe to booking updates
   */
  static subscribeToBookingUpdates(
    userId: string,
    callback: (booking: Booking) => void
  ) {
    return supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Booking);
        }
      )
      .subscribe();
  }

  /**
   * Get applicable pricing from hierarchy
   */
  private static getApplicablePricing(spot: any, vehicleType: string, startTime: Date) {
    // This is a simplified version - in production would handle complex pricing rules
    const basePricing = {
      baseRate: 50, // Default rate per hour
      vehicleTypeMultiplier: vehicleType === 'motorcycle' ? 0.5 : 1,
      timeMultiplier: this.getTimeMultiplier(startTime)
    };

    return {
      baseRate: basePricing.baseRate * basePricing.vehicleTypeMultiplier * basePricing.timeMultiplier
    };
  }

  /**
   * Get time-based pricing multiplier
   */
  private static getTimeMultiplier(startTime: Date): number {
    const hour = startTime.getHours();
    
    // Peak hours (7-9 AM, 5-7 PM): 1.5x
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.5;
    }
    
    // Night hours (10 PM - 6 AM): 0.8x
    if (hour >= 22 || hour <= 6) {
      return 0.8;
    }
    
    // Regular hours: 1x
    return 1.0;
  }
}