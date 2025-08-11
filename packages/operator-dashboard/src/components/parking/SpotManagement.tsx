import React, { useState, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { SpotForm } from './SpotForm';
import type { Location, ParkingSpot } from '../../../../shared/src/types/parking';

interface SpotManagementProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  locations: Location[];
}

interface SpotFilters {
  status: string;
  type: string;
  search: string;
  section: string;
  zone: string;
}

export const SpotManagement: React.FC<SpotManagementProps> = ({
  selectedLocation,
  onLocationSelect,
  locations
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [filters, setFilters] = useState<SpotFilters>({
    status: '',
    type: '',
    search: '',
    section: '',
    zone: ''
  });
  const [loading, setLoading] = useState(false);

  // Get all spots from selected location
  const allSpots = useMemo(() => {
    if (!selectedLocation) return [];
    
    const spots: (ParkingSpot & { sectionName: string; zoneName: string })[] = [];
    
    selectedLocation.sections.forEach(section => {
      section.zones.forEach(zone => {
        zone.spots.forEach(spot => {
          spots.push({
            ...spot,
            sectionName: section.name,
            zoneName: zone.name
          });
        });
      });
    });
    
    return spots;
  }, [selectedLocation]);

  // Filter spots based on current filters
  const filteredSpots = useMemo(() => {
    return allSpots.filter(spot => {
      if (filters.status && spot.status !== filters.status) return false;
      if (filters.type && spot.type !== filters.type) return false;
      if (filters.search && !spot.number.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.section && spot.sectionName !== filters.section) return false;
      if (filters.zone && spot.zoneName !== filters.zone) return false;
      return true;
    });
  }, [allSpots, filters]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const sections = [...new Set(allSpots.map(spot => spot.sectionName))];
    const zones = [...new Set(allSpots.map(spot => spot.zoneName))];
    const types = [...new Set(allSpots.map(spot => spot.type))];
    
    return { sections, zones, types };
  }, [allSpots]);

  const handleCreateSpot = async (data: any) => {
    setLoading(true);
    try {
      // TODO: Implement spot creation API call
      console.log('Creating spot:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowCreateModal(false);
      alert('Spot created successfully!');
    } catch (error) {
      console.error('Failed to create spot:', error);
      alert('Failed to create spot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpot = async (data: any) => {
    if (!selectedSpot) return;
    
    setLoading(true);
    try {
      // TODO: Implement spot update API call
      console.log('Updating spot:', { id: selectedSpot.id, ...data });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowEditModal(false);
      setSelectedSpot(null);
      alert('Spot updated successfully!');
    } catch (error) {
      console.error('Failed to update spot:', error);
      alert('Failed to update spot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpot = async (spot: ParkingSpot) => {
    if (window.confirm(`Are you sure you want to delete spot "${spot.number}"?`)) {
      try {
        // TODO: Implement spot deletion API call
        console.log('Deleting spot:', spot.id);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('Spot deleted successfully!');
      } catch (error) {
        console.error('Failed to delete spot:', error);
        alert('Failed to delete spot. Please try again.');
      }
    }
  };

  const handleStatusChange = async (spot: ParkingSpot, newStatus: string) => {
    try {
      // TODO: Implement spot status update API call
      console.log('Updating spot status:', { id: spot.id, status: newStatus });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`Spot ${spot.number} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update spot status:', error);
      alert('Failed to update spot status. Please try again.');
    }
  };

  const openEditModal = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'truck': return '🚛';
      case 'van': return '🚐';
      case 'suv': return '🚙';
      default: return '🚗';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      search: '',
      section: '',
      zone: ''
    });
  };

  if (!selectedLocation) {
    return (
      <Card>
        <div className='p-8 text-center'>
          <div className='text-4xl mb-4'>🅿️</div>
          <h3 className='text-lg font-medium text-secondary-900 mb-2'>
            Select a Location
          </h3>
          <p className='text-secondary-600 mb-4'>
            Choose a location to manage its parking spots
          </p>
          <div className='max-w-xs mx-auto'>
            <select
              onChange={(e) => {
                const location = locations.find(loc => loc.id === e.target.value);
                if (location) onLocationSelect(location);
              }}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
            >
              <option value=''>Select a location...</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-xl font-semibold text-secondary-900'>
            Spot Management - {selectedLocation.name}
          </h2>
          <p className='text-secondary-600 mt-1'>
            Manage individual parking spots, their status, and configurations
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowCreateModal(true)}
        >
          + Create Spot
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Search
              </label>
              <Input
                type='text'
                placeholder='Spot number...'
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                <option value=''>All Statuses</option>
                <option value='available'>Available</option>
                <option value='occupied'>Occupied</option>
                <option value='reserved'>Reserved</option>
                <option value='maintenance'>Maintenance</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Vehicle Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                <option value=''>All Types</option>
                {filterOptions.types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Section
              </label>
              <select
                value={filters.section}
                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                <option value=''>All Sections</option>
                {filterOptions.sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Zone
              </label>
              <select
                value={filters.zone}
                onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                <option value=''>All Zones</option>
                {filterOptions.zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            <div className='flex items-end'>
              <Button
                variant='outline'
                onClick={clearFilters}
                className='w-full'
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <div className='p-4 text-center'>
            <div className='text-2xl font-bold text-primary-600'>{allSpots.length}</div>
            <div className='text-sm text-secondary-600'>Total Spots</div>
          </div>
        </Card>
        <Card>
          <div className='p-4 text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {allSpots.filter(spot => spot.status === 'available').length}
            </div>
            <div className='text-sm text-secondary-600'>Available</div>
          </div>
        </Card>
        <Card>
          <div className='p-4 text-center'>
            <div className='text-2xl font-bold text-red-600'>
              {allSpots.filter(spot => spot.status === 'occupied').length}
            </div>
            <div className='text-sm text-secondary-600'>Occupied</div>
          </div>
        </Card>
        <Card>
          <div className='p-4 text-center'>
            <div className='text-2xl font-bold text-yellow-600'>
              {allSpots.filter(spot => spot.status === 'reserved').length}
            </div>
            <div className='text-sm text-secondary-600'>Reserved</div>
          </div>
        </Card>
      </div>

      {/* Spots Grid */}
      <Card>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Parking Spots ({filteredSpots.length})
            </h3>
          </div>

          {filteredSpots.length === 0 ? (
            <div className='text-center py-8'>
              <div className='text-4xl mb-4'>🅿️</div>
              <h3 className='text-lg font-medium text-secondary-900 mb-2'>
                No spots found
              </h3>
              <p className='text-secondary-600 mb-4'>
                {Object.values(filters).some(f => f) 
                  ? 'No spots match your current filters.' 
                  : 'Create your first parking spot to get started.'}
              </p>
              {!Object.values(filters).some(f => f) && (
                <Button
                  variant='primary'
                  onClick={() => setShowCreateModal(true)}
                >
                  Create First Spot
                </Button>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {filteredSpots.map((spot) => (
                <div key={spot.id} className='border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xl'>{getVehicleTypeIcon(spot.type)}</span>
                      <div>
                        <h4 className='font-medium text-secondary-900'>
                          Spot {spot.number}
                        </h4>
                        <p className='text-sm text-secondary-600'>
                          {spot.sectionName} → {spot.zoneName}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(spot.status)}`}>
                      {spot.status}
                    </span>
                  </div>

                  <div className='space-y-2 mb-4'>
                    <div className='text-sm'>
                      <span className='text-secondary-600'>Type:</span>
                      <span className='ml-1 capitalize'>{spot.type}</span>
                    </div>
                    <div className='text-sm'>
                      <span className='text-secondary-600'>Coordinates:</span>
                      <span className='ml-1'>{spot.coordinates.latitude.toFixed(6)}, {spot.coordinates.longitude.toFixed(6)}</span>
                    </div>
                    {spot.amenities.length > 0 && (
                      <div className='text-sm'>
                        <span className='text-secondary-600'>Amenities:</span>
                        <div className='flex space-x-1 mt-1'>
                          {spot.amenities.includes('ev_charging') && <span title='EV Charging'>⚡</span>}
                          {spot.amenities.includes('covered') && <span title='Covered'>🏠</span>}
                          {spot.amenities.includes('security') && <span title='Security'>🔒</span>}
                          {spot.amenities.includes('disabled') && <span title='Disabled Access'>♿</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <select
                      value={spot.status}
                      onChange={(e) => handleStatusChange(spot, e.target.value)}
                      className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500'
                    >
                      <option value='available'>Available</option>
                      <option value='occupied'>Occupied</option>
                      <option value='reserved'>Reserved</option>
                      <option value='maintenance'>Maintenance</option>
                    </select>
                    
                    <div className='flex space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openEditModal(spot)}
                        className='flex-1'
                      >
                        Edit
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeleteSpot(spot)}
                        className='flex-1 text-red-600 hover:text-red-700'
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create Spot Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Create New Parking Spot'
      >
        <SpotForm
          location={selectedLocation}
          onSubmit={handleCreateSpot}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Spot Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title='Edit Parking Spot'
      >
        {selectedSpot && (
          <SpotForm
            location={selectedLocation}
            spot={selectedSpot}
            onSubmit={handleUpdateSpot}
            onCancel={() => setShowEditModal(false)}
            loading={loading}
          />
        )}
      </Modal>
    </div>
  );
};