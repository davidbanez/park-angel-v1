import { supabase } from '@park-angel/shared/src/config/supabase';
import { 
  FinancialReportingServiceImpl,
  DiscountReportingService
} from '@park-angel/shared/src/services';
import {
  FinancialReport,
  FinancialReportType,
  FinancialReportParams,
  ExportFormat,
  ReportExportResult
} from '@park-angel/shared/src/types/financial-reporting';

export interface ReportType {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'performance' | 'compliance';
  parameters: ReportParameter[];
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'select' | 'multiselect' | 'number' | 'text' | 'boolean';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportRequest {
  reportTypeId: string;
  parameters: Record<string, any>;
  filters?: ReportFilter[];
  sorting?: ReportSort[];
  pagination?: {
    page: number;
    pageSize: number;
  };
  searchQuery?: string;
}

export interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  metadata: {
    recordCount: number;
    totalAmount?: number;
    currency?: string;
    generatedAt: Date;
    generatedBy: string;
    processingTime: number;
  };
  filters: ReportFilter[];
  sorting: ReportSort[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  reportTypeId: string;
  parameters: Record<string, any>;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:mm format
  };
  recipients: string[]; // email addresses
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: string;
  createdAt: Date;
}

export interface PerformanceMetric {
  feature: string;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  throughput: number;
  period: string;
  slaTarget: number;
  slaCompliance: number;
}

export class ReportingService {
  private financialReportingService: FinancialReportingServiceImpl;
  private discountReportingService: DiscountReportingService;

  constructor() {
    const serviceFactory = new ServiceFactory(supabase);
    this.financialReportingService = serviceFactory.createFinancialReportingService();
    this.discountReportingService = serviceFactory.createDiscountReportingService();
  }

  /**
   * Get all available report types
   */
  getAvailableReportTypes(): ReportType[] {
    return [
      // Financial Reports
      {
        id: 'operator_revenue',
        name: 'Operator Revenue Report',
        description: 'Detailed revenue analysis for operators including transactions, payouts, and trends',
        category: 'financial',
        parameters: [
          { name: 'operatorId', label: 'Operator', type: 'select', required: true, options: [] },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'includeTrends', label: 'Include Monthly Trends', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'host_revenue',
        name: 'Host Revenue Report',
        description: 'Revenue analysis for hosted parking including occupancy rates and listing performance',
        category: 'financial',
        parameters: [
          { name: 'hostId', label: 'Host', type: 'select', required: true, options: [] },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'includeOccupancy', label: 'Include Occupancy Analysis', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'transaction_reconciliation',
        name: 'Transaction Reconciliation Report',
        description: 'Comprehensive transaction reconciliation with discrepancy analysis',
        category: 'financial',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'includeDiscrepancies', label: 'Include Discrepancy Details', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'payout_summary',
        name: 'Payout Summary Report',
        description: 'Summary of all payouts with status tracking and bank account details',
        category: 'financial',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'recipientType', label: 'Recipient Type', type: 'select', required: false, options: [
            { value: 'operator', label: 'Operators' },
            { value: 'host', label: 'Hosts' },
            { value: 'all', label: 'All Recipients' }
          ], defaultValue: 'all' },
          { name: 'status', label: 'Payout Status', type: 'multiselect', required: false, options: [
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' }
          ] }
        ]
      },
      {
        id: 'revenue_analysis',
        name: 'Revenue Analysis Report',
        description: 'Comprehensive revenue analysis across all parking types and locations',
        category: 'financial',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'parkingTypes', label: 'Parking Types', type: 'multiselect', required: false, options: [
            { value: 'hosted', label: 'Hosted Parking' },
            { value: 'street', label: 'Street Parking' },
            { value: 'facility', label: 'Parking Facility' }
          ] },
          { name: 'groupBy', label: 'Group By', type: 'select', required: false, options: [
            { value: 'type', label: 'Parking Type' },
            { value: 'location', label: 'Location' },
            { value: 'operator', label: 'Operator' },
            { value: 'month', label: 'Month' }
          ], defaultValue: 'type' }
        ]
      },

      // Operational Reports
      {
        id: 'parking_inventory',
        name: 'Parking Inventory Report',
        description: 'Complete inventory of parking spots across all locations with utilization metrics',
        category: 'operational',
        parameters: [
          { name: 'locationIds', label: 'Locations', type: 'multiselect', required: false, options: [] },
          { name: 'parkingTypes', label: 'Parking Types', type: 'multiselect', required: false, options: [
            { value: 'hosted', label: 'Hosted Parking' },
            { value: 'street', label: 'Street Parking' },
            { value: 'facility', label: 'Parking Facility' }
          ] },
          { name: 'includeUtilization', label: 'Include Utilization Metrics', type: 'boolean', required: false, defaultValue: true },
          { name: 'period', label: 'Utilization Period', type: 'select', required: false, options: [
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' }
          ], defaultValue: '30d' }
        ]
      },
      {
        id: 'user_analytics',
        name: 'User Analytics Report',
        description: 'User behavior analysis including registration trends, booking patterns, and engagement metrics',
        category: 'operational',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'userTypes', label: 'User Types', type: 'multiselect', required: false, options: [
            { value: 'client', label: 'Clients' },
            { value: 'host', label: 'Hosts' },
            { value: 'operator', label: 'Operators' }
          ] },
          { name: 'includeEngagement', label: 'Include Engagement Metrics', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'violation_reports',
        name: 'Violation Reports',
        description: 'Analysis of parking violations, enforcement actions, and compliance metrics',
        category: 'operational',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'locationIds', label: 'Locations', type: 'multiselect', required: false, options: [] },
          { name: 'violationTypes', label: 'Violation Types', type: 'multiselect', required: false, options: [
            { value: 'overstay', label: 'Overstay' },
            { value: 'no_payment', label: 'No Payment' },
            { value: 'unauthorized', label: 'Unauthorized Parking' },
            { value: 'blocking', label: 'Blocking Access' }
          ] },
          { name: 'includeEnforcement', label: 'Include Enforcement Actions', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'vip_usage',
        name: 'VIP Usage Report',
        description: 'Analysis of VIP parking usage across all VIP types and locations',
        category: 'operational',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'vipTypes', label: 'VIP Types', type: 'multiselect', required: false, options: [
            { value: 'vvip', label: 'VVIP' },
            { value: 'flex_vvip', label: 'Flex VVIP' },
            { value: 'vip', label: 'VIP' },
            { value: 'flex_vip', label: 'Flex VIP' }
          ] },
          { name: 'locationIds', label: 'Locations', type: 'multiselect', required: false, options: [] }
        ]
      },

      // Performance Reports
      {
        id: 'performance_monitoring',
        name: 'Performance Monitoring Report',
        description: 'System performance metrics including response times, error rates, and SLA compliance',
        category: 'performance',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'features', label: 'Features', type: 'multiselect', required: false, options: [
            { value: 'booking', label: 'Booking System' },
            { value: 'payment', label: 'Payment Processing' },
            { value: 'messaging', label: 'Messaging System' },
            { value: 'violation_reporting', label: 'Violation Reporting' },
            { value: 'support_tickets', label: 'Support Tickets' }
          ] },
          { name: 'includeSLA', label: 'Include SLA Analysis', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'api_usage',
        name: 'API Usage Report',
        description: 'Third-party API usage statistics, billing, and performance metrics',
        category: 'performance',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'apiKeys', label: 'API Keys', type: 'multiselect', required: false, options: [] },
          { name: 'includeRevenue', label: 'Include Revenue Analysis', type: 'boolean', required: false, defaultValue: true }
        ]
      },

      // Compliance Reports
      {
        id: 'discount_summary',
        name: 'Discount Summary Report',
        description: 'Comprehensive analysis of discount applications and VAT exemptions',
        category: 'compliance',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'discountTypes', label: 'Discount Types', type: 'multiselect', required: false, options: [
            { value: 'senior', label: 'Senior Citizen' },
            { value: 'pwd', label: 'PWD' },
            { value: 'custom', label: 'Custom Discounts' }
          ] },
          { name: 'operatorIds', label: 'Operators', type: 'multiselect', required: false, options: [] }
        ]
      },
      {
        id: 'vat_exemption',
        name: 'VAT Exemption Report',
        description: 'VAT exemption analysis for compliance and audit purposes',
        category: 'compliance',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'exemptionTypes', label: 'Exemption Types', type: 'multiselect', required: false, options: [
            { value: 'senior', label: 'Senior Citizen' },
            { value: 'pwd', label: 'PWD' }
          ] }
        ]
      },
      {
        id: 'audit_trail',
        name: 'Audit Trail Report',
        description: 'Comprehensive audit trail of user actions and system events',
        category: 'compliance',
        parameters: [
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'entityTypes', label: 'Entity Types', type: 'multiselect', required: false, options: [
            { value: 'user', label: 'Users' },
            { value: 'booking', label: 'Bookings' },
            { value: 'payment', label: 'Payments' },
            { value: 'location', label: 'Locations' },
            { value: 'operator', label: 'Operators' }
          ] },
          { name: 'actions', label: 'Actions', type: 'multiselect', required: false, options: [
            { value: 'create', label: 'Create' },
            { value: 'update', label: 'Update' },
            { value: 'delete', label: 'Delete' },
            { value: 'login', label: 'Login' },
            { value: 'logout', label: 'Logout' }
          ] },
          { name: 'userIds', label: 'Users', type: 'multiselect', required: false, options: [] }
        ]
      }
    ];
  }

  /**
   * Generate a report based on the request
   */
  async generateReport(request: ReportRequest, userId: string): Promise<GeneratedReport> {
    const startTime = Date.now();
    
    try {
      let reportData: any;
      const reportType = this.getAvailableReportTypes().find(rt => rt.id === request.reportTypeId);
      
      if (!reportType) {
        throw new Error(`Unknown report type: ${request.reportTypeId}`);
      }

      // Generate report based on type
      switch (request.reportTypeId) {
        case 'operator_revenue':
          reportData = await this.generateOperatorRevenueReport(request.parameters);
          break;
        case 'host_revenue':
          reportData = await this.generateHostRevenueReport(request.parameters);
          break;
        case 'transaction_reconciliation':
          reportData = await this.generateTransactionReconciliationReport(request.parameters);
          break;
        case 'payout_summary':
          reportData = await this.generatePayoutSummaryReport(request.parameters);
          break;
        case 'revenue_analysis':
          reportData = await this.generateRevenueAnalysisReport(request.parameters);
          break;
        case 'parking_inventory':
          reportData = await this.generateParkingInventoryReport(request.parameters);
          break;
        case 'user_analytics':
          reportData = await this.generateUserAnalyticsReport(request.parameters);
          break;
        case 'violation_reports':
          reportData = await this.generateViolationReportsReport(request.parameters);
          break;
        case 'vip_usage':
          reportData = await this.generateVIPUsageReport(request.parameters);
          break;
        case 'performance_monitoring':
          reportData = await this.generatePerformanceMonitoringReport(request.parameters);
          break;
        case 'api_usage':
          reportData = await this.generateAPIUsageReport(request.parameters);
          break;
        case 'discount_summary':
          reportData = await this.generateDiscountSummaryReport(request.parameters);
          break;
        case 'vat_exemption':
          reportData = await this.generateVATExemptionReport(request.parameters);
          break;
        case 'audit_trail':
          reportData = await this.generateAuditTrailReport(request.parameters);
          break;
        default:
          throw new Error(`Report generation not implemented for type: ${request.reportTypeId}`);
      }

      // Apply filters and sorting
      const filteredData = this.applyFiltersAndSorting(reportData, request.filters, request.sorting, request.searchQuery);
      
      // Apply pagination if requested
      const paginatedData = request.pagination 
        ? this.applyPagination(filteredData, request.pagination)
        : filteredData;

      const processingTime = Date.now() - startTime;

      const report: GeneratedReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: request.reportTypeId,
        title: reportType.name,
        description: reportType.description,
        data: paginatedData,
        metadata: {
          recordCount: Array.isArray(paginatedData) ? paginatedData.length : 1,
          totalAmount: this.calculateTotalAmount(paginatedData),
          currency: 'PHP',
          generatedAt: new Date(),
          generatedBy: userId,
          processingTime
        },
        filters: request.filters || [],
        sorting: request.sorting || []
      };

      // Store report for future reference
      await this.storeGeneratedReport(report);

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Export a report to the specified format
   */
  async exportReport(reportId: string, format: ExportFormat): Promise<ReportExportResult> {
    try {
      // Get the stored report
      const { data: reportData, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !reportData) {
        throw new Error('Report not found');
      }

      const report = this.mapStoredReportToGenerated(reportData);

      // Generate export based on format
      switch (format) {
        case ExportFormat.PDF:
          return await this.exportToPDF(report);
        case ExportFormat.EXCEL:
          return await this.exportToExcel(report);
        case ExportFormat.CSV:
          return await this.exportToCSV(report);
        case ExportFormat.JSON:
          return await this.exportToJSON(report);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch scheduled reports: ${error.message}`);
      }

      return (data || []).map(this.mapStoredScheduledReport);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Create a scheduled report
   */
  async createScheduledReport(scheduledReport: Omit<ScheduledReport, 'id' | 'createdAt'>): Promise<ScheduledReport> {
    try {
      const newScheduledReport = {
        id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: scheduledReport.name,
        report_type_id: scheduledReport.reportTypeId,
        parameters: scheduledReport.parameters,
        schedule: scheduledReport.schedule,
        recipients: scheduledReport.recipients,
        is_active: scheduledReport.isActive,
        last_run: scheduledReport.lastRun?.toISOString() || null,
        next_run: scheduledReport.nextRun.toISOString(),
        created_by: scheduledReport.createdBy,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert(newScheduledReport)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create scheduled report: ${error.message}`);
      }

      return this.mapStoredScheduledReport(data);
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      throw error;
    }
  }

  /**
   * Update a scheduled report
   */
  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update scheduled report: ${error.message}`);
      }

      return this.mapStoredScheduledReport(data);
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      throw error;
    }
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete scheduled report: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  async getPerformanceMetrics(
    features: string[] = [],
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetric[]> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (features.length > 0) {
        query = query.in('feature', features);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }

      // Group by feature and calculate metrics
      const featureMetrics = (data || []).reduce((acc, metric) => {
        if (!acc[metric.feature]) {
          acc[metric.feature] = {
            responseTimes: [],
            errors: 0,
            total: 0
          };
        }
        
        acc[metric.feature].responseTimes.push(metric.response_time);
        if (metric.error) acc[metric.feature].errors++;
        acc[metric.feature].total++;
        
        return acc;
      }, {} as Record<string, any>);

      return Object.entries(featureMetrics).map(([feature, metrics]: [string, any]) => {
        const responseTimes = metrics.responseTimes.sort((a: number, b: number) => a - b);
        const averageResponseTime = responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length;
        const p95Index = Math.floor(responseTimes.length * 0.95);
        const p95ResponseTime = responseTimes[p95Index] || 0;
        const errorRate = (metrics.errors / metrics.total) * 100;
        const throughput = metrics.total / ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)); // per hour
        
        // Get SLA target (this would be configurable)
        const slaTarget = this.getSLATarget(feature);
        const slaCompliance = (responseTimes.filter((time: number) => time <= slaTarget).length / responseTimes.length) * 100;

        return {
          feature,
          averageResponseTime,
          p95ResponseTime,
          errorRate,
          throughput,
          period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          slaTarget,
          slaCompliance
        };
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  // Private helper methods for report generation
  private async generateOperatorRevenueReport(parameters: Record<string, any>): Promise<any> {
    const params: FinancialReportParams = {
      type: FinancialReportType.OPERATOR_REVENUE,
      startDate: new Date(parameters.startDate),
      endDate: new Date(parameters.endDate),
      entityId: parameters.operatorId,
      generatedBy: 'admin'
    };

    return await this.financialReportingService.generateOperatorRevenueReport(
      parameters.operatorId,
      new Date(parameters.startDate),
      new Date(parameters.endDate)
    );
  }

  private async generateHostRevenueReport(parameters: Record<string, any>): Promise<any> {
    return await this.financialReportingService.generateHostRevenueReport(
      parameters.hostId,
      new Date(parameters.startDate),
      new Date(parameters.endDate)
    );
  }

  private async generateTransactionReconciliationReport(parameters: Record<string, any>): Promise<any> {
    return await this.financialReportingService.generateTransactionReconciliationReport(
      new Date(parameters.startDate),
      new Date(parameters.endDate)
    );
  }

  private async generatePayoutSummaryReport(parameters: Record<string, any>): Promise<any> {
    // Implementation would use the financial reporting service
    // This is a simplified version
    const { data, error } = await supabase
      .from('payouts')
      .select(`
        *,
        bank_accounts (
          bank_name,
          account_name,
          account_number
        )
      `)
      .gte('created_at', new Date(parameters.startDate).toISOString())
      .lte('created_at', new Date(parameters.endDate).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to generate payout summary: ${error.message}`);
    }

    return {
      summary: {
        totalPayouts: data?.length || 0,
        totalAmount: (data || []).reduce((sum, payout) => sum + (payout.amount as number || 0), 0),
        pendingAmount: (data || []).filter(p => p.status === 'pending').reduce((sum, payout) => sum + (payout.amount as number || 0), 0),
        completedAmount: (data || []).filter(p => p.status === 'completed').reduce((sum, payout) => sum + (payout.amount as number || 0), 0)
      },
      payouts: data || []
    };
  }

  private async generateRevenueAnalysisReport(parameters: Record<string, any>): Promise<any> {
    // Implementation would aggregate revenue data across all sources
    const { data, error } = await supabase
      .from('revenue_shares')
      .select(`
        *,
        payment_transactions (
          bookings (
            parking_spots (
              zones (
                sections (
                  locations (
                    id,
                    name,
                    type,
                    operator_id
                  )
                )
              )
            )
          )
        )
      `)
      .gte('calculated_at', new Date(parameters.startDate).toISOString())
      .lte('calculated_at', new Date(parameters.endDate).toISOString());

    if (error) {
      throw new Error(`Failed to generate revenue analysis: ${error.message}`);
    }

    // Group by parking type, location, etc. based on parameters.groupBy
    const groupedData = this.groupRevenueData(data || [], parameters.groupBy || 'type');

    return {
      summary: {
        totalRevenue: (data || []).reduce((sum, item) => sum + (item.total_amount as number || 0), 0),
        parkAngelShare: (data || []).reduce((sum, item) => sum + (item.park_angel_share as number || 0), 0),
        operatorShare: (data || []).reduce((sum, item) => sum + (item.operator_share as number || 0), 0),
        hostShare: (data || []).reduce((sum, item) => sum + (item.host_share as number || 0), 0)
      },
      breakdown: groupedData
    };
  }

  private async generateParkingInventoryReport(parameters: Record<string, any>): Promise<any> {
    let query = supabase
      .from('parking_spots')
      .select(`
        *,
        zones (
          id,
          name,
          sections (
            id,
            name,
            locations (
              id,
              name,
              type,
              operator_id
            )
          )
        )
      `);

    if (parameters.locationIds && parameters.locationIds.length > 0) {
      query = query.in('zones.sections.locations.id', parameters.locationIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate parking inventory: ${error.message}`);
    }

    // Calculate utilization if requested
    let utilizationData = {};
    if (parameters.includeUtilization) {
      utilizationData = await this.calculateUtilizationMetrics(data || [], parameters.period || '30d');
    }

    return {
      summary: {
        totalSpots: data?.length || 0,
        availableSpots: (data || []).filter(spot => spot.status === 'available').length,
        occupiedSpots: (data || []).filter(spot => spot.status === 'occupied').length,
        maintenanceSpots: (data || []).filter(spot => spot.status === 'maintenance').length
      },
      spots: data || [],
      utilization: utilizationData
    };
  }

  private async generateUserAnalyticsReport(parameters: Record<string, any>): Promise<any> {
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        users (
          id,
          email,
          created_at,
          last_sign_in_at
        )
      `)
      .gte('created_at', new Date(parameters.startDate).toISOString())
      .lte('created_at', new Date(parameters.endDate).toISOString());

    if (parameters.userTypes && parameters.userTypes.length > 0) {
      query = query.in('user_type', parameters.userTypes);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate user analytics: ${error.message}`);
    }

    // Calculate engagement metrics if requested
    let engagementData = {};
    if (parameters.includeEngagement) {
      engagementData = await this.calculateEngagementMetrics(data || []);
    }

    return {
      summary: {
        totalUsers: data?.length || 0,
        newUsers: (data || []).filter(user => 
          new Date(user.created_at) >= new Date(parameters.startDate)
        ).length,
        activeUsers: (data || []).filter(user => 
          user.users?.last_sign_in_at && 
          new Date(user.users.last_sign_in_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      },
      users: data || [],
      engagement: engagementData
    };
  }

  private async generateViolationReportsReport(parameters: Record<string, any>): Promise<any> {
    let query = supabase
      .from('violation_reports')
      .select(`
        *,
        locations (
          id,
          name,
          type
        )
      `)
      .gte('created_at', new Date(parameters.startDate).toISOString())
      .lte('created_at', new Date(parameters.endDate).toISOString());

    if (parameters.locationIds && parameters.locationIds.length > 0) {
      query = query.in('location_id', parameters.locationIds);
    }

    if (parameters.violationTypes && parameters.violationTypes.length > 0) {
      query = query.in('violation_type', parameters.violationTypes);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate violation reports: ${error.message}`);
    }

    return {
      summary: {
        totalViolations: data?.length || 0,
        resolvedViolations: (data || []).filter(v => v.status === 'resolved').length,
        pendingViolations: (data || []).filter(v => v.status === 'pending').length,
        averageResolutionTime: this.calculateAverageResolutionTime(data || [])
      },
      violations: data || []
    };
  }

  private async generateVIPUsageReport(parameters: Record<string, any>): Promise<any> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        users (
          id,
          user_profiles (
            full_name,
            vip_type
          )
        ),
        parking_spots (
          zones (
            sections (
              locations (
                id,
                name,
                type
              )
            )
          )
        )
      `)
      .not('users.user_profiles.vip_type', 'is', null)
      .gte('created_at', new Date(parameters.startDate).toISOString())
      .lte('created_at', new Date(parameters.endDate).toISOString());

    if (parameters.vipTypes && parameters.vipTypes.length > 0) {
      query = query.in('users.user_profiles.vip_type', parameters.vipTypes);
    }

    if (parameters.locationIds && parameters.locationIds.length > 0) {
      query = query.in('parking_spots.zones.sections.locations.id', parameters.locationIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate VIP usage report: ${error.message}`);
    }

    // Group by VIP type
    const vipTypeUsage = (data || []).reduce((acc, booking) => {
      const vipType = booking.users?.user_profiles?.vip_type;
      if (vipType) {
        if (!acc[vipType]) {
          acc[vipType] = { count: 0, totalAmount: 0 };
        }
        acc[vipType].count++;
        acc[vipType].totalAmount += booking.total_amount as number || 0;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalVIPBookings: data?.length || 0,
        totalVIPUsers: new Set((data || []).map(b => b.users?.id)).size,
        totalSavings: (data || []).reduce((sum, booking) => sum + (booking.discount_amount as number || 0), 0)
      },
      vipTypeBreakdown: Object.entries(vipTypeUsage).map(([type, usage]: [string, any]) => ({
        vipType: type,
        bookingCount: usage.count,
        totalAmount: usage.totalAmount
      })),
      bookings: data || []
    };
  }

  private async generatePerformanceMonitoringReport(parameters: Record<string, any>): Promise<any> {
    const metrics = await this.getPerformanceMetrics(
      parameters.features || [],
      new Date(parameters.startDate),
      new Date(parameters.endDate)
    );

    return {
      summary: {
        totalFeatures: metrics.length,
        averageResponseTime: metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length,
        averageErrorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
        overallSLACompliance: metrics.reduce((sum, m) => sum + m.slaCompliance, 0) / metrics.length
      },
      metrics
    };
  }

  private async generateAPIUsageReport(parameters: Record<string, any>): Promise<any> {
    let query = supabase
      .from('api_usage_logs')
      .select(`
        *,
        api_keys (
          id,
          name,
          developer_id,
          rate_limit,
          pricing_tier
        )
      `)
      .gte('timestamp', new Date(parameters.startDate).toISOString())
      .lte('timestamp', new Date(parameters.endDate).toISOString());

    if (parameters.apiKeys && parameters.apiKeys.length > 0) {
      query = query.in('api_key_id', parameters.apiKeys);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate API usage report: ${error.message}`);
    }

    // Calculate usage statistics
    const usageStats = (data || []).reduce((acc, log) => {
      const keyId = log.api_key_id;
      if (!acc[keyId]) {
        acc[keyId] = {
          keyName: log.api_keys?.name || 'Unknown',
          totalCalls: 0,
          successfulCalls: 0,
          errorCalls: 0,
          totalResponseTime: 0,
          revenue: 0
        };
      }
      
      acc[keyId].totalCalls++;
      if (log.status_code < 400) {
        acc[keyId].successfulCalls++;
      } else {
        acc[keyId].errorCalls++;
      }
      acc[keyId].totalResponseTime += log.response_time as number || 0;
      acc[keyId].revenue += log.billing_amount as number || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalAPICalls: data?.length || 0,
        totalRevenue: Object.values(usageStats).reduce((sum: number, stats: any) => sum + stats.revenue, 0),
        averageResponseTime: (data || []).reduce((sum, log) => sum + (log.response_time as number || 0), 0) / (data?.length || 1),
        errorRate: ((data || []).filter(log => log.status_code >= 400).length / (data?.length || 1)) * 100
      },
      apiKeyStats: Object.entries(usageStats).map(([keyId, stats]: [string, any]) => ({
        keyId,
        keyName: stats.keyName,
        totalCalls: stats.totalCalls,
        successRate: (stats.successfulCalls / stats.totalCalls) * 100,
        averageResponseTime: stats.totalResponseTime / stats.totalCalls,
        revenue: stats.revenue
      })),
      logs: data || []
    };
  }

  private async generateDiscountSummaryReport(parameters: Record<string, any>): Promise<any> {
    const filters = {
      startDate: new Date(parameters.startDate),
      endDate: new Date(parameters.endDate),
      discountType: parameters.discountTypes?.[0],
      operatorId: parameters.operatorIds?.[0]
    };

    return await this.discountReportingService.generateSummaryReport(filters);
  }

  private async generateVATExemptionReport(parameters: Record<string, any>): Promise<any> {
    const filters = {
      startDate: new Date(parameters.startDate),
      endDate: new Date(parameters.endDate),
      vatExemptOnly: true
    };

    return await this.discountReportingService.generateVATExemptionReport(filters);
  }

  private async generateAuditTrailReport(parameters: Record<string, any>): Promise<any> {
    let query = supabase
      .from('audit_trail')
      .select(`
        *,
        user_profiles (
          full_name
        )
      `)
      .gte('timestamp', new Date(parameters.startDate).toISOString())
      .lte('timestamp', new Date(parameters.endDate).toISOString());

    if (parameters.entityTypes && parameters.entityTypes.length > 0) {
      query = query.in('entity_type', parameters.entityTypes);
    }

    if (parameters.actions && parameters.actions.length > 0) {
      query = query.in('action', parameters.actions);
    }

    if (parameters.userIds && parameters.userIds.length > 0) {
      query = query.in('user_id', parameters.userIds);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to generate audit trail report: ${error.message}`);
    }

    return {
      summary: {
        totalEvents: data?.length || 0,
        uniqueUsers: new Set((data || []).map(event => event.user_id)).size,
        topActions: this.getTopActions(data || []),
        topEntityTypes: this.getTopEntityTypes(data || [])
      },
      events: data || []
    };
  }

  // Helper methods
  private applyFiltersAndSorting(data: any, filters?: ReportFilter[], sorting?: ReportSort[], searchQuery?: string): any {
    let result = data;

    // Apply search query
    if (searchQuery && Array.isArray(result)) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item: any) => {
        return JSON.stringify(item).toLowerCase().includes(query);
      });
    }

    // Apply filters
    if (filters && Array.isArray(result)) {
      filters.forEach(filter => {
        result = result.filter((item: any) => {
          const value = this.getNestedValue(item, filter.field);
          return this.applyFilterCondition(value, filter.operator, filter.value);
        });
      });
    }

    // Apply sorting
    if (sorting && Array.isArray(result)) {
      sorting.forEach(sort => {
        result.sort((a: any, b: any) => {
          const aValue = this.getNestedValue(a, sort.field);
          const bValue = this.getNestedValue(b, sort.field);
          
          if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
          return 0;
        });
      });
    }

    return result;
  }

  private applyPagination(data: any, pagination: { page: number; pageSize: number }): any {
    if (!Array.isArray(data)) return data;
    
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    
    return data.slice(startIndex, endIndex);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private applyFilterCondition(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'not_equals':
        return value !== filterValue;
      case 'contains':
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'not_contains':
        return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(filterValue);
      case 'less_than':
        return Number(value) < Number(filterValue);
      case 'between':
        return Number(value) >= Number(filterValue[0]) && Number(value) <= Number(filterValue[1]);
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);
      case 'not_in':
        return Array.isArray(filterValue) && !filterValue.includes(value);
      default:
        return true;
    }
  }

  private calculateTotalAmount(data: any): number {
    if (!data) return 0;
    
    if (data.summary?.totalAmount) return data.summary.totalAmount;
    if (data.summary?.totalRevenue) return data.summary.totalRevenue;
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => {
        return sum + (item.amount || item.total_amount || item.revenue || 0);
      }, 0);
    }
    
    return 0;
  }

  private async storeGeneratedReport(report: GeneratedReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_reports')
        .insert({
          id: report.id,
          type: report.type,
          title: report.title,
          description: report.description,
          data: report.data,
          metadata: report.metadata,
          filters: report.filters,
          sorting: report.sorting,
          created_at: new Date()
        });

      if (error) {
        console.error('Failed to store generated report:', error);
      }
    } catch (error) {
      console.error('Error storing generated report:', error);
    }
  }

  private mapStoredReportToGenerated(data: any): GeneratedReport {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      data: data.data,
      metadata: data.metadata,
      filters: data.filters || [],
      sorting: data.sorting || []
    };
  }

  private mapStoredScheduledReport(data: any): ScheduledReport {
    return {
      id: data.id,
      name: data.name,
      reportTypeId: data.report_type_id,
      parameters: data.parameters,
      schedule: data.schedule,
      recipients: data.recipients,
      isActive: data.is_active,
      lastRun: data.last_run ? new Date(data.last_run) : undefined,
      nextRun: new Date(data.next_run),
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  }

  private getSLATarget(feature: string): number {
    // SLA targets in milliseconds
    const slaTargets: Record<string, number> = {
      booking: 2000,
      payment: 5000,
      messaging: 1000,
      violation_reporting: 3000,
      support_tickets: 2000
    };
    
    return slaTargets[feature] || 2000;
  }

  private groupRevenueData(data: any[], groupBy: string): any[] {
    const grouped = data.reduce((acc, item) => {
      let key: string;
      
      switch (groupBy) {
        case 'type':
          key = (item as any).payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations?.type || 'unknown';
          break;
        case 'location':
          key = (item as any).payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations?.name || 'unknown';
          break;
        case 'operator':
          key = (item as any).payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations?.operator_id || 'unknown';
          break;
        case 'month':
          key = new Date(item.calculated_at as string).toISOString().substring(0, 7);
          break;
        default:
          key = 'all';
      }
      
      if (!acc[key]) {
        acc[key] = {
          key,
          totalRevenue: 0,
          parkAngelShare: 0,
          operatorShare: 0,
          hostShare: 0,
          transactionCount: 0
        };
      }
      
      acc[key].totalRevenue += (item as any).total_amount as number || 0;
      acc[key].parkAngelShare += (item as any).park_angel_share as number || 0;
      acc[key].operatorShare += (item as any).operator_share as number || 0;
      acc[key].hostShare += (item as any).host_share as number || 0;
      acc[key].transactionCount++;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped);
  }

  private async calculateUtilizationMetrics(spots: any[], period: string): Promise<any> {
    // This would calculate utilization based on booking data
    // Simplified implementation
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('parking_spot_id, start_time, end_time')
      .in('parking_spot_id', spots.map(spot => spot.id))
      .gte('start_time', startDate.toISOString());

    if (error) {
      console.error('Error calculating utilization:', error);
      return {};
    }

    // Calculate utilization per spot
    const utilizationBySpot = spots.map(spot => {
      const spotBookings = (bookings || []).filter(b => b.parking_spot_id === spot.id);
      const totalHours = spotBookings.reduce((sum, booking) => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      const availableHours = days * 24;
      const utilizationRate = (totalHours / availableHours) * 100;
      
      return {
        spotId: spot.id,
        spotNumber: spot.number,
        utilizationRate,
        totalBookings: spotBookings.length,
        totalHours
      };
    });

    return {
      averageUtilization: utilizationBySpot.reduce((sum, spot) => sum + spot.utilizationRate, 0) / utilizationBySpot.length,
      spotUtilization: utilizationBySpot
    };
  }

  private async calculateEngagementMetrics(users: any[]): Promise<any> {
    // Calculate user engagement metrics
    const userIds = users.map(user => user.users?.id).filter(Boolean);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('user_id, created_at')
      .in('user_id', userIds);

    if (error) {
      console.error('Error calculating engagement:', error);
      return {};
    }

    const engagementByUser = users.map(user => {
      const userId = user.users?.id;
      const userBookings = (bookings || []).filter(b => b.user_id === userId);
      
      return {
        userId,
        userName: user.full_name,
        totalBookings: userBookings.length,
        lastBooking: userBookings.length > 0 ? 
          new Date(Math.max(...userBookings.map(b => new Date(b.created_at).getTime()))) : null
      };
    });

    return {
      averageBookingsPerUser: engagementByUser.reduce((sum, user) => sum + user.totalBookings, 0) / engagementByUser.length,
      activeUsers: engagementByUser.filter(user => user.totalBookings > 0).length,
      userEngagement: engagementByUser
    };
  }

  private calculateAverageResolutionTime(violations: any[]): number {
    const resolvedViolations = violations.filter(v => v.status === 'resolved' && v.resolved_at);
    
    if (resolvedViolations.length === 0) return 0;
    
    const totalResolutionTime = resolvedViolations.reduce((sum, violation) => {
      const created = new Date(violation.created_at);
      const resolved = new Date(violation.resolved_at);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);
    
    return totalResolutionTime / resolvedViolations.length / (1000 * 60 * 60); // in hours
  }

  private getTopActions(events: any[]): Array<{ action: string; count: number }> {
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopEntityTypes(events: any[]): Array<{ entityType: string; count: number }> {
    const typeCounts = events.reduce((acc, event) => {
      acc[event.entity_type] = (acc[event.entity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .map(([entityType, count]) => ({ entityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Export methods (simplified implementations)
  private async exportToPDF(report: GeneratedReport): Promise<ReportExportResult> {
    // TODO: Implement PDF generation using a library like puppeteer or jsPDF
    const fileName = `${report.type}_${report.id}.pdf`;
    return {
      fileName,
      mimeType: 'application/pdf',
      url: `/api/reports/export/${report.id}/pdf`,
      size: 0
    };
  }

  private async exportToExcel(report: GeneratedReport): Promise<ReportExportResult> {
    // TODO: Implement Excel generation using a library like exceljs
    const fileName = `${report.type}_${report.id}.xlsx`;
    return {
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      url: `/api/reports/export/${report.id}/excel`,
      size: 0
    };
  }

  private async exportToCSV(report: GeneratedReport): Promise<ReportExportResult> {
    // Convert report data to CSV
    let csvContent = '';
    
    if (Array.isArray(report.data)) {
      if (report.data.length > 0) {
        const headers = Object.keys(report.data[0]);
        csvContent = headers.join(',') + '\n';
        csvContent += report.data.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        ).join('\n');
      }
    } else if (report.data.summary) {
      // Handle summary reports
      csvContent = 'Metric,Value\n';
      Object.entries(report.data.summary).forEach(([key, value]) => {
        csvContent += `"${key}","${value}"\n`;
      });
    }

    const fileName = `${report.type}_${report.id}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    return {
      fileName,
      mimeType: 'text/csv',
      url: URL.createObjectURL(blob),
      size: csvContent.length
    };
  }

  private async exportToJSON(report: GeneratedReport): Promise<ReportExportResult> {
    const fileName = `${report.type}_${report.id}.json`;
    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    return {
      fileName,
      mimeType: 'application/json',
      url: URL.createObjectURL(blob),
      size: jsonContent.length
    };
  }
}