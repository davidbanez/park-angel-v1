import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { RealtimeService } from '@shared/services/realtime';

interface ParkingLocation {
  id: string;
  name: string;
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  occupancyRate: number;
  type: 'hosted' | 'street' | 'facility';
}

interface ParkingUtilizationDisplayProps {
  operatorId?: string;
}

export const ParkingUtilizationDisplay: React.FC<ParkingUtilizationDisplayProps> = ({
  operatorId,
}) => {
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorId) return;

    const fetchParkingData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call - in real implementation, this would fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate mock data
        const mockLocations: ParkingLocation[] = [
          {
            id: '1',
            name: 'Downtown Plaza',
            totalSpots: 120,
            occupiedSpots: 89,
            availableSpots: 31,
            occupancyRate: 0.74,
            type: 'facility',
          },
          {
            id: '2',
            name: 'Main Street',
            totalSpots: 45,
            occupiedSpots: 32,
            availableSpots: 13,
            occupancyRate: 0.71,
            type: 'street',
          },
          {
            id: '3',
            name: 'Residential Area',
            totalSpots: 28,
            occupiedSpots: 15,
            availableSpots: 13,
            occupancyRate: 0.54,
            type: 'hosted',
          },
          {
            id: '4',
            name: 'Business District',
            totalSpots: 85,
            occupiedSpots: 72,
            availableSpots: 13,
            occupancyRate: 0.85,
            type: 'facility',
          },
        ];

        setLocations(mockLocations);
      } catch (err) {
        setError('Failed to load parking data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParkingData();

    // Set up real-time subscription for parking spot updates
    RealtimeService.subscribeToParkingSpots(
      operatorId,
      (payload) => {
        console.log('Parking spot update:', payload);
        // Update the locations state based on real-time changes
        // This would be implemented with actual data transformation
      }
    );

    return () => {
      RealtimeService.unsubscribe(`parking-spots-${operatorId}`);
    };
  }, [operatorId]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 0.9) return 'bg-red-500';
    if (rate >= 0.7) return 'bg-orange-500';
    if (rate >= 0.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getOccupancyTextColor = (rate: number) => {
    if (rate >= 0.9) return 'text-red-600';
    if (rate >= 0.7) return 'text-orange-600';
    if (rate >= 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getParkingTypeIcon = (type: string) => {
    switch (type) {
      case 'facility':
        return '🏢';
      case 'street':
        return '🛣️';
      case 'hosted':
        return '🏠';
      default:
        return '🅿️';
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const totalSpots = locations.reduce((sum, loc) => sum + loc.totalSpots, 0);
  const totalOccupied = locations.reduce((sum, loc) => sum + loc.occupiedSpots, 0);
  const overallOccupancyRate = totalSpots > 0 ? totalOccupied / totalSpots : 0;

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <div className="bg-secondary-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-secondary-900">Overall Utilization</h4>
          <span className={`text-sm font-medium ${getOccupancyTextColor(overallOccupancyRate)}`}>
            {(overallOccupancyRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getOccupancyColor(overallOccupancyRate)}`}
            style={{ width: `${overallOccupancyRate * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-secondary-600">
          <span>{totalOccupied} occupied</span>
          <span>{totalSpots - totalOccupied} available</span>
        </div>
      </div>

      {/* Location Details */}
      <div className="space-y-3">
        {locations.map((location) => (
          <div key={location.id} className="border border-secondary-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getParkingTypeIcon(location.type)}</span>
                <div>
                  <h5 className="font-medium text-secondary-900">{location.name}</h5>
                  <p className="text-xs text-secondary-500 capitalize">{location.type} parking</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getOccupancyTextColor(location.occupancyRate)}`}>
                  {(location.occupancyRate * 100).toFixed(1)}%
                </span>
                <p className="text-xs text-secondary-500">
                  {location.occupiedSpots}/{location.totalSpots} spots
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getOccupancyColor(location.occupancyRate)}`}
                style={{ width: `${location.occupancyRate * 100}%` }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-secondary-500">Occupied</p>
                <p className="font-medium text-secondary-900">{location.occupiedSpots}</p>
              </div>
              <div className="text-center">
                <p className="text-secondary-500">Available</p>
                <p className="font-medium text-secondary-900">{location.availableSpots}</p>
              </div>
              <div className="text-center">
                <p className="text-secondary-500">Total</p>
                <p className="font-medium text-secondary-900">{location.totalSpots}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-secondary-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>
    </div>
  );
};