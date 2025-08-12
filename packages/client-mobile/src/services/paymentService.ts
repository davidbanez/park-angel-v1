import { supabase } from '@park-angel/shared/src/lib/supabase';
import type { 
  PaymentMethod,
  PaymentTransaction,
  PaymentIntent,
  PaymentProvider,
  PaymentMethodType,
  CreatePaymentIntentParams
} from '@park-angel/shared/src/types/payment';

export interface CreatePaymentMethodParams {
  type: PaymentMethodType;
  provider: PaymentProvider;
  metadata: Record<string, any>;
  isDefault?: boolean;
}

export interface ProcessPaymentParams {
  bookingId: string;
  paymentMethodId?: string;
  amount: number;
  currency?: string;
}

export class PaymentService {
  /**
   * Get user's payment methods
   */
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('userId', user.id)
        .order('isDefault', { ascending: false })
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Add a new payment method
   */
  static async addPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethod> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If this is set as default, unset other defaults
      if (params.isDefault) {
        await supabase
          .from('payment_methods')
          .update({ isDefault: false })
          .eq('userId', user.id);
      }

      const paymentMethodData = {
        userId: user.id,
        type: params.type,
        provider: params.provider,
        isDefault: params.isDefault || false,
        metadata: params.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payment_methods')
        .insert(paymentMethodData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  /**
   * Remove a payment method
   */
  static async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Unset all defaults first
      await supabase
        .from('payment_methods')
        .update({ isDefault: false })
        .eq('userId', user.id);

      // Set the new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ 
          isDefault: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', paymentMethodId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for booking
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call Supabase Edge Function to create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId: params.bookingId,
          userId: user.id,
          amount: params.amount,
          currency: params.currency || 'PHP',
          paymentMethodId: params.paymentMethodId,
          metadata: params.metadata
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Process payment for booking
   */
  static async processPayment(params: ProcessPaymentParams): Promise<PaymentTransaction> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create payment intent first
      const paymentIntent = await this.createPaymentIntent({
        bookingId: params.bookingId,
        userId: user.id,
        amount: params.amount,
        currency: params.currency || 'PHP',
        paymentMethodId: params.paymentMethodId
      });

      // Process payment through Edge Function
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          paymentIntentId: paymentIntent.id,
          paymentMethodId: params.paymentMethodId
        }
      });

      if (error) throw error;

      // Update booking payment status
      if (data.status === 'succeeded') {
        await supabase
          .from('bookings')
          .update({
            paymentStatus: 'paid',
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', params.bookingId);
      }

      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Process direct Park Angel payment (no external gateway)
   */
  static async processDirectPayment(params: ProcessPaymentParams): Promise<PaymentTransaction> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // For direct payments, we simulate immediate success
      // In production, this would integrate with Park Angel's payment system
      const transactionData = {
        bookingId: params.bookingId,
        userId: user.id,
        amount: params.amount,
        currency: params.currency || 'PHP',
        status: 'succeeded',
        provider: 'park_angel',
        paymentMethodId: params.paymentMethodId,
        metadata: {
          paymentType: 'direct',
          processedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update booking status
      await supabase
        .from('bookings')
        .update({
          paymentStatus: 'paid',
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', params.bookingId);

      return transaction;
    } catch (error) {
      console.error('Error processing direct payment:', error);
      throw error;
    }
  }

  /**
   * Get payment transactions for user
   */
  static async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          booking:bookings!inner(
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
            )
          )
        `)
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentTransaction> {
    try {
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: {
          transactionId,
          amount,
          reason
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Get payment method display info
   */
  static getPaymentMethodDisplayInfo(paymentMethod: PaymentMethod): {
    icon: string;
    title: string;
    subtitle: string;
  } {
    switch (paymentMethod.provider) {
      case 'stripe':
        return {
          icon: '💳',
          title: `${paymentMethod.metadata.brand?.toUpperCase()} ****${paymentMethod.metadata.last4}`,
          subtitle: `Expires ${paymentMethod.metadata.expiryMonth}/${paymentMethod.metadata.expiryYear}`
        };
      case 'paypal':
        return {
          icon: '🅿️',
          title: 'PayPal',
          subtitle: 'PayPal Account'
        };
      case 'gcash':
        return {
          icon: '💙',
          title: 'GCash',
          subtitle: paymentMethod.metadata.phoneNumber || 'GCash Wallet'
        };
      case 'paymaya':
        return {
          icon: '💚',
          title: 'PayMaya',
          subtitle: paymentMethod.metadata.phoneNumber || 'PayMaya Wallet'
        };
      case 'park_angel':
        return {
          icon: '🅿️',
          title: 'Park Angel Direct',
          subtitle: 'Direct payment to Park Angel'
        };
      default:
        return {
          icon: '💳',
          title: 'Payment Method',
          subtitle: 'Unknown payment method'
        };
    }
  }

  /**
   * Validate payment method
   */
  static validatePaymentMethod(paymentMethod: Partial<CreatePaymentMethodParams>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!paymentMethod.type) {
      errors.push('Payment method type is required');
    }

    if (!paymentMethod.provider) {
      errors.push('Payment provider is required');
    }

    if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
      if (!paymentMethod.metadata?.last4) {
        errors.push('Card information is required');
      }
      if (!paymentMethod.metadata?.expiryMonth || !paymentMethod.metadata?.expiryYear) {
        errors.push('Card expiry date is required');
      }
    }

    if (paymentMethod.provider === 'gcash' || paymentMethod.provider === 'paymaya') {
      if (!paymentMethod.metadata?.phoneNumber) {
        errors.push('Phone number is required for digital wallet');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}