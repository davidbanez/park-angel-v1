import { supabase } from '@park-angel/shared/src/lib/supabase';
import { POSSession, CashDrawerOperation } from '../types/pos';

export interface StartShiftParams {
  previousCashAmount: number;
  currentCashAmount: number;
  locationId: string;
  startTime: Date;
}

export interface EndShiftParams {
  sessionId: string;
  endCashAmount: number;
  notes?: string;
}

export interface CashValidationResult {
  isValid: boolean;
  difference: number;
  expectedAmount: number;
  actualAmount: number;
}

class POSAuthService {
  /**
   * Start a new POS shift with cash validation
   */
  async startShift(params: StartShiftParams): Promise<POSSession> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Verify user is a POS operator
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type, operator_id')
        .eq('id', user.user.id)
        .single();

      if (userError || userData?.user_type !== 'pos') {
        throw new Error('User is not authorized for POS operations');
      }

      // Check if there's already an active session for this operator
      const { data: activeSession } = await supabase
        .from('pos_sessions')
        .select('id')
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (activeSession) {
        throw new Error('You already have an active POS session. Please end your current shift first.');
      }

      // Create new POS session
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .insert({
          operator_id: user.user.id,
          location_id: params.locationId,
          start_time: params.startTime.toISOString(),
          previous_cash_amount: params.previousCashAmount,
          current_cash_amount: params.currentCashAmount,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to start shift: ${sessionError.message}`);
      }

      // Log cash drawer opening
      await this.logCashDrawerOperation({
        sessionId: session.id,
        type: 'open',
        reason: 'Shift start - cash validation',
        operatorId: user.user.id
      });

      // Initialize hardware status
      await this.initializeHardwareStatus(session.id);

      return {
        id: session.id,
        operatorId: session.operator_id,
        startTime: new Date(session.start_time),
        currentCashAmount: session.current_cash_amount,
        previousCashAmount: session.previous_cash_amount,
        transactions: [],
        status: session.status as 'active' | 'completed' | 'cancelled'
      };
    } catch (error: any) {
      console.error('Error starting shift:', error);
      throw new Error(error.message || 'Failed to start shift');
    }
  }

  /**
   * End the current POS shift
   */
  async endShift(params: EndShiftParams): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Verify session belongs to current user
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('id', params.sessionId)
        .eq('operator_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (sessionError || !session) {
        throw new Error('Active session not found');
      }

      // Update session with end details
      const { error: updateError } = await supabase
        .from('pos_sessions')
        .update({
          end_time: new Date().toISOString(),
          end_cash_amount: params.endCashAmount,
          status: 'completed',
          notes: params.notes
        })
        .eq('id', params.sessionId);

      if (updateError) {
        throw new Error(`Failed to end shift: ${updateError.message}`);
      }

      // Log cash drawer closing
      await this.logCashDrawerOperation({
        sessionId: params.sessionId,
        type: 'close',
        amount: params.endCashAmount,
        reason: 'Shift end - final cash count',
        operatorId: user.user.id
      });

    } catch (error: any) {
      console.error('Error ending shift:', error);
      throw new Error(error.message || 'Failed to end shift');
    }
  }

  /**
   * Get current active session for the user
   */
  async getCurrentSession(): Promise<POSSession | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return null;
      }

      const { data: session, error } = await supabase
        .from('active_pos_sessions_view')
        .select('*')
        .eq('operator_id', user.user.id)
        .single();

      if (error || !session) {
        return null;
      }

      return {
        id: session.id,
        operatorId: session.operator_id,
        startTime: new Date(session.start_time),
        currentCashAmount: session.current_cash_amount,
        previousCashAmount: session.previous_cash_amount,
        endCashAmount: session.end_cash_amount,
        transactions: [], // Will be loaded separately if needed
        status: session.status,
        notes: session.notes
      };
    } catch (error: any) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Validate cash amounts during shift operations
   */
  async validateCashAmount(sessionId: string, actualAmount: number): Promise<CashValidationResult> {
    try {
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('pos_sessions')
        .select('current_cash_amount')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Calculate expected cash amount based on transactions
      const { data: transactions, error: transError } = await supabase
        .from('pos_transactions')
        .select('amount, type, payment_method')
        .eq('session_id', sessionId);

      if (transError) {
        throw new Error('Failed to retrieve transactions');
      }

      let expectedAmount = session.current_cash_amount;

      // Calculate expected amount based on cash transactions
      transactions?.forEach(transaction => {
        if (transaction.payment_method === 'cash') {
          switch (transaction.type) {
            case 'parking_fee':
            case 'violation_fee':
              expectedAmount += transaction.amount;
              break;
            case 'refund':
              expectedAmount -= transaction.amount;
              break;
            case 'cash_adjustment':
              expectedAmount += transaction.amount; // Can be negative
              break;
          }
        }
      });

      const difference = actualAmount - expectedAmount;

      return {
        isValid: Math.abs(difference) <= 1.00, // Allow ₱1 tolerance
        difference,
        expectedAmount,
        actualAmount
      };
    } catch (error: any) {
      console.error('Error validating cash amount:', error);
      throw new Error(error.message || 'Failed to validate cash amount');
    }
  }

  /**
   * Log cash drawer operations for audit trail
   */
  async logCashDrawerOperation(params: {
    sessionId: string;
    type: 'open' | 'close' | 'count' | 'adjustment' | 'deposit' | 'withdrawal';
    amount?: number;
    reason?: string;
    operatorId: string;
    hardwareStatus?: any;
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
          hardware_status: params.hardwareStatus || {}
        });

      if (error) {
        console.error('Error logging cash drawer operation:', error);
      }
    } catch (error: any) {
      console.error('Error logging cash drawer operation:', error);
    }
  }

  /**
   * Initialize hardware status for a new session
   */
  private async initializeHardwareStatus(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pos_hardware_status')
        .insert({
          session_id: sessionId,
          cash_drawer: { connected: false, status: 'unknown' },
          printer: { connected: false, status: 'unknown', paper_status: 'unknown' },
          scanner: { available: true, type: 'camera', status: 'ready' },
          biometric: { available: false, type: 'none', enrolled: false }
        });

      if (error) {
        console.error('Error initializing hardware status:', error);
      }
    } catch (error: any) {
      console.error('Error initializing hardware status:', error);
    }
  }

  /**
   * Update hardware status
   */
  async updateHardwareStatus(sessionId: string, status: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('pos_hardware_status')
        .update({
          ...status,
          last_updated: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error updating hardware status:', error);
      }
    } catch (error: any) {
      console.error('Error updating hardware status:', error);
    }
  }

  /**
   * Get shift summary report
   */
  async getShiftSummary(sessionId: string): Promise<any> {
    try {
      const { data: report, error } = await supabase
        .from('pos_shift_reports')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        // If no report exists, generate basic summary
        const { data: session } = await supabase
          .from('pos_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        const { data: transactions } = await supabase
          .from('pos_transactions')
          .select('*')
          .eq('session_id', sessionId);

        return {
          sessionId,
          totalTransactions: transactions?.length || 0,
          totalCashCollected: transactions?.reduce((sum, t) => 
            t.payment_method === 'cash' ? sum + t.amount : sum, 0) || 0,
          cashOverShort: session?.cash_difference || 0,
          generatedAt: new Date().toISOString()
        };
      }

      return report;
    } catch (error: any) {
      console.error('Error getting shift summary:', error);
      throw new Error(error.message || 'Failed to get shift summary');
    }
  }

  /**
   * Create cash remittance record
   */
  async createCashRemittance(params: {
    sessionId: string;
    amount: number;
    depositMethod: 'bank_deposit' | 'cash_pickup' | 'digital_transfer';
    referenceNumber?: string;
    depositDate: Date;
    notes?: string;
  }): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('pos_cash_remittances')
        .insert({
          session_id: params.sessionId,
          operator_id: user.user.id,
          amount: params.amount,
          deposit_method: params.depositMethod,
          reference_number: params.referenceNumber,
          deposit_date: params.depositDate.toISOString(),
          notes: params.notes,
          status: 'pending'
        });

      if (error) {
        throw new Error(`Failed to create remittance record: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error creating cash remittance:', error);
      throw new Error(error.message || 'Failed to create cash remittance');
    }
  }
}

export const posAuthService = new POSAuthService();