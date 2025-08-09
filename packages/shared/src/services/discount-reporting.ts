import { SupabaseClient } from '@supabase/supabase-js';
import { DiscountType } from '../types';

export interface DiscountReportFilters {
  operatorId?: string;
  discountType?: DiscountType;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  minAmount?: number;
  maxAmount?: number;
  vatExemptOnly?: boolean;
}

export interface DiscountSummaryReport {
  totalApplications: number;
  totalDiscountAmount: number;
  totalOriginalAmount: number;
  averageDiscountPercentage: number;
  vatExemptApplications: number;
  vatExemptAmount: number;
  topDiscountTypes: Array<{
    type: DiscountType;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    discountAmount: number;
    originalAmount: number;
    savingsRate: number;
  }>;
}

export interface DiscountDetailReport {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  discountRuleName: string;
  discountType: DiscountType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
  vatExempted: boolean;
  appliedBy: string;
  appliedByName: string;
  verificationDocumentUrl?: string;
  appliedAt: Date;
  spotLocation?: string;
}

export interface VATExemptionReport {
  totalExemptTransactions: number;
  totalExemptAmount: number;
  totalVATSaved: number;
  exemptionsByType: Array<{
    discountType: DiscountType;
    count: number;
    totalAmount: number;
    vatSaved: number;
  }>;
  exemptionsByMonth: Array<{
    month: string;
    exemptTransactions: number;
    exemptAmount: number;
    vatSaved: number;
  }>;
  topExemptUsers: Array<{
    userId: string;
    userName: string;
    exemptTransactions: number;
    totalVATSaved: number;
  }>;
}

export interface DiscountComplianceReport {
  seniorCitizenCompliance: {
    totalApplications: number;
    verifiedApplications: number;
    unverifiedApplications: number;
    complianceRate: number;
    averageVerificationTime: number; // in hours
  };
  pwdCompliance: {
    totalApplications: number;
    verifiedApplications: number;
    unverifiedApplications: number;
    complianceRate: number;
    averageVerificationTime: number; // in hours
  };
  documentVerificationStatus: Array<{
    documentType: string;
    pending: number;
    approved: number;
    rejected: number;
    totalSubmitted: number;
    approvalRate: number;
  }>;
}

export interface DiscountPerformanceReport {
  rulePerformance: Array<{
    ruleId: string;
    ruleName: string;
    type: DiscountType;
    totalUsage: number;
    totalDiscountAmount: number;
    averageDiscountAmount: number;
    usageGrowthRate: number; // month-over-month
    revenueImpact: number;
    popularityRank: number;
  }>;
  operatorComparison: Array<{
    operatorId: string;
    operatorName: string;
    totalDiscounts: number;
    totalDiscountAmount: number;
    averageDiscountRate: number;
    customerSatisfactionScore?: number;
  }>;
}

export class DiscountReportingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generates a comprehensive discount summary report
   */
  async generateSummaryReport(filters: DiscountReportFilters = {}): Promise<DiscountSummaryReport> {
    const query = this.buildBaseQuery(filters);
    
    const { data: applications, error } = await query;
    
    if (error) {
      throw new Error(`Failed to generate summary report: ${error.message}`);
    }

    return this.calculateSummaryMetrics(applications);
  }

  /**
   * Generates a detailed discount application report
   */
  async generateDetailReport(filters: DiscountReportFilters = {}): Promise<DiscountDetailReport[]> {
    let query = this.supabase
      .from('discount_applications')
      .select(`
        *,
        bookings!inner(
          id,
          user_id,
          parking_spots!inner(
            zones!inner(
              sections!inner(
                locations!inner(name)
              )
            )
          )
        ),
        discount_rules!inner(name, type),
        user_profiles!discount_applications_applied_by_fkey(full_name),
        booking_user:user_profiles!discount_applications_booking_user_fkey(full_name)
      `);

    query = this.applyFilters(query, filters);

    const { data: applications, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to generate detail report: ${error.message}`);
    }

    return applications.map(app => this.mapToDetailReport(app));
  }

  /**
   * Generates VAT exemption report
   */
  async generateVATExemptionReport(filters: DiscountReportFilters = {}): Promise<VATExemptionReport> {
    let query = this.supabase
      .from('discount_applications')
      .select(`
        *,
        discount_rules!inner(type),
        bookings!inner(user_id),
        user_profiles!discount_applications_booking_user_fkey(full_name)
      `)
      .eq('vat_exempted', true);

    query = this.applyFilters(query, filters);

    const { data: exemptApplications, error } = await query;

    if (error) {
      throw new Error(`Failed to generate VAT exemption report: ${error.message}`);
    }

    return this.calculateVATExemptionMetrics(exemptApplications);
  }

  /**
   * Generates discount compliance report
   */
  async generateComplianceReport(filters: DiscountReportFilters = {}): Promise<DiscountComplianceReport> {
    // Get discount applications with verification status
    let applicationsQuery = this.supabase
      .from('discount_applications')
      .select(`
        *,
        discount_rules!inner(type),
        discount_verification_documents(status, created_at, verified_at)
      `);

    applicationsQuery = this.applyFilters(applicationsQuery, filters);

    const { data: applications, error: appError } = await applicationsQuery;

    if (appError) {
      throw new Error(`Failed to fetch applications for compliance report: ${appError.message}`);
    }

    // Get document verification statistics
    let documentsQuery = this.supabase
      .from('discount_verification_documents')
      .select('document_type, status, created_at, verified_at');

    if (filters.startDate) {
      documentsQuery = documentsQuery.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      documentsQuery = documentsQuery.lte('created_at', filters.endDate.toISOString());
    }

    const { data: documents, error: docError } = await documentsQuery;

    if (docError) {
      throw new Error(`Failed to fetch documents for compliance report: ${docError.message}`);
    }

    return this.calculateComplianceMetrics(applications, documents);
  }

  /**
   * Generates discount performance report
   */
  async generatePerformanceReport(filters: DiscountReportFilters = {}): Promise<DiscountPerformanceReport> {
    // Get rule performance data
    let query = this.supabase
      .from('discount_applications')
      .select(`
        *,
        discount_rules!inner(id, name, type, operator_id),
        operators:users!discount_rules_operator_id_fkey(id, user_profiles!inner(full_name))
      `);

    query = this.applyFilters(query, filters);

    const { data: applications, error } = await query;

    if (error) {
      throw new Error(`Failed to generate performance report: ${error.message}`);
    }

    return this.calculatePerformanceMetrics(applications);
  }

  /**
   * Exports discount data to CSV format
   */
  async exportToCSV(
    reportType: 'summary' | 'detail' | 'vat_exemption' | 'compliance' | 'performance',
    filters: DiscountReportFilters = {}
  ): Promise<string> {
    let data: any[];
    let headers: string[];

    switch (reportType) {
      case 'detail':
        const detailReport = await this.generateDetailReport(filters);
        headers = [
          'Booking ID', 'User Name', 'Discount Rule', 'Discount Type',
          'Original Amount', 'Discount Amount', 'Final Amount', 'Discount %',
          'VAT Exempted', 'Applied By', 'Applied At', 'Location'
        ];
        data = detailReport.map(item => [
          item.bookingId, item.userName, item.discountRuleName, item.discountType,
          item.originalAmount, item.discountAmount, item.finalAmount, item.discountPercentage,
          item.vatExempted ? 'Yes' : 'No', item.appliedByName, item.appliedAt.toISOString(),
          item.spotLocation || 'N/A'
        ]);
        break;

      case 'vat_exemption':
        const vatReport = await this.generateVATExemptionReport(filters);
        headers = ['Discount Type', 'Count', 'Total Amount', 'VAT Saved'];
        data = vatReport.exemptionsByType.map(item => [
          item.discountType, item.count, item.totalAmount, item.vatSaved
        ]);
        break;

      default:
        throw new Error(`Export not supported for report type: ${reportType}`);
    }

    return this.convertToCSV(headers, data);
  }

  /**
   * Gets discount trends over time
   */
  async getDiscountTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    filters: DiscountReportFilters = {}
  ): Promise<Array<{
    period: string;
    totalApplications: number;
    totalDiscountAmount: number;
    averageDiscountAmount: number;
    uniqueUsers: number;
  }>> {
    const dateFormat = period === 'daily' ? 'YYYY-MM-DD' : 
                      period === 'weekly' ? 'YYYY-"W"WW' : 'YYYY-MM';

    let query = this.supabase
      .from('discount_applications')
      .select(`
        created_at,
        discount_amount,
        bookings!inner(user_id)
      `);

    query = this.applyFilters(query, filters);

    const { data: applications, error } = await query;

    if (error) {
      throw new Error(`Failed to get discount trends: ${error.message}`);
    }

    // Group by period
    const grouped = applications.reduce((acc, app) => {
      const date = new Date(app.created_at);
      let periodKey: string;

      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!acc[periodKey]) {
        acc[periodKey] = {
          period: periodKey,
          totalApplications: 0,
          totalDiscountAmount: 0,
          averageDiscountAmount: 0,
          uniqueUsers: new Set()
        };
      }

      acc[periodKey].totalApplications++;
      acc[periodKey].totalDiscountAmount += parseFloat(app.discount_amount);
      acc[periodKey].uniqueUsers.add(app.bookings.user_id);

      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and convert Set to count
    return Object.values(grouped).map((item: any) => ({
      period: item.period,
      totalApplications: item.totalApplications,
      totalDiscountAmount: item.totalDiscountAmount,
      averageDiscountAmount: item.totalDiscountAmount / item.totalApplications,
      uniqueUsers: item.uniqueUsers.size
    }));
  }

  // Private helper methods
  private buildBaseQuery(filters: DiscountReportFilters) {
    let query = this.supabase
      .from('discount_applications')
      .select(`
        *,
        discount_rules!inner(name, type, operator_id)
      `);

    return this.applyFilters(query, filters);
  }

  private applyFilters(query: any, filters: DiscountReportFilters) {
    if (filters.operatorId) {
      query = query.eq('discount_rules.operator_id', filters.operatorId);
    }

    if (filters.discountType) {
      query = query.eq('discount_rules.type', filters.discountType);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters.minAmount) {
      query = query.gte('discount_amount', filters.minAmount);
    }

    if (filters.maxAmount) {
      query = query.lte('discount_amount', filters.maxAmount);
    }

    if (filters.vatExemptOnly) {
      query = query.eq('vat_exempted', true);
    }

    return query;
  }

  private calculateSummaryMetrics(applications: any[]): DiscountSummaryReport {
    const totalApplications = applications.length;
    const totalDiscountAmount = applications.reduce((sum, app) => sum + parseFloat(app.discount_amount), 0);
    const totalOriginalAmount = applications.reduce((sum, app) => sum + parseFloat(app.original_amount), 0);
    const averageDiscountPercentage = totalOriginalAmount > 0 ? 
      (totalDiscountAmount / totalOriginalAmount) * 100 : 0;

    const vatExemptApplications = applications.filter(app => app.vat_exempted).length;
    const vatExemptAmount = applications
      .filter(app => app.vat_exempted)
      .reduce((sum, app) => sum + parseFloat(app.discount_amount), 0);

    // Calculate top discount types
    const typeStats = applications.reduce((acc, app) => {
      const type = app.discount_rules.type;
      if (!acc[type]) {
        acc[type] = { count: 0, totalAmount: 0 };
      }
      acc[type].count++;
      acc[type].totalAmount += parseFloat(app.discount_amount);
      return acc;
    }, {} as Record<string, any>);

    const topDiscountTypes = Object.entries(typeStats)
      .map(([type, stats]: [string, any]) => ({
        type: type as DiscountType,
        count: stats.count,
        totalAmount: stats.totalAmount,
        percentage: (stats.count / totalApplications) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate monthly trends
    const monthlyStats = applications.reduce((acc, app) => {
      const month = new Date(app.created_at).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = {
          applications: 0,
          discountAmount: 0,
          originalAmount: 0
        };
      }
      acc[month].applications++;
      acc[month].discountAmount += parseFloat(app.discount_amount);
      acc[month].originalAmount += parseFloat(app.original_amount);
      return acc;
    }, {} as Record<string, any>);

    const monthlyTrends = Object.entries(monthlyStats)
      .map(([month, stats]: [string, any]) => ({
        month,
        applications: stats.applications,
        discountAmount: stats.discountAmount,
        originalAmount: stats.originalAmount,
        savingsRate: (stats.discountAmount / stats.originalAmount) * 100
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalApplications,
      totalDiscountAmount,
      totalOriginalAmount,
      averageDiscountPercentage,
      vatExemptApplications,
      vatExemptAmount,
      topDiscountTypes,
      monthlyTrends
    };
  }

  private mapToDetailReport(app: any): DiscountDetailReport {
    return {
      id: app.id,
      bookingId: app.booking_id,
      userId: app.bookings.user_id,
      userName: app.booking_user?.full_name || 'Unknown',
      discountRuleName: app.discount_rules.name,
      discountType: app.discount_rules.type,
      originalAmount: parseFloat(app.original_amount),
      discountAmount: parseFloat(app.discount_amount),
      finalAmount: parseFloat(app.final_amount),
      discountPercentage: (parseFloat(app.discount_amount) / parseFloat(app.original_amount)) * 100,
      vatExempted: app.vat_exempted,
      appliedBy: app.applied_by,
      appliedByName: app.user_profiles?.full_name || 'System',
      verificationDocumentUrl: app.verification_document_url,
      appliedAt: new Date(app.created_at),
      spotLocation: app.bookings?.parking_spots?.zones?.sections?.locations?.name
    };
  }

  private calculateVATExemptionMetrics(applications: any[]): VATExemptionReport {
    const totalExemptTransactions = applications.length;
    const totalExemptAmount = applications.reduce((sum, app) => sum + parseFloat(app.discount_amount), 0);
    const totalVATSaved = totalExemptAmount * 0.12; // 12% VAT in Philippines

    // Group by discount type
    const exemptionsByType = applications.reduce((acc, app) => {
      const type = app.discount_rules.type;
      if (!acc[type]) {
        acc[type] = { count: 0, totalAmount: 0 };
      }
      acc[type].count++;
      acc[type].totalAmount += parseFloat(app.discount_amount);
      return acc;
    }, {} as Record<string, any>);

    const exemptionsByTypeArray = Object.entries(exemptionsByType)
      .map(([type, stats]: [string, any]) => ({
        discountType: type as DiscountType,
        count: stats.count,
        totalAmount: stats.totalAmount,
        vatSaved: stats.totalAmount * 0.12
      }));

    // Group by month
    const exemptionsByMonth = applications.reduce((acc, app) => {
      const month = new Date(app.created_at).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { count: 0, totalAmount: 0 };
      }
      acc[month].count++;
      acc[month].totalAmount += parseFloat(app.discount_amount);
      return acc;
    }, {} as Record<string, any>);

    const exemptionsByMonthArray = Object.entries(exemptionsByMonth)
      .map(([month, stats]: [string, any]) => ({
        month,
        exemptTransactions: stats.count,
        exemptAmount: stats.totalAmount,
        vatSaved: stats.totalAmount * 0.12
      }));

    // Top exempt users
    const userStats = applications.reduce((acc, app) => {
      const userId = app.bookings.user_id;
      const userName = app.user_profiles?.full_name || 'Unknown';
      if (!acc[userId]) {
        acc[userId] = { userName, count: 0, totalVATSaved: 0 };
      }
      acc[userId].count++;
      acc[userId].totalVATSaved += parseFloat(app.discount_amount) * 0.12;
      return acc;
    }, {} as Record<string, any>);

    const topExemptUsers = Object.entries(userStats)
      .map(([userId, stats]: [string, any]) => ({
        userId,
        userName: stats.userName,
        exemptTransactions: stats.count,
        totalVATSaved: stats.totalVATSaved
      }))
      .sort((a, b) => b.totalVATSaved - a.totalVATSaved)
      .slice(0, 10);

    return {
      totalExemptTransactions,
      totalExemptAmount,
      totalVATSaved,
      exemptionsByType: exemptionsByTypeArray,
      exemptionsByMonth: exemptionsByMonthArray,
      topExemptUsers
    };
  }

  private calculateComplianceMetrics(applications: any[], documents: any[]): DiscountComplianceReport {
    // Senior citizen compliance
    const seniorApplications = applications.filter(app => app.discount_rules.type === 'senior');
    const seniorVerified = seniorApplications.filter(app => 
      app.discount_verification_documents?.some((doc: any) => doc.status === 'approved')
    );

    // PWD compliance
    const pwdApplications = applications.filter(app => app.discount_rules.type === 'pwd');
    const pwdVerified = pwdApplications.filter(app => 
      app.discount_verification_documents?.some((doc: any) => doc.status === 'approved')
    );

    // Document verification status
    const docStats = documents.reduce((acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = { pending: 0, approved: 0, rejected: 0 };
      }
      acc[doc.document_type][doc.status]++;
      return acc;
    }, {} as Record<string, any>);

    const documentVerificationStatus = Object.entries(docStats)
      .map(([docType, stats]: [string, any]) => {
        const total = stats.pending + stats.approved + stats.rejected;
        return {
          documentType: docType,
          pending: stats.pending,
          approved: stats.approved,
          rejected: stats.rejected,
          totalSubmitted: total,
          approvalRate: total > 0 ? (stats.approved / total) * 100 : 0
        };
      });

    return {
      seniorCitizenCompliance: {
        totalApplications: seniorApplications.length,
        verifiedApplications: seniorVerified.length,
        unverifiedApplications: seniorApplications.length - seniorVerified.length,
        complianceRate: seniorApplications.length > 0 ? 
          (seniorVerified.length / seniorApplications.length) * 100 : 0,
        averageVerificationTime: this.calculateAverageVerificationTime(seniorApplications)
      },
      pwdCompliance: {
        totalApplications: pwdApplications.length,
        verifiedApplications: pwdVerified.length,
        unverifiedApplications: pwdApplications.length - pwdVerified.length,
        complianceRate: pwdApplications.length > 0 ? 
          (pwdVerified.length / pwdApplications.length) * 100 : 0,
        averageVerificationTime: this.calculateAverageVerificationTime(pwdApplications)
      },
      documentVerificationStatus
    };
  }

  private calculatePerformanceMetrics(applications: any[]): DiscountPerformanceReport {
    // Rule performance
    const ruleStats = applications.reduce((acc, app) => {
      const ruleId = app.discount_rules.id;
      if (!acc[ruleId]) {
        acc[ruleId] = {
          ruleId,
          ruleName: app.discount_rules.name,
          type: app.discount_rules.type,
          usage: 0,
          totalAmount: 0
        };
      }
      acc[ruleId].usage++;
      acc[ruleId].totalAmount += parseFloat(app.discount_amount);
      return acc;
    }, {} as Record<string, any>);

    const rulePerformance = Object.values(ruleStats)
      .map((stats: any, index) => ({
        ruleId: stats.ruleId,
        ruleName: stats.ruleName,
        type: stats.type,
        totalUsage: stats.usage,
        totalDiscountAmount: stats.totalAmount,
        averageDiscountAmount: stats.totalAmount / stats.usage,
        usageGrowthRate: 0, // Would need historical data to calculate
        revenueImpact: stats.totalAmount,
        popularityRank: index + 1
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);

    // Operator comparison
    const operatorStats = applications.reduce((acc, app) => {
      const operatorId = app.discount_rules.operator_id || 'system';
      const operatorName = app.operators?.user_profiles?.full_name || 'System';
      
      if (!acc[operatorId]) {
        acc[operatorId] = {
          operatorId,
          operatorName,
          totalDiscounts: 0,
          totalAmount: 0,
          totalOriginalAmount: 0
        };
      }
      
      acc[operatorId].totalDiscounts++;
      acc[operatorId].totalAmount += parseFloat(app.discount_amount);
      acc[operatorId].totalOriginalAmount += parseFloat(app.original_amount);
      
      return acc;
    }, {} as Record<string, any>);

    const operatorComparison = Object.values(operatorStats)
      .map((stats: any) => ({
        operatorId: stats.operatorId,
        operatorName: stats.operatorName,
        totalDiscounts: stats.totalDiscounts,
        totalDiscountAmount: stats.totalAmount,
        averageDiscountRate: (stats.totalAmount / stats.totalOriginalAmount) * 100
      }));

    return {
      rulePerformance,
      operatorComparison
    };
  }

  private calculateAverageVerificationTime(applications: any[]): number {
    const verificationTimes = applications
      .filter(app => app.discount_verification_documents?.length > 0)
      .map(app => {
        const doc = app.discount_verification_documents[0];
        if (doc.verified_at && doc.created_at) {
          const created = new Date(doc.created_at);
          const verified = new Date(doc.verified_at);
          return (verified.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        }
        return 0;
      })
      .filter(time => time > 0);

    return verificationTimes.length > 0 ? 
      verificationTimes.reduce((sum, time) => sum + time, 0) / verificationTimes.length : 0;
  }

  private convertToCSV(headers: string[], data: any[][]): string {
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}