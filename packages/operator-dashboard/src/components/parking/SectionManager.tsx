import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { ZoneManager } from './ZoneManager';
import type { Location, Section } from '../../../../shared/src/types/parking';

interface SectionManagerProps {
  location: Location;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

export const SectionManager: React.FC<SectionManagerProps> = ({
  location,
  expandedSections,
  onToggleSection
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement section creation API call
      console.log('Creating section:', { locationId: location.id, name: sectionName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSectionName('');
      setShowCreateModal(false);
      alert('Section created successfully!');
    } catch (error) {
      console.error('Failed to create section:', error);
      alert('Failed to create section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !sectionName.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement section update API call
      console.log('Updating section:', { id: selectedSection.id, name: sectionName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSectionName('');
      setSelectedSection(null);
      setShowEditModal(false);
      alert('Section updated successfully!');
    } catch (error) {
      console.error('Failed to update section:', error);
      alert('Failed to update section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (section: Section) => {
    if (window.confirm(`Are you sure you want to delete section "${section.name}"? This will also delete all zones and spots within this section.`)) {
      try {
        // TODO: Implement section deletion API call
        console.log('Deleting section:', section.id);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('Section deleted successfully!');
      } catch (error) {
        console.error('Failed to delete section:', error);
        alert('Failed to delete section. Please try again.');
      }
    }
  };

  const openEditModal = (section: Section) => {
    setSelectedSection(section);
    setSectionName(section.name);
    setShowEditModal(true);
  };

  const getSectionStats = (section: Section) => {
    const totalZones = section.zones.length;
    const totalSpots = section.zones.reduce((total, zone) => total + zone.spots.length, 0);
    return { totalZones, totalSpots };
  };

  return (
    <div className='space-y-4'>
      {/* Section Header */}
      <div className='flex justify-between items-center'>
        <h4 className='text-md font-medium text-secondary-900'>
          Sections ({location.sections.length})
        </h4>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowCreateModal(true)}
        >
          + Add Section
        </Button>
      </div>

      {/* Sections List */}
      {location.sections.length === 0 ? (
        <div className='text-center py-8 bg-gray-50 rounded-lg'>
          <div className='text-2xl mb-2'>📂</div>
          <p className='text-secondary-600 mb-4'>No sections created yet</p>
          <Button
            variant='primary'
            size='sm'
            onClick={() => setShowCreateModal(true)}
          >
            Create First Section
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {location.sections.map((section) => {
            const stats = getSectionStats(section);
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id} className='border border-gray-200 rounded-lg p-4'>
                {/* Section Header */}
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => onToggleSection(section.id)}
                      className='text-gray-400 hover:text-gray-600'
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className='text-lg'>📂</span>
                    <div>
                      <h5 className='font-medium text-secondary-900'>
                        {section.name}
                      </h5>
                      <p className='text-sm text-secondary-600'>
                        {stats.totalZones} zones, {stats.totalSpots} spots
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openEditModal(section)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleDeleteSection(section)}
                      className='text-red-600 hover:text-red-700'
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Section Stats */}
                <div className='grid grid-cols-3 gap-4 mb-3'>
                  <div className='text-center'>
                    <div className='text-lg font-bold text-primary-600'>{stats.totalZones}</div>
                    <div className='text-xs text-secondary-600'>Zones</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-bold text-primary-600'>{stats.totalSpots}</div>
                    <div className='text-xs text-secondary-600'>Spots</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-bold text-green-600'>80%</div>
                    <div className='text-xs text-secondary-600'>Occupancy</div>
                  </div>
                </div>

                {/* Expanded Content - Zones */}
                {isExpanded && (
                  <div className='border-t pt-3'>
                    <ZoneManager section={section} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Section Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Create New Section'
      >
        <form onSubmit={handleCreateSection} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Section Name *
            </label>
            <Input
              type='text'
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder='e.g., Ground Floor, Level 1, North Wing'
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
              disabled={loading || !sectionName.trim()}
            >
              {loading ? 'Creating...' : 'Create Section'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title='Edit Section'
      >
        <form onSubmit={handleUpdateSection} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Section Name *
            </label>
            <Input
              type='text'
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder='e.g., Ground Floor, Level 1, North Wing'
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
              disabled={loading || !sectionName.trim()}
            >
              {loading ? 'Updating...' : 'Update Section'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};