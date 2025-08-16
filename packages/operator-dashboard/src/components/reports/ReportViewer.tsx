// Report viewer component for displaying report data

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import {
  OperatorReport,
  OperatorReportType,
  OperatorRevenueReportData,
  OperatorOccupancyReportData,
  UserBehaviorReportData,

} from '../../../../shared/src/types/operator-reporting';

interface ReportViewerProps {
  report: OperatorReport;
  onClose: () => void;
  onExport: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onClose,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
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

  const renderRevenueReport = (data: OperatorRevenueReportData) => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Total Revenue</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
              <p className="text-sm text-green-600">
                +{formatPercentage(data.summary.growthRate)} from last period
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Operator Share</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(data.summary.operatorShare)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Transactions</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {data.summary.transactionCount.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Average Value</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(data.summary.averageTransactionValue)}
              </p>
            </div>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Revenue Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-secondary-600">Street Parking</p>
                <p className="text-xl font-bold text-secondary-900">
                  {formatCurrency(data.breakdown.streetParking)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-secondary-600">Facility Parking</p>
                <p className="text-xl font-bold text-secondary-900">
                  {formatCurrency(data.breakdown.facilityParking)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-secondary-600">VIP Bookings</p>
                <p className="text-xl font-bold text-secondary-900">
                  {formatCurrency(data.breakdown.vipBookings)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Location Performance */}
        {data.locationBreakdown.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Location Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-2">Location</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Transactions</th>
                      <th className="text-right py-2">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.locationBreakdown.map((location, index) => (
                      <tr key={index} className="border-b border-secondary-100">
                        <td className="py-2">
                          <div>
                            <p className="font-medium">{location.locationName}</p>
                            <p className="text-sm text-secondary-600 capitalize">{location.locationType}</p>
                          </div>
                        </td>
                        <td className="text-right py-2">{formatCurrency(location.revenue)}</td>
                        <td className="text-right py-2">{location.transactionCount}</td>
                        <td className="text-right py-2">{formatPercentage(location.occupancyRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderOccupancyReport = (data: OperatorOccupancyReportData) => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Average Occupancy</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPercentage(data.summary.averageOccupancyRate)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Peak Occupancy</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPercentage(data.summary.peakOccupancyRate)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Total Spots</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {data.summary.totalSpots.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Turnover Rate</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {data.summary.turnoverRate.toFixed(1)}
              </p>
            </div>
          </Card>
        </div>

        {/* Zone Performance */}
        {data.zoneBreakdown.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Zone Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-2">Zone</th>
                      <th className="text-right py-2">Spots</th>
                      <th className="text-right py-2">Occupancy</th>
                      <th className="text-right py-2">Avg Duration</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.zoneBreakdown.map((zone, index) => (
                      <tr key={index} className="border-b border-secondary-100">
                        <td className="py-2">
                          <div>
                            <p className="font-medium">{zone.zoneName}</p>
                            <p className="text-sm text-secondary-600">{zone.locationName}</p>
                          </div>
                        </td>
                        <td className="text-right py-2">{zone.totalSpots}</td>
                        <td className="text-right py-2">{formatPercentage(zone.occupancyRate)}</td>
                        <td className="text-right py-2">{zone.averageSessionDuration.toFixed(1)}h</td>
                        <td className="text-right py-2">{formatCurrency(zone.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderUserBehaviorReport = (data: UserBehaviorReportData) => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Total Users</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {data.summary.totalUsers.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Active Users</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {data.summary.activeUsers.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Retention Rate</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPercentage(data.summary.userRetentionRate)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-600">Avg Revenue/User</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(data.summary.averageRevenuePerUser)}
              </p>
            </div>
          </Card>
        </div>

        {/* Session Analytics */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Session Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-secondary-600">Short Sessions (&lt;1h)</p>
                <p className="text-xl font-bold text-secondary-900">
                  {data.sessionAnalytics.shortSessions.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-secondary-600">Medium Sessions (1-4h)</p>
                <p className="text-xl font-bold text-secondary-900">
                  {data.sessionAnalytics.mediumSessions.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-secondary-600">Long Sessions (&gt;4h)</p>
                <p className="text-xl font-bold text-secondary-900">
                  {data.sessionAnalytics.longSessions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderDefaultReport = (data: any) => {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Report Data</h3>
            <pre className="bg-secondary-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </Card>
      </div>
    );
  };

  const renderReportContent = () => {
    switch (report.type) {
      case OperatorReportType.REVENUE_REPORT:
        return renderRevenueReport(report.data as OperatorRevenueReportData);
      case OperatorReportType.OCCUPANCY_REPORT:
        return renderOccupancyReport(report.data as OperatorOccupancyReportData);
      case OperatorReportType.USER_BEHAVIOR_REPORT:
        return renderUserBehaviorReport(report.data as UserBehaviorReportData);
      default:
        return renderDefaultReport(report.data);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'details', label: 'Details' },
    { id: 'raw', label: 'Raw Data' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">{report.title}</h2>
          <p className="text-secondary-600 mt-1">{report.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-500">
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
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onExport}>
            Export
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'summary' && renderReportContent()}
        {activeTab === 'details' && renderReportContent()}
        {activeTab === 'raw' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Raw Report Data</h3>
              <pre className="bg-secondary-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};