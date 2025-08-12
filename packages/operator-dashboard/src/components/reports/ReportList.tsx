// Report list component for displaying generated reports

import React from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import {
  OperatorReport,
  OperatorReportType,
} from '../../../../shared/src/types/operator-reporting';

interface ReportListProps {
  reports: OperatorReport[];
  onView: (report: OperatorReport) => void;
  onDelete: (reportId: string) => void;
  onExport: (report: OperatorReport) => void;
}

export const ReportList: React.FC<ReportListProps> = ({
  reports,
  onView,
  onDelete,
  onExport,
}) => {
  const getReportIcon = (type: OperatorReportType): string => {
    const icons = {
      [OperatorReportType.REVENUE_REPORT]: '💰',
      [OperatorReportType.OCCUPANCY_REPORT]: '🚗',
      [OperatorReportType.USER_BEHAVIOR_REPORT]: '👥',
      [OperatorReportType.VIOLATION_REPORT]: '⚠️',
      [OperatorReportType.VIP_USAGE_REPORT]: '⭐',
      [OperatorReportType.ZONE_PERFORMANCE_REPORT]: '📊',
      [OperatorReportType.VEHICLE_TYPE_ANALYTICS]: '🚙',
      [OperatorReportType.OPERATIONAL_SUMMARY]: '📈',
    };
    return icons[type] || '📄';
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-secondary-400 text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">No reports yet</h3>
        <p className="text-secondary-600 mb-4">
          Generate your first report to see comprehensive analytics and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">
                    {getReportIcon(report.type)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                    {report.title}
                  </h3>
                  <p className="text-secondary-600 mb-2">{report.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-secondary-500">
                    <span>Generated: {formatDate(report.generatedAt)}</span>
                    <span>•</span>
                    <span>Records: {report.metadata.recordCount.toLocaleString()}</span>
                    {report.metadata.totalAmount && (
                      <>
                        <span>•</span>
                        <span>Total: {formatCurrency(report.metadata.totalAmount)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(report)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(report)}
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(report.id)}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Report Parameters Summary */}
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                <span>
                  Period: {new Date(report.parameters.startDate).toLocaleDateString()} - {new Date(report.parameters.endDate).toLocaleDateString()}
                </span>
                {report.parameters.groupBy && (
                  <>
                    <span>•</span>
                    <span>Grouped by: {report.parameters.groupBy}</span>
                  </>
                )}
                {report.parameters.filters && Object.keys(report.parameters.filters).length > 0 && (
                  <>
                    <span>•</span>
                    <span>Filtered</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};