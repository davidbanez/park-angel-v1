import { createClient } from '@supabase/supabase-js';
import {
  PaymentProcessor,
  PaymentIntent,
  PaymentTransaction,
  CreatePaymentIntentParams,
  PaymentProvider,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  PaymentMethod,
  PaymentMethodType,
} from '../types/payment';

export interface PaymentProcessingService {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction>;
  refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction>;
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  addPaymentMethod(userId: string, paymentMethodData: any): Promise<PaymentMethod>;
  removePaymentMethod(paymentMethodId: string): Promise<void>;
  getPaymentHistory(userId: string, limit?: number): Promise<PaymentTransaction[]>;
}

export class PaymentProcessingServiceImpl implements PaymentProcessingService {
  private processors: Map<PaymentProvider, PaymentProcessor> = new Map();

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.initializeProcessors();
  }

  private initializeProcessors(): void {
    // Initialize Stripe processor
    this.processors.set(PaymentProvider.STRIPE, new StripePaymentProcessor());
    
    // Initialize PayPal processor
    this.processors.set(PaymentProvider.PAYPAL, new PayPalPaymentProcessor());
    
    // Initialize GCash processor
    this.processors.set(PaymentProvider.GCASH, new GCashPaymentProcessor());
    
    // Initialize PayMaya processor
    this.processors.set(PaymentProvider.PAYMAYA, new PayMayaPaymentProcessor());
    
    // Initialize Park Angel direct processor
    this.processors.set(PaymentProvider.PARK_ANGEL, new ParkAngelPaymentProcessor());
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    try {
      // Determine the best payment provider based on user preferences or defaults
      const provider = await this.selectPaymentProvider(params.userId);
      const processor = this.processors.get(provider);
      
      if (!processor) {
        throw new Error(`Payment processor not available for provider: ${provider}`);
      }

      // Create payment intent with the selected processor
      const paymentIntent = await processor.createPaymentIntent(params);

      // Store payment intent in database
      const { data, error } = await this.supabase
        .from('payment_intents')
        .insert({
          id: paymentIntent.id,
          booking_id: paymentIntent.bookingId,
          user_id: paymentIntent.userId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          provider: paymentIntent.provider,
          client_secret: paymentIntent.clientSecret,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
          expires_at: paymentIntent.expiresAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store payment intent: ${error.message}`);
      }

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    try {
      // Get payment intent from database
      const { data: intentData, error: intentError } = await this.supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentIntentId)
        .single();

      if (intentError || !intentData) {
        throw new Error('Payment intent not found');
      }

      const processor = this.processors.get(intentData.provider as PaymentProvider);
      if (!processor) {
        throw new Error(`Payment processor not available for provider: ${intentData.provider}`);
      }

      // Confirm payment with the processor
      const transaction = await processor.confirmPayment(paymentIntentId, paymentMethodId);

      // Store transaction in database
      const { data, error } = await this.supabase
        .from('payment_transactions')
        .insert({
          id: transaction.id,
          booking_id: transaction.bookingId,
          user_id: transaction.userId,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          provider: transaction.provider,
          provider_transaction_id: transaction.providerTransactionId,
          payment_method_id: transaction.paymentMethodId,
          metadata: transaction.metadata,
          processed_at: transaction.processedAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store payment transaction: ${error.message}`);
      }

      // Update payment intent status
      await this.supabase
        .from('payment_intents')
        .update({ 
          status: transaction.status === PaymentTransactionStatus.SUCCEEDED 
            ? PaymentIntentStatus.SUCCEEDED 
            : PaymentIntentStatus.CANCELLED 
        })
        .eq('id', paymentIntentId);

      return transaction;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    try {
      // Get original transaction
      const { data: transactionData, error: transactionError } = await this.supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError || !transactionData) {
        throw new Error('Payment transaction not found');
      }

      const processor = this.processors.get(transactionData.provider as PaymentProvider);
      if (!processor) {
        throw new Error(`Payment processor not available for provider: ${transactionData.provider}`);
      }

      // Process refund
      const refundTransaction = await processor.refundPayment(transactionId, amount, reason);

      // Store refund transaction
      const { data, error } = await this.supabase
        .from('payment_transactions')
        .insert({
          id: refundTransaction.id,
          booking_id: refundTransaction.bookingId,
          user_id: refundTransaction.userId,
          amount: -Math.abs(refundTransaction.amount), // Negative amount for refunds
          currency: refundTransaction.currency,
          status: refundTransaction.status,
          provider: refundTransaction.provider,
          provider_transaction_id: refundTransaction.providerTransactionId,
          payment_method_id: refundTransaction.paymentMethodId,
          metadata: {
            ...refundTransaction.metadata,
            originalTransactionId: transactionId,
            refundReason: reason,
          },
          processed_at: refundTransaction.processedAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store refund transaction: ${error.message}`);
      }

      return refundTransaction;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch payment methods: ${error.message}`);
      }

      return data.map(this.mapPaymentMethodFromDB);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  async addPaymentMethod(userId: string, paymentMethodData: any): Promise<PaymentMethod> {
    try {
      // Determine provider based on payment method data
      const provider = this.determineProvider(paymentMethodData);
      const processor = this.processors.get(provider);
      
      if (!processor) {
        throw new Error(`Payment processor not available for provider: ${provider}`);
      }

      // Create customer if not exists
      const customerId = await processor.createCustomer(userId, paymentMethodData.email);
      
      // Attach payment method to customer
      await processor.attachPaymentMethod(customerId, paymentMethodData.id);

      // Store payment method in database
      const { data, error } = await this.supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: this.determinePaymentMethodType(paymentMethodData),
          provider: provider,
          is_default: paymentMethodData.isDefault || false,
          metadata: {
            ...paymentMethodData,
            customerId,
          },
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store payment method: ${error.message}`);
      }

      return this.mapPaymentMethodFromDB(data);
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      // Get payment method details
      const { data: paymentMethod, error: fetchError } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .single();

      if (fetchError || !paymentMethod) {
        throw new Error('Payment method not found');
      }

      const processor = this.processors.get(paymentMethod.provider as PaymentProvider);
      if (processor) {
        // Detach from payment processor
        await processor.detachPaymentMethod(paymentMethod.metadata.paymentMethodId);
      }

      // Remove from database
      const { error } = await this.supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) {
        throw new Error(`Failed to remove payment method: ${error.message}`);
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  async getPaymentHistory(userId: string, limit: number = 50): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch payment history: ${error.message}`);
      }

      return data.map(this.mapPaymentTransactionFromDB);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  private async selectPaymentProvider(userId: string): Promise<PaymentProvider> {
    // Default to Park Angel direct payment
    // This can be enhanced to check user preferences, location, etc.
    return PaymentProvider.PARK_ANGEL;
  }

  private determineProvider(paymentMethodData: any): PaymentProvider {
    if (paymentMethodData.provider) {
      return paymentMethodData.provider;
    }
    
    // Determine based on payment method type or other criteria
    if (paymentMethodData.type === 'card') {
      return PaymentProvider.STRIPE;
    }
    
    if (paymentMethodData.type === 'paypal') {
      return PaymentProvider.PAYPAL;
    }
    
    if (paymentMethodData.type === 'gcash') {
      return PaymentProvider.GCASH;
    }
    
    if (paymentMethodData.type === 'paymaya') {
      return PaymentProvider.PAYMAYA;
    }
    
    return PaymentProvider.PARK_ANGEL;
  }

  private determinePaymentMethodType(paymentMethodData: any): PaymentMethodType {
    if (paymentMethodData.type === 'card') {
      return PaymentMethodType.CREDIT_CARD;
    }
    
    if (paymentMethodData.type === 'gcash' || paymentMethodData.type === 'paymaya') {
      return PaymentMethodType.DIGITAL_WALLET;
    }
    
    return PaymentMethodType.CREDIT_CARD; // Default
  }

  private mapPaymentMethodFromDB(data: any): PaymentMethod {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      provider: data.provider,
      isDefault: data.is_default,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapPaymentTransactionFromDB(data: any): PaymentTransaction {
    return {
      id: data.id,
      bookingId: data.booking_id,
      userId: data.user_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      provider: data.provider,
      providerTransactionId: data.provider_transaction_id,
      paymentMethodId: data.payment_method_id,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      failedAt: data.failed_at ? new Date(data.failed_at) : undefined,
      refundedAt: data.refunded_at ? new Date(data.refunded_at) : undefined,
    };
  }
}

// Abstract base class for payment processors
abstract class BasePaymentProcessor implements PaymentProcessor {
  abstract createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;
  abstract confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction>;
  abstract refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction>;
  abstract createCustomer(userId: string, email: string): Promise<string>;
  abstract attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  abstract detachPaymentMethod(paymentMethodId: string): Promise<void>;

  protected generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generatePaymentIntentId(): string {
    return `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Stripe Payment Processor
class StripePaymentProcessor extends BasePaymentProcessor {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    // TODO: Implement Stripe payment intent creation
    // This would use the Stripe SDK to create a payment intent
    
    const paymentIntent: PaymentIntent = {
      id: this.generatePaymentIntentId(),
      bookingId: params.bookingId,
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      provider: PaymentProvider.STRIPE,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      status: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
      metadata: params.metadata || {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    // TODO: Implement Stripe payment confirmation
    // This would use the Stripe SDK to confirm the payment
    
    const transaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id', // This should come from the payment intent
      userId: 'user_id', // This should come from the payment intent
      amount: 0, // This should come from the payment intent
      currency: 'PHP',
      status: PaymentTransactionStatus.SUCCEEDED,
      provider: PaymentProvider.STRIPE,
      providerTransactionId: `stripe_${Date.now()}`,
      paymentMethodId,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return transaction;
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    // TODO: Implement Stripe refund
    
    const refundTransaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: -(amount || 0),
      currency: 'PHP',
      status: PaymentTransactionStatus.REFUNDED,
      provider: PaymentProvider.STRIPE,
      providerTransactionId: `stripe_refund_${Date.now()}`,
      metadata: { refundReason: reason },
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return refundTransaction;
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    // TODO: Implement Stripe customer creation
    return `cus_${Date.now()}`;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // TODO: Implement Stripe payment method attachment
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // TODO: Implement Stripe payment method detachment
  }
}

// PayPal Payment Processor
class PayPalPaymentProcessor extends BasePaymentProcessor {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    // TODO: Implement PayPal payment intent creation
    
    const paymentIntent: PaymentIntent = {
      id: this.generatePaymentIntentId(),
      bookingId: params.bookingId,
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      provider: PaymentProvider.PAYPAL,
      status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
      metadata: params.metadata || {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    // TODO: Implement PayPal payment confirmation
    
    const transaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: 0,
      currency: 'PHP',
      status: PaymentTransactionStatus.SUCCEEDED,
      provider: PaymentProvider.PAYPAL,
      providerTransactionId: `paypal_${Date.now()}`,
      paymentMethodId,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return transaction;
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    // TODO: Implement PayPal refund
    
    const refundTransaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: -(amount || 0),
      currency: 'PHP',
      status: PaymentTransactionStatus.REFUNDED,
      provider: PaymentProvider.PAYPAL,
      providerTransactionId: `paypal_refund_${Date.now()}`,
      metadata: { refundReason: reason },
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return refundTransaction;
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    // TODO: Implement PayPal customer creation
    return `paypal_cus_${Date.now()}`;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // TODO: Implement PayPal payment method attachment
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // TODO: Implement PayPal payment method detachment
  }
}

// GCash Payment Processor
class GCashPaymentProcessor extends BasePaymentProcessor {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    // TODO: Implement GCash payment intent creation
    
    const paymentIntent: PaymentIntent = {
      id: this.generatePaymentIntentId(),
      bookingId: params.bookingId,
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      provider: PaymentProvider.GCASH,
      status: PaymentIntentStatus.REQUIRES_ACTION,
      metadata: params.metadata || {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes for mobile payments
    };

    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    // TODO: Implement GCash payment confirmation
    
    const transaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: 0,
      currency: 'PHP',
      status: PaymentTransactionStatus.SUCCEEDED,
      provider: PaymentProvider.GCASH,
      providerTransactionId: `gcash_${Date.now()}`,
      paymentMethodId,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return transaction;
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    // TODO: Implement GCash refund
    
    const refundTransaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: -(amount || 0),
      currency: 'PHP',
      status: PaymentTransactionStatus.REFUNDED,
      provider: PaymentProvider.GCASH,
      providerTransactionId: `gcash_refund_${Date.now()}`,
      metadata: { refundReason: reason },
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return refundTransaction;
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    // TODO: Implement GCash customer creation
    return `gcash_cus_${Date.now()}`;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // TODO: Implement GCash payment method attachment
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // TODO: Implement GCash payment method detachment
  }
}

// PayMaya Payment Processor
class PayMayaPaymentProcessor extends BasePaymentProcessor {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    // TODO: Implement PayMaya payment intent creation
    
    const paymentIntent: PaymentIntent = {
      id: this.generatePaymentIntentId(),
      bookingId: params.bookingId,
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      provider: PaymentProvider.PAYMAYA,
      status: PaymentIntentStatus.REQUIRES_ACTION,
      metadata: params.metadata || {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes for mobile payments
    };

    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    // TODO: Implement PayMaya payment confirmation
    
    const transaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: 0,
      currency: 'PHP',
      status: PaymentTransactionStatus.SUCCEEDED,
      provider: PaymentProvider.PAYMAYA,
      providerTransactionId: `paymaya_${Date.now()}`,
      paymentMethodId,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return transaction;
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    // TODO: Implement PayMaya refund
    
    const refundTransaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: -(amount || 0),
      currency: 'PHP',
      status: PaymentTransactionStatus.REFUNDED,
      provider: PaymentProvider.PAYMAYA,
      providerTransactionId: `paymaya_refund_${Date.now()}`,
      metadata: { refundReason: reason },
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return refundTransaction;
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    // TODO: Implement PayMaya customer creation
    return `paymaya_cus_${Date.now()}`;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // TODO: Implement PayMaya payment method attachment
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // TODO: Implement PayMaya payment method detachment
  }
}

// Park Angel Direct Payment Processor
class ParkAngelPaymentProcessor extends BasePaymentProcessor {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    // Direct payment to Park Angel account - simplified flow
    
    const paymentIntent: PaymentIntent = {
      id: this.generatePaymentIntentId(),
      bookingId: params.bookingId,
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      provider: PaymentProvider.PARK_ANGEL,
      status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
      metadata: params.metadata || {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction> {
    // Direct payment confirmation - this would integrate with Park Angel's banking system
    
    const transaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: 0,
      currency: 'PHP',
      status: PaymentTransactionStatus.SUCCEEDED,
      provider: PaymentProvider.PARK_ANGEL,
      providerTransactionId: `pa_${Date.now()}`,
      paymentMethodId,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return transaction;
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    // Direct refund processing
    
    const refundTransaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      bookingId: 'booking_id',
      userId: 'user_id',
      amount: -(amount || 0),
      currency: 'PHP',
      status: PaymentTransactionStatus.REFUNDED,
      provider: PaymentProvider.PARK_ANGEL,
      providerTransactionId: `pa_refund_${Date.now()}`,
      metadata: { refundReason: reason },
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    return refundTransaction;
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    // Park Angel customer ID is just the user ID
    return `pa_cus_${userId}`;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // No external attachment needed for direct payments
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // No external detachment needed for direct payments
  }
}