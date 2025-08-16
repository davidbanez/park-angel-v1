import { createClient } from '@supabase/supabase-js';
import { validateQueryResult, safeAccess, isValidDatabaseResult } from '../lib/supabase';
import { 
  AbstractBaseService, 
  ServiceResult, 
  ServiceErrorCode,
  PaginationParams,
  PaginatedResult 
} from './base-service';
import { 
  ValidationUtils, 
  EntityTypeGuards, 
  DatabaseTypeGuards 
} from './type-validation';
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
      // Get revenue shares with simplified query to avoid relationship issues
      const { data, error } = await this.supabase
        .from('revenue_shares')
        .select('*')
        .eq('operator_id', operatorId)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (error) {
        throw new Error(`Failed to calculate remittance: ${error.message}`);
      }

      const validRevenues = (data || []).filter(isValidDatabaseResult);
      
      const totalRevenue = validRevenues.reduce((sum, share) => {
        const grossAmount = safeAccess(share, 'gross_amount', 0);
        return sum + (typeof grossAmount === 'number' ? grossAmount : 0);
      }, 0);
      
      const operatorShare = validRevenues.reduce((sum, share) => {
        const opShare = safeAccess(share, 'operator_share', 0);
        return sum + (typeof opShare === 'number' ? opShare : 0);
      }, 0);
      
      const parkAngelShare = validRevenues.reduce((sum, share) => {
        const platformFee = safeAccess(share, 'platform_fee', 0);
        return sum + (typeof platformFee === 'number' ? platformFee : 0);
      }, 0);

      // For breakdown by parking type, we'll need to query locations separately
      // This is a simplified approach to avoid complex relationship queries
      const streetParking = operatorShare * 0.4; // Approximate distribution
      const facilityParking = operatorShare * 0.4;
      const hostedParking = operatorShare * 0.2;

      return {
        operatorId,
        periodStart,
        periodEnd,
        totalRevenue,
        operatorShare,
        parkAngelShare,
        transactionCount: validRevenues.length,
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

      if (bankError || !bankDetails || !isValidDatabaseResult(bankDetails)) {
        throw new Error('No primary bank account found for operator');
      }

      const bankDetailId = safeAccess(bankDetails, 'id', '');
      if (!bankDetailId) {
        throw new Error('Invalid bank details ID');
      }

      const { data: remittance, error } = await this.supabase
        .from('operator_remittances')
        .insert({
          operator_id: operatorId,
          bank_detail_id: bankDetailId,
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

      if (!isValidDatabaseResult(remittance)) {
        throw new Error('Invalid remittance data returned from database');
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
      // First get users with operator type
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('id, email, status, created_at')
        .eq('user_type', 'operator');

      if (userError) {
        throw new Error(`Failed to get operators: ${userError.message}`);
      }

      // Get operator profiles separately to avoid relationship issues
      const operators = await Promise.all(
        (userData || []).map(async (user) => {
          // Type guard for user data
          if (!isValidDatabaseResult(user)) {
            console.warn('Invalid user data received:', user);
            return null;
          }

          // Get operator profile
          const { data: profileData } = await this.supabase
            .from('operator_profiles')
            .select('company_name, contact_person, contact_email, is_verified')
            .eq('operator_id', user.id)
            .single();

          const profile = validateQueryResult(profileData);
          const userId = safeAccess(user, 'id', '');
          
          // Only get metrics if we have a valid user ID
          let metrics;
          try {
            metrics = await this.getOperatorDashboardMetrics(userId);
          } catch (error) {
            console.warn(`Failed to get metrics for operator ${userId}:`, error);
            // Provide default metrics if fetch fails
            metrics = {
              operatorId: userId,
              totalLocations: 0,
              totalSpots: 0,
              occupiedSpots: 0,
              occupancyRate: 0,
              todayRevenue: 0,
              monthlyRevenue: 0,
              yearlyRevenue: 0,
              totalTransactions: 0,
              averageSessionDuration: 0,
              customerSatisfactionScore: 0,
              pendingRemittances: 0,
              lastRemittanceDate: undefined,
              vipUsersCount: 0,
              violationReports: 0,
            };
          }
          
          const userStatus = safeAccess(user, 'status', 'active');
          const validStatus = (userStatus === 'active' || userStatus === 'inactive' || userStatus === 'suspended') 
            ? userStatus 
            : 'active' as const;

          return {
            id: userId,
            companyName: safeAccess(profile, 'company_name', 'Unknown'),
            contactPerson: safeAccess(profile, 'contact_person', 'Unknown'),
            contactEmail: safeAccess(profile, 'contact_email', safeAccess(user, 'email', 'unknown@example.com')),
            isVerified: safeAccess(profile, 'is_verified', false),
            totalLocations: metrics.totalLocations,
            totalSpots: metrics.totalSpots,
            currentOccupancyRate: metrics.occupancyRate,
            monthlyRevenue: metrics.monthlyRevenue,
            status: validStatus,
            createdAt: new Date(safeAccess(user, 'created_at', new Date().toISOString())),
          };
        })
      );

      // Filter out any null results from failed processing
      return operators.filter((op): op is NonNullable<typeof op> => op !== null);
    } catch (error) {
      console.error('Error getting all operators:', error);
      throw error;
    }
  }

  async getOperatorDashboardMetrics(operatorId: string): Promise<OperatorDashboardMetrics> {
    try {
      // Get location count with simplified query
      const { data: locationData, error: locationError } = await this.supabase
        .from('locations')
        .select('id')
        .eq('operator_id', operatorId);

      if (locationError) {
        throw new Error(`Failed to get location data: ${locationError.message}`);
      }

      const validLocationData = (locationData || []).filter(isValidDatabaseResult);
      const totalLocations = validLocationData.length;
      
      // Get spot counts with simplified approach to avoid complex nested queries
      let totalSpots = 0;
      let occupiedSpots = 0;
      
      if (validLocationData.length > 0) {
        // Get sections for these locations
        const locationIds = validLocationData
          .map(l => safeAccess(l, 'id', ''))
          .filter(id => id !== '');

        if (locationIds.length > 0) {
          const { data: sectionData } = await this.supabase
            .from('sections')
            .select('id')
            .in('location_id', locationIds);

          const validSectionData = (sectionData || []).filter(isValidDatabaseResult);
          
          if (validSectionData.length > 0) {
            // Get zones for these sections
            const sectionIds = validSectionData
              .map(s => safeAccess(s, 'id', ''))
              .filter(id => id !== '');

            if (sectionIds.length > 0) {
              const { data: zoneData } = await this.supabase
                .from('zones')
                .select('id')
                .in('section_id', sectionIds);

              const validZoneData = (zoneData || []).filter(isValidDatabaseResult);

              if (validZoneData.length > 0) {
                // Get spots for these zones
                const zoneIds = validZoneData
                  .map(z => safeAccess(z, 'id', ''))
                  .filter(id => id !== '');

                if (zoneIds.length > 0) {
                  const { data: spotData } = await this.supabase
                    .from('parking_spots')
                    .select('id, status')
                    .in('zone_id', zoneIds);

                  const validSpotData = (spotData || []).filter(isValidDatabaseResult);
                  
                  if (validSpotData.length > 0) {
                    totalSpots = validSpotData.length;
                    occupiedSpots = validSpotData.filter(spot => {
                      const status = safeAccess(spot, 'status', 'available');
                      return status === 'occupied' || status === 'reserved';
                    }).length;
                  }
                }
              }
            }
          }
        }
      }



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

      const validRevenues = (revenueData || []).filter(isValidDatabaseResult);
      
      const todayRevenue = validRevenues
        .filter(r => {
          const createdAt = safeAccess(r, 'created_at', '');
          return createdAt && new Date(createdAt) >= startOfDay;
        })
        .reduce((sum, r) => {
          const operatorShare = safeAccess(r, 'operator_share', 0);
          return sum + (typeof operatorShare === 'number' ? operatorShare : 0);
        }, 0);

      const monthlyRevenue = validRevenues
        .filter(r => {
          const createdAt = safeAccess(r, 'created_at', '');
          return createdAt && new Date(createdAt) >= startOfMonth;
        })
        .reduce((sum, r) => {
          const operatorShare = safeAccess(r, 'operator_share', 0);
          return sum + (typeof operatorShare === 'number' ? operatorShare : 0);
        }, 0);

      const yearlyRevenue = validRevenues
        .filter(r => {
          const createdAt = safeAccess(r, 'created_at', '');
          return createdAt && new Date(createdAt) >= startOfYear;
        })
        .reduce((sum, r) => {
          const operatorShare = safeAccess(r, 'operator_share', 0);
          return sum + (typeof operatorShare === 'number' ? operatorShare : 0);
        }, 0);

      const totalTransactions = validRevenues.length;

      // Get VIP users count
      const { data: vipData } = await this.supabase
        .from('vip_assignments')
        .select('id')
        .eq('operator_id', operatorId)
        .eq('is_active', true);

      const validVipData = (vipData || []).filter(isValidDatabaseResult);
      const vipUsersCount = validVipData.length;

      // Get pending remittances
      const { data: remittanceData } = await this.supabase
        .from('operator_remittances')
        .select('id')
        .eq('operator_id', operatorId)
        .eq('status', 'pending');

      const validRemittanceData = (remittanceData || []).filter(isValidDatabaseResult);
      const pendingRemittances = validRemittanceData.length;

      // Get last remittance date
      const { data: lastRemittanceData } = await this.supabase
        .from('operator_remittances')
        .select('processed_at')
        .eq('operator_id', operatorId)
        .eq('status', 'completed')
        .order('processed_at', { ascending: false })
        .limit(1);

      const validLastRemittanceData = (lastRemittanceData || []).filter(isValidDatabaseResult);
      const lastRemittanceDate = validLastRemittanceData.length > 0 
        ? new Date(safeAccess(validLastRemittanceData[0], 'processed_at', new Date().toISOString()))
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

      const validData = (data || []).filter(isValidDatabaseResult);
      return validData.map(item => this.mapPerformanceMetrics(item));
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  // Helper mapping functions
  private mapOperatorProfile(data: any): OperatorProfile {
    if (!isValidDatabaseResult(data)) {
      throw new Error('Invalid operator profile data');
    }

    const licenseExpiryDate = safeAccess(data, 'license_expiry_date', null);
    
    return {
      id: safeAccess(data, 'id', ''),
      operatorId: safeAccess(data, 'operator_id', ''),
      companyName: safeAccess(data, 'company_name', ''),
      businessRegistrationNumber: safeAccess(data, 'business_registration_number', undefined),
      taxIdentificationNumber: safeAccess(data, 'tax_identification_number', undefined),
      businessAddress: safeAccess(data, 'business_address', { street: '', city: '', state: '', country: '', postalCode: '' }),
      contactPerson: safeAccess(data, 'contact_person', ''),
      contactPhone: safeAccess(data, 'contact_phone', ''),
      contactEmail: safeAccess(data, 'contact_email', ''),
      websiteUrl: safeAccess(data, 'website_url', undefined),
      businessType: safeAccess(data, 'business_type', undefined),
      licenseNumber: safeAccess(data, 'license_number', undefined),
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
      isVerified: safeAccess(data, 'is_verified', false),
      verificationDocuments: safeAccess(data, 'verification_documents', []),
      createdAt: new Date(safeAccess(data, 'created_at', new Date().toISOString())),
      updatedAt: new Date(safeAccess(data, 'updated_at', new Date().toISOString())),
    };
  }

  private mapBankDetails(data: any): OperatorBankDetails {
    if (!isValidDatabaseResult(data)) {
      throw new Error('Invalid bank details data');
    }

    return {
      id: safeAccess(data, 'id', ''),
      operatorId: safeAccess(data, 'operator_id', ''),
      bankName: safeAccess(data, 'bank_name', ''),
      accountHolderName: safeAccess(data, 'account_holder_name', ''),
      accountNumber: safeAccess(data, 'account_number', ''),
      routingNumber: safeAccess(data, 'routing_number', undefined),
      swiftCode: safeAccess(data, 'swift_code', undefined),
      branchName: safeAccess(data, 'branch_name', undefined),
      branchAddress: safeAccess(data, 'branch_address', undefined),
      accountType: safeAccess(data, 'account_type', 'checking'),
      isPrimary: safeAccess(data, 'is_primary', false),
      isVerified: safeAccess(data, 'is_verified', false),
      verificationDocuments: safeAccess(data, 'verification_documents', []),
      createdAt: new Date(safeAccess(data, 'created_at', new Date().toISOString())),
      updatedAt: new Date(safeAccess(data, 'updated_at', new Date().toISOString())),
    };
  }

  private mapRevenueConfig(data: any): OperatorRevenueConfig {
    if (!isValidDatabaseResult(data)) {
      throw new Error('Invalid revenue config data');
    }

    return {
      id: safeAccess(data, 'id', ''),
      operatorId: safeAccess(data, 'operator_id', ''),
      parkingType: safeAccess(data, 'parking_type', 'street'),
      operatorPercentage: safeAccess(data, 'operator_percentage', 0),
      parkAngelPercentage: safeAccess(data, 'park_angel_percentage', 0),
      isActive: safeAccess(data, 'is_active', true),
      effectiveDate: new Date(safeAccess(data, 'effective_date', new Date().toISOString())),
      createdBy: safeAccess(data, 'created_by', ''),
      createdAt: new Date(safeAccess(data, 'created_at', new Date().toISOString())),
      updatedAt: new Date(safeAccess(data, 'updated_at', new Date().toISOString())),
    };
  }

  private mapVIPAssignment(data: any): VIPAssignment {
    if (!isValidDatabaseResult(data)) {
      throw new Error('Invalid VIP assignment data');
    }

    const validUntil = safeAccess(data, 'valid_until', null);

    return {
      id: safeAccess(data, 'id', ''),
      userId: safeAccess(data, 'user_id', ''),
      operatorId: safeAccess(data, 'operator_id', ''),
      vipType: safeAccess(data, 'vip_type', 'VIP'),
      locationId: safeAccess(data, 'location_id', undefined),
      spotIds: safeAccess(data, 'spot_ids', []),
      timeLimitMinutes: safeAccess(data, 'time_limit_minutes', undefined),
      isActive: safeAccess(data, 'is_active', true),
      validFrom: new Date(safeAccess(data, 'valid_from', new Date().toISOString())),
      validUntil: validUntil ? new Date(validUntil) : undefined,
      assignedBy: safeAccess(data, 'assigned_by', ''),
      notes: safeAccess(data, 'notes', undefined),
      createdAt: new Date(safeAccess(data, 'created_at', new Date().toISOString())),
      updatedAt: new Date(safeAccess(data, 'updated_at', new Date().toISOString())),
    };
  }

  private mapRemittance(data: any): OperatorRemittance {
    if (!isValidDatabaseResult(data)) {
      throw new Error('Invalid remittance data');
    }

    const processedAt = safeAccess(data, 'processed_at', null);

    return {
      id: safeAccess(data, 'id', ''),
      operatorId: safeAccess(data, 'operator_id', ''),
      bankDetailId: safeAccess(data, 'bank_detail_id', ''),
      periodStart: new Date(safeAccess(data, 'period_start', new Date().toISOString())),
      periodEnd: new Date(safeAccess(data, 'period_end', new Date().toISOString())),
      totalRevenue: safeAccess(data, 'total_revenue', 0),
      operatorShare: safeAccess(data, 'operator_share', 0),
      parkAngelShare: safeAccess(data, 'park_angel_share', 0),
      transactionCount: safeAccess(data, 'transaction_count', 0),
      status: safeAccess(data, 'status', 'pending'),
      paymentReference: safeAccess(data, 'payment_reference', undefined),
      processedAt: processedAt ? new Date(processedAt) : undefined,
      processedBy: safeAccess(data, 'processed_by', undefined),
      failureReason: safeAccess(data, 'failure_reason', undefined),
      notes: safeAccess(data, 'notes', undefined),
      createdAt: new Date(safeAccess(data, 'created_at', new Date().toISOString())),
      updatedAt: new Date(safeAccess(data, 'updated_at', new Date().toISOString())),
    };
  }

  private mapPerformanceMetrics(data: any): OperatorPerformanceMetrics {
    if (!isValidDatabaseResult(data)) {
      throw new Error('Invalid performance metrics data');
    }

    return {
      id: safeAccess(data, 'id', ''),
      operatorId: safeAccess(data, 'operator_id', ''),
      metricDate: new Date(safeAccess(data, 'metric_date', new Date().toISOString())),
      totalSpots: safeAccess(data, 'total_spots', 0),
      occupiedSpots: safeAccess(data, 'occupied_spots', 0),
      occupancyRate: safeAccess(data, 'occupancy_rate', 0),
      totalRevenue: safeAccess(data, 'total_revenue', 0),
      transactionCount: safeAccess(data, 'transaction_count', 0),
      averageSessionDuration: safeAccess(data, 'average_session_duration', 0),
      customerSatisfactionScore: safeAccess(data, 'customer_satisfaction_score', undefined),
      violationReports: safeAccess(data, 'violation_reports', 0),
      responseTimeAvg: safeAccess(data, 'response_time_avg', undefined),
      createdAt: new Date(safeAccess(data, 'created_at', new Date().toISOString())),
    };
  }


}