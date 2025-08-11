import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import type { Section, Zone } from '../../../../shared/src/types/parking';

interface ZoneManagerProps {
  section: Section;
}

export const ZoneManager: React.FC<ZoneManagerProps> = ({ section }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  const toggleZoneExpansion = (zoneId: string) => {
    const newExpanded = new Set(expandedZones);
    if (newExpanded.has(zoneId)) {
      newExpanded.delete(zoneId);
    } else {
      newExpanded.add(zoneId);
    }
    setExpandedZones(newExpanded);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement zone creation API call
      console.log('Creating zone:', { sectionId: section.id, name: zoneName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setZoneName('');
      setShowCreateModal(false);
      alert('Zone created successfully!');
    } catch (error) {
      console.error('Failed to create zone:', error);
      alert('Failed to create zone. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !zoneName.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement zone update API call
      console.log('Updating zone:', { id: selectedZone.id, name: zoneName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setZoneName('');
      setSelectedZone(null);
      setShowEditModal(false);
      alert('Zone updated successfully!');
    } catch (error) {
      console.error('Failed to update zone:', error);
      alert('Failed to update zone. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zone: Zone) => {
    if (window.confirm(`Are you sure you want to delete zone "${zone.name}"? This will also delete all spots within this zone.`)) {
      try {
        // TODO: Implement zone deletion API call
        console.log('Deleting zone:', zone.id);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('Zone deleted successfully!');
      } catch (error) {
        console.error('Failed to delete zone:', error);
        alert('Failed to delete zone. Please try again.');
      }
    }
  };

  const openEditModal = (zone: Zone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setShowEditModal(true);
  };

  const getZoneStats = (zone: Zone) => {
    const totalSpots = zone.spots.length;
    const availableSpots = zone.spots.filter(spot => spot.status === 'available').length;
    const occupiedSpots = zone.spots.filter(spot => spot.status === 'occupied').length;
    const reservedSpots = zone.spots.filter(spot => spot.status === 'reserved').length;
    const maintenanceSpots = zone.spots.filter(spot => spot.status === 'maintenance').length;
    
    return { totalSpots, availableSpots, occupiedSpots, reservedSpots, maintenanceSpots };
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

  return (
    <div className='space-y-4'>
      {/* Zone Header */}
      <div className='flex justify-between items-center'>
        <h5 className='text-sm font-medium text-secondary-900'>
          Zones ({section.zones.length})
        </h5>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowCreateModal(true)}
        >
          + Add Zone
        </Button>
      </div>

      {/* Zones List */}
      {section.zones.length === 0 ? (
        <div className='text-center py-6 bg-gray-50 rounded-lg'>
          <div className='text-xl mb-2'>🏷️</div>
          <p className='text-secondary-600 text-sm mb-3'>No zones created yet</p>
          <Button
            variant='primary'
            size='sm'
            onClick={() => setShowCreateModal(true)}
          >
            Create First Zone
          </Button>
        </div>
      ) : (
        <div className='space-y-2'>
          {section.zones.map((zone) => {
            const stats = getZoneStats(zone);
            const isExpanded = expandedZones.has(zone.id);

            return (
              <div key={zone.id} className='border border-gray-200 rounded-md p-3 bg-gray-50'>
                {/* Zone Header */}
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => toggleZoneExpansion(zone.id)}
                      className='text-gray-400 hover:text-gray-600 text-sm'
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className='text-md'>🏷️</span>
                    <div>
                      <h6 className='text-sm font-medium text-secondary-900'>
                        {zone.name}
                      </h6>
                      <p className='text-xs text-secondary-600'>
                        {stats.totalSpots} spots
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openEditModal(zone)}
                      className='text-xs px-2 py-1'
                    >
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleDeleteZone(zone)}
                      className='text-xs px-2 py-1 text-red-600 hover:text-red-700'
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Zone Stats */}
                <div className='grid grid-cols-4 gap-2 mb-2'>
                  <div className='text-center'>
                    <div className='text-sm font-bold text-green-600'>{stats.availableSpots}</div>
                    <div className='text-xs text-secondary-600'>Available</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-sm font-bold text-red-600'>{stats.occupiedSpots}</div>
                    <div className='text-xs text-secondary-600'>Occupied</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-sm font-bold text-yellow-600'>{stats.reservedSpots}</div>
                    <div className='text-xs text-secondary-600'>Reserved</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-sm font-bold text-gray-600'>{stats.maintenanceSpots}</div>
                    <div className='text-xs text-secondary-600'>Maintenance</div>
                  </div>
                </div>

                {/* Expanded Content - Spots */}
                {isExpanded && (
                  <div className='border-t pt-2'>
                    <div className='flex justify-between items-center mb-2'>
                      <h6 className='text-xs font-medium text-secondary-900'>
                        Parking Spots ({zone.spots.length})
                      </h6>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => alert('Add spot functionality would be implemented here')}
                        className='text-xs px-2 py-1'
                      >
                        + Add Spot
                      </Button>
                    </div>
                    
                    {zone.spots.length === 0 ? (
                      <div className='text-center py-4 bg-white rounded border'>
                        <div className='text-lg mb-1'>🅿️</div>
                        <p className='text-xs text-secondary-600 mb-2'>No spots created yet</p>
                        <Button
                          variant='primary'
                          size='sm'
                          onClick={() => alert('Add spot functionality would be implemented here')}
                          className='text-xs px-3 py-1'
                        >
                          Create First Spot
                        </Button>
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
                        {zone.spots.map((spot) => (
                          <div
                            key={spot.id}
                            className={`p-2 rounded border text-center ${getStatusColor(spot.status)}`}
                          >
                            <div className='flex items-center justify-center space-x-1 mb-1'>
                              <span className='text-sm'>{getVehicleTypeIcon(spot.type)}</span>
                              <span className='text-xs font-medium'>{spot.number}</span>
                            </div>
                            <div className='text-xs capitalize'>{spot.status}</div>
                            {spot.amenities.length > 0 && (
                              <div className='text-xs mt-1'>
                                {spot.amenities.includes('ev_charging') && '⚡'}
                                {spot.amenities.includes('covered') && '🏠'}
                                {spot.amenities.includes('security') && '🔒'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Zone Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Create New Zone'
      >
        <form onSubmit={handleCreateZone} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Zone Name *
            </label>
            <Input
              type='text'
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder='e.g., Zone A, Premium Area, Electric Vehicle Zone'
              required
            />
          </div>
          <div className='flex justify-end space-x-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowCreateModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              disabled={loading || !zoneName.trim()}
            >
              {loading ? 'Creating...' : 'Create Zone'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Zone Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title='Edit Zone'
      >
        <form onSubmit={handleUpdateZone} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Zone Name *
            </label>
            <Input
              type='text'
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder='e.g., Zone A, Premium Area, Electric Vehicle Zone'
              required
            />
          </div>
          <div className='flex justify-end space-x-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowEditModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              disabled={loading || !zoneName.trim()}
            >
              {loading ? 'Updating...' : 'Update Zone'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};