import { createClient } from '@supabase/supabase-js';
import {
  CommissionRule,
  CommissionCalculation,
} from '../types/financial-reporting';
import { FinancialReportingService } from './financial-reporting';

export interface CommissionSystemService {
  createCommissionRule(rule: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommissionRule>;
  updateCommissionRule(ruleId: string, updates: Partial<CommissionRule>): Promise<CommissionRule>;
  getActiveCommissionRule(parkingType: string): Promise<CommissionRule>;
  getAllCommissionRules(parkingType?: string): Promise<CommissionRule[]>;
  calculateCommission(transactionId: string, totalAmount: number, parkingType: string): Promise<CommissionCalculation>;
  getCommissionHistory(hostId?: string, startDate?: Date, endDate?: Date): Promise<CommissionCalculation[]>;
  updateHostedParkingCommission(hostPercentage: number, parkAngelPercentage: number): Promise<CommissionRule>;
}

export class CommissionSystemServiceImpl implements CommissionSystemService {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private financialReportingService: FinancialReportingService
  ) {}

  async createCommissionRule(
    ruleData: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CommissionRule> {
    try {
      // Validate percentages add up to 100
      if (ruleData.hostPercentage + ruleData.parkAngelPercentage !== 100) {
        throw new Error('Host and Park Angel percentages must add up to 100%');
      }

      // Deactivate existing rules for the same parking type
      await this.supabase
        .from('commission_rules')
        .update({ is_active: false, updated_at: new Date() })
        .eq('parking_type', ruleData.parkingType)
        .eq('is_active', true);

      const rule: CommissionRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { error } = await this.supabase
        .from('commission_rules')
        .insert({
          id: rule.id,
          parking_type: rule.parkingType,
          host_percentage: rule.hostPercentage,
          park_angel_percentage: rule.parkAngelPercentage,
          effective_date: rule.effectiveDate,
          expiry_date: rule.expiryDate,
          is_active: rule.isActive,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create commission rule: ${error.message}`);
      }

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: rule.id,
        entityType: 'commission_rule',
        action: 'create',
        userId: 'system', // Would be the admin user ID in practice
        details: {
          parkingType: rule.parkingType,
          hostPercentage: rule.hostPercentage,
          parkAngelPercentage: rule.parkAngelPercentage,
          effectiveDate: rule.effectiveDate,
        },
      });

      return rule;
    } catch (error) {
      console.error('Error creating commission rule:', error);
      throw error;
    }
  }

  async updateCommissionRule(
    ruleId: string,
    updates: Partial<CommissionRule>
  ): Promise<CommissionRule> {
    try {
      // Validate percentages if both are provided
      if (updates.hostPercentage !== undefined && updates.parkAngelPercentage !== undefined) {
        if (updates.hostPercentage + updates.parkAngelPercentage !== 100) {
          throw new Error('Host and Park Angel percentages must add up to 100%');
        }
      }

      const { data, error } = await this.supabase
        .from('commission_rules')
        .update({
          host_percentage: updates.hostPercentage,
          park_angel_percentage: updates.parkAngelPercentage,
          effective_date: updates.effectiveDate,
          expiry_date: updates.expiryDate,
          is_active: updates.isActive,
          updated_at: new Date(),
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update commission rule: ${error.message}`);
      }

      const rule = this.mapCommissionRuleFromDB(data);

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: ruleId,
        entityType: 'commission_rule',
        action: 'update',
        userId: 'system',
        details: { updates },
      });

      return rule;
    } catch (error) {
      console.error('Error updating commission rule:', error);
      throw error;
    }
  }

  async getActiveCommissionRule(parkingType: string): Promise<CommissionRule> {
    try {
      const { data, error } = await this.supabase
        .from('commission_rules')
        .select('*')
        .eq('parking_type', parkingType)
        .eq('is_active', true)
        .lte('effective_date', new Date().toISOString())
        .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString()}`)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Return default commission rule for hosted parking if none found
        if (parkingType === 'hosted') {
          return {
            id: 'default_hosted',
            parkingType: 'hosted',
            hostPercentage: 60,
            parkAngelPercentage: 40,
            effectiveDate: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        throw new Error(`No active commission rule found for parking type: ${parkingType}`);
      }

      return this.mapCommissionRuleFromDB(data);
    } catch (error) {
      console.error('Error fetching active commission rule:', error);
      throw error;
    }
  }

  async getAllCommissionRules(parkingType?: string): Promise<CommissionRule[]> {
    try {
      let query = this.supabase
        .from('commission_rules')
        .select('*');

      if (parkingType) {
        query = query.eq('parking_type', parkingType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch commission rules: ${error.message}`);
      }

      return (data || []).map(this.mapCommissionRuleFromDB);
    } catch (error) {
      console.error('Error fetching commission rules:', error);
      throw error;
    }
  }

  async calculateCommission(
    transactionId: string,
    totalAmount: number,
    parkingType: string
  ): Promise<CommissionCalculation> {
    try {
      // Get the active commission rule
      const commissionRule = await this.getActiveCommissionRule(parkingType);

      // Calculate commission amounts
      const hostShare = (totalAmount * commissionRule.hostPercentage) / 100;
      const parkAngelShare = (totalAmount * commissionRule.parkAngelPercentage) / 100;

      const calculation: CommissionCalculation = {
        transactionId,
        totalAmount,
        hostShare,
        parkAngelShare,
        commissionRule,
        calculatedAt: new Date(),
      };

      // Store the calculation
      await this.storeCommissionCalculation(calculation);

      // Log audit event
      await this.financialReportingService.logAuditEvent({
        entityId: transactionId,
        entityType: 'commission_calculation',
        action: 'calculate',
        userId: 'system',
        details: {
          totalAmount,
          hostShare,
          parkAngelShare,
          commissionRuleId: commissionRule.id,
        },
      });

      return calculation;
    } catch (error) {
      console.error('Error calculating commission:', error);
      throw error;
    }
  }

  async getCommissionHistory(
    hostId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CommissionCalculation[]> {
    try {
      let query = this.supabase
        .from('commission_calculations')
        .select(`
          *,
          commission_rules (*)
        `);

      if (hostId) {
        // Join with transactions to filter by host
        query = query
          .eq('payment_transactions.bookings.parking_spots.zones.sections.locations.operator_id', hostId)
          .eq('payment_transactions.bookings.parking_spots.zones.sections.locations.type', 'hosted');
      }

      if (startDate) {
        query = query.gte('calculated_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('calculated_at', endDate.toISOString());
      }

      const { data, error } = await query.order('calculated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch commission history: ${error.message}`);
      }

      return (data || []).map(this.mapCommissionCalculationFromDB);
    } catch (error) {
      console.error('Error fetching commission history:', error);
      throw error;
    }
  }

  async updateHostedParkingCommission(
    hostPercentage: number,
    parkAngelPercentage: number
  ): Promise<CommissionRule> {
    try {
      // Validate percentages
      if (hostPercentage + parkAngelPercentage !== 100) {
        throw new Error('Host and Park Angel percentages must add up to 100%');
      }

      // Create new commission rule for hosted parking
      const newRule = await this.createCommissionRule({
        parkingType: 'hosted',
        hostPercentage,
        parkAngelPercentage,
        effectiveDate: new Date(),
        isActive: true,
      });

      // Log audit event for commission update
      await this.financialReportingService.logAuditEvent({
        entityId: newRule.id,
        entityType: 'commission_rule',
        action: 'update_hosted_commission',
        userId: 'system',
        details: {
          previousDefault: { hostPercentage: 60, parkAngelPercentage: 40 },
          newCommission: { hostPercentage, parkAngelPercentage },
          effectiveDate: new Date(),
        },
      });

      return newRule;
    } catch (error) {
      console.error('Error updating hosted parking commission:', error);
      throw error;
    }
  }

  // Private helper methods

  private async storeCommissionCalculation(calculation: CommissionCalculation): Promise<void> {
    const { error } = await this.supabase
      .from('commission_calculations')
      .insert({
        transaction_id: calculation.transactionId,
        total_amount: calculation.totalAmount,
        host_share: calculation.hostShare,
        park_angel_share: calculation.parkAngelShare,
        commission_rule_id: calculation.commissionRule.id,
        calculated_at: calculation.calculatedAt,
      });

    if (error) {
      console.error('Failed to store commission calculation:', error);
      // Don't throw error for storage failures
    }
  }

  private mapCommissionRuleFromDB(data: any): CommissionRule {
    return {
      id: data.id,
      parkingType: data.parking_type,
      hostPercentage: data.host_percentage,
      parkAngelPercentage: data.park_angel_percentage,
      effectiveDate: new Date(data.effective_date),
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapCommissionCalculationFromDB(data: any): CommissionCalculation {
    return {
      transactionId: data.transaction_id,
      totalAmount: data.total_amount,
      hostShare: data.host_share,
      parkAngelShare: data.park_angel_share,
      commissionRule: this.mapCommissionRuleFromDB(data.commission_rules),
      calculatedAt: new Date(data.calculated_at),
    };
  }
}