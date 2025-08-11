import React, { useState } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { FacilityLayoutDesigner } from '../components/layout';
// Temporary types until shared package is fixed
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

export const ParkingManagementPage: React.FC = () => {
  const [showLayoutDesigner, setShowLayoutDesigner] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

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
      </div>

      {/* Facility Layout Designer */}
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
              onClick={() => openLayoutDesigner('demo-location-1')}
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

      {/* Other Parking Management Features */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Location Hierarchy
              </h3>
              <span className='text-2xl'>🏢</span>
            </div>
            <p className='text-secondary-600 mb-4'>
              Manage your parking structure: Location → Section → Zone → Spot
            </p>
            <ul className='text-sm text-secondary-600 space-y-2 mb-4'>
              <li>• Create and organize locations</li>
              <li>• Define sections and zones</li>
              <li>• Configure individual spots</li>
              <li>• GPS coordinate tagging</li>
            </ul>
            <Button variant='outline' size='sm'>
              Manage Hierarchy
            </Button>
          </div>
        </Card>

        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Real-time Occupancy
              </h3>
              <span className='text-2xl'>📊</span>
            </div>
            <p className='text-secondary-600 mb-4'>
              Monitor parking spot availability and occupancy in real-time
            </p>
            <ul className='text-sm text-secondary-600 space-y-2 mb-4'>
              <li>• Live occupancy status</li>
              <li>• Historical usage data</li>
              <li>• Utilization analytics</li>
              <li>• Capacity planning</li>
            </ul>
            <Button variant='outline' size='sm'>
              View Occupancy
            </Button>
          </div>
        </Card>

        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Spot Management
              </h3>
              <span className='text-2xl'>🅿️</span>
            </div>
            <p className='text-secondary-600 mb-4'>
              Configure and manage individual parking spots
            </p>
            <ul className='text-sm text-secondary-600 space-y-2 mb-4'>
              <li>• Spot status management</li>
              <li>• Vehicle type assignments</li>
              <li>• Maintenance scheduling</li>
              <li>• Amenity configuration</li>
            </ul>
            <Button variant='outline' size='sm'>
              Manage Spots
            </Button>
          </div>
        </Card>

        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Search & Filtering
              </h3>
              <span className='text-2xl'>🔍</span>
            </div>
            <p className='text-secondary-600 mb-4'>
              Advanced search and filtering capabilities for parking management
            </p>
            <ul className='text-sm text-secondary-600 space-y-2 mb-4'>
              <li>• Multi-criteria search</li>
              <li>• Status-based filtering</li>
              <li>• Location-based queries</li>
              <li>• Export search results</li>
            </ul>
            <Button variant='outline' size='sm'>
              Advanced Search
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
