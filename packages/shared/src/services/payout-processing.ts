import { createClient } from '@supabase/supabase-js';
import {
  Payout,
  PayoutStatus,
  PayoutProcessor,
  CreatePayoutParams,
  BankAccount,
} from '../types/payment';
import { RevenueShareService } from './revenue-sharing';

export interface PayoutService {
  createPayout(params: CreatePayoutParams): Promise<Payout>;
  processPayout(payoutId: string): Promise<Payout>;
  cancelPayout(payoutId: string): Promise<Payout>;
  getPayoutStatus(payoutId: string): Promise<PayoutStatus>;
  getPendingPayouts(recipientId?: string): Promise<Payout[]>;
  getPayoutHistory(recipientId: string, limit?: number): Promise<Payout[]>;
  scheduleAutomaticPayouts(): Promise<void>;
  addBankAccount(bankAccount: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankAccount>;
  updateBankAccount(bankAccountId: string, updates: Partial<BankAccount>): Promise<BankAccount>;
  deleteBankAccount(bankAccountId: string): Promise<void>;
  getBankAccounts(ownerId: string): Promise<BankAccount[]>;
}

export class PayoutServiceImpl implements PayoutService {
  private processors: Map<string, PayoutProcessor> = new Map();

  constructor(
    private supabase: ReturnType<typeof createClient>,
    private revenueShareService: RevenueShareService
  ) {
    this.initializeProcessors();
  }

  private initializeProcessors(): void {
    // Initialize different payout processors
    this.processors.set('bank_transfer', new BankTransferProcessor());
    this.processors.set('stripe_transfer', new StripeTransferProcessor());
    this.processors.set('paypal_transfer', new PayPalTransferProcessor());
  }

  async createPayout(params: CreatePayoutParams): Promise<Payout> {
    try {
      // Validate bank account
      const { data: bankAccount, error: bankError } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', params.bankAccountId)
        .eq('owner_id', params.recipientId)
        .single();

      if (bankError || !bankAccount) {
        throw new Error('Bank account not found or not owned by recipient');
      }

      if (!bankAccount.is_verified) {
        throw new Error('Bank account is not verified');
      }

      // Create payout record
      const payout: Payout = {
        id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipientId: params.recipientId,
        recipientType: params.recipientType,
        amount: params.amount,
        currency: params.currency,
        status: PayoutStatus.PENDING,
        bankAccountId: params.bankAccountId,
        transactionIds: params.transactionIds,
        metadata: params.metadata || {},
        createdAt: new Date(),
      };

      // Store payout in database
      const { data, error } = await this.supabase
        .from('payouts')
        .insert({
          id: payout.id,
          recipient_id: payout.recipientId,
          recipient_type: payout.recipientType,
          amount: payout.amount,
          currency: payout.currency,
          status: payout.status,
          bank_account_id: payout.bankAccountId,
          transaction_ids: payout.transactionIds,
          metadata: payout.metadata,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payout: ${error.message}`);
      }

      return payout;
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  async processPayout(payoutId: string): Promise<Payout> {
    try {
      // Get payout details
      const { data: payoutData, error: payoutError } = await this.supabase
        .from('payouts')
        .select(`
          *,
          bank_accounts (*)
        `)
        .eq('id', payoutId)
        .single();

      if (payoutError || !payoutData) {
        throw new Error('Payout not found');
      }

      if (payoutData.status !== PayoutStatus.PENDING) {
        throw new Error('Payout is not in pending status');
      }

      // Update status to processing
      await this.supabase
        .from('payouts')
        .update({ status: PayoutStatus.PROCESSING })
        .eq('id', payoutId);

      // Select appropriate processor
      const processor = this.processors.get('bank_transfer'); // Default to bank transfer
      if (!processor) {
        throw new Error('Payout processor not available');
      }

      try {
        // Process the payout
        const processedPayout = await processor.createPayout({
          recipientId: (payoutData as any).recipient_id as string,
          recipientType: (payoutData as any).recipient_type as 'operator' | 'host',
          amount: (payoutData as any).amount as number,
          currency: (payoutData as any).currency as string,
          bankAccountId: (payoutData as any).bank_account_id as string,
          transactionIds: (payoutData as any).transaction_ids as string[],
          metadata: (payoutData as any).metadata,
        });

        // Update payout status to paid
        const { data: updatedPayout, error: updateError } = await this.supabase
          .from('payouts')
          .update({
            status: PayoutStatus.PAID,
            processed_at: new Date(),
            metadata: {
              ...(payoutData as any).metadata,
              transferReference: processedPayout.metadata.transferReference,
            },
          })
          .eq('id', payoutId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update payout status: ${updateError.message}`);
        }

        return this.mapPayoutFromDB(updatedPayout);
      } catch (processingError) {
        // Update status to failed
        await this.supabase
          .from('payouts')
          .update({
            status: PayoutStatus.FAILED,
            failed_at: new Date(),
            metadata: {
              ...(payoutData as any).metadata,
              errorMessage: processingError instanceof Error ? processingError.message : 'Unknown error',
            },
          })
          .eq('id', payoutId);

        throw processingError;
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
  }

  async cancelPayout(payoutId: string): Promise<Payout> {
    try {
      const { data, error } = await this.supabase
        .from('payouts')
        .update({ status: PayoutStatus.CANCELLED })
        .eq('id', payoutId)
        .eq('status', PayoutStatus.PENDING) // Only allow cancelling pending payouts
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel payout: ${error.message}`);
      }

      if (!data) {
        throw new Error('Payout not found or cannot be cancelled');
      }

      return this.mapPayoutFromDB(data);
    } catch (error) {
      console.error('Error cancelling payout:', error);
      throw error;
    }
  }

  async getPayoutStatus(payoutId: string): Promise<PayoutStatus> {
    try {
      const { data, error } = await this.supabase
        .from('payouts')
        .select('status')
        .eq('id', payoutId)
        .single();

      if (error || !data) {
        throw new Error('Payout not found');
      }

      return data.status as PayoutStatus;
    } catch (error) {
      console.error('Error fetching payout status:', error);
      throw error;
    }
  }

  async getPendingPayouts(recipientId?: string): Promise<Payout[]> {
    try {
      let query = this.supabase
        .from('payouts')
        .select('*')
        .eq('status', PayoutStatus.PENDING);

      if (recipientId) {
        query = query.eq('recipient_id', recipientId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch pending payouts: ${error.message}`);
      }

      return (data || []).map(this.mapPayoutFromDB);
    } catch (error) {
      console.error('Error fetching pending payouts:', error);
      throw error;
    }
  }

  async getPayoutHistory(recipientId: string, limit: number = 50): Promise<Payout[]> {
    try {
      const { data, error } = await this.supabase
        .from('payouts')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch payout history: ${error.message}`);
      }

      return (data || []).map(this.mapPayoutFromDB);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      throw error;
    }
  }

  async scheduleAutomaticPayouts(): Promise<void> {
    try {
      // Get all operators and hosts with pending earnings
      const { data: operators, error: operatorError } = await this.supabase
        .from('users')
        .select('id')
        .eq('user_type', 'operator');

      if (operatorError) {
        throw new Error(`Failed to fetch operators: ${operatorError.message}`);
      }

      const { data: hosts, error: hostError } = await this.supabase
        .from('users')
        .select('id')
        .eq('user_type', 'host');

      if (hostError) {
        throw new Error(`Failed to fetch hosts: ${hostError.message}`);
      }

      // Process operator payouts
      for (const operator of operators || []) {
        await this.processAutomaticPayout((operator as any).id as string, 'operator');
      }

      // Process host payouts
      for (const host of hosts || []) {
        await this.processAutomaticPayout((host as any).id as string, 'host');
      }
    } catch (error) {
      console.error('Error scheduling automatic payouts:', error);
      throw error;
    }
  }

  private async processAutomaticPayout(recipientId: string, recipientType: 'operator' | 'host'): Promise<void> {
    try {
      // Get earnings for the past week
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      let earnings;
      if (recipientType === 'operator') {
        earnings = await this.revenueShareService.getOperatorEarnings(recipientId, startDate, endDate);
      } else {
        earnings = await this.revenueShareService.getHostEarnings(recipientId, startDate, endDate);
      }

      const shareAmount = recipientType === 'operator' ? earnings.operatorShare : earnings.hostShare;

      // Only create payout if there are earnings above minimum threshold
      const minimumPayoutAmount = 100; // PHP 100 minimum
      if (shareAmount < minimumPayoutAmount) {
        return;
      }

      // Get default bank account
      const { data: bankAccount, error: bankError } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('owner_id', recipientId)
        .eq('is_default', true)
        .eq('is_verified', true)
        .single();

      if (bankError || !bankAccount) {
        console.warn(`No verified default bank account found for ${recipientType} ${recipientId}`);
        return;
      }

      // Get related transaction IDs
      const { data: revenueShares, error: revenueError } = await this.supabase
        .from('revenue_shares')
        .select('transaction_id')
        .eq(recipientType === 'operator' ? 'operator_id' : 'host_id', recipientId)
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString());

      if (revenueError) {
        throw new Error(`Failed to fetch revenue shares: ${revenueError.message}`);
      }

      const transactionIds = (revenueShares || []).map(rs => rs.transaction_id);

      // Create automatic payout
      await this.createPayout({
        recipientId,
        recipientType,
        amount: shareAmount,
        currency: 'PHP',
        bankAccountId: (bankAccount as any).id as string,
        transactionIds: transactionIds as string[],
        metadata: {
          automatic: true,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error(`Error processing automatic payout for ${recipientType} ${recipientId}:`, error);
      // Don't throw error to continue processing other payouts
    }
  }

  async addBankAccount(bankAccountData: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankAccount> {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .insert({
          owner_id: bankAccountData.ownerId,
          owner_type: bankAccountData.ownerType,
          bank_name: bankAccountData.bankName,
          account_number: bankAccountData.accountNumber,
          account_name: bankAccountData.accountName,
          routing_number: bankAccountData.routingNumber,
          swift_code: bankAccountData.swiftCode,
          is_verified: bankAccountData.isVerified,
          is_default: bankAccountData.isDefault,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add bank account: ${error.message}`);
      }

      return this.mapBankAccountFromDB(data);
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw error;
    }
  }

  async updateBankAccount(bankAccountId: string, updates: Partial<BankAccount>): Promise<BankAccount> {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .update({
          bank_name: updates.bankName,
          account_number: updates.accountNumber,
          account_name: updates.accountName,
          routing_number: updates.routingNumber,
          swift_code: updates.swiftCode,
          is_verified: updates.isVerified,
          is_default: updates.isDefault,
          updated_at: new Date(),
        })
        .eq('id', bankAccountId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update bank account: ${error.message}`);
      }

      return this.mapBankAccountFromDB(data);
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  }

  async deleteBankAccount(bankAccountId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bank_accounts')
        .delete()
        .eq('id', bankAccountId);

      if (error) {
        throw new Error(`Failed to delete bank account: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  }

  async getBankAccounts(ownerId: string): Promise<BankAccount[]> {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bank accounts: ${error.message}`);
      }

      return (data || []).map(this.mapBankAccountFromDB);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      throw error;
    }
  }

  private mapPayoutFromDB(data: any): Payout {
    return {
      id: data.id,
      recipientId: data.recipient_id,
      recipientType: data.recipient_type,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      bankAccountId: data.bank_account_id,
      transactionIds: data.transaction_ids,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      failedAt: data.failed_at ? new Date(data.failed_at) : undefined,
    };
  }

  private mapBankAccountFromDB(data: any): BankAccount {
    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerType: data.owner_type,
      bankName: data.bank_name,
      accountNumber: data.account_number,
      accountName: data.account_name,
      routingNumber: data.routing_number,
      swiftCode: data.swift_code,
      isVerified: data.is_verified,
      isDefault: data.is_default,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Abstract base class for payout processors
abstract class BasePayoutProcessor implements PayoutProcessor {
  abstract createPayout(params: CreatePayoutParams): Promise<Payout>;
  abstract processPayout(payoutId: string): Promise<Payout>;
  abstract cancelPayout(payoutId: string): Promise<Payout>;
  abstract getPayoutStatus(payoutId: string): Promise<PayoutStatus>;

  protected generatePayoutId(): string {
    return `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Bank Transfer Processor (for direct bank transfers)
class BankTransferProcessor extends BasePayoutProcessor {
  async createPayout(params: CreatePayoutParams): Promise<Payout> {
    // TODO: Implement actual bank transfer integration
    // This would integrate with banking APIs or manual processing systems
    
    const payout: Payout = {
      id: this.generatePayoutId(),
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      amount: params.amount,
      currency: params.currency,
      status: PayoutStatus.PAID, // Simulate successful transfer
      bankAccountId: params.bankAccountId,
      transactionIds: params.transactionIds,
      metadata: {
        ...params.metadata,
        transferReference: `BT_${Date.now()}`,
        bankTransactionId: `bank_${Date.now()}`,
      },
      createdAt: new Date(),
      processedAt: new Date(),
    };

    return payout;
  }

  async processPayout(payoutId: string): Promise<Payout> {
    // Implementation for processing bank transfer
    throw new Error('Method not implemented');
  }

  async cancelPayout(payoutId: string): Promise<Payout> {
    // Implementation for cancelling bank transfer
    throw new Error('Method not implemented');
  }

  async getPayoutStatus(payoutId: string): Promise<PayoutStatus> {
    // Implementation for checking bank transfer status
    throw new Error('Method not implemented');
  }
}

// Stripe Transfer Processor
class StripeTransferProcessor extends BasePayoutProcessor {
  async createPayout(params: CreatePayoutParams): Promise<Payout> {
    // TODO: Implement Stripe Connect transfers
    
    const payout: Payout = {
      id: this.generatePayoutId(),
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      amount: params.amount,
      currency: params.currency,
      status: PayoutStatus.PAID,
      bankAccountId: params.bankAccountId,
      transactionIds: params.transactionIds,
      metadata: {
        ...params.metadata,
        transferReference: `tr_${Date.now()}`,
      },
      createdAt: new Date(),
      processedAt: new Date(),
    };

    return payout;
  }

  async processPayout(payoutId: string): Promise<Payout> {
    throw new Error('Method not implemented');
  }

  async cancelPayout(payoutId: string): Promise<Payout> {
    throw new Error('Method not implemented');
  }

  async getPayoutStatus(payoutId: string): Promise<PayoutStatus> {
    throw new Error('Method not implemented');
  }
}

// PayPal Transfer Processor
class PayPalTransferProcessor extends BasePayoutProcessor {
  async createPayout(params: CreatePayoutParams): Promise<Payout> {
    // TODO: Implement PayPal payouts
    
    const payout: Payout = {
      id: this.generatePayoutId(),
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      amount: params.amount,
      currency: params.currency,
      status: PayoutStatus.PAID,
      bankAccountId: params.bankAccountId,
      transactionIds: params.transactionIds,
      metadata: {
        ...params.metadata,
        transferReference: `batch_${Date.now()}`,
      },
      createdAt: new Date(),
      processedAt: new Date(),
    };

    return payout;
  }

  async processPayout(payoutId: string): Promise<Payout> {
    throw new Error('Method not implemented');
  }

  async cancelPayout(payoutId: string): Promise<Payout> {
    throw new Error('Method not implemented');
  }

  async getPayoutStatus(payoutId: string): Promise<PayoutStatus> {
    throw new Error('Method not implemented');
  }
}