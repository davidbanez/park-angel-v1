import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { LocationForm } from './LocationForm';
import { SectionManager } from './SectionManager';

import type { Location } from '../../../../shared/src/types/parking';

interface LocationHierarchyManagerProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  onLocationCreate: (data: any) => Promise<Location>;
  onLocationUpdate: (id: string, data: any) => Promise<Location>;
  onLocationDelete: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const LocationHierarchyManager: React.FC<LocationHierarchyManagerProps> = ({
  locations,
  onLocationCreate,
  onLocationUpdate,
  onLocationDelete,
  loading
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLocationExpansion = (locationId: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleCreateLocation = async (data: any) => {
    try {
      await onLocationCreate(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  const handleUpdateLocation = async (data: any) => {
    if (!selectedLocation) return;
    
    try {
      await onLocationUpdate(selectedLocation.id, data);
      setShowEditModal(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (window.confirm(`Are you sure you want to delete "${location.name}"? This will also delete all sections, zones, and spots within this location.`)) {
      try {
        await onLocationDelete(location.id);
      } catch (error) {
        console.error('Failed to delete location:', error);
      }
    }
  };

  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  const getLocationStats = (location: Location) => {
    const totalSections = location.sections.length;
    const totalZones = location.sections.reduce((total, section) => total + section.zones.length, 0);
    const totalSpots = location.sections.reduce((total, section) => 
      total + section.zones.reduce((zoneTotal, zone) => zoneTotal + zone.spots.length, 0), 0);
    
    return { totalSections, totalZones, totalSpots };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hosted': return '🏠';
      case 'street': return '🛣️';
      case 'facility': return '🏢';
      default: return '🅿️';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-xl font-semibold text-secondary-900'>
            Location Hierarchy Management
          </h2>
          <p className='text-secondary-600 mt-1'>
            Manage your parking structure: Location → Section → Zone → Spot
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowCreateModal(true)}
        >
          + Create Location
        </Button>
      </div>

      {/* Search */}
      <div className='flex space-x-4'>
        <div className='flex-1'>
          <Input
            type='text'
            placeholder='Search locations by name, city, or type...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Locations List */}
      <div className='space-y-4'>
        {filteredLocations.length === 0 ? (
          <Card>
            <div className='p-8 text-center'>
              <div className='text-4xl mb-4'>🏢</div>
              <h3 className='text-lg font-medium text-secondary-900 mb-2'>
                No locations found
              </h3>
              <p className='text-secondary-600 mb-4'>
                {searchQuery ? 'No locations match your search criteria.' : 'Get started by creating your first parking location.'}
              </p>
              {!searchQuery && (
                <Button
                  variant='primary'
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Your First Location
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredLocations.map((location) => {
            const stats = getLocationStats(location);
            const isExpanded = expandedLocations.has(location.id);

            return (
              <Card key={location.id}>
                <div className='p-6'>
                  {/* Location Header */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center space-x-3'>
                      <button
                        onClick={() => toggleLocationExpansion(location.id)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                      <span className='text-2xl'>{getTypeIcon(location.type)}</span>
                      <div>
                        <h3 className='text-lg font-semibold text-secondary-900'>
                          {location.name}
                        </h3>
                        <p className='text-sm text-secondary-600'>
                          {location.address.street}, {location.address.city}, {location.address.state}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        location.type === 'hosted' ? 'bg-purple-100 text-purple-800' :
                        location.type === 'street' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {location.type}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openEditModal(location)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeleteLocation(location)}
                        className='text-red-600 hover:text-red-700'
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Location Stats */}
                  <div className='grid grid-cols-4 gap-4 mb-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-primary-600'>{stats.totalSections}</div>
                      <div className='text-sm text-secondary-600'>Sections</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-primary-600'>{stats.totalZones}</div>
                      <div className='text-sm text-secondary-600'>Zones</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-primary-600'>{stats.totalSpots}</div>
                      <div className='text-sm text-secondary-600'>Spots</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>75%</div>
                      <div className='text-sm text-secondary-600'>Occupancy</div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className='border-t pt-4'>
                      <SectionManager
                        location={location}
                        expandedSections={expandedSections}
                        onToggleSection={toggleSectionExpansion}
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Location Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Create New Location'
      >
        <LocationForm
          onSubmit={handleCreateLocation}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title='Edit Location'
      >
        {selectedLocation && (
          <LocationForm
            location={selectedLocation}
            onSubmit={handleUpdateLocation}
            onCancel={() => setShowEditModal(false)}
            loading={loading}
          />
        )}
      </Modal>
    </div>
  );
};