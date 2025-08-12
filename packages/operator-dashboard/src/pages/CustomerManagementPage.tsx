import React, { useState } from 'react';
import { CustomerList, VIPAssignmentComponent, CustomerSupport, CustomerAnalyticsComponent } from '../components/customer';
import type { CustomerProfile } from '../../../shared/src/types/user';

export const CustomerManagementPage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'vip' | 'support' | 'analytics'>('list');
  
  // Mock operator ID - in real app this would come from auth context
  const operatorId = 'mock-operator-id';
  const currentUserId = 'mock-current-user-id';

  const tabs = [
    { id: 'list', label: 'Customer List', icon: '👥' },
    { id: 'vip', label: 'VIP Management', icon: '⭐' },
    { id: 'support', label: 'Customer Support', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  const handleCustomerSelect = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setActiveTab('vip'); // Switch to VIP tab when customer is selected
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    if (tabId === 'list') {
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Customer Management</h1>
          <p className="text-secondary-600 mt-1">
            Manage customers, VIP assignments, and customer support
          </p>
          {selectedCustomer && (
            <p className="text-purple-600 mt-1 font-medium">
              Selected: {selectedCustomer.profile.firstName} {selectedCustomer.profile.lastName}
            </p>
          )}
        </div>
        {selectedCustomer && (
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setActiveTab('list');
            }}
            className="px-4 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-900 border border-secondary-300 rounded-md hover:bg-secondary-50"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'list' && (
          <CustomerList
            operatorId={operatorId}
            onCustomerSelect={handleCustomerSelect}
          />
        )}

        {activeTab === 'vip' && (
          <div className="space-y-6">
            {selectedCustomer ? (
              <VIPAssignmentComponent
                customer={selectedCustomer}
                operatorId={operatorId}
                currentUserId={currentUserId}
                onUpdate={() => {
                  // In a real app, you'd refresh the customer data
                  console.log('VIP assignment updated');
                }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-secondary-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Select a Customer</h3>
                <p className="text-secondary-600">
                  Please select a customer from the Customer List tab to manage their VIP status.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <CustomerSupport
            operatorId={operatorId}
            currentUserId={currentUserId}
            customer={selectedCustomer || undefined}
          />
        )}

        {activeTab === 'analytics' && (
          <CustomerAnalyticsComponent
            operatorId={operatorId}
            customer={selectedCustomer || undefined}
          />
        )}
      </div>
    </div>
  );
};