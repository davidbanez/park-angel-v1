import { createClient } from '@supabase/supabase-js';
import { Booking, BookingStatus, PaymentStatus, Vehicle } from '../models/booking';
import { UserId, Money, TimeRange } from '../models/value-objects';
import { VehicleType } from '../types';
import { 
  BookingWorkflowService, 
  CreateBookingRequest, 
  DateRange 
} from './parking-management';
import { SpotAvailabilityServiceImpl } from './spot-availability';
import { DynamicPricingServiceImpl } from './dynamic-pricing';

export class BookingWorkflowServiceImpl implements BookingWorkflowService {
  private availabilityService: SpotAvailabilityServiceImpl;
  private pricingService: DynamicPricingServiceImpl;

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.availabilityService = new SpotAvailabilityServiceImpl(supabase);
    this.pricingService = new DynamicPricingServiceImpl(supabase);
  }

  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    // Validate booking request
    await this.validateBookingRequest(data);

    // Check spot availability
    const isAvailable = await this.availabilityService.checkAvailability(
      data.spotId,
      data.startTime,
      data.endTime
    );

    if (!isAvailable) {
      throw new Error('Spot is not available for the requested time period');
    }

    // Get vehicle information
    const vehicle = await this.getVehicle(data.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Calculate pricing
    const priceCalculation = await this.pricingService.calculatePrice({
      spotId: data.spotId,
      vehicleType: vehicle.type,
      startTime: data.startTime,
      endTime: data.endTime,
      userId: data.userId
    });

    // Reserve the spot temporarily
    await this.availabilityService.reserveSpot(data.spotId, {
      userId: data.userId,
      startTime: data.startTime,
      endTime: data.endTime
    });

    try {
      // Create booking record
      const booking = Booking.create({
        userId: new UserId(data.userId),
        spotId: data.spotId,
        vehicleId: data.vehicleId,
        startTime: data.startTime,
        endTime: data.endTime,
        amount: priceCalculation.finalPrice,
        vatAmount: priceCalculation.vatAmount,
        totalAmount: priceCalculation.totalAmount,
        discounts: priceCalculation.discounts
      });

      const { error } = await this.supabase
        .from('bookings')
        .insert({
          id: booking.id,
          user_id: booking.userId.value,
          spot_id: booking.spotId,
          vehicle_id: booking.vehicleId,
          start_time: booking.timeRange.start.toISOString(),
          end_time: booking.timeRange.end.toISOString(),
          status: booking.status,
          payment_status: booking.paymentStatus,
          amount: booking.amount.value,
          discounts: JSON.stringify(booking.discounts),
          vat_amount: booking.vatAmount.value,
          total_amount: booking.totalAmount.value
        });

      if (error) throw new Error(`Failed to create booking: ${error.message}`);

      // Trigger payment processing (this would integrate with payment gateway)
      await this.initiatePaymentProcessing(booking);

      return booking;

    } catch (error) {
      // Release the spot if booking creation fails
      await this.availabilityService.releaseSpot(data.spotId);
      throw error;
    }
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.status !== BookingStatus.PENDING) {
      throw new Error('Only pending bookings can be confirmed');
    }

    booking.confirm();

    const { error } = await this.supabase
      .from('bookings')
      .update({
        status: booking.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw new Error(`Failed to confirm booking: ${error.message}`);

    // Update spot status to reserved
    await this.supabase
      .from('parking_spots')
      .update({ status: 'reserved' })
      .eq('id', booking.spotId);

    // Send confirmation notifications
    await this.sendBookingNotification(booking, 'confirmed');

    return booking;
  }

  async startBooking(bookingId: string): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error('Only confirmed bookings can be started');
    }

    booking.start();

    const { error } = await this.supabase
      .from('bookings')
      .update({
        status: booking.status,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw new Error(`Failed to start booking: ${error.message}`);

    // Update spot status to occupied
    await this.supabase
      .from('parking_spots')
      .update({ status: 'occupied' })
      .eq('id', booking.spotId);

    // Send start notifications
    await this.sendBookingNotification(booking, 'started');

    return booking;
  }

  async completeBooking(bookingId: string): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new Error('Only active bookings can be completed');
    }

    booking.complete();

    const { error } = await this.supabase
      .from('bookings')
      .update({
        status: booking.status,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw new Error(`Failed to complete booking: ${error.message}`);

    // Update spot status to available
    await this.supabase
      .from('parking_spots')
      .update({ status: 'available' })
      .eq('id', booking.spotId);

    // Process any revenue sharing for hosted parking
    await this.processRevenueSharing(booking);

    // Send completion notifications
    await this.sendBookingNotification(booking, 'completed');

    return booking;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (!booking.canBeCancelled()) {
      throw new Error('This booking cannot be cancelled');
    }

    booking.cancel(reason);

    const { error } = await this.supabase
      .from('bookings')
      .update({
        status: booking.status,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw new Error(`Failed to cancel booking: ${error.message}`);

    // Release the spot
    await this.availabilityService.releaseSpot(booking.spotId);

    // Process refund if applicable
    if (booking.isPaid()) {
      await this.processRefund(booking);
    }

    // Send cancellation notifications
    await this.sendBookingNotification(booking, 'cancelled');

    return booking;
  }

  async extendBooking(bookingId: string, newEndTime: Date): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (!booking.canBeExtended()) {
      throw new Error('This booking cannot be extended');
    }

    // Check if extension is possible (no conflicting bookings)
    const isExtensionAvailable = await this.availabilityService.checkAvailability(
      booking.spotId,
      booking.timeRange.end,
      newEndTime
    );

    if (!isExtensionAvailable) {
      throw new Error('Spot is not available for the requested extension period');
    }

    // Calculate additional cost for extension
    const vehicle = await this.getVehicle(booking.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const extensionPricing = await this.pricingService.calculatePrice({
      spotId: booking.spotId,
      vehicleType: vehicle.type,
      startTime: booking.timeRange.end,
      endTime: newEndTime,
      userId: booking.userId.value
    });

    // Create extension record
    const { error: extensionError } = await this.supabase
      .from('booking_extensions')
      .insert({
        booking_id: bookingId,
        original_end_time: booking.timeRange.end.toISOString(),
        new_end_time: newEndTime.toISOString(),
        additional_amount: extensionPricing.finalPrice,
        additional_vat: extensionPricing.vatAmount,
        total_additional_amount: extensionPricing.totalAmount
      });

    if (extensionError) throw new Error(`Failed to create extension: ${extensionError.message}`);

    // Update booking
    booking.extendTime(newEndTime);

    const { error } = await this.supabase
      .from('bookings')
      .update({
        end_time: booking.timeRange.end.toISOString(),
        total_amount: booking.totalAmount.value + extensionPricing.totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw new Error(`Failed to extend booking: ${error.message}`);

    // Process additional payment
    await this.processExtensionPayment(booking, extensionPricing.totalAmount);

    // Send extension notifications
    await this.sendBookingNotification(booking, 'extended');

    return booking;
  }

  async getBooking(id: string): Promise<Booking | null> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get booking: ${error.message}`);
    }

    return this.mapToBookingModel(data);
  }

  async getUserBookings(userId: string, status?: BookingStatus): Promise<Booking[]> {
    let query = this.supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get user bookings: ${error.message}`);

    return data.map(item => this.mapToBookingModel(item));
  }

  async getSpotBookings(spotId: string, dateRange?: DateRange): Promise<Booking[]> {
    let query = this.supabase
      .from('bookings')
      .select('*')
      .eq('spot_id', spotId)
      .order('start_time', { ascending: true });

    if (dateRange) {
      query = query
        .gte('start_time', dateRange.start.toISOString())
        .lte('end_time', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get spot bookings: ${error.message}`);

    return data.map(item => this.mapToBookingModel(item));
  }

  private async validateBookingRequest(data: CreateBookingRequest): Promise<void> {
    // Validate time range
    if (data.startTime >= data.endTime) {
      throw new Error('Start time must be before end time');
    }

    if (data.startTime < new Date()) {
      throw new Error('Cannot book in the past');
    }

    // Validate minimum booking duration (e.g., 30 minutes)
    const durationMinutes = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      throw new Error('Minimum booking duration is 30 minutes');
    }

    // Validate maximum advance booking (e.g., 30 days)
    const maxAdvanceMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (data.startTime.getTime() - new Date().getTime() > maxAdvanceMs) {
      throw new Error('Cannot book more than 30 days in advance');
    }

    // Validate user exists
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', data.userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Validate spot exists
    const { data: spot, error: spotError } = await this.supabase
      .from('parking_spots')
      .select('id, status')
      .eq('id', data.spotId)
      .single();

    if (spotError || !spot) {
      throw new Error('Parking spot not found');
    }

    if (spot.status === 'maintenance') {
      throw new Error('Parking spot is under maintenance');
    }
  }

  private async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get vehicle: ${error.message}`);
    }

    return new Vehicle(
      data.id,
      new UserId(data.user_id),
      data.type as VehicleType,
      data.brand,
      data.model,
      data.year,
      data.color,
      data.plate_number,
      data.is_primary,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  private async initiatePaymentProcessing(booking: Booking): Promise<void> {
    // This would integrate with payment gateways (Stripe, PayPal, etc.)
    // For now, we'll simulate immediate payment success for direct payments
    
    // In a real implementation, this would:
    // 1. Create payment intent with payment gateway
    // 2. Handle payment confirmation webhooks
    // 3. Update booking payment status accordingly
    
    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        booking.markPaymentPaid();
        
        await this.supabase
          .from('bookings')
          .update({
            payment_status: booking.paymentStatus,
            status: booking.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        await this.sendBookingNotification(booking, 'payment_confirmed');
      } catch (error) {
        console.error('Payment processing failed:', error);
      }
    }, 2000); // 2 second delay to simulate processing
  }

  private async processRefund(booking: Booking): Promise<void> {
    const refundAmount = booking.getRefundAmount();
    
    if (refundAmount.value > 0) {
      // Process refund through payment gateway
      // This would integrate with the payment processor's refund API
      
      booking.markPaymentRefunded();
      
      await this.supabase
        .from('bookings')
        .update({
          payment_status: booking.paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      // Record refund transaction
      await this.supabase
        .from('refund_transactions')
        .insert({
          booking_id: booking.id,
          amount: refundAmount.value,
          status: 'processed',
          processed_at: new Date().toISOString()
        });
    }
  }

  private async processExtensionPayment(booking: Booking, additionalAmount: number): Promise<void> {
    // Process additional payment for booking extension
    // This would integrate with payment gateways
    
    // For now, simulate immediate payment success
    await this.supabase
      .from('extension_payments')
      .insert({
        booking_id: booking.id,
        amount: additionalAmount,
        status: 'paid',
        processed_at: new Date().toISOString()
      });
  }

  private async processRevenueSharing(booking: Booking): Promise<void> {
    // Check if this is hosted parking that requires revenue sharing
    const { data: hostedListing } = await this.supabase
      .from('hosted_listings')
      .select('host_id')
      .eq('spot_id', booking.spotId)
      .single();

    if (hostedListing) {
      // Calculate host payout (default 60% to host, 40% to platform)
      const hostShare = booking.totalAmount.value * 0.6;
      const platformFee = booking.totalAmount.value * 0.4;

      // Create payout record
      await this.supabase
        .from('host_payouts')
        .insert({
          host_id: hostedListing.host_id,
          booking_ids: [booking.id],
          gross_amount: booking.totalAmount.value,
          platform_fee: platformFee,
          net_amount: hostShare,
          status: 'pending'
        });
    }
  }

  private async sendBookingNotification(booking: Booking, type: string): Promise<void> {
    // This would integrate with notification service
    // Send push notifications, emails, SMS as appropriate
    
    const notificationData = {
      user_id: booking.userId.value,
      booking_id: booking.id,
      type,
      message: this.getNotificationMessage(type, booking),
      created_at: new Date().toISOString()
    };

    await this.supabase
      .from('notifications')
      .insert(notificationData);
  }

  private getNotificationMessage(type: string, booking: Booking): string {
    switch (type) {
      case 'confirmed':
        return `Your parking booking has been confirmed for ${booking.timeRange.start.toLocaleDateString()}`;
      case 'started':
        return 'Your parking session has started. Enjoy your stay!';
      case 'completed':
        return 'Your parking session has been completed. Thank you for using Park Angel!';
      case 'cancelled':
        return 'Your parking booking has been cancelled.';
      case 'extended':
        return `Your parking session has been extended until ${booking.timeRange.end.toLocaleTimeString()}`;
      case 'payment_confirmed':
        return 'Your payment has been confirmed. Your booking is now active.';
      default:
        return 'Booking status updated.';
    }
  }

  private mapToBookingModel(data: any): Booking {
    return new Booking(
      data.id,
      new UserId(data.user_id),
      data.spot_id,
      data.vehicle_id,
      new TimeRange(new Date(data.start_time), new Date(data.end_time)),
      data.status as BookingStatus,
      data.payment_status as PaymentStatus,
      new Money(data.amount),
      JSON.parse(data.discounts || '[]'),
      new Money(data.vat_amount),
      new Money(data.total_amount),
      new Date(data.created_at),
      new Date(data.updated_at),
      data.confirmed_at ? new Date(data.confirmed_at) : undefined,
      data.started_at ? new Date(data.started_at) : undefined,
      data.completed_at ? new Date(data.completed_at) : undefined,
      data.cancelled_at ? new Date(data.cancelled_at) : undefined,
      data.cancellation_reason
    );
  }
}

// Booking automation and scheduling
export class BookingAutomation {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async scheduleBookingReminders(): Promise<void> {
    // Get bookings starting in the next hour
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const { data: upcomingBookings } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .gte('start_time', oneHourFromNow.toISOString())
      .lte('start_time', twoHoursFromNow.toISOString());

    for (const booking of upcomingBookings || []) {
      await this.sendBookingReminder(booking);
    }
  }

  async processExpiredReservations(): Promise<void> {
    // Find expired temporary reservations (older than 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const { data: expiredReservations } = await this.supabase
      .from('spot_reservations')
      .select('spot_id')
      .lt('expires_at', fifteenMinutesAgo.toISOString());

    for (const reservation of expiredReservations || []) {
      // Release the spot
      await this.supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('id', reservation.spot_id);

      // Remove the expired reservation
      await this.supabase
        .from('spot_reservations')
        .delete()
        .eq('spot_id', reservation.spot_id);
    }
  }

  async autoCompleteExpiredBookings(): Promise<void> {
    // Find active bookings that have passed their end time
    const now = new Date();

    const { data: expiredBookings } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now.toISOString());

    const bookingService = new BookingWorkflowServiceImpl(this.supabase);

    for (const bookingData of expiredBookings || []) {
      try {
        await bookingService.completeBooking(bookingData.id);
      } catch (error) {
        console.error(`Failed to auto-complete booking ${bookingData.id}:`, error);
      }
    }
  }

  private async sendBookingReminder(booking: any): Promise<void> {
    const reminderData = {
      user_id: booking.user_id,
      booking_id: booking.id,
      type: 'reminder',
      message: `Reminder: Your parking session starts in 1 hour at ${new Date(booking.start_time).toLocaleTimeString()}`,
      created_at: new Date().toISOString()
    };

    await this.supabase
      .from('notifications')
      .insert(reminderData);
  }
}