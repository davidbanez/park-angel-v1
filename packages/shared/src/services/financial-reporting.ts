import { createClient } from '@supabase/supabase-js';
import {
  FinancialReport,
  FinancialReportType,
  FinancialReportParams,
  OperatorRevenueReport,
  HostRevenueReport,
  TransactionReconciliationReport,
  AuditTrailEntry,
  ExportFormat,
  ReportExportResult,
} from '../types/financial-reporting';
import { RevenueShareService } from './revenue-sharing';
import { PayoutService } from './payout-processing';

export interface FinancialReportingService {
  generateReport(params: FinancialReportParams): Promise<FinancialReport>;
  generateOperatorRevenueReport(operatorId: string, startDate: Date, endDate: Date): Promise<OperatorRevenueReport>;
  generateHostRevenueReport(hostId: string, startDate: Date, endDate: Date): Promise<HostRevenueReport>;
  generateTransactionReconciliationReport(startDate: Date, endDate: Date): Promise<TransactionReconciliationReport>;
  exportReport(reportId: string, format: ExportFormat): Promise<ReportExportResult>;
  getAuditTrail(entityId: string, entityType: string, startDate?: Date, endDate?: Date): Promise<AuditTrailEntry[]>;
  logAuditEvent(event: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<void>;
}

export class FinancialReportingServiceImpl implements FinancialReportingService {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private revenueShareService: RevenueShareService,
    private payoutService: PayoutService
  ) {}

  async generateReport(params: FinancialReportParams): Promise<FinancialReport> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let reportData: any;
      
      switch (params.type) {
        case FinancialReportType.OPERATOR_REVENUE:
          reportData = await this.generateOperatorRevenueReport(
            params.entityId!,
            params.startDate,
            params.endDate
          );
          break;
          
        case FinancialReportType.HOST_REVENUE:
          reportData = await this.generateHostRevenueReport(
            params.entityId!,
            params.startDate,
            params.endDate
          );
          break;
          
        case FinancialReportType.TRANSACTION_RECONCILIATION:
          reportData = await this.generateTransactionReconciliationReport(
            params.startDate,
            params.endDate
          );
          break;
          
        case FinancialReportType.PAYOUT_SUMMARY:
          reportData = await this.generatePayoutSummaryReport(
            params.startDate,
            params.endDate,
            params.entityId
          );
          break;
          
        case FinancialReportType.REVENUE_ANALYSIS:
          reportData = await this.generateRevenueAnalysisReport(
            params.startDate,
            params.endDate
          );
          break;
          
        default:
          throw new Error(`Unsupported report type: ${params.type}`);
      }

      const report: FinancialReport = {
        id: reportId,
        type: params.type,
        title: this.getReportTitle(params.type),
        description: this.getReportDescription(params.type, params),
        generatedAt: new Date(),
        generatedBy: params.generatedBy,
        parameters: params,
        data: reportData,
        metadata: {
          recordCount: this.getRecordCount(reportData),
          totalAmount: this.getTotalAmount(reportData),
          currency: 'PHP',
        },
      };

      // Store report in database for future reference
      await this.storeReport(report);

      // Log audit event
      await this.logAuditEvent({
        entityId: reportId,
        entityType: 'financial_report',
        action: 'generate',
        userId: params.generatedBy,
        details: {
          reportType: params.type,
          parameters: params,
        },
      });

      return report;
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  async generateOperatorRevenueReport(
    operatorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OperatorRevenueReport> {
    try {
      // Get operator earnings
      const earnings = await this.revenueShareService.getOperatorEarnings(
        operatorId,
        startDate,
        endDate
      );

      // Get detailed transaction breakdown
      const { data: transactions, error: transactionError } = await this.supabase
        .from('revenue_shares')
        .select(`
          *,
          payment_transactions (
            id,
            amount,
            currency,
            status,
            created_at,
            bookings (
              id,
              start_time,
              end_time,
              parking_spots (
                id,
                number,
                zones (
                  id,
                  name,
                  sections (
                    id,
                    name,
                    locations (
                      id,
                      name,
                      type
                    )
                  )
                )
              )
            )
          )
        `)
        .eq('operator_id', operatorId)
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString())
        .order('calculated_at', { ascending: false });

      if (transactionError) {
        throw new Error(`Failed to fetch operator transactions: ${transactionError.message}`);
      }

      // Get payout history
      const payouts = await this.payoutService.getPayoutHistory(operatorId, 100);
      const periodPayouts = payouts.filter(
        payout => payout.createdAt >= startDate && payout.createdAt <= endDate
      );

      // Calculate metrics
      const totalTransactions = transactions?.length || 0;
      const averageTransactionValue = totalTransactions > 0 
        ? earnings.totalRevenue / totalTransactions 
        : 0;

      // Group transactions by location
      const locationBreakdown = this.groupTransactionsByLocation(transactions || []);

      // Calculate monthly trends
      const monthlyTrends = this.calculateMonthlyTrends(transactions || [], startDate, endDate);

      return {
        operatorId,
        period: { startDate, endDate },
        summary: {
          totalRevenue: earnings.totalRevenue,
          operatorShare: earnings.operatorShare,
          parkAngelShare: earnings.parkAngelShare,
          transactionCount: earnings.transactionCount,
          averageTransactionValue,
        },
        breakdown: earnings.breakdown,
        transactions: (transactions || []).map(this.mapTransactionForReport),
        payouts: periodPayouts,
        locationBreakdown,
        monthlyTrends,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating operator revenue report:', error);
      throw error;
    }
  }

  async generateHostRevenueReport(
    hostId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HostRevenueReport> {
    try {
      // Get host earnings
      const earnings = await this.revenueShareService.getHostEarnings(
        hostId,
        startDate,
        endDate
      );

      // Get detailed transaction breakdown
      const { data: transactions, error: transactionError } = await this.supabase
        .from('revenue_shares')
        .select(`
          *,
          payment_transactions (
            id,
            amount,
            currency,
            status,
            created_at,
            bookings (
              id,
              start_time,
              end_time,
              parking_spots (
                id,
                number,
                zones (
                  id,
                  name,
                  sections (
                    id,
                    name,
                    locations (
                      id,
                      name,
                      type
                    )
                  )
                )
              )
            )
          )
        `)
        .eq('host_id', hostId)
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString())
        .order('calculated_at', { ascending: false });

      if (transactionError) {
        throw new Error(`Failed to fetch host transactions: ${transactionError.message}`);
      }

      // Get payout history
      const payouts = await this.payoutService.getPayoutHistory(hostId, 100);
      const periodPayouts = payouts.filter(
        payout => payout.createdAt >= startDate && payout.createdAt <= endDate
      );

      // Calculate metrics
      const totalTransactions = transactions?.length || 0;
      const averageTransactionValue = totalTransactions > 0 
        ? earnings.totalRevenue / totalTransactions 
        : 0;

      // Group transactions by listing
      const listingBreakdown = this.groupTransactionsByListing(transactions || []);

      // Calculate occupancy rates
      const occupancyRates = await this.calculateHostOccupancyRates(hostId, startDate, endDate);

      return {
        hostId,
        period: { startDate, endDate },
        summary: {
          totalRevenue: earnings.totalRevenue,
          hostShare: earnings.hostShare,
          parkAngelShare: earnings.parkAngelShare,
          transactionCount: earnings.transactionCount,
          averageTransactionValue,
        },
        breakdown: earnings.breakdown,
        transactions: (transactions || []).map(this.mapTransactionForReport),
        payouts: periodPayouts,
        listingBreakdown,
        occupancyRates,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating host revenue report:', error);
      throw error;
    }
  }

  async generateTransactionReconciliationReport(
    startDate: Date,
    endDate: Date
  ): Promise<TransactionReconciliationReport> {
    try {
      // Get all payment transactions in the period
      const { data: transactions, error: transactionError } = await this.supabase
        .from('payment_transactions')
        .select(`
          *,
          bookings (
            id,
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
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (transactionError) {
        throw new Error(`Failed to fetch transactions: ${transactionError.message}`);
      }

      // Get all revenue shares in the period
      const { data: revenueShares, error: revenueError } = await this.supabase
        .from('revenue_shares')
        .select('*')
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString());

      if (revenueError) {
        throw new Error(`Failed to fetch revenue shares: ${revenueError.message}`);
      }

      // Get all payouts in the period
      const { data: payouts, error: payoutError } = await this.supabase
        .from('payouts')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (payoutError) {
        throw new Error(`Failed to fetch payouts: ${payoutError.message}`);
      }

      // Perform reconciliation
      const reconciliation = this.performReconciliation(
        transactions || [],
        revenueShares || [],
        payouts || []
      );

      return {
        period: { startDate, endDate },
        summary: {
          totalTransactions: transactions?.length || 0,
          totalAmount: (transactions || []).reduce((sum, t) => sum + Math.abs(t.amount), 0),
          totalRevenueShares: revenueShares?.length || 0,
          totalPayouts: payouts?.length || 0,
          reconciledTransactions: reconciliation.reconciledCount,
          unreconciledTransactions: reconciliation.unreconciledCount,
        },
        transactions: (transactions || []).map(this.mapTransactionForReconciliation),
        revenueShares: revenueShares || [],
        payouts: payouts || [],
        discrepancies: reconciliation.discrepancies,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating transaction reconciliation report:', error);
      throw error;
    }
  }

  async exportReport(reportId: string, format: ExportFormat): Promise<ReportExportResult> {
    try {
      // Get report from database
      const { data: reportData, error } = await this.supabase
        .from('financial_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !reportData) {
        throw new Error('Report not found');
      }

      const report = this.mapReportFromDB(reportData);

      let exportResult: ReportExportResult;

      switch (format) {
        case ExportFormat.PDF:
          exportResult = await this.exportToPDF(report);
          break;
        case ExportFormat.EXCEL:
          exportResult = await this.exportToExcel(report);
          break;
        case ExportFormat.CSV:
          exportResult = await this.exportToCSV(report);
          break;
        case ExportFormat.JSON:
          exportResult = await this.exportToJSON(report);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Log audit event
      await this.logAuditEvent({
        entityId: reportId,
        entityType: 'financial_report',
        action: 'export',
        userId: report.generatedBy,
        details: {
          format,
          fileName: exportResult.fileName,
        },
      });

      return exportResult;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  async getAuditTrail(
    entityId: string,
    entityType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditTrailEntry[]> {
    try {
      let query = this.supabase
        .from('audit_trail')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch audit trail: ${error.message}`);
      }

      return (data || []).map(this.mapAuditTrailFromDB);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  }

  async logAuditEvent(event: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entity_id: event.entityId,
        entity_type: event.entityType,
        action: event.action,
        user_id: event.userId,
        details: event.details,
        timestamp: new Date(),
      };

      const { error } = await this.supabase
        .from('audit_trail')
        .insert(auditEntry);

      if (error) {
        throw new Error(`Failed to log audit event: ${error.message}`);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error for audit logging failures
    }
  }

  // Private helper methods

  private async generatePayoutSummaryReport(
    startDate: Date,
    endDate: Date,
    recipientId?: string
  ): Promise<any> {
    let query = this.supabase
      .from('payouts')
      .select(`
        *,
        bank_accounts (
          bank_name,
          account_name,
          account_number
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (recipientId) {
      query = query.eq('recipient_id', recipientId);
    }

    const { data: payouts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payouts: ${error.message}`);
    }

    const totalAmount = (payouts || []).reduce((sum, payout) => sum + payout.amount, 0);
    const paidAmount = (payouts || [])
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amount, 0);
    const pendingAmount = (payouts || [])
      .filter(payout => payout.status === 'pending')
      .reduce((sum, payout) => sum + payout.amount, 0);

    return {
      summary: {
        totalPayouts: payouts?.length || 0,
        totalAmount,
        paidAmount,
        pendingAmount,
        failedAmount: totalAmount - paidAmount - pendingAmount,
      },
      payouts: payouts || [],
    };
  }

  private async generateRevenueAnalysisReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const parkAngelRevenue = await this.revenueShareService.getParkAngelRevenue(startDate, endDate);

    // Get revenue by parking type
    const { data: revenueByType, error } = await this.supabase
      .from('revenue_shares')
      .select(`
        park_angel_share,
        payment_transactions (
          bookings (
            parking_spots (
              zones (
                sections (
                  locations (type)
                )
              )
            )
          )
        )
      `)
      .gte('calculated_at', startDate.toISOString())
      .lte('calculated_at', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch revenue by type: ${error.message}`);
    }

    return {
      summary: parkAngelRevenue,
      breakdown: parkAngelRevenue.breakdown,
      revenueByType: this.calculateRevenueByType(revenueByType || []),
    };
  }

  private getReportTitle(type: FinancialReportType): string {
    const titles = {
      [FinancialReportType.OPERATOR_REVENUE]: 'Operator Revenue Report',
      [FinancialReportType.HOST_REVENUE]: 'Host Revenue Report',
      [FinancialReportType.TRANSACTION_RECONCILIATION]: 'Transaction Reconciliation Report',
      [FinancialReportType.PAYOUT_SUMMARY]: 'Payout Summary Report',
      [FinancialReportType.REVENUE_ANALYSIS]: 'Revenue Analysis Report',
    };
    return titles[type] || 'Financial Report';
  }

  private getReportDescription(type: FinancialReportType, params: FinancialReportParams): string {
    const startDate = params.startDate.toLocaleDateString();
    const endDate = params.endDate.toLocaleDateString();
    
    const descriptions = {
      [FinancialReportType.OPERATOR_REVENUE]: `Detailed revenue analysis for operator from ${startDate} to ${endDate}`,
      [FinancialReportType.HOST_REVENUE]: `Detailed revenue analysis for host from ${startDate} to ${endDate}`,
      [FinancialReportType.TRANSACTION_RECONCILIATION]: `Transaction reconciliation analysis from ${startDate} to ${endDate}`,
      [FinancialReportType.PAYOUT_SUMMARY]: `Payout summary and status from ${startDate} to ${endDate}`,
      [FinancialReportType.REVENUE_ANALYSIS]: `Comprehensive revenue analysis from ${startDate} to ${endDate}`,
    };
    return descriptions[type] || `Financial report from ${startDate} to ${endDate}`;
  }

  private getRecordCount(data: any): number {
    if (data.transactions) return data.transactions.length;
    if (data.payouts) return data.payouts.length;
    return 0;
  }

  private getTotalAmount(data: any): number {
    if (data.summary?.totalRevenue) return data.summary.totalRevenue;
    if (data.summary?.totalAmount) return data.summary.totalAmount;
    return 0;
  }

  private async storeReport(report: FinancialReport): Promise<void> {
    const { error } = await this.supabase
      .from('financial_reports')
      .insert({
        id: report.id,
        type: report.type,
        title: report.title,
        description: report.description,
        generated_at: report.generatedAt,
        generated_by: report.generatedBy,
        parameters: report.parameters,
        data: report.data,
        metadata: report.metadata,
      });

    if (error) {
      console.error('Failed to store report:', error);
      // Don't throw error for storage failures
    }
  }

  private groupTransactionsByLocation(transactions: any[]): any[] {
    const locationMap = new Map();

    transactions.forEach(transaction => {
      const location = transaction.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations;
      if (location) {
        const key = location.id;
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            locationId: location.id,
            locationName: location.name,
            locationType: location.type,
            revenue: 0,
            transactionCount: 0,
          });
        }
        const locationData = locationMap.get(key);
        locationData.revenue += transaction.operator_share || 0;
        locationData.transactionCount += 1;
      }
    });

    return Array.from(locationMap.values());
  }

  private groupTransactionsByListing(transactions: any[]): any[] {
    // Similar to groupTransactionsByLocation but for hosted parking listings
    return this.groupTransactionsByLocation(transactions);
  }

  private calculateMonthlyTrends(transactions: any[]): any[] {
    const monthlyMap = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.calculated_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          revenue: 0,
          transactionCount: 0,
        });
      }
      
      const monthData = monthlyMap.get(monthKey);
      monthData.revenue += transaction.operator_share || transaction.host_share || 0;
      monthData.transactionCount += 1;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  private async calculateHostOccupancyRates(): Promise<any> {
    // This would calculate occupancy rates for hosted parking
    // Implementation depends on booking data structure
    return {
      averageOccupancyRate: 0,
      peakOccupancyRate: 0,
      lowOccupancyRate: 0,
    };
  }

  private performReconciliation(transactions: any[], revenueShares: any[]): any {
    const reconciledTransactions = new Set();
    const discrepancies = [];

    // Check if each transaction has corresponding revenue share
    transactions.forEach(transaction => {
      const revenueShare = revenueShares.find(rs => rs.transaction_id === transaction.id);
      if (revenueShare) {
        reconciledTransactions.add(transaction.id);
        
        // Check for amount discrepancies
        if (Math.abs(Math.abs(transaction.amount) - revenueShare.total_amount) > 0.01) {
          discrepancies.push({
            type: 'amount_mismatch',
            transactionId: transaction.id,
            transactionAmount: Math.abs(transaction.amount),
            revenueShareAmount: revenueShare.total_amount,
            difference: Math.abs(transaction.amount) - revenueShare.total_amount,
          });
        }
      } else {
        discrepancies.push({
          type: 'missing_revenue_share',
          transactionId: transaction.id,
          amount: Math.abs(transaction.amount),
        });
      }
    });

    return {
      reconciledCount: reconciledTransactions.size,
      unreconciledCount: transactions.length - reconciledTransactions.size,
      discrepancies,
    };
  }

  private calculateRevenueByType(revenueData: any[]): any {
    const typeMap = new Map();

    revenueData.forEach(item => {
      const locationType = item.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations?.type;
      if (locationType) {
        if (!typeMap.has(locationType)) {
          typeMap.set(locationType, 0);
        }
        typeMap.set(locationType, typeMap.get(locationType) + item.park_angel_share);
      }
    });

    return Object.fromEntries(typeMap);
  }

  private mapTransactionForReport(transaction: any): any {
    return {
      id: transaction.transaction_id,
      amount: transaction.total_amount,
      operatorShare: transaction.operator_share,
      hostShare: transaction.host_share,
      parkAngelShare: transaction.park_angel_share,
      calculatedAt: transaction.calculated_at,
      location: transaction.payment_transactions?.bookings?.parking_spots?.zones?.sections?.locations?.name,
    };
  }

  private mapTransactionForReconciliation(transaction: any): any {
    return {
      id: transaction.id,
      amount: Math.abs(transaction.amount),
      status: transaction.status,
      createdAt: transaction.created_at,
      location: transaction.bookings?.parking_spots?.zones?.sections?.locations?.name,
    };
  }

  private mapReportFromDB(data: any): FinancialReport {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      generatedAt: new Date(data.generated_at),
      generatedBy: data.generated_by,
      parameters: data.parameters,
      data: data.data,
      metadata: data.metadata,
    };
  }

  private mapAuditTrailFromDB(data: any): AuditTrailEntry {
    return {
      id: data.id,
      entityId: data.entity_id,
      entityType: data.entity_type,
      action: data.action,
      userId: data.user_id,
      details: data.details,
      timestamp: new Date(data.timestamp),
    };
  }

  // Export methods (simplified implementations)
  private async exportToPDF(report: FinancialReport): Promise<ReportExportResult> {
    // TODO: Implement PDF generation using a library like puppeteer or jsPDF
    const fileName = `${report.type}_${report.id}.pdf`;
    return {
      fileName,
      mimeType: 'application/pdf',
      url: `/api/reports/export/${report.id}/pdf`,
      size: 0, // Would be calculated after generation
    };
  }

  private async exportToExcel(report: FinancialReport): Promise<ReportExportResult> {
    // TODO: Implement Excel generation using a library like exceljs
    const fileName = `${report.type}_${report.id}.xlsx`;
    return {
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      url: `/api/reports/export/${report.id}/excel`,
      size: 0,
    };
  }

  private async exportToCSV(report: FinancialReport): Promise<ReportExportResult> {
    // TODO: Implement CSV generation
    const fileName = `${report.type}_${report.id}.csv`;
    return {
      fileName,
      mimeType: 'text/csv',
      url: `/api/reports/export/${report.id}/csv`,
      size: 0,
    };
  }

  private async exportToJSON(report: FinancialReport): Promise<ReportExportResult> {
    const fileName = `${report.type}_${report.id}.json`;
    return {
      fileName,
      mimeType: 'application/json',
      url: `/api/reports/export/${report.id}/json`,
      size: JSON.stringify(report).length,
    };
  }
}