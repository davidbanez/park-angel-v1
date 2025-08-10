import { createClient } from '@supabase/supabase-js';
import {
  RemittanceSchedule,
  RemittanceRun,
  RemittanceFrequency,
  RemittanceStatus,
} from '../types/financial-reporting';
import { RevenueShareService } from './revenue-sharing';
import { PayoutService } from './payout-processing';
import { FinancialReportingService } from './financial-reporting';

export interface AutomatedRemittanceService {
  createRemittanceSchedule(schedule: Omit<RemittanceSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RemittanceSchedule>;
  updateRemittanceSchedule(scheduleId: string, updates: Partial<RemittanceSchedule>): Promise<RemittanceSchedule>;
  deleteRemittanceSchedule(scheduleId: string): Promise<void>;
  getRemittanceSchedules(recipientId?: string): Promise<RemittanceSchedule[]>;
  processScheduledRemittances(): Promise<RemittanceRun[]>;
  processRemittanceSchedule(scheduleId: string): Promise<RemittanceRun>;
  getRemittanceRuns(scheduleId?: string, limit?: number): Promise<RemittanceRun[]>;
  retryFailedRemittance(runId: string): Promise<RemittanceRun>;
  calculateNextRunDate(frequency: RemittanceFrequency, lastRunDate?: Date): Date;
}

export class AutomatedRemittanceServiceImpl implements AutomatedRemittanceService {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private revenueShareService: RevenueShareService,
    private payoutService: PayoutService,
    private financialReportingService: FinancialReportingService
  ) {}

  async createRemittanceSchedule(
    scheduleData: Omit<RemittanceSchedule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RemittanceSchedule> {
    try {
      const schedule: RemittanceSchedule = {
        id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...scheduleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { error } = await this.supabase
        .from('remittance_schedules')
        .insert({
          id: schedule.id,
          recipient_id: schedule.recipientId,
          recipient_type: schedule.recipientType,
          frequency: schedule.frequency,
          minimum_amount: schedule.minimumAmount,
          bank_account_id: schedule.bankAccountId,
          is_active: schedule.isActive,
          next_run_date: schedule.nextRunDate,
          last_run_date: schedule.lastRunDate,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create remittance schedule: ${error.message}`);
      }

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: schedule.id,
        entityType: 'remittance_schedule',
        action: 'create',
        userId: scheduleData.recipientId, // Assuming recipient creates their own schedule
        details: {
          frequency: schedule.frequency,
          minimumAmount: schedule.minimumAmount,
          bankAccountId: schedule.bankAccountId,
        },
      });

      return schedule;
    } catch (error) {
      console.error('Error creating remittance schedule:', error);
      throw error;
    }
  }

  async updateRemittanceSchedule(
    scheduleId: string,
    updates: Partial<RemittanceSchedule>
  ): Promise<RemittanceSchedule> {
    try {
      const { data, error } = await this.supabase
        .from('remittance_schedules')
        .update({
          frequency: updates.frequency,
          minimum_amount: updates.minimumAmount,
          bank_account_id: updates.bankAccountId,
          is_active: updates.isActive,
          next_run_date: updates.nextRunDate,
          updated_at: new Date(),
        })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update remittance schedule: ${error.message}`);
      }

      const schedule = this.mapRemittanceScheduleFromDB(data);

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: scheduleId,
        entityType: 'remittance_schedule',
        action: 'update',
        userId: schedule.recipientId,
        details: { updates },
      });

      return schedule;
    } catch (error) {
      console.error('Error updating remittance schedule:', error);
      throw error;
    }
  }

  async deleteRemittanceSchedule(scheduleId: string): Promise<void> {
    try {
      // Get schedule details for audit log
      const { data: scheduleData } = await this.supabase
        .from('remittance_schedules')
        .select('recipient_id')
        .eq('id', scheduleId)
        .single();

      const { error } = await this.supabase
        .from('remittance_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        throw new Error(`Failed to delete remittance schedule: ${error.message}`);
      }

      // Log audit event
      if (scheduleData) {
        await this.financialReportingService.logAuditEvent({
          entityId: scheduleId,
          entityType: 'remittance_schedule',
          action: 'delete',
          userId: scheduleData.recipient_id,
          details: {},
        });
      }
    } catch (error) {
      console.error('Error deleting remittance schedule:', error);
      throw error;
    }
  }

  async getRemittanceSchedules(recipientId?: string): Promise<RemittanceSchedule[]> {
    try {
      let query = this.supabase
        .from('remittance_schedules')
        .select('*');

      if (recipientId) {
        query = query.eq('recipient_id', recipientId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch remittance schedules: ${error.message}`);
      }

      return (data || []).map(this.mapRemittanceScheduleFromDB);
    } catch (error) {
      console.error('Error fetching remittance schedules:', error);
      throw error;
    }
  }

  async processScheduledRemittances(): Promise<RemittanceRun[]> {
    try {
      // Get all active schedules that are due for processing
      const { data: dueSchedules, error } = await this.supabase
        .from('remittance_schedules')
        .select('*')
        .eq('is_active', true)
        .lte('next_run_date', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to fetch due remittance schedules: ${error.message}`);
      }

      const remittanceRuns: RemittanceRun[] = [];

      // Process each due schedule
      for (const scheduleData of dueSchedules || []) {
        try {
          const run = await this.processRemittanceSchedule(scheduleData.id);
          remittanceRuns.push(run);
        } catch (error) {
          console.error(`Error processing remittance schedule ${scheduleData.id}:`, error);
          // Continue processing other schedules even if one fails
        }
      }

      return remittanceRuns;
    } catch (error) {
      console.error('Error processing scheduled remittances:', error);
      throw error;
    }
  }

  async processRemittanceSchedule(scheduleId: string): Promise<RemittanceRun> {
    try {
      // Get schedule details
      const { data: scheduleData, error: scheduleError } = await this.supabase
        .from('remittance_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (scheduleError || !scheduleData) {
        throw new Error('Remittance schedule not found');
      }

      const schedule = this.mapRemittanceScheduleFromDB(scheduleData);

      // Calculate earnings since last run
      const startDate = schedule.lastRunDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
      const endDate = new Date();

      let earnings;
      if (schedule.recipientType === 'operator') {
        earnings = await this.revenueShareService.getOperatorEarnings(
          schedule.recipientId,
          startDate,
          endDate
        );
      } else {
        earnings = await this.revenueShareService.getHostEarnings(
          schedule.recipientId,
          startDate,
          endDate
        );
      }

      const shareAmount = schedule.recipientType === 'operator' 
        ? earnings.operatorShare 
        : earnings.hostShare;

      // Create remittance run record
      const run: RemittanceRun = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduleId: schedule.id,
        recipientId: schedule.recipientId,
        recipientType: schedule.recipientType,
        amount: shareAmount,
        transactionIds: [], // Will be populated below
        status: RemittanceStatus.PENDING,
        runDate: new Date(),
      };

      // Check if amount meets minimum threshold
      if (shareAmount < schedule.minimumAmount) {
        run.status = RemittanceStatus.CANCELLED;
        run.errorMessage = `Amount ${shareAmount} is below minimum threshold ${schedule.minimumAmount}`;
        
        await this.storeRemittanceRun(run);
        return run;
      }

      // Get related transaction IDs
      const { data: revenueShares, error: revenueError } = await this.supabase
        .from('revenue_shares')
        .select('transaction_id')
        .eq(schedule.recipientType === 'operator' ? 'operator_id' : 'host_id', schedule.recipientId)
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString());

      if (revenueError) {
        throw new Error(`Failed to fetch revenue shares: ${revenueError.message}`);
      }

      run.transactionIds = (revenueShares || []).map(rs => rs.transaction_id);

      // Store initial run record
      await this.storeRemittanceRun(run);

      try {
        // Create payout
        const payout = await this.payoutService.createPayout({
          recipientId: schedule.recipientId,
          recipientType: schedule.recipientType,
          amount: shareAmount,
          currency: 'PHP',
          bankAccountId: schedule.bankAccountId,
          transactionIds: run.transactionIds,
          metadata: {
            automatic: true,
            remittanceRunId: run.id,
            scheduleId: schedule.id,
          },
        });

        // Process the payout
        await this.payoutService.processPayout(payout.id);

        // Update run status
        run.status = RemittanceStatus.COMPLETED;
        run.payoutId = payout.id;
        run.completedAt = new Date();

        // Update schedule's next run date and last run date
        const nextRunDate = this.calculateNextRunDate(schedule.frequency, new Date());
        await this.supabase
          .from('remittance_schedules')
          .update({
            next_run_date: nextRunDate,
            last_run_date: new Date(),
            updated_at: new Date(),
          })
          .eq('id', schedule.id);

      } catch (payoutError) {
        // Update run status to failed
        run.status = RemittanceStatus.FAILED;
        run.failedAt = new Date();
        run.errorMessage = payoutError instanceof Error ? payoutError.message : 'Unknown error';
      }

      // Update run record
      await this.updateRemittanceRun(run);

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: run.id,
        entityType: 'remittance_run',
        action: 'process',
        userId: 'system',
        details: {
          scheduleId: schedule.id,
          recipientId: schedule.recipientId,
          amount: shareAmount,
          status: run.status,
        },
      });

      return run;
    } catch (error) {
      console.error('Error processing remittance schedule:', error);
      throw error;
    }
  }

  async getRemittanceRuns(scheduleId?: string, limit: number = 50): Promise<RemittanceRun[]> {
    try {
      let query = this.supabase
        .from('remittance_runs')
        .select('*');

      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }

      const { data, error } = await query
        .order('run_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch remittance runs: ${error.message}`);
      }

      return (data || []).map(this.mapRemittanceRunFromDB);
    } catch (error) {
      console.error('Error fetching remittance runs:', error);
      throw error;
    }
  }

  async retryFailedRemittance(runId: string): Promise<RemittanceRun> {
    try {
      // Get the failed run
      const { data: runData, error: runError } = await this.supabase
        .from('remittance_runs')
        .select('*')
        .eq('id', runId)
        .eq('status', RemittanceStatus.FAILED)
        .single();

      if (runError || !runData) {
        throw new Error('Failed remittance run not found');
      }

      const run = this.mapRemittanceRunFromDB(runData);

      // Update status to processing
      run.status = RemittanceStatus.PROCESSING;
      run.errorMessage = undefined;
      await this.updateRemittanceRun(run);

      try {
        // Create new payout
        const payout = await this.payoutService.createPayout({
          recipientId: run.recipientId,
          recipientType: run.recipientType,
          amount: run.amount,
          currency: 'PHP',
          bankAccountId: '', // Would need to get from schedule
          transactionIds: run.transactionIds,
          metadata: {
            automatic: true,
            remittanceRunId: run.id,
            retry: true,
          },
        });

        // Process the payout
        await this.payoutService.processPayout(payout.id);

        // Update run status
        run.status = RemittanceStatus.COMPLETED;
        run.payoutId = payout.id;
        run.completedAt = new Date();
        run.failedAt = undefined;

      } catch (payoutError) {
        // Update run status to failed again
        run.status = RemittanceStatus.FAILED;
        run.failedAt = new Date();
        run.errorMessage = payoutError instanceof Error ? payoutError.message : 'Unknown error';
      }

      // Update run record
      await this.updateRemittanceRun(run);

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: run.id,
        entityType: 'remittance_run',
        action: 'retry',
        userId: 'system',
        details: {
          originalStatus: RemittanceStatus.FAILED,
          newStatus: run.status,
        },
      });

      return run;
    } catch (error) {
      console.error('Error retrying failed remittance:', error);
      throw error;
    }
  }

  calculateNextRunDate(frequency: RemittanceFrequency, lastRunDate?: Date): Date {
    const baseDate = lastRunDate || new Date();
    const nextDate = new Date(baseDate);

    switch (frequency) {
      case RemittanceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RemittanceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RemittanceFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RemittanceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    return nextDate;
  }

  // Private helper methods

  private async storeRemittanceRun(run: RemittanceRun): Promise<void> {
    const { error } = await this.supabase
      .from('remittance_runs')
      .insert({
        id: run.id,
        schedule_id: run.scheduleId,
        recipient_id: run.recipientId,
        recipient_type: run.recipientType,
        amount: run.amount,
        transaction_ids: run.transactionIds,
        payout_id: run.payoutId,
        status: run.status,
        run_date: run.runDate,
        completed_at: run.completedAt,
        failed_at: run.failedAt,
        error_message: run.errorMessage,
      });

    if (error) {
      throw new Error(`Failed to store remittance run: ${error.message}`);
    }
  }

  private async updateRemittanceRun(run: RemittanceRun): Promise<void> {
    const { error } = await this.supabase
      .from('remittance_runs')
      .update({
        payout_id: run.payoutId,
        status: run.status,
        completed_at: run.completedAt,
        failed_at: run.failedAt,
        error_message: run.errorMessage,
      })
      .eq('id', run.id);

    if (error) {
      throw new Error(`Failed to update remittance run: ${error.message}`);
    }
  }

  private mapRemittanceScheduleFromDB(data: any): RemittanceSchedule {
    return {
      id: data.id,
      recipientId: data.recipient_id,
      recipientType: data.recipient_type,
      frequency: data.frequency,
      minimumAmount: data.minimum_amount,
      bankAccountId: data.bank_account_id,
      isActive: data.is_active,
      nextRunDate: new Date(data.next_run_date),
      lastRunDate: data.last_run_date ? new Date(data.last_run_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapRemittanceRunFromDB(data: any): RemittanceRun {
    return {
      id: data.id,
      scheduleId: data.schedule_id,
      recipientId: data.recipient_id,
      recipientType: data.recipient_type,
      amount: data.amount,
      transactionIds: data.transaction_ids,
      payoutId: data.payout_id,
      status: data.status,
      runDate: new Date(data.run_date),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      failedAt: data.failed_at ? new Date(data.failed_at) : undefined,
      errorMessage: data.error_message,
    };
  }
}