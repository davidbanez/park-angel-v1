// Export manager component for exporting reports in various formats

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import {
  OperatorReport,
  ExportFormat,
  ReportExportOptions,
  ReportExportResult,
} from '../../../../shared/src/types/operator-reporting';

interface ExportManagerProps {
  report: OperatorReport;
  onExport: (reportId: string, options: ReportExportOptions) => Promise<ReportExportResult>;
  onClose: () => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  report,
  onExport,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.PDF);
  const [fileName, setFileName] = useState(
    `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
  );
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<ReportExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportFormats = [
    {
      value: ExportFormat.PDF,
      label: 'PDF Document',
      description: 'Formatted report with charts and tables',
      icon: '📄',
      extension: 'pdf',
    },
    {
      value: ExportFormat.EXCEL,
      label: 'Excel Spreadsheet',
      description: 'Data in spreadsheet format with multiple sheets',
      icon: '📊',
      extension: 'xlsx',
    },
    {
      value: ExportFormat.CSV,
      label: 'CSV File',
      description: 'Raw data in comma-separated values format',
      icon: '📋',
      extension: 'csv',
    },
    {
      value: ExportFormat.JSON,
      label: 'JSON Data',
      description: 'Raw data in JSON format for developers',
      icon: '🔧',
      extension: 'json',
    },
  ];

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setExportResult(null);

    try {
      const options: ReportExportOptions = {
        format,
        includeCharts,
        includeRawData,
        fileName: `${fileName}.${exportFormats.find(f => f.value === format)?.extension}`,
      };

      const result = await onExport(report.id, options);
      setExportResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (exportResult) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = exportResult.url;
      link.download = exportResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (exportResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Export Completed
          </h3>
          <p className="text-secondary-600 mb-4">
            Your report has been successfully exported and is ready for download.
          </p>
        </div>

        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary-900">{exportResult.fileName}</p>
              <p className="text-sm text-secondary-600">
                {formatFileSize(exportResult.size)} • {exportResult.mimeType}
              </p>
              <p className="text-xs text-secondary-500 mt-1">
                Expires: {new Date(exportResult.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Download
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exportFormats.map((formatOption) => (
            <div
              key={formatOption.value}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                format === formatOption.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
              onClick={() => setFormat(formatOption.value)}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{formatOption.icon}</span>
                <div>
                  <h3 className="font-medium text-secondary-900">{formatOption.label}</h3>
                  <p className="text-sm text-secondary-600 mt-1">{formatOption.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Name */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          File Name
        </label>
        <Input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
        />
        <p className="text-xs text-secondary-500 mt-1">
          Extension will be added automatically based on format
        </p>
      </div>

      {/* Export Options */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-3">
          Export Options
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="mr-3"
              disabled={format === ExportFormat.CSV || format === ExportFormat.JSON}
            />
            <div>
              <span className="text-sm font-medium text-secondary-900">Include Charts</span>
              <p className="text-xs text-secondary-600">
                Include visual charts and graphs in the export
              </p>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeRawData}
              onChange={(e) => setIncludeRawData(e.target.checked)}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-secondary-900">Include Raw Data</span>
              <p className="text-xs text-secondary-600">
                Include detailed raw data tables
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-secondary-50 rounded-lg p-4">
        <h3 className="font-medium text-secondary-900 mb-2">Export Summary</h3>
        <div className="text-sm text-secondary-600 space-y-1">
          <p>Report: {report.title}</p>
          <p>Records: {report.metadata.recordCount.toLocaleString()}</p>
          <p>Period: {new Date(report.parameters.startDate).toLocaleDateString()} - {new Date(report.parameters.endDate).toLocaleDateString()}</p>
          <p>Format: {exportFormats.find(f => f.value === format)?.label}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-400 mr-2">❌</span>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          disabled={loading || !fileName.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Exporting...
            </>
          ) : (
            'Export Report'
          )}
        </Button>
      </div>
    </div>
  );
};