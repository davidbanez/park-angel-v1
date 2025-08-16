// Operator reporting service for Park Angel

import { createClient } from '@supabase/supabase-js';
import {
  OperatorReport,
  OperatorReportType,
  OperatorReportParams,
  OperatorReportFilters,
  OperatorRevenueReportData,
  OperatorOccupancyReportData,
  UserBehaviorReportData,
  ViolationReportData,
  VIPUsageReportData,
  ZonePerformanceReportData,
  ExportFormat,
  ReportExportOptions,
  ReportExportResult,
  ReportQueryOptions,
} from '../types/operator-reporting';

export interface OperatorReportingService {
  generateReport(params: OperatorReportParams): Promise<OperatorReport>;
  getReports(operatorId: string, options?: ReportQueryOptions): Promise<OperatorReport[]>;
  getReport(reportId: string): Promise<OperatorReport | null>;
  deleteReport(reportId: string): Promise<void>;
  exportReport(reportId: string, options: ReportExportOptions): Promise<ReportExportResult>;
  scheduleReport(params: OperatorReportParams, schedule: string): Promise<string>;
  getScheduledReports(operatorId: string): Promise<any[]>;
  cancelScheduledReport(scheduleId: string): Promise<void>;
}

export class OperatorReportingServiceImpl implements OperatorReportingService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async generateReport(params: OperatorReportParams): Promise<OperatorReport> {
    try {
      let reportData: any;

      switch (params.type) {
        case OperatorReportType.REVENUE_REPORT:
          reportData = await this.generateRevenueReport(params);
          break;
        case OperatorReportType.OCCUPANCY_REPORT:
          reportData = await this.generateOccupancyReport(params);
          break;
        case OperatorReportType.USER_BEHAVIOR_REPORT:
          reportData = await this.generateUserBehaviorReport(params);
          break;
        case OperatorReportType.VIOLATION_REPORT:
          reportData = await this.generateViolationReport(params);
          break;
        case OperatorReportType.VIP_USAGE_REPORT:
          reportData = await this.generateVIPUsageReport(params);
          break;
        case OperatorReportType.ZONE_PERFORMANCE_REPORT:
          reportData = await this.generateZonePerformanceReport(params);
          break;
        case OperatorReportType.VEHICLE_TYPE_ANALYTICS:
          reportData = await this.generateVehicleTypeAnalytics(params);
          break;
        case OperatorReportType.OPERATIONAL_SUMMARY:
          reportData = await this.generateOperationalSummary(params);
          break;
        default:
          throw new Error(`Unsupported report type: ${params.type}`);
      }

      const report: OperatorReport = {
        id: crypto.randomUUID(),
        type: params.type,
        title: this.getReportTitle(params.type),
        description: this.getReportDescription(params.type),
        operatorId: params.operatorId,
        generatedAt: new Date(),
        generatedBy: params.generatedBy,
        parameters: params,
        data: reportData,
        metadata: {
          recordCount: this.getRecordCount(reportData),
          totalAmount: this.getTotalAmount(reportData),
          currency: 'PHP',
          processingTime: Date.now(),
          dataSource: 'supabase',
          exportFormats: [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV],
        },
      };

      // Save report to database
      const { error } = await this.supabase
        .from('operator_reports')
        .insert({
          id: report.id,
          type: report.type,
          title: report.title,
          description: report.description,
          operator_id: report.operatorId,
          generated_at: report.generatedAt.toISOString(),
          generated_by: report.generatedBy,
          parameters: report.parameters,
          data: report.data,
          metadata: report.metadata,
        });

      if (error) {
        console.error('Error saving report:', error);
        throw new Error('Failed to save report');
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async getReports(operatorId: string, options?: ReportQueryOptions): Promise<OperatorReport[]> {
    try {
      let query = this.supabase
        .from('operator_reports')
        .select('*')
        .eq('operator_id', operatorId)
        .order('generated_at', { ascending: false });

      if (options?.filters) {
        // Apply filters
        if (options.filters.searchQuery) {
          query = query.or(`title.ilike.%${options.filters.searchQuery}%,description.ilike.%${options.filters.searchQuery}%`);
        }
      }

      if (options?.pagination) {
        query = query.range(options.pagination.offset, options.pagination.offset + options.pagination.limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        throw new Error('Failed to fetch reports');
      }

      return data?.map(this.mapDatabaseToReport) || [];
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  async getReport(reportId: string): Promise<OperatorReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('operator_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching report:', error);
        throw new Error('Failed to fetch report');
      }

      return this.mapDatabaseToReport(data);
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
        throw new Error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  async exportReport(reportId: string, options: ReportExportOptions): Promise<ReportExportResult> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Generate export file based on format
      const fileName = options.fileName || `${report.title}_${new Date().toISOString().split('T')[0]}.${options.format}`;
      
      let exportData: any;
      let mimeType: string;

      switch (options.format) {
        case ExportFormat.PDF:
          exportData = await this.generatePDFExport(report, options);
          mimeType = 'application/pdf';
          break;
        case ExportFormat.EXCEL:
          exportData = await this.generateExcelExport(report, options);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case ExportFormat.CSV:
          exportData = await this.generateCSVExport(report, options);
          mimeType = 'text/csv';
          break;
        case ExportFormat.JSON:
          exportData = JSON.stringify(report.data, null, 2);
          mimeType = 'application/json';
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('report-exports')
        .upload(`${report.operatorId}/${fileName}`, exportData, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading export:', uploadError);
        throw new Error('Failed to upload export file');
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('report-exports')
        .getPublicUrl(`${report.operatorId}/${fileName}`);

      return {
        fileName,
        mimeType,
        url: urlData.publicUrl,
        size: new Blob([exportData]).size,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  async scheduleReport(params: OperatorReportParams, schedule: string): Promise<string> {
    try {
      const scheduleId = crypto.randomUUID();
      
      const { error } = await this.supabase
        .from('operator_scheduled_reports')
        .insert({
          id: scheduleId,
          operator_id: params.operatorId,
          report_type: params.type,
          parameters: params,
          schedule,
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error scheduling report:', error);
        throw new Error('Failed to schedule report');
      }

      return scheduleId;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  async getScheduledReports(operatorId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('operator_scheduled_reports')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scheduled reports:', error);
        throw new Error('Failed to fetch scheduled reports');
      }

      return data || [];
    } catch (error) {
      console.error('Error getting scheduled reports:', error);
      throw error;
    }
  }

  async cancelScheduledReport(scheduleId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_scheduled_reports')
        .update({ is_active: false })
        .eq('id', scheduleId);

      if (error) {
        console.error('Error cancelling scheduled report:', error);
        throw new Error('Failed to cancel scheduled report');
      }
    } catch (error) {
      console.error('Error cancelling scheduled report:', error);
      throw error;
    }
  }

  private async generateRevenueReport(params: OperatorReportParams): Promise<OperatorRevenueReportData> {
    // Implementation for revenue report generation
    const { data: transactions } = await this.supabase
      .from('transactions')
      .select(`
        *,
        booking:bookings(*),
        location:locations(*),
        revenue_shares(*)
      `)
      .eq('operator_id', params.operatorId)
      .gte('created_at', params.startDate.toISOString())
      .lte('created_at', params.endDate.toISOString());

    // Calculate revenue metrics with proper type handling
    const totalRevenue = transactions?.reduce((sum, t) => {
      const amount = this.safeGetNumber(t, 'amount');
      return sum + amount;
    }, 0) || 0;
    
    const transactionCount = transactions?.length || 0;
    
    const operatorShare = transactions?.reduce((sum, t) => {
      const shares = this.safeGetArray(t, 'revenue_shares');
      const operatorShareAmount = shares.length > 0 
        ? this.safeGetNumber(shares[0], 'operator_share')
        : 0;
      return sum + operatorShareAmount;
    }, 0) || 0;
    
    const parkAngelShare = transactions?.reduce((sum, t) => {
      const shares = this.safeGetArray(t, 'revenue_shares');
      const parkAngelShareAmount = shares.length > 0
        ? this.safeGetNumber(shares[0], 'park_angel_share')
        : 0;
      return sum + parkAngelShareAmount;
    }, 0) || 0;

    return {
      summary: {
        totalRevenue,
        operatorShare,
        parkAngelShare,
        transactionCount,
        averageTransactionValue: transactionCount > 0 ? totalRevenue / transactionCount : 0,
        growthRate: 0, // Calculate based on previous period
        previousPeriodRevenue: 0, // Fetch from previous period
      },
      breakdown: {
        streetParking: 0, // Calculate based on location type
        facilityParking: 0,
        hostedParking: 0,
        regularBookings: 0,
        vipBookings: 0,
        discountedBookings: 0,
      },
      trends: [], // Generate time-based trends
      locationBreakdown: [], // Group by location
      vehicleTypeBreakdown: [], // Group by vehicle type
      discountImpact: {
        totalDiscountAmount: 0,
        discountedTransactions: 0,
        seniorCitizenDiscounts: 0,
        pwdDiscounts: 0,
        customDiscounts: 0,
        vatExemptions: 0,
      },
      comparisons: [], // Compare with previous periods
    };
  }

  private async generateOccupancyReport(params: OperatorReportParams): Promise<OperatorOccupancyReportData> {
    // Implementation for occupancy report generation
    const { data: bookings } = await this.supabase
      .from('bookings')
      .select(`
        *,
        spot:parking_spots(*),
        location:locations(*)
      `)
      .eq('operator_id', params.operatorId)
      .gte('start_time', params.startDate.toISOString())
      .lte('end_time', params.endDate.toISOString());

    return {
      summary: {
        averageOccupancyRate: 0,
        peakOccupancyRate: 0,
        lowOccupancyRate: 0,
        totalSpots: 0,
        activeSpots: 0,
        maintenanceSpots: 0,
        averageSessionDuration: 0,
        turnoverRate: 0,
      },
      trends: [],
      locationBreakdown: [],
      zoneBreakdown: [],
      peakHours: [],
      utilizationMetrics: {
        underutilizedSpots: [],
        overutilizedSpots: [],
        optimalUtilizationRate: 0.75,
        recommendations: [],
      },
    };
  }

  private async generateUserBehaviorReport(params: OperatorReportParams): Promise<UserBehaviorReportData> {
    // Implementation for user behavior report generation
    return {
      summary: {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        returningUsers: 0,
        averageSessionsPerUser: 0,
        averageRevenuePerUser: 0,
        userRetentionRate: 0,
      },
      userSegments: [],
      bookingPatterns: [],
      sessionAnalytics: {
        averageSessionDuration: 0,
        shortSessions: 0,
        mediumSessions: 0,
        longSessions: 0,
        extendedSessions: 0,
        cancelledSessions: 0,
      },
      loyaltyMetrics: {
        loyalUsers: 0,
        averageLifetimeValue: 0,
        repeatBookingRate: 0,
        referralRate: 0,
        satisfactionScore: 0,
      },
      churnAnalysis: {
        churnRate: 0,
        churnedUsers: 0,
        atRiskUsers: 0,
        churnReasons: [],
        retentionStrategies: [],
      },
    };
  }

  private async generateViolationReport(params: OperatorReportParams): Promise<ViolationReportData> {
    // Implementation for violation report generation
    return {
      summary: {
        totalViolations: 0,
        resolvedViolations: 0,
        pendingViolations: 0,
        averageResolutionTime: 0,
        enforcementRate: 0,
        revenueFromFines: 0,
      },
      violationTypes: [],
      locationBreakdown: [],
      trends: [],
      enforcementMetrics: {
        towingRequests: 0,
        clampingRequests: 0,
        warningsIssued: 0,
        finesCollected: 0,
        enforcementResponseTime: 0,
      },
      resolutionAnalysis: {
        averageResolutionTime: 0,
        resolutionMethods: [],
        escalationRate: 0,
        customerSatisfaction: 0,
      },
    };
  }

  private async generateVIPUsageReport(params: OperatorReportParams): Promise<VIPUsageReportData> {
    // Implementation for VIP usage report generation
    return {
      summary: {
        totalVIPUsers: 0,
        activeVIPUsers: 0,
        vvipUsers: 0,
        flexVVIPUsers: 0,
        vipUsers: 0,
        flexVIPUsers: 0,
        totalVIPSessions: 0,
        vipRevenueImpact: 0,
      },
      vipTypes: [],
      locationUsage: [],
      trends: [],
      benefitAnalysis: {
        freeSessionsProvided: 0,
        discountAmountProvided: 0,
        priorityBookings: 0,
        extendedTimeUsage: 0,
        costToOperator: 0,
      },
      recommendations: [],
    };
  }

  private async generateZonePerformanceReport(params: OperatorReportParams): Promise<ZonePerformanceReportData> {
    // Implementation for zone performance report generation
    return {
      summary: {
        totalZones: 0,
        highPerformingZones: 0,
        underperformingZones: 0,
        averageRevenue: 0,
        averageOccupancy: 0,
        totalSpots: 0,
      },
      zoneMetrics: [],
      performanceComparisons: [],
      trends: [],
      optimization: {
        recommendations: [],
        potentialRevenue: 0,
        implementationPriority: [],
      },
    };
  }

  private async generateVehicleTypeAnalytics(params: OperatorReportParams): Promise<any> {
    // Implementation for vehicle type analytics
    return {
      summary: {},
      breakdown: [],
      trends: [],
    };
  }

  private async generateOperationalSummary(params: OperatorReportParams): Promise<any> {
    // Implementation for operational summary
    return {
      overview: {},
      keyMetrics: [],
      performance: {},
      recommendations: [],
    };
  }

  private async generatePDFExport(report: OperatorReport, options: ReportExportOptions): Promise<Blob> {
    // Implementation for PDF export
    // This would use a library like jsPDF or Puppeteer
    return new Blob(['PDF content'], { type: 'application/pdf' });
  }

  private async generateExcelExport(report: OperatorReport, options: ReportExportOptions): Promise<Blob> {
    // Implementation for Excel export
    // This would use a library like ExcelJS
    return new Blob(['Excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private async generateCSVExport(report: OperatorReport, options: ReportExportOptions): Promise<string> {
    // Implementation for CSV export
    return 'CSV content';
  }

  private mapDatabaseToReport(data: any): OperatorReport {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      operatorId: data.operator_id,
      generatedAt: new Date(data.generated_at),
      generatedBy: data.generated_by,
      parameters: data.parameters,
      data: data.data,
      metadata: data.metadata,
    };
  }

  private getReportTitle(type: OperatorReportType): string {
    const titles = {
      [OperatorReportType.REVENUE_REPORT]: 'Revenue Report',
      [OperatorReportType.OCCUPANCY_REPORT]: 'Occupancy Report',
      [OperatorReportType.USER_BEHAVIOR_REPORT]: 'User Behavior Report',
      [OperatorReportType.VIOLATION_REPORT]: 'Violation Report',
      [OperatorReportType.VIP_USAGE_REPORT]: 'VIP Usage Report',
      [OperatorReportType.ZONE_PERFORMANCE_REPORT]: 'Zone Performance Report',
      [OperatorReportType.VEHICLE_TYPE_ANALYTICS]: 'Vehicle Type Analytics',
      [OperatorReportType.OPERATIONAL_SUMMARY]: 'Operational Summary',
    };
    return titles[type] || 'Unknown Report';
  }

  private getReportDescription(type: OperatorReportType): string {
    const descriptions = {
      [OperatorReportType.REVENUE_REPORT]: 'Comprehensive revenue analysis with trends and breakdowns',
      [OperatorReportType.OCCUPANCY_REPORT]: 'Parking spot occupancy rates and utilization metrics',
      [OperatorReportType.USER_BEHAVIOR_REPORT]: 'User behavior patterns and engagement analytics',
      [OperatorReportType.VIOLATION_REPORT]: 'Violation tracking and enforcement statistics',
      [OperatorReportType.VIP_USAGE_REPORT]: 'VIP user activity and benefit utilization',
      [OperatorReportType.ZONE_PERFORMANCE_REPORT]: 'Zone-level performance metrics and optimization',
      [OperatorReportType.VEHICLE_TYPE_ANALYTICS]: 'Vehicle type distribution and revenue analysis',
      [OperatorReportType.OPERATIONAL_SUMMARY]: 'Overall operational performance summary',
    };
    return descriptions[type] || 'Report description';
  }

  private getRecordCount(data: any): number {
    // Extract record count from report data
    if (data.summary && typeof data.summary.transactionCount === 'number') {
      return data.summary.transactionCount;
    }
    return 0;
  }

  private getTotalAmount(data: any): number {
    // Extract total amount from report data
    if (data.summary && typeof data.summary.totalRevenue === 'number') {
      return data.summary.totalRevenue;
    }
    return 0;
  }

  // Type safety helper methods
  private safeGetNumber(obj: any, key: string): number {
    if (obj && typeof obj === 'object' && key in obj) {
      const value = obj[key];
      return typeof value === 'number' ? value : 0;
    }
    return 0;
  }

  private safeGetString(obj: any, key: string): string {
    if (obj && typeof obj === 'object' && key in obj) {
      const value = obj[key];
      return typeof value === 'string' ? value : '';
    }
    return '';
  }

  private safeGetArray(obj: any, key: string): any[] {
    if (obj && typeof obj === 'object' && key in obj) {
      const value = obj[key];
      return Array.isArray(value) ? value : [];
    }
    return [];
  }
}