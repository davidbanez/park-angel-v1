// Hook for operator reporting functionality

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  OperatorReport,
  OperatorReportParams,
  ReportQueryOptions,
  ReportExportOptions,
  ReportExportResult,
} from '../../../shared/src/types/operator-reporting';
import { OperatorReportingServiceImpl } from '../../../shared/src/services/operator-reporting';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useOperatorReporting = () => {
  const [reports, setReports] = useState<OperatorReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportingService = new OperatorReportingServiceImpl(supabase as any);

  const generateReport = useCallback(async (params: OperatorReportParams): Promise<OperatorReport> => {
    setLoading(true);
    setError(null);
    
    try {
      const report = await reportingService.generateReport(params);
      setReports(prev => [report, ...prev]);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getReports = useCallback(async (operatorId: string, options?: ReportQueryOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedReports = await reportingService.getReports(operatorId, options);
      setReports(fetchedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getReport = useCallback(async (reportId: string): Promise<OperatorReport | null> => {
    setLoading(true);
    setError(null);
    
    try {
      return await reportingService.getReport(reportId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await reportingService.deleteReport(reportId);
      setReports(prev => prev.filter(report => report.id !== reportId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (
    reportId: string,
    options: ReportExportOptions
  ): Promise<ReportExportResult> => {
    setLoading(true);
    setError(null);
    
    try {
      return await reportingService.exportReport(reportId, options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleReport = useCallback(async (
    params: OperatorReportParams,
    schedule: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      return await reportingService.scheduleReport(params, schedule);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getScheduledReports = useCallback(async (operatorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await reportingService.getScheduledReports(operatorId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scheduled reports';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelScheduledReport = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await reportingService.cancelScheduledReport(scheduleId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel scheduled report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reports,
    loading,
    error,
    generateReport,
    getReports,
    getReport,
    deleteReport,
    exportReport,
    scheduleReport,
    getScheduledReports,
    cancelScheduledReport,
  };
};