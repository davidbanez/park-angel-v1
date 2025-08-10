import { createClient } from '@supabase/supabase-js';
import {
  ReconciliationRule,
  ReconciliationRuleType,
  ReconciliationResult,
  Discrepancy,
  DiscrepancyType,
} from '../types/financial-reporting';
import { FinancialReportingService } from './financial-reporting';

export interface TransactionReconciliationService {
  createReconciliationRule(rule: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReconciliationRule>;
  updateReconciliationRule(ruleId: string, updates: Partial<ReconciliationRule>): Promise<ReconciliationRule>;
  deleteReconciliationRule(ruleId: string): Promise<void>;
  getReconciliationRules(isActive?: boolean): Promise<ReconciliationRule[]>;
  runReconciliation(startDate: Date, endDate: Date, ruleIds?: string[]): Promise<ReconciliationResult[]>;
  runSingleReconciliationRule(ruleId: string, startDate: Date, endDate: Date): Promise<ReconciliationResult>;
  getReconciliationHistory(limit?: number): Promise<ReconciliationResult[]>;
  resolveDiscrepancy(discrepancyId: string, resolution: string, resolvedBy: string): Promise<void>;
  getUnresolvedDiscrepancies(): Promise<Discrepancy[]>;
}

export class TransactionReconciliationServiceImpl implements TransactionReconciliationService {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private financialReportingService: FinancialReportingService
  ) {}

  async createReconciliationRule(
    ruleData: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReconciliationRule> {
    try {
      const rule: ReconciliationRule = {
        id: `recon_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { error } = await this.supabase
        .from('reconciliation_rules')
        .insert({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          rule_type: rule.ruleType,
          conditions: rule.conditions,
          actions: rule.actions,
          is_active: rule.isActive,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create reconciliation rule: ${error.message}`);
      }

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: rule.id,
        entityType: 'reconciliation_rule',
        action: 'create',
        userId: 'system',
        details: {
          name: rule.name,
          ruleType: rule.ruleType,
          conditions: rule.conditions,
          actions: rule.actions,
        },
      });

      return rule;
    } catch (error) {
      console.error('Error creating reconciliation rule:', error);
      throw error;
    }
  }

  async updateReconciliationRule(
    ruleId: string,
    updates: Partial<ReconciliationRule>
  ): Promise<ReconciliationRule> {
    try {
      const { data, error } = await this.supabase
        .from('reconciliation_rules')
        .update({
          name: updates.name,
          description: updates.description,
          rule_type: updates.ruleType,
          conditions: updates.conditions,
          actions: updates.actions,
          is_active: updates.isActive,
          updated_at: new Date(),
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update reconciliation rule: ${error.message}`);
      }

      const rule = this.mapReconciliationRuleFromDB(data);

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: ruleId,
        entityType: 'reconciliation_rule',
        action: 'update',
        userId: 'system',
        details: { updates },
      });

      return rule;
    } catch (error) {
      console.error('Error updating reconciliation rule:', error);
      throw error;
    }
  }

  async deleteReconciliationRule(ruleId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('reconciliation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw new Error(`Failed to delete reconciliation rule: ${error.message}`);
      }

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: ruleId,
        entityType: 'reconciliation_rule',
        action: 'delete',
        userId: 'system',
        details: {},
      });
    } catch (error) {
      console.error('Error deleting reconciliation rule:', error);
      throw error;
    }
  }

  async getReconciliationRules(isActive?: boolean): Promise<ReconciliationRule[]> {
    try {
      let query = this.supabase
        .from('reconciliation_rules')
        .select('*');

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch reconciliation rules: ${error.message}`);
      }

      return (data || []).map(this.mapReconciliationRuleFromDB);
    } catch (error) {
      console.error('Error fetching reconciliation rules:', error);
      throw error;
    }
  }

  async runReconciliation(
    startDate: Date,
    endDate: Date,
    ruleIds?: string[]
  ): Promise<ReconciliationResult[]> {
    try {
      // Get active reconciliation rules
      let rules = await this.getReconciliationRules(true);

      // Filter by specific rule IDs if provided
      if (ruleIds && ruleIds.length > 0) {
        rules = rules.filter(rule => ruleIds.includes(rule.id));
      }

      const results: ReconciliationResult[] = [];

      // Run each rule
      for (const rule of rules) {
        try {
          const result = await this.runSingleReconciliationRule(rule.id, startDate, endDate);
          results.push(result);
        } catch (error) {
          console.error(`Error running reconciliation rule ${rule.id}:`, error);
          // Continue with other rules
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            passed: false,
            discrepancies: [{
              type: DiscrepancyType.MISSING_TRANSACTION,
              description: `Failed to run rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            correctedItems: [],
            notifications: [],
          });
        }
      }

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: `reconciliation_${Date.now()}`,
        entityType: 'reconciliation_run',
        action: 'run',
        userId: 'system',
        details: {
          startDate,
          endDate,
          rulesExecuted: rules.length,
          totalDiscrepancies: results.reduce((sum, r) => sum + r.discrepancies.length, 0),
        },
      });

      return results;
    } catch (error) {
      console.error('Error running reconciliation:', error);
      throw error;
    }
  }

  async runSingleReconciliationRule(
    ruleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    try {
      // Get the rule
      const { data: ruleData, error: ruleError } = await this.supabase
        .from('reconciliation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (ruleError || !ruleData) {
        throw new Error('Reconciliation rule not found');
      }

      const rule = this.mapReconciliationRuleFromDB(ruleData);

      let result: ReconciliationResult;

      switch (rule.ruleType) {
        case ReconciliationRuleType.AMOUNT_VALIDATION:
          result = await this.runAmountValidationRule(rule, startDate, endDate);
          break;
        case ReconciliationRuleType.STATUS_CHECK:
          result = await this.runStatusCheckRule(rule, startDate, endDate);
          break;
        case ReconciliationRuleType.DUPLICATE_DETECTION:
          result = await this.runDuplicateDetectionRule(rule, startDate, endDate);
          break;
        case ReconciliationRuleType.COMPLETENESS_CHECK:
          result = await this.runCompletenessCheckRule(rule, startDate, endDate);
          break;
        default:
          throw new Error(`Unsupported rule type: ${rule.ruleType}`);
      }

      // Store the result
      await this.storeReconciliationResult(result, startDate, endDate);

      return result;
    } catch (error) {
      console.error('Error running single reconciliation rule:', error);
      throw error;
    }
  }

  async getReconciliationHistory(limit: number = 50): Promise<ReconciliationResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('reconciliation_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch reconciliation history: ${error.message}`);
      }

      return (data || []).map(this.mapReconciliationResultFromDB);
    } catch (error) {
      console.error('Error fetching reconciliation history:', error);
      throw error;
    }
  }

  async resolveDiscrepancy(
    discrepancyId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('discrepancies')
        .update({
          status: 'resolved',
          resolution,
          resolved_by: resolvedBy,
          resolved_at: new Date(),
        })
        .eq('id', discrepancyId);

      if (error) {
        throw new Error(`Failed to resolve discrepancy: ${error.message}`);
      }

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: discrepancyId,
        entityType: 'discrepancy',
        action: 'resolve',
        userId: resolvedBy,
        details: { resolution },
      });
    } catch (error) {
      console.error('Error resolving discrepancy:', error);
      throw error;
    }
  }

  async getUnresolvedDiscrepancies(): Promise<Discrepancy[]> {
    try {
      const { data, error } = await this.supabase
        .from('discrepancies')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch unresolved discrepancies: ${error.message}`);
      }

      return (data || []).map(this.mapDiscrepancyFromDB);
    } catch (error) {
      console.error('Error fetching unresolved discrepancies:', error);
      throw error;
    }
  }

  // Private helper methods for different rule types

  private async runAmountValidationRule(
    rule: ReconciliationRule,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    const discrepancies: Discrepancy[] = [];
    const correctedItems: string[] = [];

    // Get transactions and their revenue shares
    const { data: transactions, error } = await this.supabase
      .from('payment_transactions')
      .select(`
        *,
        revenue_shares (*)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    for (const transaction of transactions || []) {
      const revenueShare = transaction.revenue_shares?.[0];
      
      if (revenueShare) {
        const transactionAmount = Math.abs(transaction.amount);
        const revenueShareAmount = revenueShare.total_amount;
        const difference = Math.abs(transactionAmount - revenueShareAmount);

        // Check if amounts match within tolerance (e.g., 0.01)
        if (difference > 0.01) {
          discrepancies.push({
            type: DiscrepancyType.AMOUNT_MISMATCH,
            transactionId: transaction.id,
            description: `Transaction amount (${transactionAmount}) does not match revenue share amount (${revenueShareAmount})`,
            amount: transactionAmount,
            expectedAmount: revenueShareAmount,
            actualAmount: transactionAmount,
            difference,
          });
        }
      } else {
        discrepancies.push({
          type: DiscrepancyType.MISSING_REVENUE_SHARE,
          transactionId: transaction.id,
          description: `Transaction ${transaction.id} has no corresponding revenue share`,
          amount: Math.abs(transaction.amount),
        });
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: discrepancies.length === 0,
      discrepancies,
      correctedItems,
      notifications: [],
    };
  }

  private async runStatusCheckRule(
    rule: ReconciliationRule,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    const discrepancies: Discrepancy[] = [];

    // Check for transactions with inconsistent statuses
    const { data: transactions, error } = await this.supabase
      .from('payment_transactions')
      .select(`
        *,
        bookings (status)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    for (const transaction of transactions || []) {
      // Check if payment succeeded but booking is not confirmed
      if (transaction.status === 'succeeded' && transaction.bookings?.status !== 'confirmed') {
        discrepancies.push({
          type: DiscrepancyType.STATUS_MISMATCH,
          transactionId: transaction.id,
          description: `Payment succeeded but booking status is ${transaction.bookings?.status}`,
        });
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: discrepancies.length === 0,
      discrepancies,
      correctedItems: [],
      notifications: [],
    };
  }

  private async runDuplicateDetectionRule(
    rule: ReconciliationRule,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    const discrepancies: Discrepancy[] = [];

    // Find duplicate transactions (same booking_id, amount, and created within 5 minutes)
    const { data: transactions, error } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('booking_id, amount, created_at');

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    const duplicateGroups = new Map<string, any[]>();

    for (const transaction of transactions || []) {
      const key = `${transaction.booking_id}_${transaction.amount}`;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(transaction);
    }

    // Check for potential duplicates
    for (const [, group] of duplicateGroups) {
      if (group.length > 1) {
        // Check if transactions are within 5 minutes of each other
        for (let i = 1; i < group.length; i++) {
          const timeDiff = new Date(group[i].created_at).getTime() - new Date(group[i-1].created_at).getTime();
          if (timeDiff < 5 * 60 * 1000) { // 5 minutes
            discrepancies.push({
              type: DiscrepancyType.DUPLICATE_ENTRY,
              transactionId: group[i].id,
              description: `Potential duplicate transaction for booking ${group[i].booking_id}`,
              amount: Math.abs(group[i].amount),
            });
          }
        }
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: discrepancies.length === 0,
      discrepancies,
      correctedItems: [],
      notifications: [],
    };
  }

  private async runCompletenessCheckRule(
    rule: ReconciliationRule,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationResult> {
    const discrepancies: Discrepancy[] = [];

    // Check for missing revenue shares
    const { data: transactions, error } = await this.supabase
      .from('payment_transactions')
      .select(`
        id,
        amount,
        status,
        revenue_shares (id)
      `)
      .eq('status', 'succeeded')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    for (const transaction of transactions || []) {
      if (!transaction.revenue_shares || transaction.revenue_shares.length === 0) {
        discrepancies.push({
          type: DiscrepancyType.MISSING_REVENUE_SHARE,
          transactionId: transaction.id,
          description: `Successful transaction ${transaction.id} is missing revenue share calculation`,
          amount: Math.abs(transaction.amount),
        });
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: discrepancies.length === 0,
      discrepancies,
      correctedItems: [],
      notifications: [],
    };
  }

  private async storeReconciliationResult(
    result: ReconciliationResult,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    try {
      // Store the main result
      const { error: resultError } = await this.supabase
        .from('reconciliation_results')
        .insert({
          id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          rule_id: result.ruleId,
          rule_name: result.ruleName,
          passed: result.passed,
          start_date: startDate,
          end_date: endDate,
          discrepancy_count: result.discrepancies.length,
          corrected_count: result.correctedItems.length,
          created_at: new Date(),
        });

      if (resultError) {
        console.error('Failed to store reconciliation result:', resultError);
      }

      // Store discrepancies
      for (const discrepancy of result.discrepancies) {
        const { error: discrepancyError } = await this.supabase
          .from('discrepancies')
          .insert({
            id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: discrepancy.type,
            transaction_id: discrepancy.transactionId,
            description: discrepancy.description,
            amount: discrepancy.amount,
            expected_amount: discrepancy.expectedAmount,
            actual_amount: discrepancy.actualAmount,
            difference: discrepancy.difference,
            status: 'open',
            created_at: new Date(),
          });

        if (discrepancyError) {
          console.error('Failed to store discrepancy:', discrepancyError);
        }
      }
    } catch (error) {
      console.error('Error storing reconciliation result:', error);
      // Don't throw error for storage failures
    }
  }

  private mapReconciliationRuleFromDB(data: any): ReconciliationRule {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      ruleType: data.rule_type,
      conditions: data.conditions,
      actions: data.actions,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapReconciliationResultFromDB(data: any): ReconciliationResult {
    return {
      ruleId: data.rule_id,
      ruleName: data.rule_name,
      passed: data.passed,
      discrepancies: [], // Would need to fetch separately
      correctedItems: [], // Would need to fetch separately
      notifications: [],
    };
  }

  private mapDiscrepancyFromDB(data: any): Discrepancy {
    return {
      type: data.type,
      transactionId: data.transaction_id,
      description: data.description,
      amount: data.amount,
      expectedAmount: data.expected_amount,
      actualAmount: data.actual_amount,
      difference: data.difference,
    };
  }
}