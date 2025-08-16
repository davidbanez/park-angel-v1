import { createClient } from '@supabase/supabase-js';
import { OperatorReport, OperatorReportParams, ReportExportOptions, ReportExportResult, ReportQueryOptions } from '../types/operator-reporting';
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
export declare class OperatorReportingServiceImpl implements OperatorReportingService {
    private supabase;
    constructor(supabase: ReturnType<typeof createClient>);
    generateReport(params: OperatorReportParams): Promise<OperatorReport>;
    getReports(operatorId: string, options?: ReportQueryOptions): Promise<OperatorReport[]>;
    getReport(reportId: string): Promise<OperatorReport | null>;
    deleteReport(reportId: string): Promise<void>;
    exportReport(reportId: string, options: ReportExportOptions): Promise<ReportExportResult>;
    scheduleReport(params: OperatorReportParams, schedule: string): Promise<string>;
    getScheduledReports(operatorId: string): Promise<any[]>;
    cancelScheduledReport(scheduleId: string): Promise<void>;
    private generateRevenueReport;
    private generateOccupancyReport;
    private generateUserBehaviorReport;
    private generateViolationReport;
    private generateVIPUsageReport;
    private generateZonePerformanceReport;
    private generateVehicleTypeAnalytics;
    private generateOperationalSummary;
    private generatePDFExport;
    private generateExcelExport;
    private generateCSVExport;
    private mapDatabaseToReport;
    private getReportTitle;
    private getReportDescription;
    private getRecordCount;
    private getTotalAmount;
    private safeGetNumber;
    private safeGetString;
    private safeGetArray;
}
