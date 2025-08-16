import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { DataTable } from './ui/DataTable';
import { adminAPIManagementService } from '../services/apiManagementService';
import type { 
  DeveloperAccount, 
  APIApplication, 
  APIKey, 
  APIPricingPlan,
  APIUsageAnalytics,
  CreateAPIApplicationRequest,
  CreateAPIKeyRequest
} from '@park-angel/shared';

interface DeveloperPortalProps {
  developerId?: string;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({ developerId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'keys' | 'usage' | 'billing'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [developer, setDeveloper] = useState<DeveloperAccount | null>(null);
  const [applications, setApplications] = useState<APIApplication[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [pricingPlans, setPricingPlans] = useState<APIPricingPlan[]>([]);
  const [analytics, setAnalytics] = useState<APIUsageAnalytics | null>(null);

  // Modal states
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<APIApplication | null>(null);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);

  // Form states
  const [applicationForm, setApplicationForm] = useState<CreateAPIApplicationRequest>({
    name: '',
    description: '',
    app_type: 'web',
    callback_urls: [],
    webhook_url: ''
  });

  const [keyForm, setKeyForm] = useState<CreateAPIKeyRequest>({
    key_name: '',
    environment: 'development',
    permissions: {},
    rate_limit_per_minute: 100,
    rate_limit_per_hour: 1000,
    rate_limit_per_day: 10000
  });

  useEffect(() => {
    if (developerId) {
      loadDeveloperData();
    }
  }, [developerId, activeTab]);

  const loadDeveloperData = async () => {
    if (!developerId) return;

    setLoading(true);
    setError(null);

    try {
      const [developerData, applicationsData, keysData, plansData] = await Promise.all([
        adminAPIManagementService.getDeveloperAccount(developerId),
        adminAPIManagementService.getAPIApplications({ developer_account_id: developerId }),
        adminAPIManagementService.getAPIKeys(),
        adminAPIManagementService.getPricingPlans()
      ]);

      setDeveloper(developerData);
      setApplications(applicationsData);
      setApiKeys(keysData.filter(key => 
        applicationsData.some(app => app.id === key.application_id)
      ));
      setPricingPlans(plansData);

      if (activeTab === 'usage') {
        const analyticsData = await adminAPIManagementService.getAPIUsageAnalytics();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!developerId) return;

    try {
      await adminAPIManagementService.createAPIApplication(developerId, applicationForm);
      setShowApplicationModal(false);
      setApplicationForm({
        name: '',
        description: '',
        app_type: 'web',
        callback_urls: [],
        webhook_url: ''
      });
      await loadDeveloperData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
    }
  };

  const handleCreateAPIKey = async () => {
    if (!selectedApplication) return;

    try {
      await adminAPIManagementService.createAPIKey(selectedApplication.id, keyForm);
      setShowKeyModal(false);
      setKeyForm({
        key_name: '',
        environment: 'development',
        permissions: {},
        rate_limit_per_minute: 100,
        rate_limit_per_hour: 1000,
        rate_limit_per_day: 10000
      });
      await loadDeveloperData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleRotateKey = async (keyId: string) => {
    try {
      await adminAPIManagementService.rotateAPIKey(keyId);
      await loadDeveloperData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate API key');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {developer && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Developer Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Company Name</p>
              <p className="text-gray-900">{developer.company_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Contact Email</p>
              <p className="text-gray-900">{developer.contact_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                developer.status === 'approved' ? 'bg-green-100 text-green-800' :
                developer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {developer.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-gray-900">{new Date(developer.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            <p className="text-sm text-gray-600">Applications</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
            <p className="text-sm text-gray-600">API Keys</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics?.total_calls || 0}</p>
            <p className="text-sm text-gray-600">Total API Calls</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">1</span>
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">Create an Application</h4>
              <p className="text-gray-600">Register your application to get started with the Park Angel API.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">2</span>
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">Generate API Keys</h4>
              <p className="text-gray-600">Create API keys for different environments (development, staging, production).</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">3</span>
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">Start Building</h4>
              <p className="text-gray-600">Use our comprehensive API documentation to integrate parking services.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Applications</h3>
        <Button onClick={() => setShowApplicationModal(true)}>
          Create Application
        </Button>
      </div>

      <Card>
        <DataTable
          data={applications}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'app_type', label: 'Type' },
            { 
              key: 'status', 
              label: 'Status',
              render: (app: APIApplication) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
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
                      setShowKeyModal(true);
                    }}
                    disabled={app.status !== 'approved'}
                  >
                    Create Key
                  </Button>
                </div>
              )
            }
          ]}
          loading={loading}
        />
      </Card>
    </div>
  );

  const renderAPIKeys = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">API Keys</h3>

      <Card>
        <DataTable
          data={apiKeys}
          columns={[
            { key: 'key_name', label: 'Name' },
            { 
              key: 'api_key', 
              label: 'API Key',
              render: (key: APIKey) => (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {key.api_key.substring(0, 20)}...
                </code>
              )
            },
            { key: 'environment', label: 'Environment' },
            { 
              key: 'is_active', 
              label: 'Status',
              render: (key: APIKey) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {key.is_active ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              key: 'last_used_at',
              label: 'Last Used',
              render: (key: APIKey) => key.last_used_at ? 
                new Date(key.last_used_at).toLocaleDateString() : 'Never'
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (key: APIKey) => (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRotateKey(key.id)}
                  >
                    Rotate
                  </Button>
                </div>
              )
            }
          ]}
          loading={loading}
        />
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'applications', label: 'Applications' },
            { key: 'keys', label: 'API Keys' },
            { key: 'usage', label: 'Usage' },
            { key: 'billing', label: 'Billing' }
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
      {activeTab === 'applications' && renderApplications()}
      {activeTab === 'keys' && renderAPIKeys()}
      {activeTab === 'usage' && (
        <div className="text-center py-12">
          <p className="text-gray-500">Usage analytics coming soon...</p>
        </div>
      )}
      {activeTab === 'billing' && (
        <div className="text-center py-12">
          <p className="text-gray-500">Billing information coming soon...</p>
        </div>
      )}

      {/* Create Application Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        title="Create Application"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Name
            </label>
            <Input
              value={applicationForm.name}
              onChange={(e) => setApplicationForm({ ...applicationForm, name: e.target.value })}
              placeholder="My Parking App"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={applicationForm.description}
              onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Brief description of your application"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Type
            </label>
            <select
              value={applicationForm.app_type}
              onChange={(e) => setApplicationForm({ ...applicationForm, app_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="web">Web Application</option>
              <option value="mobile">Mobile Application</option>
              <option value="server">Server Application</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowApplicationModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateApplication}>
              Create Application
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create API Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Create API Key"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Name
            </label>
            <Input
              value={keyForm.key_name}
              onChange={(e) => setKeyForm({ ...keyForm, key_name: e.target.value })}
              placeholder="Production Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <select
              value={keyForm.environment}
              onChange={(e) => setKeyForm({ ...keyForm, environment: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowKeyModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAPIKey}>
              Create API Key
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};