import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Chart } from '../components/ui/Chart';
import { adminAPIManagementService } from '../services/apiManagementService';
import type {
  DeveloperAccount,
  APIApplication,
  APIKey,
  APIPricingPlan,
  DeveloperPortalStats,
  APIUsageAnalytics
} from '@park-angel/shared';

interface APIManagementProps {}

export const APIManagement: React.FC<APIManagementProps> = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'developers' | 'applications' | 'keys' | 'pricing' | 'analytics' | 'documentation'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<DeveloperPortalStats | null>(null);
  const [developers, setDevelopers] = useState<DeveloperAccount[]>([]);
  const [applications, setApplications] = useState<APIApplication[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [pricingPlans, setPricingPlans] = useState<APIPricingPlan[]>([]);
  const [analytics, setAnalytics] = useState<APIUsageAnalytics | null>(null);

  // Filter states
  const [developerFilter, setDeveloperFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  // Modal states
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperAccount | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<APIApplication | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'overview':
          const statsData = await adminAPIManagementService.getDeveloperPortalStats();
          setStats(statsData);
          break;
        case 'developers':
          const developersData = await adminAPIManagementService.getDeveloperAccounts();
          setDevelopers(developersData);
          break;
        case 'applications':
          const applicationsData = await adminAPIManagementService.getAPIApplications();
          setApplications(applicationsData);
          break;
        case 'keys':
          const keysData = await adminAPIManagementService.getAPIKeys();
          setApiKeys(keysData);
          break;
        case 'pricing':
          const plansData = await adminAPIManagementService.getPricingPlans();
          setPricingPlans(plansData);
          break;
        case 'analytics':
          const analyticsData = await adminAPIManagementService.getAPIUsageAnalytics();
          setAnalytics(analyticsData);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeveloper = async (id: string) => {
    try {
      await adminAPIManagementService.approveDeveloperAccount(id, 'current-admin-id');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve developer');
    }
  };

  const handleRejectDeveloper = async (id: string) => {
    try {
      await adminAPIManagementService.rejectDeveloperAccount(id, 'current-admin-id');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject developer');
    }
  };

  const handleApproveApplication = async (id: string) => {
    try {
      await adminAPIManagementService.approveAPIApplication(id, 'current-admin-id');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (id: string) => {
    try {
      await adminAPIManagementService.rejectAPIApplication(id, 'current-admin-id');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application');
    }
  };

  const handleBulkApproveDevelopers = async () => {
    try {
      await adminAPIManagementService.bulkApproveDeveloperAccounts(selectedDevelopers, 'current-admin-id');
      setSelectedDevelopers([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk approve developers');
    }
  };

  const handleExportData = async () => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (activeTab) {
        case 'developers':
          data = await adminAPIManagementService.exportDeveloperAccounts();
          filename = 'developer-accounts.csv';
          break;
        case 'applications':
          data = await adminAPIManagementService.exportAPIApplications();
          filename = 'api-applications.csv';
          break;
        case 'analytics':
          data = await adminAPIManagementService.exportAPIUsage();
          filename = 'api-usage.csv';
          break;
      }

      if (data.length > 0) {
        const csv = convertToCSV(data);
        downloadCSV(csv, filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Developers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_developers || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_applications || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total API Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_api_calls?.toLocaleString() || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{stats?.total_revenue?.toLocaleString() || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage Trends</h3>
          <div className="h-64">
            <Chart
              type="line"
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                  label: 'API Calls',
                  data: [1200, 1900, 3000, 5000, 2000, 3000],
                  borderColor: 'rgb(147, 51, 234)',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                }]
              }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h3>
          <div className="h-64">
            <Chart
              type="doughnut"
              data={{
                labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
                datasets: [{
                  label: 'Revenue by Plan',
                  data: [0, 2500, 8500, 15000],
                  backgroundColor: [
                    'rgb(156, 163, 175)',
                    'rgb(59, 130, 246)',
                    'rgb(147, 51, 234)',
                    'rgb(16, 185, 129)'
                  ]
                }]
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderDevelopers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Input
            placeholder="Search developers..."
            value={developerFilter}
            onChange={(e) => setDeveloperFilter(e.target.value)}
            className="w-64"
          />
          {selectedDevelopers.length > 0 && (
            <div className="flex space-x-2">
              <Button onClick={handleBulkApproveDevelopers} variant="outline" size="sm">
                Approve Selected ({selectedDevelopers.length})
              </Button>
              <Button 
                onClick={() => setSelectedDevelopers([])} 
                variant="outline" 
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportData} variant="outline">
            Export
          </Button>
          <Button onClick={() => setShowDeveloperModal(true)}>
            Add Developer
          </Button>
        </div>
      </div>

      <Card>
        <DataTable
          data={developers.filter(dev => 
            dev.company_name.toLowerCase().includes(developerFilter.toLowerCase()) ||
            dev.contact_email.toLowerCase().includes(developerFilter.toLowerCase())
          )}
          columns={[
            {
              key: 'select',
              label: '',
              render: (developer: DeveloperAccount) => (
                <input
                  type="checkbox"
                  checked={selectedDevelopers.includes(developer.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDevelopers([...selectedDevelopers, developer.id]);
                    } else {
                      setSelectedDevelopers(selectedDevelopers.filter(id => id !== developer.id));
                    }
                  }}
                />
              )
            },
            { key: 'company_name', label: 'Company Name' },
            { key: 'contact_email', label: 'Contact Email' },
            { 
              key: 'status', 
              label: 'Status',
              render: (developer: DeveloperAccount) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  developer.status === 'approved' ? 'bg-green-100 text-green-800' :
                  developer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  developer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {developer.status}
                </span>
              )
            },
            {
              key: 'created_at',
              label: 'Created',
              render: (developer: DeveloperAccount) => new Date(developer.created_at).toLocaleDateString()
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (developer: DeveloperAccount) => (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDeveloper(developer);
                      setShowDeveloperModal(true);
                    }}
                  >
                    View
                  </Button>
                  {developer.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveDeveloper(developer.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectDeveloper(developer.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              )
            }
          ]}
          loading={loading}
        />
      </Card>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Input
            placeholder="Search applications..."
            value={applicationFilter}
            onChange={(e) => setApplicationFilter(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportData} variant="outline">
            Export
          </Button>
        </div>
      </div>

      <Card>
        <DataTable
          data={applications.filter(app => 
            app.name.toLowerCase().includes(applicationFilter.toLowerCase()) ||
            app.developer_account?.company_name?.toLowerCase().includes(applicationFilter.toLowerCase())
          )}
          columns={[
            { key: 'name', label: 'Application Name' },
            { 
              key: 'developer_account.company_name', 
              label: 'Company',
              render: (app: APIApplication) => app.developer_account?.company_name || 'N/A'
            },
            { key: 'app_type', label: 'Type' },
            { 
              key: 'status', 
              label: 'Status',
              render: (app: APIApplication) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {app.status}
                </span>
              )
            },
            {
              key: 'created_at',
              label: 'Created',
              render: (app: APIApplication) => new Date(app.created_at).toLocaleDateString()
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (app: APIApplication) => (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowApplicationModal(true);
                    }}
                  >
                    View
                  </Button>
                  {app.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveApplication(app.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectApplication(app.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              )
            }
          ]}
          loading={loading}
        />
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics?.total_calls?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-600">Total API Calls</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analytics?.successful_calls?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-600">Successful Calls</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{analytics?.failed_calls?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-600">Failed Calls</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics?.average_response_time?.toFixed(0) || 0}ms</p>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Calls Over Time</h3>
          <div className="h-64">
            <Chart
              type="line"
              data={{
                labels: analytics?.calls_over_time?.map(item => item.date) || [],
                datasets: [{
                  label: 'API Calls',
                  data: analytics?.calls_over_time?.map(item => item.calls) || [],
                  borderColor: 'rgb(147, 51, 234)',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                }]
              }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Endpoints</h3>
          <div className="space-y-3">
            {analytics?.top_endpoints?.slice(0, 5).map((endpoint, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{endpoint.endpoint}</p>
                  <p className="text-sm text-gray-600">{endpoint.avg_response_time.toFixed(0)}ms avg</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{endpoint.calls.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">calls</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleExportData} variant="outline">
          Export Usage Data
        </Button>
      </div>
    </div>
  );

  if (loading && !stats && !developers.length && !applications.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">API Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'developers', label: 'Developers' },
            { key: 'applications', label: 'Applications' },
            { key: 'keys', label: 'API Keys' },
            { key: 'pricing', label: 'Pricing Plans' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'documentation', label: 'Documentation' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'developers' && renderDevelopers()}
      {activeTab === 'applications' && renderApplications()}
      {activeTab === 'analytics' && renderAnalytics()}
      
      {/* Other tabs would be implemented similarly */}
      {activeTab === 'keys' && (
        <div className="text-center py-12">
          <p className="text-gray-500">API Keys management coming soon...</p>
        </div>
      )}
      
      {activeTab === 'pricing' && (
        <div className="text-center py-12">
          <p className="text-gray-500">Pricing Plans management coming soon...</p>
        </div>
      )}
      
      {activeTab === 'documentation' && (
        <div className="text-center py-12">
          <p className="text-gray-500">Documentation management coming soon...</p>
        </div>
      )}

      {/* Modals would be implemented here */}
      {showDeveloperModal && (
        <Modal
          isOpen={showDeveloperModal}
          onClose={() => {
            setShowDeveloperModal(false);
            setSelectedDeveloper(null);
          }}
          title={selectedDeveloper ? 'Developer Details' : 'Add Developer'}
        >
          <div className="p-6">
            <p>Developer modal content would go here...</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default APIManagement;