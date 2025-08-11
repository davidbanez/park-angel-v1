import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import type { Location, ParkingSpot } from '../../../../shared/src/types/parking';

interface SpotFormProps {
  location: Location;
  spot?: ParkingSpot;
  onSubmit: (data: SpotFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

interface SpotFormData {
  zoneId: string;
  number: string;
  type: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  amenities: string[];
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'truck', label: 'Truck', icon: '🚛' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'suv', label: 'SUV', icon: '🚙' }
];

const AMENITIES = [
  { value: 'covered', label: 'Covered', icon: '🏠' },
  { value: 'ev_charging', label: 'EV Charging', icon: '⚡' },
  { value: 'security', label: 'Security Camera', icon: '🔒' },
  { value: 'disabled', label: 'Disabled Access', icon: '♿' },
  { value: 'valet', label: 'Valet Service', icon: '🚗' },
  { value: 'car_wash', label: 'Car Wash', icon: '🧽' }
];

export const SpotForm: React.FC<SpotFormProps> = ({
  location,
  spot,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState<SpotFormData>({
    zoneId: '',
    number: '',
    type: 'car',
    coordinates: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    amenities: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (spot) {
      setFormData({
        zoneId: spot.zoneId,
        number: spot.number,
        type: spot.type,
        coordinates: spot.coordinates,
        amenities: spot.amenities || []
      });
    }
  }, [spot]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.zoneId) {
      newErrors.zoneId = 'Zone selection is required';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Spot number is required';
    }

    if (isNaN(formData.coordinates.latitude) || formData.coordinates.latitude < -90 || formData.coordinates.latitude > 90) {
      newErrors.latitude = 'Valid latitude is required (-90 to 90)';
    }

    if (isNaN(formData.coordinates.longitude) || formData.coordinates.longitude < -180 || formData.coordinates.longitude > 180) {
      newErrors.longitude = 'Valid longitude is required (-180 to 180)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof SpotFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Get all zones from all sections
  const allZones = location.sections.flatMap(section => 
    section.zones.map(zone => ({
      ...zone,
      sectionName: section.name
    }))
  );

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Zone Selection */}
      <div>
        <h3 className='text-lg font-medium text-secondary-900 mb-4'>
          Location Details
        </h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Zone *
            </label>
            <select
              value={formData.zoneId}
              onChange={(e) => handleInputChange('zoneId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.zoneId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value=''>Select a zone...</option>
              {allZones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.sectionName} → {zone.name}
                </option>
              ))}
            </select>
            {errors.zoneId && (
              <p className='mt-1 text-sm text-red-600'>{errors.zoneId}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Spot Number *
            </label>
            <Input
              type='text'
              value={formData.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              placeholder='e.g., A1, B-15, 001'
              error={errors.number}
            />
          </div>
        </div>
      </div>

      {/* Vehicle Type */}
      <div>
        <h3 className='text-lg font-medium text-secondary-900 mb-4'>
          Vehicle Type
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {VEHICLE_TYPES.map(vehicleType => (
            <button
              key={vehicleType.value}
              type='button'
              onClick={() => handleInputChange('type', vehicleType.value)}
              className={`p-3 border rounded-lg text-center transition-colors ${
                formData.type === vehicleType.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className='text-2xl mb-1'>{vehicleType.icon}</div>
              <div className='text-sm font-medium'>{vehicleType.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* GPS Coordinates */}
      <div>
        <h3 className='text-lg font-medium text-secondary-900 mb-4'>
          GPS Coordinates
        </h3>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Latitude *
              </label>
              <Input
                type='number'
                step='any'
                value={formData.coordinates.latitude}
                onChange={(e) => handleInputChange('coordinates.latitude', parseFloat(e.target.value))}
                placeholder='e.g., 14.5995'
                error={errors.latitude}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Longitude *
              </label>
              <Input
                type='number'
                step='any'
                value={formData.coordinates.longitude}
                onChange={(e) => handleInputChange('coordinates.longitude', parseFloat(e.target.value))}
                placeholder='e.g., 120.9842'
                error={errors.longitude}
              />
            </div>
          </div>
          <Button
            type='button'
            variant='outline'
            onClick={getCurrentLocation}
            className='w-full'
          >
            📍 Use Current Location
          </Button>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className='text-lg font-medium text-secondary-900 mb-4'>
          Amenities
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {AMENITIES.map(amenity => (
            <button
              key={amenity.value}
              type='button'
              onClick={() => handleAmenityToggle(amenity.value)}
              className={`p-3 border rounded-lg text-center transition-colors ${
                formData.amenities.includes(amenity.value)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className='text-xl mb-1'>{amenity.icon}</div>
              <div className='text-sm font-medium'>{amenity.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className='flex justify-end space-x-3 pt-6 border-t'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          variant='primary'
          disabled={loading}
        >
          {loading ? 'Saving...' : spot ? 'Update Spot' : 'Create Spot'}
        </Button>
      </div>
    </form>
  );
};