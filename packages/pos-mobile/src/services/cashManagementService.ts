import { supabase } from '@park-angel/shared/src/lib/supabase';
import { POSTransaction, CashDrawerOperation } from '../types/pos';

export interface CashCountParams {
  sessionId: string;
  denominations: {
    [key: string]: number; // denomination -> count
  };
  totalAmount: number;
  notes?: string;
}

export interface CashAdjustmentParams {
  sessionId: string;
  amount: number;
  reason: string;
  type: 'add' | 'remove';
}

export interface CashDepositParams {
  sessionId: string;
  amount: number;
  reason: string;
  depositMethod: 'bank_deposit' | 'safe_deposit' | 'manager_pickup';
  referenceNumber?: string;
}

export interface CashSummary {
  startingCash: number;
  cashSales: number;
  cashAdjustments: number;
  cashDeposits: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  lastCountTime?: Date;
}

class CashManagementService {
  /**
   * Perform cash count and record denominations
   */
  async performCashCount(params: CashCountParams): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Verify session belongs to current user
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('id, operator_id')
        .eq('id', params.sessionId)
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (sessionError || !session) {
        throw new Error('Active session not found');
      }

      // Log cash count operation
      await this.logCashDrawerOperation({
        sessionId: params.sessionId,
        type: 'count',
        amount: params.totalAmount,
        reason: params.notes || 'Cash count performed',
        operatorId: user.user.id,
        metadata: {
          denominations: params.denominations,
          countTime: new Date().toISOString()
        }
      });

      // Create cash adjustment transaction if there's a difference
      const cashSummary = await this.getCashSummary(params.sessionId);
      const difference = params.totalAmount - cashSummary.expectedCash;

      if (Math.abs(difference) > 0.01) { // More than 1 centavo difference
        await this.createTransaction({
          sessionId: params.sessionId,
          type: 'cash_adjustment',
          amount: difference,
          description: `Cash count adjustment: ${difference > 0 ? 'overage' : 'shortage'} of ₱${Math.abs(difference).toFixed(2)}`,
          paymentMethod: 'cash',
          metadata: {
            countDenominations: params.denominations,
            expectedAmount: cashSummary.expectedCash,
            actualAmount: params.totalAmount
          }
        });
      }

    } catch (error: any) {
      console.error('Error performing cash count:', error);
      throw new Error(error.message || 'Failed to perform cash count');
    }
  }

  /**
   * Make cash adjustment (add or remove cash)
   */
  async makeCashAdjustment(params: CashAdjustmentParams): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Verify session belongs to current user
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('id, operator_id')
        .eq('id', params.sessionId)
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (sessionError || !session) {
        throw new Error('Active session not found');
      }

      const adjustmentAmount = params.type === 'add' ? params.amount : -params.amount;

      // Create adjustment transaction
      await this.createTransaction({
        sessionId: params.sessionId,
        type: 'cash_adjustment',
        amount: adjustmentAmount,
        description: `Cash ${params.type === 'add' ? 'addition' : 'removal'}: ${params.reason}`,
        paymentMethod: 'cash',
        metadata: {
          adjustmentType: params.type,
          originalAmount: params.amount,
          reason: params.reason
        }
      });

      // Log cash drawer operation
      await this.logCashDrawerOperation({
        sessionId: params.sessionId,
        type: 'adjustment',
        amount: adjustmentAmount,
        reason: params.reason,
        operatorId: user.user.id
      });

    } catch (error: any) {
      console.error('Error making cash adjustment:', error);
      throw new Error(error.message || 'Failed to make cash adjustment');
    }
  }

  /**
   * Record cash deposit/removal
   */
  async recordCashDeposit(params: CashDepositParams): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Verify session belongs to current user
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('id, operator_id')
        .eq('id', params.sessionId)
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (sessionError || !session) {
        throw new Error('Active session not found');
      }

      // Create deposit transaction (negative amount to remove from drawer)
      await this.createTransaction({
        sessionId: params.sessionId,
        type: 'cash_adjustment',
        amount: -params.amount,
        description: `Cash deposit: ${params.reason}`,
        paymentMethod: 'cash',
        metadata: {
          depositMethod: params.depositMethod,
          referenceNumber: params.referenceNumber,
          reason: params.reason
        }
      });

      // Log cash drawer operation
      await this.logCashDrawerOperation({
        sessionId: params.sessionId,
        type: 'deposit',
        amount: params.amount,
        reason: `${params.depositMethod}: ${params.reason}`,
        operatorId: user.user.id,
        metadata: {
          depositMethod: params.depositMethod,
          referenceNumber: params.referenceNumber
        }
      });

    } catch (error: any) {
      console.error('Error recording cash deposit:', error);
      throw new Error(error.message || 'Failed to record cash deposit');
    }
  }

  /**
   * Get cash summary for current session
   */
  async getCashSummary(sessionId: string): Promise<CashSummary> {
    try {
      // Get session starting cash
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('current_cash_amount, previous_cash_amount')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Get all cash transactions for this session
      const { data: transactions, error: transError } = await supabase
        .from('pos_transactions')
        .select('amount, type, payment_method')
        .eq('session_id', sessionId)
        .eq('payment_method', 'cash');

      if (transError) {
        throw new Error('Failed to retrieve transactions');
      }

      let cashSales = 0;
      let cashAdjustments = 0;
      let cashDeposits = 0;

      transactions?.forEach(transaction => {
        switch (transaction.type) {
          case 'parking_fee':
          case 'violation_fee':
            cashSales += transaction.amount;
            break;
          case 'refund':
            cashSales -= transaction.amount;
            break;
          case 'cash_adjustment':
            if (transaction.amount > 0) {
              cashAdjustments += transaction.amount;
            } else {
              cashDeposits += Math.abs(transaction.amount);
            }
            break;
        }
      });

      // Get last cash count
      const { data: lastCount } = await supabase
        .from('cash_drawer_operations')
        .select('amount, created_at, metadata')
        .eq('session_id', sessionId)
        .eq('type', 'count')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const expectedCash = session.current_cash_amount + cashSales + cashAdjustments - cashDeposits;

      return {
        startingCash: session.current_cash_amount,
        cashSales,
        cashAdjustments,
        cashDeposits,
        expectedCash,
        actualCash: lastCount?.amount,
        difference: lastCount ? lastCount.amount - expectedCash : undefined,
        lastCountTime: lastCount ? new Date(lastCount.created_at) : undefined
      };

    } catch (error: any) {
      console.error('Error getting cash summary:', error);
      throw new Error(error.message || 'Failed to get cash summary');
    }
  }

  /**
   * Get cash drawer operations history
   */
  async getCashDrawerHistory(sessionId: string): Promise<CashDrawerOperation[]> {
    try {
      const { data: operations, error } = await supabase
        .from('cash_drawer_operations')
        .select(`
          *,
          operator:users!cash_drawer_operations_operator_id_fkey(
            id,
            user_profiles(first_name, last_name)
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve cash drawer history: ${error.message}`);
      }

      return operations?.map(op => ({
        id: op.id,
        sessionId: op.session_id,
        type: op.type,
        amount: op.amount,
        reason: op.reason,
        timestamp: new Date(op.created_at),
        operatorId: op.operator_id
      })) || [];

    } catch (error: any) {
      console.error('Error getting cash drawer history:', error);
      throw new Error(error.message || 'Failed to get cash drawer history');
    }
  }

  /**
   * Generate end-of-shift cash report
   */
  async generateCashReport(sessionId: string): Promise<any> {
    try {
      const cashSummary = await this.getCashSummary(sessionId);
      const drawerHistory = await this.getCashDrawerHistory(sessionId);

      // Get transaction breakdown
      const { data: transactions, error: transError } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('payment_method', 'cash');

      if (transError) {
        throw new Error('Failed to retrieve transactions for report');
      }

      const transactionBreakdown = {
        parkingFees: transactions?.filter(t => t.type === 'parking_fee').length || 0,
        violationFees: transactions?.filter(t => t.type === 'violation_fee').length || 0,
        refunds: transactions?.filter(t => t.type === 'refund').length || 0,
        adjustments: transactions?.filter(t => t.type === 'cash_adjustment').length || 0
      };

      return {
        sessionId,
        cashSummary,
        transactionBreakdown,
        drawerOperations: drawerHistory,
        generatedAt: new Date(),
        totalTransactions: transactions?.length || 0,
        reconciliationStatus: Math.abs(cashSummary.difference || 0) <= 1.00 ? 'balanced' : 'variance'
      };

    } catch (error: any) {
      console.error('Error generating cash report:', error);
      throw new Error(error.message || 'Failed to generate cash report');
    }
  }

  /**
   * Create a POS transaction record
   */
  private async createTransaction(params: {
    sessionId: string;
    type: 'parking_fee' | 'discount' | 'cash_adjustment' | 'refund' | 'violation_fee';
    amount: number;
    description: string;
    paymentMethod: 'cash' | 'card' | 'digital_wallet';
    parkingSessionId?: string;
    vehiclePlateNumber?: string;
    discountType?: string;
    vatAmount?: number;
    changeAmount?: number;
    metadata?: any;
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
          payment_method: params.paymentMethod,
          change_amount: params.changeAmount || 0,
          metadata: params.metadata || {}
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
      console.error('Error creating transaction:', error);
      throw new Error(error.message || 'Failed to create transaction');
    }
  }

  /**
   * Log cash drawer operation
   */
  private async logCashDrawerOperation(params: {
    sessionId: string;
    type: 'open' | 'close' | 'count' | 'adjustment' | 'deposit' | 'withdrawal';
    amount?: number;
    reason?: string;
    operatorId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('cash_drawer_operations')
        .insert({
          session_id: params.sessionId,
          type: params.type,
          amount: params.amount,
          reason: params.reason,
          operator_id: params.operatorId,
          hardware_status: params.metadata || {}
        });

      if (error) {
        console.error('Error logging cash drawer operation:', error);
      }
    } catch (error: any) {
      console.error('Error logging cash drawer operation:', error);
    }
  }
}

export const cashManagementService = new CashManagementService();