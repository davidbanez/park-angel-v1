import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Chart } from './ui/Chart'
import { ReportingService, PerformanceMetric } from '../services/reportingService'

interface PerformanceMonitorProps {
  className?: string
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className = '' }) => {
  const [reportingService] = useState(() => new ReportingService())
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const availableFeatures = [
    'booking',
    'payment',
    'messaging',
    'violation_reporting',
    'support_tickets'
  ]

  useEffect(() => {
    loadMetrics()
  }, [selectedPeriod, selectedFeatures])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (selectedPeriod) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1)
          break
        case '24h':
          startDate.setDate(endDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
      }

      const performanceMetrics = await reportingService.getPerformanceMetrics(
        selectedFeatures.length > 0 ? selectedFeatures : availableFeatures,
        startDate,
        endDate
      )
      
      setMetrics(performanceMetrics)
    } catch (error) {
      console.error('Error loading performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const getSLAStatusColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600 bg-green-100'
    if (compliance >= 90) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getResponseTimeColor = (responseTime: number, slaTarget: number) => {
    if (responseTime <= slaTarget) return 'text-green-600'
    if (responseTime <= slaTarget * 1.2) return 'text-yellow-600'
    return 'text-red-600'
  }

  const chartData = metrics.map(metric => ({
    name: metric.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    'Avg Response Time': metric.averageResponseTime,
    'P95 Response Time': metric.p95ResponseTime,
    'SLA Target': metric.slaTarget,
    'Error Rate': metric.errorRate
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Period Selection */}
            <div className="flex space-x-2">
              {(['1h', '24h', '7d', '30d'] as const).map(period => (
                <Button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  className={selectedPeriod === period ? 'bg-purple-600 text-white' : ''}
                >
                  {period === '1h' ? 'Last Hour' :
                   period === '24h' ? 'Last 24h' :
                   period === '7d' ? 'Last 7 Days' :
                   'Last 30 Days'}
                </Button>
              ))}
            </div>

            {/* Feature Selection */}
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map(feature => (
                <Button
                  key={feature}
                  onClick={() => handleFeatureToggle(feature)}
                  variant={selectedFeatures.includes(feature) || selectedFeatures.length === 0 ? 'default' : 'outline'}
                  size="sm"
                  className={`${
                    selectedFeatures.includes(feature) || selectedFeatures.length === 0 
                      ? 'bg-purple-600 text-white' 
                      : ''
                  }`}
                >
                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>

            <Button onClick={loadMetrics} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? 
                `${Math.round(metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length)}ms` : 
                '-'
              }
            </div>
            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? 
                `${(metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length).toFixed(2)}%` : 
                '-'
              }
            </div>
            <p className="text-sm font-medium text-gray-600">Avg Error Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? 
                `${Math.round(metrics.reduce((sum, m) => sum + m.throughput, 0))}` : 
                '-'
              }
            </div>
            <p className="text-sm font-medium text-gray-600">Total Throughput/hr</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? 
                `${(metrics.reduce((sum, m) => sum + m.slaCompliance, 0) / metrics.length).toFixed(1)}%` : 
                '-'
              }
            </div>
            <p className="text-sm font-medium text-gray-600">SLA Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Chart
                type="bar"
                data={chartData}
                xAxisKey="name"
                yAxisKeys={['Avg Response Time', 'P95 Response Time', 'SLA Target']}
                colors={['#8B5CF6', '#F59E0B', '#EF4444']}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading performance metrics...</p>
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No performance data available for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P95 Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Throughput/hr
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SLA Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.map((metric, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metric.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        getResponseTimeColor(metric.averageResponseTime, metric.slaTarget)
                      }`}>
                        {Math.round(metric.averageResponseTime)}ms
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        getResponseTimeColor(metric.p95ResponseTime, metric.slaTarget * 1.5)
                      }`}>
                        {Math.round(metric.p95ResponseTime)}ms
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        metric.errorRate > 5 ? 'text-red-600' : 
                        metric.errorRate > 1 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {metric.errorRate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(metric.throughput)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        metric.slaCompliance >= 95 ? 'text-green-600' :
                        metric.slaCompliance >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metric.slaCompliance.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getSLAStatusColor(metric.slaCompliance)
                        }`}>
                          {metric.slaCompliance >= 95 ? 'Healthy' :
                           metric.slaCompliance >= 90 ? 'Warning' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SLA Targets */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {metric.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium">{metric.slaTarget}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current:</span>
                    <span className={`font-medium ${
                      getResponseTimeColor(metric.averageResponseTime, metric.slaTarget)
                    }`}>
                      {Math.round(metric.averageResponseTime)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compliance:</span>
                    <span className={`font-medium ${
                      metric.slaCompliance >= 95 ? 'text-green-600' :
                      metric.slaCompliance >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.slaCompliance.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}