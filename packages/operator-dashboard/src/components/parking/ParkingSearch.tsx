import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../shared/Input';
import type { Location } from '../../../../shared/src/types/parking';

interface ParkingSearchProps {
  value: string;
  onChange: (value: string) => void;
  locations: Location[];
  onLocationSelect: (location: Location) => void;
}

export const ParkingSearch: React.FC<ParkingSearchProps> = ({
  value,
  onChange,
  locations,
  onLocationSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const results: any[] = [];
      
      locations.forEach(location => {
        // Search locations
        if (location.name.toLowerCase().includes(value.toLowerCase()) ||
            location.address.city.toLowerCase().includes(value.toLowerCase()) ||
            location.type.toLowerCase().includes(value.toLowerCase())) {
          results.push({
            type: 'location',
            id: location.id,
            name: location.name,
            subtitle: `${location.type} - ${location.address.city}`,
            data: location
          });
        }

        // Search sections
        location.sections.forEach(section => {
          if (section.name.toLowerCase().includes(value.toLowerCase())) {
            results.push({
              type: 'section',
              id: section.id,
              name: section.name,
              subtitle: `Section in ${location.name}`,
              data: { location, section }
            });
          }

          // Search zones
          section.zones.forEach(zone => {
            if (zone.name.toLowerCase().includes(value.toLowerCase())) {
              results.push({
                type: 'zone',
                id: zone.id,
                name: zone.name,
                subtitle: `Zone in ${location.name} → ${section.name}`,
                data: { location, section, zone }
              });
            }

            // Search spots
            zone.spots.forEach(spot => {
              if (spot.number.toLowerCase().includes(value.toLowerCase())) {
                results.push({
                  type: 'spot',
                  id: spot.id,
                  name: `Spot ${spot.number}`,
                  subtitle: `${location.name} → ${section.name} → ${zone.name}`,
                  data: { location, section, zone, spot }
                });
              }
            });
          });
        });
      });

      setFilteredResults(results.slice(0, 10)); // Limit to 10 results
      setIsOpen(results.length > 0);
    } else {
      setFilteredResults([]);
      setIsOpen(false);
    }
  }, [value, locations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResultClick = (result: any) => {
    onChange(result.name);
    setIsOpen(false);
    
    // Select the location for further management
    onLocationSelect(result.data.location);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'location': return '🏢';
      case 'section': return '📂';
      case 'zone': return '🏷️';
      case 'spot': return '🅿️';
      default: return '🔍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'location': return 'bg-blue-100 text-blue-800';
      case 'section': return 'bg-green-100 text-green-800';
      case 'zone': return 'bg-yellow-100 text-yellow-800';
      case 'spot': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={searchRef} className='relative'>
      <div className='relative'>
        <Input
          type='text'
          placeholder='Search locations, sections, zones, or spots...'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='pl-10'
        />
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <span className='text-gray-400'>🔍</span>
        </div>
      </div>

      {isOpen && filteredResults.length > 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'>
          {filteredResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className='w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0'
            >
              <div className='flex items-center space-x-3'>
                <span className='text-lg'>{getTypeIcon(result.type)}</span>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center space-x-2'>
                    <p className='text-sm font-medium text-secondary-900 truncate'>
                      {result.name}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </div>
                  <p className='text-sm text-secondary-600 truncate'>
                    {result.subtitle}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredResults.length === 0 && value.length >= 2 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg'>
          <div className='px-4 py-3 text-center text-secondary-600'>
            <span className='text-2xl mb-2 block'>🔍</span>
            <p className='text-sm'>No results found for "{value}"</p>
          </div>
        </div>
      )}
    </div>
  );
};