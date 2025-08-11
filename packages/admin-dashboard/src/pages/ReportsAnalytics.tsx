import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable } from '../components/ui/DataTable'
import { 
  ReportingService, 
  ReportType, 
  ReportRequest, 
  GeneratedReport, 
  ScheduledReport,
  ReportFilter,
  ReportSort
} from '../services/reportingService'
import { ExportFormat } from '@park-angel/shared/src/types/financial-reporting'

interface ReportGeneratorProps {
  reportTypes: ReportType[];
  onGenerateReport: (request: ReportRequest) => void;
  isGenerating: boolean;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  reportTypes, 
  onGenerateReport, 
  isGenerating 
}) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [sorting, setSorting] = useState<ReportSort[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleGenerateReport = () => {
    if (!selectedReportType) return;

    const request: ReportRequest = {
      reportTypeId: selectedReportType.id,
      parameters,
      filters,
      sorting,
      searchQuery: searchQuery || undefined
    };

    onGenerateReport(request);
  };

  const addFilter = () => {
    setFilters(prev => [...prev, {
      field: '',
      operator: 'equals',
      value: ''
    }]);
  };

  const updateFilter = (index: number, filter: ReportFilter) => {
    setFilters(prev => prev.map((f, i) => i === index ? filter : f));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const addSort = () => {
    setSorting(prev => [...prev, {
      field: '',
      direction: 'asc'
    }]);
  };

  const updateSort = (index: number, sort: ReportSort) => {
    setSorting(prev => prev.map((s, i) => i === index ? sort : s));
  };

  const removeSort = (index: number) => {
    setSorting(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <select
            value={selectedReportType?.id || ''}
            onChange={(e) => {
              const reportType = reportTypes.find(rt => rt.id === e.target.value);
              setSelectedReportType(reportType || null);
              setParameters({});
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a report type</option>
            {reportTypes.map(reportType => (
              <option key={reportType.id} value={reportType.id}>
                {reportType.name}
              </option>
            ))}
          </select>
          {selectedReportType && (
            <p className="mt-1 text-sm text-gray-600">
              {selectedReportType.description}
            </p>
          )}
        </div>

        {/* Report Parameters */}
        {selectedReportType && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedReportType.parameters.map(param => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {param.label}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {param.type === 'date' && (
                    <Input
                      type="date"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      required={param.required}
                    />
                  )}
                  {param.type === 'select' && (
                    <select
                      value={parameters[param.name] || param.defaultValue || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required={param.required}
                    >
                      <option value="">Select an option</option>
                      {param.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {param.type === 'multiselect' && (
                    <select
                      multiple
                      value={parameters[param.name] || []}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        handleParameterChange(param.name, values);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      size={Math.min(param.options?.length || 3, 5)}
                    >
                      {param.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {param.type === 'number' && (
                    <Input
                      type="number"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                      required={param.required}
                    />
                  )}
                  {param.type === 'text' && (
                    <Input
                      type="text"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      required={param.required}
                    />
                  )}
                  {param.type === 'boolean' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parameters[param.name] ?? param.defaultValue ?? false}
                        onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Enable</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query (optional)
          </label>
          <Input
            type="text"
            placeholder="Search within report data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <Button onClick={addFilter} variant="outline" size="sm">
              Add Filter
            </Button>
          </div>
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Field name"
                value={filter.field}
                onChange={(e) => updateFilter(index, { ...filter, field: e.target.value })}
                className="flex-1"
              />
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, { ...filter, operator: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="between">Between</option>
                <option value="in">In</option>
                <option value="not_in">Not In</option>
              </select>
              <Input
                placeholder="Value"
                value={filter.value}
                onChange={(e) => updateFilter(index, { ...filter, value: e.target.value })}
                className="flex-1"
              />
              <Button onClick={() => removeFilter(index)} variant="outline" size="sm">
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Sorting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Sorting</h3>
            <Button onClick={addSort} variant="outline" size="sm">
              Add Sort
            </Button>
          </div>
          {sorting.map((sort, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Field name"
                value={sort.field}
                onChange={(e) => updateSort(index, { ...sort, field: e.target.value })}
                className="flex-1"
              />
              <select
                value={sort.direction}
                onChange={(e) => updateSort(index, { ...sort, direction: e.target.value as 'asc' | 'desc' })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <Button onClick={() => removeSort(index)} variant="outline" size="sm">
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedReportType || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface ReportViewerProps {
  report: GeneratedReport | null;
  onExport: (reportId: string, format: ExportFormat) => void;
  isExporting: boolean;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report, onExport, isExporting }) => {
  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No report generated yet. Use the form above to generate a report.</p>
        </CardContent>
      </Card>
    );
  }

  const handleExport = (format: ExportFormat) => {
    onExport(report.id, format);
  };

  const renderReportData = () => {
    if (Array.isArray(report.data)) {
      return (
        <DataTable
          data={report.data}
          columns={report.data.length > 0 ? Object.keys(report.data[0]).map(key => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            sortable: true
          })) : []}
          searchable={true}
          exportable={true}
        />
      );
    } else if (report.data.summary) {
      return (
        <div className="space-y-6">
          {/* Summary Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(report.data.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? 
                      (key.toLowerCase().includes('amount') || key.toLowerCase().includes('revenue') ? 
                        `₱${value.toLocaleString()}` : 
                        value.toLocaleString()
                      ) : 
                      String(value)
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Data */}
          {report.data.transactions && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transactions</h3>
              <DataTable
                data={report.data.transactions}
                columns={[
                  { key: 'id', label: 'ID', sortable: true },
                  { key: 'amount', label: 'Amount', sortable: true, render: (value) => `₱${value.toLocaleString()}` },
                  { key: 'calculatedAt', label: 'Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'location', label: 'Location', sortable: true }
                ]}
                searchable={true}
              />
            </div>
          )}

          {report.data.payouts && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payouts</h3>
              <DataTable
                data={report.data.payouts}
                columns={[
                  { key: 'id', label: 'ID', sortable: true },
                  { key: 'amount', label: 'Amount', sortable: true, render: (value) => `₱${value.toLocaleString()}` },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'createdAt', label: 'Created', sortable: true, render: (value) => new Date(value).toLocaleDateString() }
                ]}
                searchable={true}
              />
            </div>
          )}

          {report.data.breakdown && Array.isArray(report.data.breakdown) && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Breakdown</h3>
              <DataTable
                data={report.data.breakdown}
                columns={Object.keys(report.data.breakdown[0] || {}).map(key => ({
                  key,
                  label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                  sortable: true,
                  render: key.toLowerCase().includes('amount') || key.toLowerCase().includes('revenue') ? 
                    (value: number) => `₱${value.toLocaleString()}` : undefined
                }))}
                searchable={true}
              />
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(report.data, null, 2)}
          </pre>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{report.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => handleExport(ExportFormat.CSV)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport(ExportFormat.EXCEL)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              Export Excel
            </Button>
            <Button
              onClick={() => handleExport(ExportFormat.PDF)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Report Metadata */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Generated:</span>
              <p className="text-gray-900">{report.metadata.generatedAt.toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Records:</span>
              <p className="text-gray-900">{report.metadata.recordCount.toLocaleString()}</p>
            </div>
            {report.metadata.totalAmount && (
              <div>
                <span className="font-medium text-gray-600">Total Amount:</span>
                <p className="text-gray-900">₱{report.metadata.totalAmount.toLocaleString()}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-600">Processing Time:</span>
              <p className="text-gray-900">{report.metadata.processingTime}ms</p>
            </div>
          </div>
        </div>

        {/* Report Data */}
        {renderReportData()}
      </CardContent>
    </Card>
  );
};

interface ScheduledReportsProps {
  scheduledReports: ScheduledReport[];
  onCreateScheduled: (report: Omit<ScheduledReport, 'id' | 'createdAt'>) => void;
  onUpdateScheduled: (id: string, updates: Partial<ScheduledReport>) => void;
  onDeleteScheduled: (id: string) => void;
  reportTypes: ReportType[];
}

const ScheduledReports: React.FC<ScheduledReportsProps> = ({
  scheduledReports,
  onCreateScheduled,
  onUpdateScheduled,
  onDeleteScheduled,
  reportTypes
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);

  const handleCreateScheduled = (reportData: any) => {
    onCreateScheduled(reportData);
    setShowCreateModal(false);
  };

  const handleUpdateScheduled = (reportData: any) => {
    if (editingReport) {
      onUpdateScheduled(editingReport.id, reportData);
      setEditingReport(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scheduled Reports</CardTitle>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Schedule New Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={scheduledReports}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { 
              key: 'reportTypeId', 
              label: 'Report Type', 
              sortable: true,
              render: (value) => reportTypes.find(rt => rt.id === value)?.name || value
            },
            { 
              key: 'schedule.frequency', 
              label: 'Frequency', 
              sortable: true,
              render: (_, row) => row.schedule.frequency
            },
            { 
              key: 'nextRun', 
              label: 'Next Run', 
              sortable: true,
              render: (value) => new Date(value).toLocaleString()
            },
            { 
              key: 'isActive', 
              label: 'Status', 
              sortable: true,
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {value ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, row) => (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setEditingReport(row)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onDeleteScheduled(row.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
          searchable={true}
        />

        {/* Create/Edit Modal */}
        {(showCreateModal || editingReport) && (
          <ScheduledReportModal
            isOpen={true}
            onClose={() => {
              setShowCreateModal(false);
              setEditingReport(null);
            }}
            onSave={editingReport ? handleUpdateScheduled : handleCreateScheduled}
            reportTypes={reportTypes}
            initialData={editingReport}
          />
        )}
      </CardContent>
    </Card>
  );
};

interface ScheduledReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  reportTypes: ReportType[];
  initialData?: ScheduledReport | null;
}

const ScheduledReportModal: React.FC<ScheduledReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  reportTypes,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    reportTypeId: initialData?.reportTypeId || '',
    parameters: initialData?.parameters || {},
    schedule: initialData?.schedule || {
      frequency: 'monthly' as const,
      time: '09:00'
    },
    recipients: initialData?.recipients || [''],
    isActive: initialData?.isActive ?? true
  });

  const selectedReportType = reportTypes.find(rt => rt.id === formData.reportTypeId);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      recipients: formData.recipients.filter(email => email.trim() !== ''),
      createdBy: 'current-user-id' // This should come from auth context
    };
    onSave(dataToSave);
  };

  const updateRecipient = (index: number, email: string) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = email;
    setFormData(prev => ({ ...prev, recipients: newRecipients }));
  };

  const addRecipient = () => {
    setFormData(prev => ({ ...prev, recipients: [...prev.recipients, ''] }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      recipients: prev.recipients.filter((_, i) => i !== index) 
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Scheduled Report' : 'Schedule New Report'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter report name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            value={formData.reportTypeId}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              reportTypeId: e.target.value,
              parameters: {}
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a report type</option>
            {reportTypes.map(reportType => (
              <option key={reportType.id} value={reportType.id}>
                {reportType.name}
              </option>
            ))}
          </select>
        </div>

        {/* Report Parameters */}
        {selectedReportType && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Parameters</h3>
            <div className="space-y-2">
              {selectedReportType.parameters.map(param => (
                <div key={param.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {param.label}
                  </label>
                  {param.type === 'date' && (
                    <Input
                      type="date"
                      value={formData.parameters[param.name] || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, [param.name]: e.target.value }
                      }))}
                    />
                  )}
                  {param.type === 'select' && (
                    <select
                      value={formData.parameters[param.name] || param.defaultValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, [param.name]: e.target.value }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select an option</option>
                      {param.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Configuration */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Schedule</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Frequency
              </label>
              <select
                value={formData.schedule.frequency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, frequency: e.target.value as any }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Time
              </label>
              <Input
                type="time"
                value={formData.schedule.time}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, time: e.target.value }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Recipients
            </label>
            <Button onClick={addRecipient} variant="outline" size="sm">
              Add Recipient
            </Button>
          </div>
          {formData.recipients.map((email, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateRecipient(index, e.target.value)}
                placeholder="Enter email address"
                className="flex-1"
              />
              {formData.recipients.length > 1 && (
                <Button
                  onClick={() => removeRecipient(index)}
                  variant="outline"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Active Status */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!formData.name || !formData.reportTypeId}
          >
            {initialData ? 'Update' : 'Schedule'} Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const ReportsAnalytics: React.FC = () => {
  const [reportingService] = useState(() => new ReportingService());
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [currentReport, setCurrentReport] = useState<GeneratedReport | null>(null);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled'>('generate');

  useEffect(() => {
    // Load report types
    const types = reportingService.getAvailableReportTypes();
    setReportTypes(types);

    // Load scheduled reports
    loadScheduledReports();
  }, [reportingService]);

  const loadScheduledReports = async () => {
    try {
      const reports = await reportingService.getScheduledReports();
      setScheduledReports(reports);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
    }
  };

  const handleGenerateReport = async (request: ReportRequest) => {
    setIsGenerating(true);
    try {
      const report = await reportingService.generateReport(request, 'current-user-id');
      setCurrentReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
      // TODO: Show error notification
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = async (reportId: string, format: ExportFormat) => {
    setIsExporting(true);
    try {
      const exportResult = await reportingService.exportReport(reportId, format);
      
      // Download the file
      const link = document.createElement('a');
      link.href = exportResult.url;
      link.download = exportResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting report:', error);
      // TODO: Show error notification
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateScheduledReport = async (reportData: Omit<ScheduledReport, 'id' | 'createdAt'>) => {
    try {
      await reportingService.createScheduledReport(reportData);
      await loadScheduledReports();
    } catch (error) {
      console.error('Error creating scheduled report:', error);
    }
  };

  const handleUpdateScheduledReport = async (id: string, updates: Partial<ScheduledReport>) => {
    try {
      await reportingService.updateScheduledReport(id, updates);
      await loadScheduledReports();
    } catch (error) {
      console.error('Error updating scheduled report:', error);
    }
  };

  const handleDeleteScheduledReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      try {
        await reportingService.deleteScheduledReport(id);
        await loadScheduledReports();
      } catch (error) {
        console.error('Error deleting scheduled report:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-gray-600">
          Generate comprehensive reports and manage scheduled analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generate Reports
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scheduled'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheduled Reports
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <ReportGenerator
            reportTypes={reportTypes}
            onGenerateReport={handleGenerateReport}
            isGenerating={isGenerating}
          />
          
          <ReportViewer
            report={currentReport}
            onExport={handleExportReport}
            isExporting={isExporting}
          />
        </div>
      )}

      {activeTab === 'scheduled' && (
        <ScheduledReports
          scheduledReports={scheduledReports}
          onCreateScheduled={handleCreateScheduledReport}
          onUpdateScheduled={handleUpdateScheduledReport}
          onDeleteScheduled={handleDeleteScheduledReport}
          reportTypes={reportTypes}
        />
      )}
    </div>
  )
}