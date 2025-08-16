import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Modal } from '../components/shared/Modal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ReportGenerator } from '../components/reports/ReportGenerator';
import { ReportList } from '../components/reports/ReportList';
import { ReportViewer } from '../components/reports/ReportViewer';
import { ReportFilters } from '../components/reports/ReportFilters';
import { ExportManager } from '../components/reports/ExportManager';
import { useOperatorReporting } from '../hooks/useOperatorReporting';
import { useOperatorStore } from '../stores/operatorStore';
import {
  OperatorReport,
  OperatorReportType,
  OperatorReportParams,
  ReportQueryOptions,
} from '../../../shared/src/types/operator-reporting';

export const ReportsPage: React.FC = () => {
  const { operatorData: currentOperator } = useOperatorStore();
  const {
    reports,
    loading,
    error,
    generateReport,
    getReports,
    deleteReport,
    exportReport,
  } = useOperatorReporting();

  const [selectedReport, setSelectedReport] = useState<OperatorReport | null>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [showExportManager, setShowExportManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilters, setReportFilters] = useState<ReportQueryOptions>({});

  useEffect(() => {
    if (currentOperator?.id) {
      loadReports();
    }
  }, [currentOperator?.id, reportFilters]);

  const loadReports = async () => {
    if (!currentOperator?.id) return;
    
    try {
      await getReports(currentOperator.id, {
        ...reportFilters,
        filters: {
          ...reportFilters.filters,
          searchQuery,
        },
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleGenerateReport = async (params: OperatorReportParams) => {
    if (!currentOperator?.id) return;

    try {
      const report = await generateReport({
        ...params,
        operatorId: currentOperator.id,
        generatedBy: currentOperator.id,
      });
      
      setShowReportGenerator(false);
      await loadReports();
      
      // Show the generated report
      setSelectedReport(report);
      setShowReportViewer(true);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleViewReport = (report: OperatorReport) => {
    setSelectedReport(report);
    setShowReportViewer(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      await loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleExportReport = (report: OperatorReport) => {
    setSelectedReport(report);
    setShowExportManager(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filters: ReportQueryOptions) => {
    setReportFilters(filters);
  };

  if (!currentOperator) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-secondary-400 mb-2">⚠️</div>
          <p className="text-secondary-600">No operator selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Reports & Analytics</h1>
          <p className="text-secondary-600 mt-1">
            Comprehensive reporting with advanced filtering and export capabilities
          </p>
        </div>
        <Button
          onClick={() => setShowReportGenerator(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Generate Report
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="lg:w-auto">
              <ReportFilters
                filters={reportFilters}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Reports</p>
                <p className="text-2xl font-bold text-secondary-900">{reports.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Revenue Reports</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {reports.filter(r => r.type === OperatorReportType.REVENUE_REPORT).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🚗</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Occupancy Reports</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {reports.filter(r => r.type === OperatorReportType.OCCUPANCY_REPORT).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Violation Reports</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {reports.filter(r => r.type === OperatorReportType.VIOLATION_REPORT).length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Recent Reports</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 mb-2">❌</div>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <ReportList
              reports={reports}
              onView={handleViewReport}
              onDelete={handleDeleteReport}
              onExport={handleExportReport}
            />
          )}
        </div>
      </Card>

      {/* Report Generator Modal */}
      <Modal
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
        title="Generate New Report"
        size="lg"
      >
        <ReportGenerator
          onGenerate={handleGenerateReport}
          onCancel={() => setShowReportGenerator(false)}
        />
      </Modal>

      {/* Report Viewer Modal */}
      <Modal
        isOpen={showReportViewer}
        onClose={() => setShowReportViewer(false)}
        title={selectedReport?.title || 'Report'}
        size="xl"
      >
        {selectedReport && (
          <ReportViewer
            report={selectedReport}
            onClose={() => setShowReportViewer(false)}
            onExport={() => {
              setShowReportViewer(false);
              setShowExportManager(true);
            }}
          />
        )}
      </Modal>

      {/* Export Manager Modal */}
      <Modal
        isOpen={showExportManager}
        onClose={() => setShowExportManager(false)}
        title="Export Report"
        size="md"
      >
        {selectedReport && (
          <ExportManager
            report={selectedReport}
            onExport={exportReport}
            onClose={() => setShowExportManager(false)}
          />
        )}
      </Modal>
    </div>
  );
};