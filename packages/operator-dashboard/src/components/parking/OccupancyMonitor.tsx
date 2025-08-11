import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import type { Location } from '../../../../shared/src/types/parking';

interface OccupancyMonitorProps {
  locations: Location[];
  selectedLocationId: string;
  onLocationSelect: (locationId: string) => void;
}

interface OccupancyData {
  locationId: string;
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  reservedSpots: number;
  maintenanceSpots: number;
  occupancyRate: number;
  lastUpdated: Date;
}

interface SpotOccupancy {
  spotId: string;
  spotNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  sectionName: string;
  zoneName: string;
  vehicleType: string;
  occupiedBy?: {
    licensePlate: string;
    startTime: Date;
    endTime?: Date;
    vehicleType: string;
  };
}

export const OccupancyMonitor: React.FC<OccupancyMonitorProps> = ({
  locations,
  selectedLocationId,
  onLocationSelect
}) => {
  const [occupancyData, setOccupancyData] = useState<Record<string, OccupancyData>>({});
  const [spotOccupancy, setSpotOccupancy] = useState<SpotOccupancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  // Mock data generation for demonstration
  const generateMockOccupancyData = (location: Location): OccupancyData => {
    const totalSpots = location.sections.reduce((total, section) => 
      total + section.zones.reduce((zoneTotal, zone) => 
        zoneTotal + zone.spots.length, 0), 0);
    
    const occupiedSpots = Math.floor(totalSpots * (0.6 + Math.random() * 0.3)); // 60-90% occupancy
    const reservedSpots = Math.floor(totalSpots * 0.1); // 10% reserved
    const maintenanceSpots = Math.floor(totalSpots * 0.05); // 5% maintenance
    const availableSpots = totalSpots - occupiedSpots - reservedSpots - maintenanceSpots;
    
    return {
      locationId: location.id,
      totalSpots,
      availableSpots: Math.max(0, availableSpots),
      occupiedSpots,
      reservedSpots,
      maintenanceSpots,
      occupancyRate: totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0,
      lastUpdated: new Date()
    };
  };

  const generateMockSpotOccupancy = (location: Location): SpotOccupancy[] => {
    const spots: SpotOccupancy[] = [];
    
    location.sections.forEach(section => {
      section.zones.forEach(zone => {
        zone.spots.forEach(spot => {
          const random = Math.random();
          let status: 'available' | 'occupied' | 'reserved' | 'maintenance';
          let occupiedBy;

          if (random < 0.65) {
            status = 'occupied';
            occupiedBy = {
              licensePlate: `ABC-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
              startTime: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000), // Up to 4 hours ago
              endTime: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000) : undefined, // Up to 2 hours from now
              vehicleType: spot.type
            };
          } else if (random < 0.75) {
            status = 'available';
          } else if (random < 0.9) {
            status = 'reserved';
          } else {
            status = 'maintenance';
          }

          spots.push({
            spotId: spot.id,
            spotNumber: spot.number,
            status,
            sectionName: section.name,
            zoneName: zone.name,
            vehicleType: spot.type,
            occupiedBy
          });
        });
      });
    });

    return spots;
  };

  const refreshOccupancyData = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newOccupancyData: Record<string, OccupancyData> = {};
      locations.forEach(location => {
        newOccupancyData[location.id] = generateMockOccupancyData(location);
      });
      setOccupancyData(newOccupancyData);

      if (selectedLocation) {
        setSpotOccupancy(generateMockSpotOccupancy(selectedLocation));
      }
    } catch (error) {
      console.error('Failed to refresh occupancy data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOccupancyData();
  }, [locations, selectedLocationId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshOccupancyData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredSpots = spotOccupancy.filter(() => {
    // You can add filters here later
    return true;
  });

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-xl font-semibold text-secondary-900'>
            Real-time Occupancy Monitor
          </h2>
          <p className='text-secondary-600 mt-1'>
            Monitor parking spot availability and occupancy in real-time
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='flex items-center space-x-2'>
            <label className='text-sm text-secondary-700'>Auto-refresh:</label>
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
            />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
              className='text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500'
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          <Button
            variant='outline'
            onClick={refreshOccupancyData}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'} Refresh
          </Button>
        </div>
      </div>

      {/* Location Selector */}
      <Card>
        <div className='p-4'>
          <label className='block text-sm font-medium text-secondary-700 mb-2'>
            Select Location
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => onLocationSelect(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
          >
            <option value=''>Select a location...</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.type})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Overall Statistics */}
      {selectedLocationId && occupancyData[selectedLocationId] && (
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <Card>
            <div className='p-4 text-center'>
              <div className='text-2xl font-bold text-primary-600'>
                {occupancyData[selectedLocationId].totalSpots}
              </div>
              <div className='text-sm text-secondary-600'>Total Spots</div>
            </div>
          </Card>
          <Card>
            <div className='p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {occupancyData[selectedLocationId].availableSpots}
              </div>
              <div className='text-sm text-secondary-600'>Available</div>
            </div>
          </Card>
          <Card>
            <div className='p-4 text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {occupancyData[selectedLocationId].occupiedSpots}
              </div>
              <div className='text-sm text-secondary-600'>Occupied</div>
            </div>
          </Card>
          <Card>
            <div className='p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {occupancyData[selectedLocationId].reservedSpots}
              </div>
              <div className='text-sm text-secondary-600'>Reserved</div>
            </div>
          </Card>
          <Card>
            <div className='p-4 text-center'>
              <div className='text-2xl font-bold text-primary-600'>
                {occupancyData[selectedLocationId].occupancyRate.toFixed(1)}%
              </div>
              <div className='text-sm text-secondary-600'>Occupancy Rate</div>
            </div>
          </Card>
        </div>
      )}

      {/* Spot Details */}
      {selectedLocationId && (
        <Card>
          <div className='p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Spot Details ({filteredSpots.length} spots)
              </h3>
              <div className='text-sm text-secondary-600'>
                Last updated: {occupancyData[selectedLocationId]?.lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            {filteredSpots.length === 0 ? (
              <div className='text-center py-8'>
                <div className='text-4xl mb-4'>🅿️</div>
                <h3 className='text-lg font-medium text-secondary-900 mb-2'>
                  No spots to monitor
                </h3>
                <p className='text-secondary-600'>
                  Select a location with parking spots to monitor occupancy.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {filteredSpots.map((spot) => (
                  <div
                    key={spot.spotId}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(spot.status)}`}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-lg'>{getVehicleTypeIcon(spot.vehicleType)}</span>
                        <span className='font-medium'>Spot {spot.spotNumber}</span>
                      </div>
                      <span className='text-xs font-medium uppercase tracking-wide'>
                        {spot.status}
                      </span>
                    </div>

                    <div className='text-sm text-secondary-600 mb-2'>
                      {spot.sectionName} → {spot.zoneName}
                    </div>

                    {spot.occupiedBy && (
                      <div className='text-sm space-y-1'>
                        <div className='flex items-center space-x-1'>
                          <span className='font-medium'>🚗</span>
                          <span>{spot.occupiedBy.licensePlate}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <span className='font-medium'>⏱️</span>
                          <span>{formatDuration(spot.occupiedBy.startTime)}</span>
                        </div>
                        {spot.occupiedBy.endTime && (
                          <div className='flex items-center space-x-1'>
                            <span className='font-medium'>⏰</span>
                            <span>Until {spot.occupiedBy.endTime.toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {spot.status === 'maintenance' && (
                      <div className='text-sm text-gray-600 mt-2'>
                        🔧 Under maintenance
                      </div>
                    )}

                    {spot.status === 'reserved' && (
                      <div className='text-sm text-yellow-700 mt-2'>
                        📅 Reserved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {!selectedLocationId && (
        <Card>
          <div className='p-8 text-center'>
            <div className='text-4xl mb-4'>📊</div>
            <h3 className='text-lg font-medium text-secondary-900 mb-2'>
              Select a Location
            </h3>
            <p className='text-secondary-600'>
              Choose a location to monitor real-time parking occupancy.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};