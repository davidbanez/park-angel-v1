import { supabase } from '@park-angel/shared/src/lib/supabase';
import { ParkingSession, AppliedDiscount, POSTransaction } from '../types/pos';
import { ReceiptService } from './receiptService';

export interface CreateParkingSessionParams {
  vehiclePlateNumber: string;
  vehicleType: 'car' | 'motorcycle' | 'truck' | 'van';
  spotId?: string;
  duration?: number; // in minutes
  paymentMethod: 'cash' | 'card' | 'digital_wallet';
  discounts?: AppliedDiscount[];
  notes?: string;
}

export interface PaymentProcessingParams {
  amount: number;
  paymentMethod: 'cash' | 'card' | 'digital_wallet';
  cashReceived?: number;
  cardDetails?: {
    last4: string;
    brand: string;
    transactionId: string;
  };
  digitalWalletDetails?: {
    provider: string;
    transactionId: string;
  };
}

export interface SessionReassignmentParams {
  sessionId: string;
  newSpotId: string;
  reason: string;
  additionalFee?: number;
}

export interface ManualTerminationParams {
  sessionId: string;
  endTime: Date;
  reason: string;
  refundAmount?: number;
}

class ParkingSessionService {
  private receiptService = ReceiptService.getInstance();

  /**
   * Create a new parking session for walk-in customers
   */
  async createParkingSession(params: CreateParkingSessionParams): Promise<ParkingSession> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get current active POS session
      const { data: posSession, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('id, location_id, operator_id')
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (sessionError || !posSession) {
        throw new Error('No active POS session found');
      }

      // Get available spot or use default
      let spotId = params.spotId;
      if (!spotId) {
        const { data: availableSpot } = await supabase
          .from('parking_spots')
          .select('id')
          .eq('location_id', posSession.location_id)
          .eq('status', 'available')
          .eq('vehicle_type', params.vehicleType)
          .limit(1)
          .single();
        
        spotId = availableSpot?.id;
      }

      if (!spotId) {
        throw new Error(`No available ${params.vehicleType} spots found`);
      }

      // Calculate pricing
      const pricing = await this.calculatePricing({
        spotId,
        vehicleType: params.vehicleType,
        duration: params.duration || 60, // Default 1 hour
        discounts: params.discounts || []
      });

      // Create parking session record
      const startTime = new Date();
      const endTime = params.duration 
        ? new Date(startTime.getTime() + params.duration * 60000)
        : new Date(startTime.getTime() + 60 * 60000); // Default 1 hour

      const { data: parkingSession, error: createError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.user.id, // POS operator as user
          spot_id: spotId,
          vehicle_plate_number: params.vehiclePlateNumber,
          vehicle_type: params.vehicleType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          amount: pricing.baseAmount,
          discounts: params.discounts || [],
          vat_amount: pricing.vatAmount,
          total_amount: pricing.totalAmount,
          status: 'active',
          payment_status: 'pending',
          booking_type: 'pos_walkin',
          metadata: {
            pos_session_id: posSession.id,
            created_by_pos: true,
            payment_method: params.paymentMethod,
            notes: params.notes
          }
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create parking session: ${createError.message}`);
      }

      // Update spot status
      await supabase
        .from('parking_spots')
        .update({ 
          status: 'occupied',
          current_booking_id: parkingSession.id,
          occupied_since: startTime.toISOString()
        })
        .eq('id', spotId);

      // Create POS transaction record
      const transaction = await this.createPOSTransaction({
        sessionId: posSession.id,
        type: 'parking_fee',
        amount: pricing.totalAmount,
        description: `Parking fee - ${params.vehicleType} - ${params.vehiclePlateNumber}`,
        parkingSessionId: parkingSession.id,
        vehiclePlateNumber: params.vehiclePlateNumber,
        discountType: params.discounts?.[0]?.type,
        vatAmount: pricing.vatAmount,
        paymentMethod: params.paymentMethod
      });

      const result: ParkingSession = {
        id: parkingSession.id,
        operatorId: posSession.operator_id,
        spotId: spotId,
        vehiclePlateNumber: params.vehiclePlateNumber,
        vehicleType: params.vehicleType,
        startTime: new Date(parkingSession.start_time),
        endTime: new Date(parkingSession.end_time),
        amount: pricing.baseAmount,
        discounts: params.discounts || [],
        vatAmount: pricing.vatAmount,
        totalAmount: pricing.totalAmount,
        paymentMethod: params.paymentMethod,
        status: 'active',
        receiptNumber: transaction.receiptNumber,
        notes: params.notes
      };

      return result;

    } catch (error: any) {
      console.error('Error creating parking session:', error);
      throw new Error(error.message || 'Failed to create parking session');
    }
  }

  /**
   * Process payment for parking session
   */
  async processPayment(
    sessionId: string, 
    paymentParams: PaymentProcessingParams
  ): Promise<{ success: boolean; receiptData?: any; changeAmount?: number }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get parking session
      const { data: parkingSession, error: sessionError } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_spots(id, name, location_id),
          locations(name, address)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !parkingSession) {
        throw new Error('Parking session not found');
      }

      let changeAmount = 0;
      let paymentStatus = 'paid';

      // Process payment based on method
      switch (paymentParams.paymentMethod) {
        case 'cash':
          if (!paymentParams.cashReceived) {
            throw new Error('Cash received amount is required');
          }
          if (paymentParams.cashReceived < paymentParams.amount) {
            throw new Error('Insufficient cash received');
          }
          changeAmount = paymentParams.cashReceived - paymentParams.amount;
          break;

        case 'card':
          if (!paymentParams.cardDetails) {
            throw new Error('Card details are required');
          }
          // In a real implementation, you would process the card payment here
          break;

        case 'digital_wallet':
          if (!paymentParams.digitalWalletDetails) {
            throw new Error('Digital wallet details are required');
          }
          // In a real implementation, you would process the digital wallet payment here
          break;
      }

      // Update parking session payment status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: paymentStatus,
          metadata: {
            ...parkingSession.metadata,
            payment_processed_at: new Date().toISOString(),
            payment_details: {
              method: paymentParams.paymentMethod,
              cash_received: paymentParams.cashReceived,
              change_amount: changeAmount,
              card_details: paymentParams.cardDetails,
              digital_wallet_details: paymentParams.digitalWalletDetails
            }
          }
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }

      // Generate receipt data
      const receiptData = await this.generateReceiptData(parkingSession, {
        paymentMethod: paymentParams.paymentMethod,
        changeAmount,
        cashReceived: paymentParams.cashReceived
      });

      // Store receipt for reprinting
      await this.storeReceipt(sessionId, receiptData);

      return {
        success: true,
        receiptData,
        changeAmount
      };

    } catch (error: any) {
      console.error('Error processing payment:', error);
      throw new Error(error.message || 'Failed to process payment');
    }
  }

  /**
   * Reassign parking session to different spot
   */
  async reassignSession(params: SessionReassignmentParams): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get current parking session
      const { data: parkingSession, error: sessionError } = await supabase
        .from('bookings')
        .select('*, parking_spots(id, name)')
        .eq('id', params.sessionId)
        .eq('status', 'active')
        .single();

      if (sessionError || !parkingSession) {
        throw new Error('Active parking session not found');
      }

      // Check if new spot is available
      const { data: newSpot, error: spotError } = await supabase
        .from('parking_spots')
        .select('id, name, status, vehicle_type')
        .eq('id', params.newSpotId)
        .eq('status', 'available')
        .single();

      if (spotError || !newSpot) {
        throw new Error('New parking spot is not available');
      }

      // Verify vehicle type compatibility
      if (newSpot.vehicle_type !== parkingSession.vehicle_type) {
        throw new Error(`New spot is not compatible with ${parkingSession.vehicle_type}`);
      }

      // Update old spot status
      await supabase
        .from('parking_spots')
        .update({ 
          status: 'available',
          current_booking_id: null,
          occupied_since: null
        })
        .eq('id', parkingSession.spot_id);

      // Update new spot status
      await supabase
        .from('parking_spots')
        .update({ 
          status: 'occupied',
          current_booking_id: params.sessionId,
          occupied_since: new Date().toISOString()
        })
        .eq('id', params.newSpotId);

      // Update parking session
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          spot_id: params.newSpotId,
          metadata: {
            ...parkingSession.metadata,
            reassignment_history: [
              ...(parkingSession.metadata?.reassignment_history || []),
              {
                from_spot_id: parkingSession.spot_id,
                to_spot_id: params.newSpotId,
                reason: params.reason,
                additional_fee: params.additionalFee || 0,
                reassigned_at: new Date().toISOString(),
                reassigned_by: user.user.id
              }
            ]
          }
        })
        .eq('id', params.sessionId);

      if (updateError) {
        throw new Error(`Failed to reassign session: ${updateError.message}`);
      }

      // Create additional fee transaction if applicable
      if (params.additionalFee && params.additionalFee > 0) {
        const { data: posSession } = await supabase
          .from('pos_sessions')
          .select('id')
          .eq('operator_id', user.user.id)
          .eq('status', 'active')
          .single();

        if (posSession) {
          await this.createPOSTransaction({
            sessionId: posSession.id,
            type: 'parking_fee',
            amount: params.additionalFee,
            description: `Spot reassignment fee - ${parkingSession.vehicle_plate_number}`,
            parkingSessionId: params.sessionId,
            vehiclePlateNumber: parkingSession.vehicle_plate_number,
            paymentMethod: 'cash' // Default to cash for additional fees
          });
        }
      }

    } catch (error: any) {
      console.error('Error reassigning session:', error);
      throw new Error(error.message || 'Failed to reassign parking session');
    }
  }

  /**
   * Manually terminate parking session
   */
  async terminateSession(params: ManualTerminationParams): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get parking session
      const { data: parkingSession, error: sessionError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', params.sessionId)
        .eq('status', 'active')
        .single();

      if (sessionError || !parkingSession) {
        throw new Error('Active parking session not found');
      }

      // Calculate actual duration and any adjustments
      const actualDuration = Math.ceil(
        (params.endTime.getTime() - new Date(parkingSession.start_time).getTime()) / (1000 * 60)
      );

      // Update parking session
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          end_time: params.endTime.toISOString(),
          status: 'completed',
          duration: actualDuration,
          metadata: {
            ...parkingSession.metadata,
            manual_termination: {
              reason: params.reason,
              terminated_by: user.user.id,
              terminated_at: new Date().toISOString(),
              refund_amount: params.refundAmount || 0
            }
          }
        })
        .eq('id', params.sessionId);

      if (updateError) {
        throw new Error(`Failed to terminate session: ${updateError.message}`);
      }

      // Update spot status
      await supabase
        .from('parking_spots')
        .update({ 
          status: 'available',
          current_booking_id: null,
          occupied_since: null
        })
        .eq('id', parkingSession.spot_id);

      // Create refund transaction if applicable
      if (params.refundAmount && params.refundAmount > 0) {
        const { data: posSession } = await supabase
          .from('pos_sessions')
          .select('id')
          .eq('operator_id', user.user.id)
          .eq('status', 'active')
          .single();

        if (posSession) {
          await this.createPOSTransaction({
            sessionId: posSession.id,
            type: 'refund',
            amount: -params.refundAmount, // Negative amount for refund
            description: `Refund - Early termination - ${parkingSession.vehicle_plate_number}`,
            parkingSessionId: params.sessionId,
            vehiclePlateNumber: parkingSession.vehicle_plate_number,
            paymentMethod: 'cash' // Refunds typically in cash
          });
        }
      }

    } catch (error: any) {
      console.error('Error terminating session:', error);
      throw new Error(error.message || 'Failed to terminate parking session');
    }
  }

  /**
   * Get parking spot occupancy status
   */
  async getSpotOccupancy(locationId?: string): Promise<any[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('parking_spots')
        .select(`
          *,
          current_booking:bookings!parking_spots_current_booking_id_fkey(
            id,
            vehicle_plate_number,
            vehicle_type,
            start_time,
            end_time,
            status
          ),
          location:locations(id, name, address)
        `);

      if (locationId) {
        query = query.eq('location_id', locationId);
      } else {
        // Get user's assigned locations
        const { data: posSession } = await supabase
          .from('pos_sessions')
          .select('location_id')
          .eq('operator_id', user.user.id)
          .eq('status', 'active')
          .single();

        if (posSession) {
          query = query.eq('location_id', posSession.location_id);
        }
      }

      const { data: spots, error } = await query.order('name');

      if (error) {
        throw new Error(`Failed to get spot occupancy: ${error.message}`);
      }

      return spots || [];

    } catch (error: any) {
      console.error('Error getting spot occupancy:', error);
      throw new Error(error.message || 'Failed to get spot occupancy');
    }
  }

  /**
   * Get active parking sessions
   */
  async getActiveSessions(): Promise<ParkingSession[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get current POS session location
      const { data: posSession } = await supabase
        .from('pos_sessions')
        .select('location_id')
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (!posSession) {
        return [];
      }

      const { data: sessions, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_spots!inner(id, name, location_id)
        `)
        .eq('status', 'active')
        .eq('parking_spots.location_id', posSession.location_id)
        .order('start_time', { ascending: false });

      if (error) {
        throw new Error(`Failed to get active sessions: ${error.message}`);
      }

      return sessions?.map(session => ({
        id: session.id,
        operatorId: session.user_id,
        spotId: session.spot_id,
        vehiclePlateNumber: session.vehicle_plate_number,
        vehicleType: session.vehicle_type,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        duration: session.duration,
        amount: session.amount,
        discounts: session.discounts || [],
        vatAmount: session.vat_amount,
        totalAmount: session.total_amount,
        paymentMethod: session.metadata?.payment_method || 'cash',
        status: session.status,
        receiptNumber: session.metadata?.receipt_number || '',
        notes: session.metadata?.notes
      })) || [];

    } catch (error: any) {
      console.error('Error getting active sessions:', error);
      throw new Error(error.message || 'Failed to get active sessions');
    }
  }

  /**
   * Calculate pricing for parking session
   */
  private async calculatePricing(params: {
    spotId: string;
    vehicleType: string;
    duration: number;
    discounts: AppliedDiscount[];
  }): Promise<{ baseAmount: number; vatAmount: number; totalAmount: number }> {
    try {
      // Get spot pricing information
      const { data: spot, error } = await supabase
        .from('parking_spots')
        .select(`
          *,
          zone:zones(
            *,
            section:sections(
              *,
              location:locations(*)
            )
          )
        `)
        .eq('id', params.spotId)
        .single();

      if (error || !spot) {
        throw new Error('Parking spot not found');
      }

      // Calculate base rate (simplified pricing logic)
      let baseRate = 50; // Default rate per hour
      
      // Vehicle type multipliers
      const vehicleMultipliers = {
        motorcycle: 0.5,
        car: 1.0,
        van: 1.2,
        truck: 1.5
      };

      const multiplier = vehicleMultipliers[params.vehicleType as keyof typeof vehicleMultipliers] || 1.0;
      const hourlyRate = baseRate * multiplier;
      const baseAmount = (hourlyRate * params.duration) / 60; // Convert minutes to hours

      // Apply discounts
      let discountAmount = 0;
      let isVATExempt = false;

      for (const discount of params.discounts) {
        discountAmount += (baseAmount * discount.percentage) / 100;
        if (discount.isVATExempt) {
          isVATExempt = true;
        }
      }

      const discountedAmount = baseAmount - discountAmount;
      
      // Calculate VAT (12% in Philippines)
      const vatAmount = isVATExempt ? 0 : discountedAmount * 0.12;
      const totalAmount = discountedAmount + vatAmount;

      return {
        baseAmount: Math.round(baseAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100
      };

    } catch (error: any) {
      console.error('Error calculating pricing:', error);
      // Return default pricing if calculation fails
      return {
        baseAmount: 50,
        vatAmount: 6,
        totalAmount: 56
      };
    }
  }

  /**
   * Create POS transaction record
   */
  private async createPOSTransaction(params: {
    sessionId: string;
    type: 'parking_fee' | 'discount' | 'cash_adjustment' | 'refund' | 'violation_fee';
    amount: number;
    description: string;
    parkingSessionId?: string;
    vehiclePlateNumber?: string;
    discountType?: string;
    vatAmount?: number;
    paymentMethod: 'cash' | 'card' | 'digital_wallet';
  }): Promise<POSTransaction> {
    try {
      // Generate receipt number
      const { data: receiptData, error: receiptError } = await supabase
        .rpc('generate_receipt_number');

      if (receiptError) {
        throw new Error('Failed to generate receipt number');
      }

      const receiptNumber = receiptData || `POS-${Date.now()}`;

      const { data: transaction, error } = await supabase
        .from('pos_transactions')
        .insert({
          session_id: params.sessionId,
          type: params.type,
          amount: params.amount,
          description: params.description,
          parking_session_id: params.parkingSessionId,
          vehicle_plate_number: params.vehiclePlateNumber,
          discount_type: params.discountType,
          vat_amount: params.vatAmount || 0,
          receipt_number: receiptNumber,
          payment_method: params.paymentMethod
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`);
      }

      return {
        id: transaction.id,
        sessionId: transaction.session_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        parkingSessionId: transaction.parking_session_id,
        vehiclePlateNumber: transaction.vehicle_plate_number,
        discountType: transaction.discount_type,
        vatAmount: transaction.vat_amount,
        timestamp: new Date(transaction.created_at),
        receiptNumber: transaction.receipt_number
      };

    } catch (error: any) {
      console.error('Error creating POS transaction:', error);
      throw new Error(error.message || 'Failed to create transaction');
    }
  }

  /**
   * Generate receipt data for printing
   */
  private async generateReceiptData(parkingSession: any, paymentDetails: any): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    const operatorName = user.user?.user_metadata?.full_name || 'POS Operator';

    return {
      receiptNumber: paymentDetails.receiptNumber || `R${Date.now()}`,
      timestamp: new Date(),
      operatorName,
      locationName: parkingSession.locations?.name || 'Park Angel Location',
      items: [
        {
          description: `Parking - ${parkingSession.vehicle_type}`,
          quantity: 1,
          unitPrice: parkingSession.amount,
          totalPrice: parkingSession.amount
        }
      ],
      subtotal: parkingSession.amount,
      discounts: parkingSession.discounts || [],
      vatAmount: parkingSession.vat_amount,
      totalAmount: parkingSession.total_amount,
      paymentMethod: paymentDetails.paymentMethod,
      changeAmount: paymentDetails.changeAmount,
      customerInfo: {
        plateNumber: parkingSession.vehicle_plate_number,
        vehicleType: parkingSession.vehicle_type
      }
    };
  }

  /**
   * Store receipt for reprinting
   */
  private async storeReceipt(sessionId: string, receiptData: any): Promise<void> {
    try {
      await supabase
        .from('pos_receipts')
        .insert({
          transaction_id: sessionId,
          receipt_number: receiptData.receiptNumber,
          receipt_data: receiptData,
          print_status: 'pending'
        });
    } catch (error: any) {
      console.error('Error storing receipt:', error);
      // Don't throw error as this is not critical
    }
  }
}

export const parkingSessionService = new ParkingSessionService();