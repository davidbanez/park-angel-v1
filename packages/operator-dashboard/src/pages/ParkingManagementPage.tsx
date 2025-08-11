import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';

import { FacilityLayoutDesigner } from '../components/layout';
import { LocationHierarchyManager, SpotManagement, ParkingSearch, OccupancyMonitor, ParkingAnalytics } from '../components/parking';
import { useParkingManagement } from '../hooks/useParkingManagement';
import type { Location } from '../../../shared/src/types/parking';

interface FacilityLayout {
  id: string;
  locationId: string;
  name: string;
  elements: any[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface OccupancyOverlay {
  spotId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  occupiedBy?: {
    vehicleId: string;
    licensePlate: string;
    startTime: Date;
    endTime?: Date;
  };
}

type ActiveTab = 'overview' | 'hierarchy' | 'spots' | 'occupancy' | 'analytics' | 'layout';

export const ParkingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showLayoutDesigner, setShowLayoutDesigner] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  const {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,

    refreshLocations
  } = useParkingManagement();

  useEffect(() => {
    refreshLocations();
  }, [refreshLocations]);

  // Mock data for demonstration
  const mockOccupancyData: OccupancyOverlay[] = [
    {
      spotId: 'spot-1',
      status: 'occupied',
      occupiedBy: {
        vehicleId: 'vehicle-1',
        licensePlate: 'ABC-123',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      },
    },
    {
      spotId: 'spot-2',
      status: 'reserved',
    },
    {
      spotId: 'spot-3',
      status: 'maintenance',
    },
  ];

  const handleSaveLayout = async (layout: FacilityLayout) => {
    try {
      // In a real implementation, this would save to the backend
      console.log('Saving layout:', layout);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Failed to save layout:', error);
      alert('Failed to save layout. Please try again.');
    }
  };

  const openLayoutDesigner = (locationId: string) => {
    setSelectedLocationId(locationId);
    setShowLayoutDesigner(true);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setSelectedLocationId(location.id);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'hierarchy', label: 'Location Hierarchy', icon: '🏢' },
    { id: 'spots', label: 'Spot Management', icon: '🅿️' },
    { id: 'occupancy', label: 'Real-time Occupancy', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📋' },
    { id: 'layout', label: 'Layout Designer', icon: '🎨' },
  ] as const;

  if (showLayoutDesigner) {
    return (
      <FacilityLayoutDesigner
        locationId={selectedLocationId}
        occupancyData={mockOccupancyData}
        onSave={handleSaveLayout}
        onClose={() => setShowLayoutDesigner(false)}
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-secondary-900'>
                    Total Locations
                  </h3>
                  <span className='text-2xl'>🏢</span>
                </div>
                <div className='text-3xl font-bold text-primary-600 mb-2'>
                  {locations.length}
                </div>
                <p className='text-secondary-600 text-sm'>
                  Active parking locations
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-secondary-900'>
                    Total Spots
                  </h3>
                  <span className='text-2xl'>🅿️</span>
                </div>
                <div className='text-3xl font-bold text-primary-600 mb-2'>
                  {locations.reduce((total, location) => 
                    total + location.sections.reduce((sectionTotal, section) => 
                      sectionTotal + section.zones.reduce((zoneTotal, zone) => 
                        zoneTotal + zone.spots.length, 0), 0), 0)}
                </div>
                <p className='text-secondary-600 text-sm'>
                  Total parking spots
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-secondary-900'>
                    Occupancy Rate
                  </h3>
                  <span className='text-2xl'>📊</span>
                </div>
                <div className='text-3xl font-bold text-green-600 mb-2'>
                  75%
                </div>
                <p className='text-secondary-600 text-sm'>
                  Current occupancy
                </p>
              </div>
            </Card>
          </div>
        );

      case 'hierarchy':
        return (
          <LocationHierarchyManager
            locations={locations}
            onLocationSelect={handleLocationSelect}
            onLocationCreate={createLocation}
            onLocationUpdate={updateLocation}
            onLocationDelete={deleteLocation}
            loading={loading}
            error={error}
          />
        );

      case 'spots':
        return (
          <SpotManagement
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            locations={locations}
          />
        );

      case 'occupancy':
        return (
          <OccupancyMonitor
            locations={locations}
            selectedLocationId={selectedLocationId}
            onLocationSelect={setSelectedLocationId}
          />
        );

      case 'analytics':
        return (
          <ParkingAnalytics
            locations={locations}
            selectedLocationId={selectedLocationId}
          />
        );

      case 'layout':
        return (
          <div className='space-y-6'>
            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
                      Facility Layout Designer
                    </h3>
                    <p className='text-secondary-600'>
                      Create and manage visual floor plans for your parking facilities
                      with drag-and-drop tools.
                    </p>
                  </div>
                  <div className='w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center'>
                    <span className='text-primary-600 text-2xl'>🏗️</span>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h4 className='font-medium text-secondary-900 mb-2'>
                      Drawing Tools
                    </h4>
                    <ul className='text-sm text-secondary-600 space-y-1'>
                      <li>• Parking spots (car, motorcycle, disabled)</li>
                      <li>• Navigation elements (entrances, exits, lanes)</li>
                      <li>• Infrastructure (elevators, stairs, pillars)</li>
                      <li>• Electric charging stations</li>
                    </ul>
                  </div>

                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h4 className='font-medium text-secondary-900 mb-2'>Features</h4>
                    <ul className='text-sm text-secondary-600 space-y-1'>
                      <li>• Drag-and-drop interface</li>
                      <li>• Real-time occupancy overlay</li>
                      <li>• Grid snapping and alignment</li>
                      <li>• Undo/redo functionality</li>
                    </ul>
                  </div>

                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h4 className='font-medium text-secondary-900 mb-2'>
                      Export Options
                    </h4>
                    <ul className='text-sm text-secondary-600 space-y-1'>
                      <li>• PNG/JPEG images</li>
                      <li>• SVG vector graphics</li>
                      <li>• PDF documents</li>
                      <li>• Custom quality settings</li>
                    </ul>
                  </div>
                </div>

                <div className='flex space-x-3'>
                  <Button
                    variant='primary'
                    onClick={() => openLayoutDesigner(selectedLocationId || 'demo-location-1')}
                  >
                    🎨 Open Layout Designer
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => alert('This would show existing layouts')}
                  >
                    📋 View Existing Layouts
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-secondary-900'>
            Parking Management
          </h1>
          <p className='text-secondary-600 mt-1'>
            Manage your parking locations, sections, zones, and spots
          </p>
        </div>
        <div className='flex space-x-3'>
          <ParkingSearch
            value={searchQuery}
            onChange={setSearchQuery}
            locations={locations}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='mt-6'>
        {loading ? (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
          </div>
        ) : error ? (
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Error loading parking data
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};
