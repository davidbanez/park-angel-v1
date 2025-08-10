import { supabase } from '../../../shared/src/lib/supabase'
import { 
  OperatorManagementServiceImpl,
  OperatorManagementService 
} from '../../../shared/src/services/operator-management'
import {
  OperatorSummary,
  OperatorProfile,
  OperatorBankDetails,
  OperatorRevenueConfig,
  VIPAssignment,
  OperatorRemittance,
  OperatorDashboardMetrics,
  CreateOperatorProfileData,
  CreateOperatorBankDetailsData,
  CreateOperatorRevenueConfigData,
  CreateVIPAssignmentData,
  RemittanceCalculation,
} from '../../../shared/src/types/operator'

class AdminOperatorService {
  private operatorService: OperatorManagementService

  constructor() {
    this.operatorService = new OperatorManagementServiceImpl(supabase as any)
  }

  // Operator Management
  async getAllOperators(): Promise<OperatorSummary[]> {
    return this.operatorService.getAllOperators()
  }

  async getOperatorProfile(operatorId: string): Promise<OperatorProfile | null> {
    return this.operatorService.getOperatorProfile(operatorId)
  }

  async createOperatorProfile(data: CreateOperatorProfileData): Promise<OperatorProfile> {
    return this.operatorService.createOperatorProfile(data)
  }

  async verifyOperator(operatorId: string, verifiedBy: string): Promise<void> {
    return this.operatorService.verifyOperator(operatorId, verifiedBy)
  }

  async getOperatorDashboardMetrics(operatorId: string): Promise<OperatorDashboardMetrics> {
    return this.operatorService.getOperatorDashboardMetrics(operatorId)
  }

  // Bank Details Management
  async getBankDetails(operatorId: string): Promise<OperatorBankDetails[]> {
    return this.operatorService.getBankDetails(operatorId)
  }

  async createBankDetails(data: CreateOperatorBankDetailsData): Promise<OperatorBankDetails> {
    return this.operatorService.createBankDetails(data)
  }

  async verifyBankAccount(bankDetailId: string, verifiedBy: string): Promise<void> {
    return this.operatorService.verifyBankAccount(bankDetailId, verifiedBy)
  }

  // Revenue Configuration
  async getRevenueConfigs(operatorId: string): Promise<OperatorRevenueConfig[]> {
    return this.operatorService.getRevenueConfigs(operatorId)
  }

  async createRevenueConfig(data: CreateOperatorRevenueConfigData): Promise<OperatorRevenueConfig> {
    return this.operatorService.createRevenueConfig(data)
  }

  async updateRevenueConfig(
    configId: string, 
    operatorPercentage: number, 
    parkAngelPercentage: number
  ): Promise<OperatorRevenueConfig> {
    return this.operatorService.updateRevenueConfig(configId, operatorPercentage, parkAngelPercentage)
  }

  // VIP Management
  async getVIPAssignments(operatorId: string): Promise<VIPAssignment[]> {
    return this.operatorService.getVIPAssignments(operatorId)
  }

  async createVIPAssignment(data: CreateVIPAssignmentData): Promise<VIPAssignment> {
    return this.operatorService.createVIPAssignment(data)
  }

  async deactivateVIPAssignment(assignmentId: string): Promise<void> {
    return this.operatorService.deactivateVIPAssignment(assignmentId)
  }

  // Remittance Management
  async calculateRemittance(
    operatorId: string, 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<RemittanceCalculation> {
    return this.operatorService.calculateRemittance(operatorId, periodStart, periodEnd)
  }

  async createRemittance(
    operatorId: string, 
    calculation: RemittanceCalculation
  ): Promise<OperatorRemittance> {
    return this.operatorService.createRemittance(operatorId, calculation)
  }

  async getRemittances(operatorId: string): Promise<OperatorRemittance[]> {
    return this.operatorService.getRemittances(operatorId)
  }

  async processRemittance(
    remittanceId: string, 
    processedBy: string, 
    paymentReference: string
  ): Promise<void> {
    return this.operatorService.processRemittance(remittanceId, processedBy, paymentReference)
  }

  // User Management for Operators
  async createOperatorUser(userData: {
    email: string
    password: string
    companyName: string
    contactPerson: string
    contactPhone: string
    contactEmail: string
    businessAddress: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  }): Promise<{ user: any; profile: OperatorProfile }> {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          user_type: 'operator',
        },
      })

      if (authError || !authData.user) {
        throw new Error(`Failed to create user: ${authError?.message}`)
      }

      // Insert user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          user_type: 'operator',
          status: 'active',
        })

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`)
      }

      // Create operator profile
      const profile = await this.createOperatorProfile({
        operatorId: authData.user.id,
        companyName: userData.companyName,
        contactPerson: userData.contactPerson,
        contactPhone: userData.contactPhone,
        contactEmail: userData.contactEmail,
        businessAddress: userData.businessAddress,
      })

      return {
        user: authData.user,
        profile,
      }
    } catch (error) {
      console.error('Error creating operator user:', error)
      throw error
    }
  }

  // Location Management for Operators
  async getOperatorLocations(operatorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          sections (
            id,
            name,
            zones (
              id,
              name,
              parking_spots (
                id,
                status
              )
            )
          )
        `)
        .eq('operator_id', operatorId)

      if (error) {
        throw new Error(`Failed to get operator locations: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error getting operator locations:', error)
      throw error
    }
  }

  async createLocation(locationData: {
    name: string
    type: 'hosted' | 'street' | 'facility'
    operatorId: string
    address: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
    coordinates: {
      latitude: number
      longitude: number
    }
    settings?: any
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: locationData.name,
          type: locationData.type,
          operator_id: locationData.operatorId,
          address: locationData.address,
          coordinates: locationData.coordinates,
          settings: locationData.settings || {},
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create location: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error creating location:', error)
      throw error
    }
  }

  // Analytics and Reporting
  async getOperatorAnalytics(operatorId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    revenue: number
    transactions: number
    occupancyRate: number
    customerSatisfaction: number
    trends: {
      date: string
      revenue: number
      transactions: number
      occupancy: number
    }[]
  }> {
    try {
      // Calculate date range based on period
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      // Get revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_shares')
        .select('*')
        .eq('operator_id', operatorId)
        .gte('created_at', startDate.toISOString())

      if (revenueError) {
        throw new Error(`Failed to get revenue data: ${revenueError.message}`)
      }

      const revenues = revenueData || []
      const totalRevenue = revenues.reduce((sum, r) => sum + (r.operator_share || 0), 0)
      const totalTransactions = revenues.length

      // Get occupancy data
      const metrics = await this.getOperatorDashboardMetrics(operatorId)

      // Generate trends data (simplified)
      const trends = []
      const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      
      for (let i = 0; i < Math.min(daysInPeriod, 30); i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dayRevenues = revenues.filter(r => {
          const rDate = new Date(r.created_at)
          return rDate.toDateString() === date.toDateString()
        })

        trends.push({
          date: date.toISOString().split('T')[0],
          revenue: dayRevenues.reduce((sum, r) => sum + (r.operator_share || 0), 0),
          transactions: dayRevenues.length,
          occupancy: metrics.occupancyRate, // Simplified - would need historical data
        })
      }

      return {
        revenue: totalRevenue,
        transactions: totalTransactions,
        occupancyRate: metrics.occupancyRate,
        customerSatisfaction: metrics.customerSatisfactionScore,
        trends,
      }
    } catch (error) {
      console.error('Error getting operator analytics:', error)
      throw error
    }
  }
}

// Export singleton instance
export const adminOperatorService = new AdminOperatorService()
export default adminOperatorService