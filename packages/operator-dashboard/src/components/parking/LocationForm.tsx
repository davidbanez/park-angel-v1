import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import type { Location } from '../../../../shared/src/types/parking';

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: LocationFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

interface LocationFormData {
  name: string;
  type: 'hosted' | 'street' | 'facility';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  settings?: any;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    type: 'facility',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Philippines'
    },
    coordinates: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    settings: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        address: location.address,
        coordinates: location.coordinates,
        settings: location.settings || {}
      });
    }
  }, [location]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }

    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors.state = 'State/Province is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors.zipCode = 'ZIP/Postal code is required';
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
          ...prev[parent as keyof LocationFormData],
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

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Basic Information */}
      <div>
        <h3 className='text-lg font-medium text-secondary-900 mb-4'>
          Basic Information
        </h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Location Name *
            </label>
            <Input
              type='text'
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder='e.g., Downtown Parking Garage'
              error={errors.name}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Parking Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            >
              <option value='facility'>Parking Facility</option>
              <option value='street'>Street Parking</option>
              <option value='hosted'>Hosted Parking</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div>
        <h3 className='text-lg font-medium text-secondary-900 mb-4'>
          Address Information
        </h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-1'>
              Street Address *
            </label>
            <Input
              type='text'
              value={formData.address.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              placeholder='e.g., 123 Main Street'
              error={errors.street}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                City *
              </label>
              <Input
                type='text'
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                placeholder='e.g., Manila'
                error={errors.city}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                State/Province *
              </label>
              <Input
                type='text'
                value={formData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                placeholder='e.g., Metro Manila'
                error={errors.state}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                ZIP/Postal Code *
              </label>
              <Input
                type='text'
                value={formData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                placeholder='e.g., 1000'
                error={errors.zipCode}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Country *
              </label>
              <Input
                type='text'
                value={formData.address.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                placeholder='e.g., Philippines'
              />
            </div>
          </div>
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
          {loading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
        </Button>
      </div>
    </form>
  );
};