import { SupabaseClient } from '@supabase/supabase-js';
import { 
  DiscountRule, 
  DiscountEngine, 
  VATCalculator, 
  AppliedDiscount,
  VATCalculation,
  TransactionCalculation,
  DiscountUserContext,
  CreateDiscountRuleData,
  DiscountOperator
} from '../models/discount';
import { Money, Percentage, UserId } from '../models/value-objects';
import { DiscountType } from '../types';

export interface DiscountVerificationDocument {
  id: string;
  userId: string;
  discountType: DiscountType;
  documentType: 'senior_id' | 'pwd_id' | 'birth_certificate' | 'medical_certificate';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  expiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountApplication {
  id: string;
  bookingId: string;
  discountRuleId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  vatExempted: boolean;
  appliedBy: string;
  verificationDocumentUrl?: string;
  createdAt: Date;
}

export interface VATConfig {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  operatorId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountAnalytics {
  totalDiscountsApplied: number;
  totalDiscountAmount: number;
  discountsByType: Record<DiscountType, {
    count: number;
    totalAmount: number;
    averageAmount: number;
  }>;
  vatExemptTransactions: number;
  vatExemptAmount: number;
  topDiscountRules: Array<{
    ruleId: string;
    name: string;
    usageCount: number;
    totalAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    discountCount: number;
    discountAmount: number;
    vatExemptCount: number;
  }>;
}

export class DiscountVATManagementService {
  private discountEngine: DiscountEngine;
  private vatCalculator: VATCalculator;

  constructor(private supabase: SupabaseClient) {
    this.discountEngine = new DiscountEngine();
    this.vatCalculator = new VATCalculator();
  }

  // Discount Rule Management
  async createDiscountRule(data: CreateDiscountRuleData & { 
    operatorId?: string; 
    createdBy: string;
  }): Promise<DiscountRule> {
    const rule = DiscountRule.create(data);
    
    const { data: insertedRule, error } = await this.supabase
      .from('discount_rules')
      .insert({
        id: rule.id,
        name: rule.name,
        type: rule.type,
        percentage: rule.percentage.value,
        is_vat_exempt: rule.isVATExempt,
        conditions: JSON.stringify(rule.conditions.map(c => c.toJSON())),
        operator_id: data.operatorId,
        is_active: rule.isActive,
        created_by: data.createdBy,
        created_at: rule.createdAt,
        updated_at: rule.updatedAt
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create discount rule: ${error.message}`);
    }

    return rule;
  }

  async updateDiscountRule(
    ruleId: string, 
    updates: Partial<CreateDiscountRuleData>,
    updatedBy: string
  ): Promise<DiscountRule> {
    const { data: existingRule, error: fetchError } = await this.supabase
      .from('discount_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (fetchError || !existingRule) {
      throw new Error('Discount rule not found');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.percentage !== undefined) updateData.percentage = updates.percentage;
    if (updates.isVATExempt !== undefined) updateData.is_vat_exempt = updates.isVATExempt;
    if (updates.conditions) updateData.conditions = JSON.stringify(updates.conditions);
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data: updatedRule, error } = await this.supabase
      .from('discount_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update discount rule: ${error.message}`);
    }

    return this.mapDatabaseRuleToModel(updatedRule);
  }

  async deleteDiscountRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('discount_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      throw new Error(`Failed to delete discount rule: ${error.message}`);
    }
  }

  async getDiscountRules(operatorId?: string): Promise<DiscountRule[]> {
    let query = this.supabase
      .from('discount_rules')
      .select('*')
      .eq('is_active', true);

    if (operatorId) {
      query = query.or(`operator_id.eq.${operatorId},operator_id.is.null`);
    } else {
      query = query.is('operator_id', null);
    }

    const { data: rules, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch discount rules: ${error.message}`);
    }

    return rules.map(rule => this.mapDatabaseRuleToModel(rule));
  }

  async getDiscountRuleById(ruleId: string): Promise<DiscountRule | null> {
    const { data: rule, error } = await this.supabase
      .from('discount_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error || !rule) {
      return null;
    }

    return this.mapDatabaseRuleToModel(rule);
  }

  // VAT Configuration Management
  async createVATConfig(config: {
    name: string;
    rate: number;
    isDefault?: boolean;
    operatorId?: string;
  }): Promise<VATConfig> {
    // If this is set as default, unset other defaults for the same scope
    if (config.isDefault) {
      await this.supabase
        .from('vat_config')
        .update({ is_default: false })
        .eq('operator_id', config.operatorId || null);
    }

    const { data: vatConfig, error } = await this.supabase
      .from('vat_config')
      .insert({
        name: config.name,
        rate: config.rate,
        is_default: config.isDefault || false,
        operator_id: config.operatorId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create VAT config: ${error.message}`);
    }

    return this.mapDatabaseVATConfigToModel(vatConfig);
  }

  async updateVATConfig(
    configId: string,
    updates: Partial<{
      name: string;
      rate: number;
      isDefault: boolean;
      isActive: boolean;
    }>
  ): Promise<VATConfig> {
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      const { data: existingConfig } = await this.supabase
        .from('vat_config')
        .select('operator_id')
        .eq('id', configId)
        .single();

      if (existingConfig) {
        await this.supabase
          .from('vat_config')
          .update({ is_default: false })
          .eq('operator_id', existingConfig.operator_id || null)
          .neq('id', configId);
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.rate !== undefined) updateData.rate = updates.rate;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data: updatedConfig, error } = await this.supabase
      .from('vat_config')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update VAT config: ${error.message}`);
    }

    return this.mapDatabaseVATConfigToModel(updatedConfig);
  }

  async getVATConfigs(operatorId?: string): Promise<VATConfig[]> {
    let query = this.supabase
      .from('vat_config')
      .select('*')
      .eq('is_active', true);

    if (operatorId) {
      query = query.or(`operator_id.eq.${operatorId},operator_id.is.null`);
    } else {
      query = query.is('operator_id', null);
    }

    const { data: configs, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch VAT configs: ${error.message}`);
    }

    return configs.map(config => this.mapDatabaseVATConfigToModel(config));
  }

  async getDefaultVATConfig(operatorId?: string): Promise<VATConfig | null> {
    let query = this.supabase
      .from('vat_config')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true);

    if (operatorId) {
      query = query.or(`operator_id.eq.${operatorId},operator_id.is.null`);
    } else {
      query = query.is('operator_id', null);
    }

    const { data: config, error } = await query
      .order('operator_id', { nullsLast: false })
      .limit(1)
      .single();

    if (error || !config) {
      // Return default Philippine VAT if no config found
      return {
        id: 'default',
        name: 'Default VAT',
        rate: 12,
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return this.mapDatabaseVATConfigToModel(config);
  }

  // Document Verification Management
  async submitDiscountVerificationDocument(document: {
    userId: string;
    discountType: DiscountType;
    documentType: 'senior_id' | 'pwd_id' | 'birth_certificate' | 'medical_certificate';
    documentUrl: string;
    expiryDate?: Date;
  }): Promise<DiscountVerificationDocument> {
    const { data: verificationDoc, error } = await this.supabase
      .from('discount_verification_documents')
      .insert({
        user_id: document.userId,
        discount_type: document.discountType,
        document_type: document.documentType,
        document_url: document.documentUrl,
        status: 'pending',
        expiry_date: document.expiryDate?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit verification document: ${error.message}`);
    }

    return this.mapDatabaseVerificationDocToModel(verificationDoc);
  }

  async verifyDiscountDocument(
    documentId: string,
    verifiedBy: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<DiscountVerificationDocument> {
    const { data: verifiedDoc, error } = await this.supabase
      .from('discount_verification_documents')
      .update({
        status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to verify document: ${error.message}`);
    }

    // If approved, update user's discount eligibility
    if (status === 'approved') {
      await this.updateUserDiscountEligibility(
        verifiedDoc.user_id,
        verifiedDoc.discount_type,
        true
      );
    }

    return this.mapDatabaseVerificationDocToModel(verifiedDoc);
  }

  async getUserVerificationDocuments(userId: string): Promise<DiscountVerificationDocument[]> {
    const { data: documents, error } = await this.supabase
      .from('discount_verification_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch verification documents: ${error.message}`);
    }

    return documents.map(doc => this.mapDatabaseVerificationDocToModel(doc));
  }

  async getPendingVerificationDocuments(): Promise<DiscountVerificationDocument[]> {
    const { data: documents, error } = await this.supabase
      .from('discount_verification_documents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch pending verification documents: ${error.message}`);
    }

    return documents.map(doc => this.mapDatabaseVerificationDocToModel(doc));
  }

  // Discount Application Workflow
  async applyDiscountToBooking(
    bookingId: string,
    originalAmount: number,
    userContext: DiscountUserContext,
    appliedBy: string,
    operatorId?: string
  ): Promise<TransactionCalculation> {
    // Load applicable discount rules
    const discountRules = await this.getDiscountRules(operatorId);
    this.discountEngine = new DiscountEngine(discountRules);

    // Get VAT configuration
    const vatConfig = await this.getDefaultVATConfig(operatorId);
    this.vatCalculator = new VATCalculator(
      new Percentage(vatConfig?.rate || 12)
    );

    // Calculate transaction with discounts and VAT
    const calculation = this.discountEngine.calculateTotalWithDiscountsAndVAT(
      new Money(originalAmount),
      userContext,
      this.vatCalculator
    );

    // Record discount applications
    for (const appliedDiscount of calculation.appliedDiscounts) {
      await this.recordDiscountApplication({
        bookingId,
        discountRuleId: appliedDiscount.id,
        originalAmount,
        discountAmount: appliedDiscount.amount.value,
        finalAmount: calculation.finalAmount.value,
        vatExempted: appliedDiscount.isVATExempt,
        appliedBy
      });
    }

    return calculation;
  }

  async recordDiscountApplication(application: {
    bookingId: string;
    discountRuleId: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    vatExempted: boolean;
    appliedBy: string;
    verificationDocumentUrl?: string;
  }): Promise<DiscountApplication> {
    const { data: discountApp, error } = await this.supabase
      .from('discount_applications')
      .insert({
        booking_id: application.bookingId,
        discount_rule_id: application.discountRuleId,
        original_amount: application.originalAmount,
        discount_amount: application.discountAmount,
        final_amount: application.finalAmount,
        vat_exempted: application.vatExempted,
        applied_by: application.appliedBy,
        verification_document_url: application.verificationDocumentUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record discount application: ${error.message}`);
    }

    return this.mapDatabaseDiscountAppToModel(discountApp);
  }

  // Analytics and Reporting
  async getDiscountAnalytics(
    operatorId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DiscountAnalytics> {
    let query = this.supabase
      .from('discount_applications')
      .select(`
        *,
        discount_rules!inner(name, type, operator_id)
      `);

    if (operatorId) {
      query = query.eq('discount_rules.operator_id', operatorId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: applications, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch discount analytics: ${error.message}`);
    }

    return this.calculateDiscountAnalytics(applications);
  }

  async getDiscountUsageReport(
    operatorId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    date: string;
    discountType: DiscountType;
    discountName: string;
    usageCount: number;
    totalDiscountAmount: number;
    totalOriginalAmount: number;
    savingsPercentage: number;
  }>> {
    let query = this.supabase
      .from('discount_applications')
      .select(`
        created_at,
        discount_amount,
        original_amount,
        discount_rules!inner(name, type, operator_id)
      `);

    if (operatorId) {
      query = query.eq('discount_rules.operator_id', operatorId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: applications, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch discount usage report: ${error.message}`);
    }

    // Group by date and discount type
    const grouped = applications.reduce((acc, app) => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      const key = `${date}-${app.discount_rules.type}`;
      
      if (!acc[key]) {
        acc[key] = {
          date,
          discountType: app.discount_rules.type as DiscountType,
          discountName: app.discount_rules.name,
          usageCount: 0,
          totalDiscountAmount: 0,
          totalOriginalAmount: 0,
          savingsPercentage: 0
        };
      }

      acc[key].usageCount++;
      acc[key].totalDiscountAmount += parseFloat(app.discount_amount);
      acc[key].totalOriginalAmount += parseFloat(app.original_amount);

      return acc;
    }, {} as Record<string, any>);

    // Calculate savings percentage
    return Object.values(grouped).map((item: any) => ({
      ...item,
      savingsPercentage: (item.totalDiscountAmount / item.totalOriginalAmount) * 100
    }));
  }

  // Private helper methods
  private async updateUserDiscountEligibility(
    userId: string,
    discountType: DiscountType,
    isEligible: boolean
  ): Promise<void> {
    const { data: user, error: fetchError } = await this.supabase
      .from('user_profiles')
      .select('discount_eligibility')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
    }

    let eligibility = user.discount_eligibility || [];

    if (isEligible && !eligibility.includes(discountType)) {
      eligibility.push(discountType);
    } else if (!isEligible) {
      eligibility = eligibility.filter((type: DiscountType) => type !== discountType);
    }

    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({ discount_eligibility: eligibility })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update user discount eligibility: ${updateError.message}`);
    }
  }

  private mapDatabaseRuleToModel(dbRule: any): DiscountRule {
    const conditions = dbRule.conditions ? 
      JSON.parse(dbRule.conditions).map((c: any) => ({
        id: c.id,
        field: c.field,
        operator: c.operator as DiscountOperator,
        value: c.value,
        createdAt: new Date(c.createdAt)
      })) : [];

    return new DiscountRule(
      dbRule.id,
      dbRule.name,
      dbRule.type as DiscountType,
      new Percentage(dbRule.percentage),
      dbRule.is_vat_exempt,
      conditions,
      dbRule.is_active,
      new Date(dbRule.created_at),
      new Date(dbRule.updated_at)
    );
  }

  private mapDatabaseVATConfigToModel(dbConfig: any): VATConfig {
    return {
      id: dbConfig.id,
      name: dbConfig.name,
      rate: parseFloat(dbConfig.rate),
      isDefault: dbConfig.is_default,
      operatorId: dbConfig.operator_id,
      isActive: dbConfig.is_active,
      createdAt: new Date(dbConfig.created_at),
      updatedAt: new Date(dbConfig.updated_at)
    };
  }

  private mapDatabaseVerificationDocToModel(dbDoc: any): DiscountVerificationDocument {
    return {
      id: dbDoc.id,
      userId: dbDoc.user_id,
      discountType: dbDoc.discount_type as DiscountType,
      documentType: dbDoc.document_type,
      documentUrl: dbDoc.document_url,
      status: dbDoc.status,
      verifiedBy: dbDoc.verified_by,
      verifiedAt: dbDoc.verified_at ? new Date(dbDoc.verified_at) : undefined,
      expiryDate: dbDoc.expiry_date ? new Date(dbDoc.expiry_date) : undefined,
      notes: dbDoc.notes,
      createdAt: new Date(dbDoc.created_at),
      updatedAt: new Date(dbDoc.updated_at)
    };
  }

  private mapDatabaseDiscountAppToModel(dbApp: any): DiscountApplication {
    return {
      id: dbApp.id,
      bookingId: dbApp.booking_id,
      discountRuleId: dbApp.discount_rule_id,
      originalAmount: parseFloat(dbApp.original_amount),
      discountAmount: parseFloat(dbApp.discount_amount),
      finalAmount: parseFloat(dbApp.final_amount),
      vatExempted: dbApp.vat_exempted,
      appliedBy: dbApp.applied_by,
      verificationDocumentUrl: dbApp.verification_document_url,
      createdAt: new Date(dbApp.created_at)
    };
  }

  private calculateDiscountAnalytics(applications: any[]): DiscountAnalytics {
    const totalDiscountsApplied = applications.length;
    const totalDiscountAmount = applications.reduce(
      (sum, app) => sum + parseFloat(app.discount_amount), 0
    );

    const discountsByType = applications.reduce((acc, app) => {
      const type = app.discount_rules.type as DiscountType;
      if (!acc[type]) {
        acc[type] = { count: 0, totalAmount: 0, averageAmount: 0 };
      }
      acc[type].count++;
      acc[type].totalAmount += parseFloat(app.discount_amount);
      return acc;
    }, {} as Record<DiscountType, any>);

    // Calculate averages
    Object.keys(discountsByType).forEach(type => {
      const typeData = discountsByType[type as DiscountType];
      typeData.averageAmount = typeData.totalAmount / typeData.count;
    });

    const vatExemptTransactions = applications.filter(app => app.vat_exempted).length;
    const vatExemptAmount = applications
      .filter(app => app.vat_exempted)
      .reduce((sum, app) => sum + parseFloat(app.discount_amount), 0);

    // Top discount rules
    const ruleUsage = applications.reduce((acc, app) => {
      const ruleId = app.discount_rule_id;
      if (!acc[ruleId]) {
        acc[ruleId] = {
          ruleId,
          name: app.discount_rules.name,
          usageCount: 0,
          totalAmount: 0
        };
      }
      acc[ruleId].usageCount++;
      acc[ruleId].totalAmount += parseFloat(app.discount_amount);
      return acc;
    }, {} as Record<string, any>);

    const topDiscountRules = Object.values(ruleUsage)
      .sort((a: any, b: any) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Monthly trends (simplified - would need more complex grouping for real implementation)
    const monthlyTrends = applications.reduce((acc, app) => {
      const month = new Date(app.created_at).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = {
          month,
          discountCount: 0,
          discountAmount: 0,
          vatExemptCount: 0
        };
      }
      acc[month].discountCount++;
      acc[month].discountAmount += parseFloat(app.discount_amount);
      if (app.vat_exempted) {
        acc[month].vatExemptCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      totalDiscountsApplied,
      totalDiscountAmount,
      discountsByType,
      vatExemptTransactions,
      vatExemptAmount,
      topDiscountRules: topDiscountRules as any,
      monthlyTrends: Object.values(monthlyTrends) as any
    };
  }
}