// Report generator component for creating new reports

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card } from '../shared/Card';
import {
  OperatorReportType,
  OperatorReportParams,
  OperatorReportFilters,
} from '../../../../shared/src/types/operator-reporting';

interface ReportGeneratorProps {
  onGenerate: (params: OperatorReportParams) => Promise<void>;
  onCancel: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  onGenerate,
  onCancel,
}) => {
  const [reportType, setReportType] = useState<OperatorReportType>(OperatorReportType.REVENUE_REPORT);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState<OperatorReportFilters>({});
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'location' | 'zone' | 'vehicle_type'>('day');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: OperatorReportType.REVENUE_REPORT, label: 'Revenue Report', icon: '💰' },
    { value: OperatorReportType.OCCUPANCY_REPORT, label: 'Occupancy Report', icon: '🚗' },
    { value: OperatorReportType.USER_BEHAVIOR_REPORT, label: 'User Behavior Report', icon: '👥' },
    { value: OperatorReportType.VIOLATION_REPORT, label: 'Violation Report', icon: '⚠️' },
    { value: OperatorReportType.VIP_USAGE_REPORT, label: 'VIP Usage Report', icon: '⭐' },
    { value: OperatorReportType.ZONE_PERFORMANCE_REPORT, label: 'Zone Performance Report', icon: '📊' },
    { value: OperatorReportType.VEHICLE_TYPE_ANALYTICS, label: 'Vehicle Type Analytics', icon: '🚙' },
    { value: OperatorReportType.OPERATIONAL_SUMMARY, label: 'Operational Summary', icon: '📈' },
  ];

  const groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'location', label: 'By Location' },
    { value: 'zone', label: 'By Zone' },
    { value: 'vehicle_type', label: 'By Vehicle Type' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params: OperatorReportParams = {
        type: reportType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        operatorId: '', // Will be set by parent component
        filters,
        groupBy,
        generatedBy: '', // Will be set by parent component
      };

      await onGenerate(params);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReportDescription = (type: OperatorReportType): string => {
    const descriptions = {
      [OperatorReportType.REVENUE_REPORT]: 'Comprehensive revenue analysis with trends, breakdowns by location, vehicle type, and discount impact.',
      [OperatorReportType.OCCUPANCY_REPORT]: 'Parking spot occupancy rates, utilization metrics, peak hours, and zone performance.',
      [OperatorReportType.USER_BEHAVIOR_REPORT]: 'User behavior patterns, booking frequency, session analytics, and loyalty metrics.',
      [OperatorReportType.VIOLATION_REPORT]: 'Violation tracking, enforcement statistics, resolution analysis, and location breakdowns.',
      [OperatorReportType.VIP_USAGE_REPORT]: 'VIP user activity, benefit utilization, location usage, and cost analysis.',
      [OperatorReportType.ZONE_PERFORMANCE_REPORT]: 'Zone-level performance metrics, comparisons, trends, and optimization recommendations.',
      [OperatorReportType.VEHICLE_TYPE_ANALYTICS]: 'Vehicle type distribution, revenue analysis, and usage patterns.',
      [OperatorReportType.OPERATIONAL_SUMMARY]: 'Overall operational performance summary with key metrics and recommendations.',
    };
    return descriptions[type] || 'Report description';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Report Type Selection */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-3">
          Report Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reportTypes.map((type) => (
            <div
              key={type.value}
              className={`cursor-pointer transition-all ${
                reportType === type.value
                  ? 'ring-2 ring-purple-500 bg-purple-50'
                  : 'hover:bg-secondary-50'
              }`}
              onClick={() => setReportType(type.value)}
            >
              <Card>
              <div className="p-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{type.icon}</span>
                  <div>
                    <h3 className="font-medium text-secondary-900">{type.label}</h3>
                  </div>
                </div>
              </div>
              </Card>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-secondary-600">
          {getReportDescription(reportType)}
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Group By */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Group By
        </label>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as any)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {groupByOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced Filters */}
      <Card>
        <div className="p-4">
          <h3 className="font-medium text-secondary-900 mb-4">Advanced Filters (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Minimum Amount
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minAmount: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Maximum Amount
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  maxAmount: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>
    </form>
  );
};