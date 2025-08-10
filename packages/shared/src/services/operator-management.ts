import { createClient } from '@supabase/supabase-js';
import {
  OperatorProfile,
  OperatorBankDetails,
  OperatorRevenueConfig,
  OperatorRemittance,
  VIPAssignment,
  OperatorPerformanceMetrics,
  CreateOperatorProfileData,
  CreateOperatorBankDetailsData,
  CreateOperatorRevenueConfigData,
  CreateVIPAssignmentData,
  UpdateOperatorProfileData,
  OperatorSummary,
  OperatorDashboardMetrics,
  RemittanceCalculation,
} from '../types/operator';

export interface OperatorManagementService {
  // Operator Profile Management
  createOperatorProfile(data: CreateOperatorProfileData): Promise<OperatorProfile>;
  getOperatorProfile(operatorId: string): Promise<OperatorProfile | null>;
  updateOperatorProfile(operatorId: string, data: UpdateOperatorProfileData): Promise<OperatorProfile>;
  verifyOperator(operatorId: string, verifiedBy: string): Promise<void>;
  
  // Bank Details Management
  createBankDetails(data: CreateOperatorBankDetailsData): Promise<OperatorBankDetails>;
  getBankDetails(operatorId: string): Promise<OperatorBankDetails[]>;
  updateBankDetails(bankDetailId: string, data: Partial<CreateOperatorBankDetailsData>): Promise<OperatorBankDetails>;
  setPrimaryBankAccount(bankDetailId: string): Promise<void>;
  verifyBankAccount(bankDetailId: string, verifiedBy: string): Promise<void>;
  
  // Revenue Configuration
  createRevenueConfig(data: CreateOperatorRevenueConfigData): Promise<OperatorRevenueConfig>;
  getRevenueConfigs(operatorId: string): Promise<OperatorRevenueConfig[]>;
  updateRevenueConfig(configId: string, operatorPercentage: number, parkAngelPercentage: number): Promise<OperatorRevenueConfig>;
  
  // VIP Management
  createVIPAssignment(data: CreateVIPAssignmentData): Promise<VIPAssignment>;
  getVIPAssignments(operatorId: string): Promise<VIPAssignment[]>;
  updateVIPAssignment(assignmentId: string, data: Partial<CreateVIPAssignmentData>): Promise<VIPAssignment>;
  deactivateVIPAssignment(assignmentId: string): Promise<void>;
  
  // Remittance Management
  calculateRemittance(operatorId: string, periodStart: Date, periodEnd: Date): Promise<RemittanceCalculation>;
  createRemittance(operatorId: string, calculation: RemittanceCalculation): Promise<OperatorRemittance>;
  getRemittances(operatorId: string): Promise<OperatorRemittance[]>;
  processRemittance(remittanceId: string, processedBy: string, paymentReference: string): Promise<void>;
  
  // Operator Management
  getAllOperators(): Promise<OperatorSummary[]>;
  getOperatorDashboardMetrics(operatorId: string): Promise<OperatorDashboardMetrics>;
  getOperatorPerformanceMetrics(operatorId: string, startDate?: Date, endDate?: Date): Promise<OperatorPerformanceMetrics[]>;
}

export class OperatorManagementServiceImpl implements OperatorManagementService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async createOperatorProfile(data: CreateOperatorProfileData): Promise<OperatorProfile> {
    try {
      const { data: profile, error } = await this.supabase
        .from('operator_profiles')
        .insert({
          operator_id: data.operatorId,
          company_name: data.companyName,
          business_registration_number: data.businessRegistrationNumber,
          tax_identification_number: data.taxIdentificationNumber,
          business_address: data.businessAddress,
          contact_person: data.contactPerson,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          website_url: data.websiteUrl,
          business_type: data.businessType,
          license_number: data.licenseNumber,
          license_expiry_date: data.licenseExpiryDate,
          verification_documents: data.verificationDocuments || [],
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create operator profile: ${error.message}`);
      }

      return this.mapOperatorProfile(profile);
    } catch (error) {
      console.error('Error creating operator profile:', error);
      throw error;
    }
  }

  async getOperatorProfile(operatorId: string): Promise<OperatorProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('operator_profiles')
        .select('*')
        .eq('operator_id', operatorId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw new Error(`Failed to get operator profile: ${error.message}`);
      }

      return this.mapOperatorProfile(data);
    } catch (error) {
      console.error('Error getting operator profile:', error);
      throw error;
    }
  }

  async updateOperatorProfile(operatorId: string, data: UpdateOperatorProfileData): Promise<OperatorProfile> {
    try {
      const updateData: any = {};
      
      if (data.companyName) updateData.company_name = data.companyName;
      if (data.businessRegistrationNumber) updateData.business_registration_number = data.businessRegistrationNumber;
      if (data.taxIdentificationNumber) updateData.tax_identification_number = data.taxIdentificationNumber;
      if (data.businessAddress) updateData.business_address = data.businessAddress;
      if (data.contactPerson) updateData.contact_person = data.contactPerson;
      if (data.contactPhone) updateData.contact_phone = data.contactPhone;
      if (data.contactEmail) updateData.contact_email = data.contactEmail;
      if (data.websiteUrl) updateData.website_url = data.websiteUrl;
      if (data.businessType) updateData.business_type = data.businessType;
      if (data.licenseNumber) updateData.license_number = data.licenseNumber;
      if (data.licenseExpiryDate) updateData.license_expiry_date = data.licenseExpiryDate;
      if (data.verificationDocuments) updateData.verification_documents = data.verificationDocuments;

      const { data: profile, error } = await this.supabase
        .from('operator_profiles')
        .update(updateData)
        .eq('operator_id', operatorId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update operator profile: ${error.message}`);
      }

      return this.mapOperatorProfile(profile);
    } catch (error) {
      console.error('Error updating operator profile:', error);
      throw error;
    }
  }

  async verifyOperator(operatorId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_profiles')
        .update({ is_verified: true })
        .eq('operator_id', operatorId);

      if (error) {
        throw new Error(`Failed to verify operator: ${error.message}`);
      }
    } catch (error) {
      console.error('Error verifying operator:', error);
      throw error;
    }
  }

  async createBankDetails(data: CreateOperatorBankDetailsData): Promise<OperatorBankDetails> {
    try {
      const { data: bankDetails, error } = await this.supabase
        .from('operator_bank_details')
        .insert({
          operator_id: data.operatorId,
          bank_name: data.bankName,
          account_holder_name: data.accountHolderName,
          account_number: data.accountNumber,
          routing_number: data.routingNumber,
          swift_code: data.swiftCode,
          branch_name: data.branchName,
          branch_address: data.branchAddress,
          account_type: data.accountType,
          is_primary: data.isPrimary ?? true,
          verification_documents: data.verificationDocuments || [],
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create bank details: ${error.message}`);
      }

      return this.mapBankDetails(bankDetails);
    } catch (error) {
      console.error('Error creating bank details:', error);
      throw error;
    }
  }

  async getBankDetails(operatorId: string): Promise<OperatorBankDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('operator_bank_details')
        .select('*')
        .eq('operator_id', operatorId)
        .order('is_primary', { ascending: false });

      if (error) {
        throw new Error(`Failed to get bank details: ${error.message}`);
      }

      return (data || []).map(this.mapBankDetails);
    } catch (error) {
      console.error('Error getting bank details:', error);
      throw error;
    }
  }

  async updateBankDetails(bankDetailId: string, data: Partial<CreateOperatorBankDetailsData>): Promise<OperatorBankDetails> {
    try {
      const updateData: any = {};
      
      if (data.bankName) updateData.bank_name = data.bankName;
      if (data.accountHolderName) updateData.account_holder_name = data.accountHolderName;
      if (data.accountNumber) updateData.account_number = data.accountNumber;
      if (data.routingNumber) updateData.routing_number = data.routingNumber;
      if (data.swiftCode) updateData.swift_code = data.swiftCode;
      if (data.branchName) updateData.branch_name = data.branchName;
      if (data.branchAddress) updateData.branch_address = data.branchAddress;
      if (data.accountType) updateData.account_type = data.accountType;
      if (data.verificationDocuments) updateData.verification_documents = data.verificationDocuments;

      const { data: bankDetails, error } = await this.supabase
        .from('operator_bank_details')
        .update(updateData)
        .eq('id', bankDetailId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update bank details: ${error.message}`);
      }

      return this.mapBankDetails(bankDetails);
    } catch (error) {
      console.error('Error updating bank details:', error);
      throw error;
    }
  }

  async setPrimaryBankAccount(bankDetailId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_bank_details')
        .update({ is_primary: true })
        .eq('id', bankDetailId);

      if (error) {
        throw new Error(`Failed to set primary bank account: ${error.message}`);
      }
    } catch (error) {
      console.error('Error setting primary bank account:', error);
      throw error;
    }
  }

  async verifyBankAccount(bankDetailId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_bank_details')
        .update({ is_verified: true })
        .eq('id', bankDetailId);

      if (error) {
        throw new Error(`Failed to verify bank account: ${error.message}`);
      }
    } catch (error) {
      console.error('Error verifying bank account:', error);
      throw error;
    }
  }

  async createRevenueConfig(data: CreateOperatorRevenueConfigData): Promise<OperatorRevenueConfig> {
    try {
      const { data: config, error } = await this.supabase
        .from('operator_revenue_configs')
        .insert({
          operator_id: data.operatorId,
          parking_type: data.parkingType,
          operator_percentage: data.operatorPercentage,
          park_angel_percentage: data.parkAngelPercentage,
          effective_date: data.effectiveDate || new Date(),
          created_by: data.createdBy,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create revenue config: ${error.message}`);
      }

      return this.mapRevenueConfig(config);
    } catch (error) {
      console.error('Error creating revenue config:', error);
      throw error;
    }
  }

  async getRevenueConfigs(operatorId: string): Promise<OperatorRevenueConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from('operator_revenue_configs')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('is_active', true)
        .order('effective_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to get revenue configs: ${error.message}`);
      }

      return (data || []).map(this.mapRevenueConfig);
    } catch (error) {
      console.error('Error getting revenue configs:', error);
      throw error;
    }
  }

  async updateRevenueConfig(configId: string, operatorPercentage: number, parkAngelPercentage: number): Promise<OperatorRevenueConfig> {
    try {
      const { data: config, error } = await this.supabase
        .from('operator_revenue_configs')
        .update({
          operator_percentage: operatorPercentage,
          park_angel_percentage: parkAngelPercentage,
        })
        .eq('id', configId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update revenue config: ${error.message}`);
      }

      return this.mapRevenueConfig(config);
    } catch (error) {
      console.error('Error updating revenue config:', error);
      throw error;
    }
  }

  async createVIPAssignment(data: CreateVIPAssignmentData): Promise<VIPAssignment> {
    try {
      const { data: assignment, error } = await this.supabase
        .from('vip_assignments')
        .insert({
          user_id: data.userId,
          operator_id: data.operatorId,
          vip_type: data.vipType,
          location_id: data.locationId,
          spot_ids: data.spotIds || [],
          time_limit_minutes: data.timeLimitMinutes,
          valid_from: data.validFrom || new Date(),
          valid_until: data.validUntil,
          assigned_by: data.assignedBy,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create VIP assignment: ${error.message}`);
      }

      return this.mapVIPAssignment(assignment);
    } catch (error) {
      console.error('Error creating VIP assignment:', error);
      throw error;
    }
  }

  async getVIPAssignments(operatorId: string): Promise<VIPAssignment[]> {
    try {
      const { data, error } = await this.supabase
        .from('vip_assignments')
        .select(`
          *,
          users!vip_assignments_user_id_fkey (
            id,
            email,
            user_profiles (first_name, last_name)
          )
        `)
        .eq('operator_id', operatorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get VIP assignments: ${error.message}`);
      }

      return (data || []).map(this.mapVIPAssignment);
    } catch (error) {
      console.error('Error getting VIP assignments:', error);
      throw error;
    }
  }

  async updateVIPAssignment(assignmentId: string, data: Partial<CreateVIPAssignmentData>): Promise<VIPAssignment> {
    try {
      const updateData: any = {};
      
      if (data.vipType) updateData.vip_type = data.vipType;
      if (data.locationId) updateData.location_id = data.locationId;
      if (data.spotIds) updateData.spot_ids = data.spotIds;
      if (data.timeLimitMinutes) updateData.time_limit_minutes = data.timeLimitMinutes;
      if (data.validFrom) updateData.valid_from = data.validFrom;
      if (data.validUntil) updateData.valid_until = data.validUntil;
      if (data.notes) updateData.notes = data.notes;

      const { data: assignment, error } = await this.supabase
        .from('vip_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update VIP assignment: ${error.message}`);
      }

      return this.mapVIPAssignment(assignment);
    } catch (error) {
      console.error('Error updating VIP assignment:', error);
      throw error;
    }
  }

  async deactivateVIPAssignment(assignmentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('vip_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) {
        throw new Error(`Failed to deactivate VIP assignment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deactivating VIP assignment:', error);
      throw error;
    }
  }

  async calculateRemittance(operatorId: string, periodStart: Date, periodEnd: Date): Promise<RemittanceCalculation> {
    try {
      const { data, error } = await this.supabase
        .from('revenue_shares')
        .select(`
          *,
          bookings (
            *,
            parking_spots (
              *,
              zones (
                *,
                sections (
                  *,
                  locations (type)
                )
              )
            )
          )
        `)
        .eq('operator_id', operatorId)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (error) {
        throw new Error(`Failed to calculate remittance: ${error.message}`);
      }

      const revenues = data || [];
      const totalRevenue = revenues.reduce((sum, share) => sum + share.gross_amount, 0);
      const operatorShare = revenues.reduce((sum, share) => sum + (share.operator_share || 0), 0);
      const parkAngelShare = revenues.reduce((sum, share) => sum + share.platform_fee, 0);

      // Calculate breakdown by parking type
      const streetParking = revenues
        .filter(share => {
          const location = share.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'street';
        })
        .reduce((sum, share) => sum + (share.operator_share || 0), 0);

      const facilityParking = revenues
        .filter(share => {
          const location = share.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'facility';
        })
        .reduce((sum, share) => sum + (share.operator_share || 0), 0);

      const hostedParking = revenues
        .filter(share => {
          const location = share.bookings?.parking_spots?.zones?.sections?.locations;
          return location?.type === 'hosted';
        })
        .reduce((sum, share) => sum + (share.operator_share || 0), 0);

      return {
        operatorId,
        periodStart,
        periodEnd,
        totalRevenue,
        operatorShare,
        parkAngelShare,
        transactionCount: revenues.length,
        breakdown: {
          streetParking,
          facilityParking,
          hostedParking,
        },
      };
    } catch (error) {
      console.error('Error calculating remittance:', error);
      throw error;
    }
  }

  async createRemittance(operatorId: string, calculation: RemittanceCalculation): Promise<OperatorRemittance> {
    try {
      // Get primary bank details
      const { data: bankDetails, error: bankError } = await this.supabase
        .from('operator_bank_details')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('is_primary', true)
        .single();

      if (bankError || !bankDetails) {
        throw new Error('No primary bank account found for operator');
      }

      const { data: remittance, error } = await this.supabase
        .from('operator_remittances')
        .insert({
          operator_id: operatorId,
          bank_detail_id: bankDetails.id,
          period_start: calculation.periodStart,
          period_end: calculation.periodEnd,
          total_revenue: calculation.totalRevenue,
          operator_share: calculation.operatorShare,
          park_angel_share: calculation.parkAngelShare,
          transaction_count: calculation.transactionCount,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create remittance: ${error.message}`);
      }

      return this.mapRemittance(remittance);
    } catch (error) {
      console.error('Error creating remittance:', error);
      throw error;
    }
  }

  async getRemittances(operatorId: string): Promise<OperatorRemittance[]> {
    try {
      const { data, error } = await this.supabase
        .from('operator_remittances')
        .select('*')
        .eq('operator_id', operatorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get remittances: ${error.message}`);
      }

      return (data || []).map(this.mapRemittance);
    } catch (error) {
      console.error('Error getting remittances:', error);
      throw error;
    }
  }

  async processRemittance(remittanceId: string, processedBy: string, paymentReference: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_remittances')
        .update({
          status: 'completed',
          payment_reference: paymentReference,
          processed_at: new Date(),
          processed_by: processedBy,
        })
        .eq('id', remittanceId);

      if (error) {
        throw new Error(`Failed to process remittance: ${error.message}`);
      }
    } catch (error) {
      console.error('Error processing remittance:', error);
      throw error;
    }
  }

  async getAllOperators(): Promise<OperatorSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          status,
          created_at,
          operator_profiles (
            company_name,
            contact_person,
            contact_email,
            is_verified
          )
        `)
        .eq('user_type', 'operator');

      if (error) {
        throw new Error(`Failed to get operators: ${error.message}`);
      }

      // Get additional metrics for each operator
      const operators = await Promise.all(
        (data || []).map(async (operator) => {
          const metrics = await this.getOperatorDashboardMetrics(operator.id);
          
          return {
            id: operator.id,
            companyName: operator.operator_profiles?.company_name || 'Unknown',
            contactPerson: operator.operator_profiles?.contact_person || 'Unknown',
            contactEmail: operator.operator_profiles?.contact_email || operator.email,
            isVerified: operator.operator_profiles?.is_verified || false,
            totalLocations: metrics.totalLocations,
            totalSpots: metrics.totalSpots,
            currentOccupancyRate: metrics.occupancyRate,
            monthlyRevenue: metrics.monthlyRevenue,
            status: operator.status,
            createdAt: new Date(operator.created_at),
          };
        })
      );

      return operators;
    } catch (error) {
      console.error('Error getting all operators:', error);
      throw error;
    }
  }

  async getOperatorDashboardMetrics(operatorId: string): Promise<OperatorDashboardMetrics> {
    try {
      // Get location and spot counts
      const { data: locationData, error: locationError } = await this.supabase
        .from('locations')
        .select(`
          id,
          sections (
            id,
            zones (
              id,
              parking_spots (
                id,
                status
              )
            )
          )
        `)
        .eq('operator_id', operatorId);

      if (locationError) {
        throw new Error(`Failed to get location data: ${locationError.message}`);
      }

      const locations = locationData || [];
      const totalLocations = locations.length;
      
      let totalSpots = 0;
      let occupiedSpots = 0;
      
      locations.forEach(location => {
        location.sections?.forEach(section => {
          section.zones?.forEach(zone => {
            zone.parking_spots?.forEach(spot => {
              totalSpots++;
              if (spot.status === 'occupied') {
                occupiedSpots++;
              }
            });
          });
        });
      });

      const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

      // Get revenue data
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const { data: revenueData, error: revenueError } = await this.supabase
        .from('revenue_shares')
        .select('*')
        .eq('operator_id', operatorId);

      if (revenueError) {
        throw new Error(`Failed to get revenue data: ${revenueError.message}`);
      }

      const revenues = revenueData || [];
      
      const todayRevenue = revenues
        .filter(r => new Date(r.created_at) >= startOfDay)
        .reduce((sum, r) => sum + (r.operator_share || 0), 0);

      const monthlyRevenue = revenues
        .filter(r => new Date(r.created_at) >= startOfMonth)
        .reduce((sum, r) => sum + (r.operator_share || 0), 0);

      const yearlyRevenue = revenues
        .filter(r => new Date(r.created_at) >= startOfYear)
        .reduce((sum, r) => sum + (r.operator_share || 0), 0);

      const totalTransactions = revenues.length;

      // Get VIP users count
      const { data: vipData } = await this.supabase
        .from('vip_assignments')
        .select('id')
        .eq('operator_id', operatorId)
        .eq('is_active', true);

      const vipUsersCount = vipData?.length || 0;

      // Get pending remittances
      const { data: remittanceData } = await this.supabase
        .from('operator_remittances')
        .select('id')
        .eq('operator_id', operatorId)
        .eq('status', 'pending');

      const pendingRemittances = remittanceData?.length || 0;

      // Get last remittance date
      const { data: lastRemittanceData } = await this.supabase
        .from('operator_remittances')
        .select('processed_at')
        .eq('operator_id', operatorId)
        .eq('status', 'completed')
        .order('processed_at', { ascending: false })
        .limit(1);

      const lastRemittanceDate = lastRemittanceData?.[0]?.processed_at 
        ? new Date(lastRemittanceData[0].processed_at) 
        : undefined;

      return {
        operatorId,
        totalLocations,
        totalSpots,
        occupiedSpots,
        occupancyRate,
        todayRevenue,
        monthlyRevenue,
        yearlyRevenue,
        totalTransactions,
        averageSessionDuration: 0, // Would need booking data to calculate
        customerSatisfactionScore: 0, // Would need rating data to calculate
        pendingRemittances,
        lastRemittanceDate,
        vipUsersCount,
        violationReports: 0, // Would need violation data to calculate
      };
    } catch (error) {
      console.error('Error getting operator dashboard metrics:', error);
      throw error;
    }
  }

  async getOperatorPerformanceMetrics(operatorId: string, startDate?: Date, endDate?: Date): Promise<OperatorPerformanceMetrics[]> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const { data, error } = await this.supabase
        .from('operator_performance_metrics')
        .select('*')
        .eq('operator_id', operatorId)
        .gte('metric_date', start.toISOString().split('T')[0])
        .lte('metric_date', end.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to get performance metrics: ${error.message}`);
      }

      return (data || []).map(this.mapPerformanceMetrics);
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  // Helper mapping functions
  private mapOperatorProfile(data: any): OperatorProfile {
    return {
      id: data.id,
      operatorId: data.operator_id,
      companyName: data.company_name,
      businessRegistrationNumber: data.business_registration_number,
      taxIdentificationNumber: data.tax_identification_number,
      businessAddress: data.business_address,
      contactPerson: data.contact_person,
      contactPhone: data.contact_phone,
      contactEmail: data.contact_email,
      websiteUrl: data.website_url,
      businessType: data.business_type,
      licenseNumber: data.license_number,
      licenseExpiryDate: data.license_expiry_date ? new Date(data.license_expiry_date) : undefined,
      isVerified: data.is_verified,
      verificationDocuments: data.verification_documents || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapBankDetails(data: any): OperatorBankDetails {
    return {
      id: data.id,
      operatorId: data.operator_id,
      bankName: data.bank_name,
      accountHolderName: data.account_holder_name,
      accountNumber: data.account_number,
      routingNumber: data.routing_number,
      swiftCode: data.swift_code,
      branchName: data.branch_name,
      branchAddress: data.branch_address,
      accountType: data.account_type,
      isPrimary: data.is_primary,
      isVerified: data.is_verified,
      verificationDocuments: data.verification_documents || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapRevenueConfig(data: any): OperatorRevenueConfig {
    return {
      id: data.id,
      operatorId: data.operator_id,
      parkingType: data.parking_type,
      operatorPercentage: data.operator_percentage,
      parkAngelPercentage: data.park_angel_percentage,
      isActive: data.is_active,
      effectiveDate: new Date(data.effective_date),
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapVIPAssignment(data: any): VIPAssignment {
    return {
      id: data.id,
      userId: data.user_id,
      operatorId: data.operator_id,
      vipType: data.vip_type,
      locationId: data.location_id,
      spotIds: data.spot_ids || [],
      timeLimitMinutes: data.time_limit_minutes,
      isActive: data.is_active,
      validFrom: new Date(data.valid_from),
      validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
      assignedBy: data.assigned_by,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapRemittance(data: any): OperatorRemittance {
    return {
      id: data.id,
      operatorId: data.operator_id,
      bankDetailId: data.bank_detail_id,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      totalRevenue: data.total_revenue,
      operatorShare: data.operator_share,
      parkAngelShare: data.park_angel_share,
      transactionCount: data.transaction_count,
      status: data.status,
      paymentReference: data.payment_reference,
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      processedBy: data.processed_by,
      failureReason: data.failure_reason,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapPerformanceMetrics(data: any): OperatorPerformanceMetrics {
    return {
      id: data.id,
      operatorId: data.operator_id,
      metricDate: new Date(data.metric_date),
      totalSpots: data.total_spots,
      occupiedSpots: data.occupied_spots,
      occupancyRate: data.occupancy_rate,
      totalRevenue: data.total_revenue,
      transactionCount: data.transaction_count,
      averageSessionDuration: data.average_session_duration,
      customerSatisfactionScore: data.customer_satisfaction_score,
      violationReports: data.violation_reports,
      responseTimeAvg: data.response_time_avg,
      createdAt: new Date(data.created_at),
    };
  }
}