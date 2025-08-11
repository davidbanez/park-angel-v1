import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { PricingHierarchyManager } from '../components/pricing/PricingHierarchyManager';
import { DynamicPricingDashboard } from '../components/pricing/DynamicPricingDashboard';
import { DiscountConfigurationManager } from '../components/pricing/DiscountConfigurationManager';
import { useAuth } from '../../../shared/src/hooks/useAuth';

type PricingTab = 'hierarchy' | 'dynamic' | 'discounts';

export const PricingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PricingTab>('hierarchy');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadOperatorLocations();
  }, []);

  const loadOperatorLocations = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real implementation, this would fetch from Supabase
      const mockLocations = [
        { id: '1', name: 'Main Parking Facility' },
        { id: '2', name: 'Downtown Street Parking' },
        { id: '3', name: 'Mall Parking Garage' }
      ];
      
      setLocations(mockLocations);
      if (mockLocations.length > 0) {
        setSelectedLocationId(mockLocations[0].id);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      key: 'hierarchy' as PricingTab,
      label: 'Pricing Hierarchy',
      description: 'Configure pricing at location, section, zone, and spot levels'
    },
    {
      key: 'dynamic' as PricingTab,
      label: 'Dynamic Pricing',
      description: 'Monitor occupancy-based pricing adjustments'
    },
    {
      key: 'discounts' as PricingTab,
      label: 'Discounts',
      description: 'Manage discount configurations and rules'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Pricing Management</h1>
            <p className="text-secondary-600 mt-1">
              Configure hierarchical pricing and dynamic pricing rules
            </p>
          </div>
        </div>

        <Card>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pricing management...</p>
          </div>
        </Card>
      </div>
    );
  }

  // For demo purposes, we'll use a mock user if no user is available
  const currentUser = user || { id: 'demo-user-id' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Pricing Management</h1>
          <p className="text-secondary-600 mt-1">
            Configure hierarchical pricing and dynamic pricing rules
          </p>
        </div>
      </div>

      {/* Location Selector */}
      {locations.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Select Location:
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs text-gray-500 font-normal">
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedLocationId && (
        <div>
          {activeTab === 'hierarchy' && (
            <PricingHierarchyManager
              locationId={selectedLocationId}
              operatorId={currentUser.id}
            />
          )}

          {activeTab === 'dynamic' && (
            <DynamicPricingDashboard
              locationId={selectedLocationId}
              operatorId={currentUser.id}
            />
          )}

          {activeTab === 'discounts' && (
            <DiscountConfigurationManager
              operatorId={currentUser.id}
            />
          )}
        </div>
      )}

      {locations.length === 0 && (
        <Card>
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Locations Found
            </h3>
            <p className="text-gray-600 mb-4">
              You need to have at least one location configured to manage pricing.
            </p>
            <Button onClick={() => window.location.href = '/parking-management'}>
              Manage Locations
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};