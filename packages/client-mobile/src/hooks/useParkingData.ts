import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ParkingService } from '../services/parkingService';
import { useParkingStore } from '../stores/parkingStore';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';

export const useParkingData = () => {
  const queryClient = useQueryClient();
  const { currentLocation, filters } = useParkingStore();
  const [realtimeSubscription, setRealtimeSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Query for nearby parking spots
  const {
    data: nearbySpots = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['parking-spots', currentLocation, filters],
    queryFn: async () => {
      if (!currentLocation) return [];
      
      return await ParkingService.searchParkingSpots({
        location: currentLocation,
        radius: 5, // 5km radius
        type: filters.type.length > 0 ? filters.type : undefined,
      });
    },
    enabled: !!currentLocation,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Set up real-time subscriptions for occupancy updates
  useEffect(() => {
    if (nearbySpots.length > 0) {
      // Clean up existing subscription
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }

      // Subscribe to occupancy updates for visible spots
      const spotIds = nearbySpots.map(spot => spot.id);
      const subscription = ParkingService.subscribeToOccupancyUpdates(
        spotIds,
        (updates) => {
          // Update the query cache with new occupancy data
          queryClient.setQueryData(
            ['parking-spots', currentLocation, filters],
            (oldData: ParkingSpot[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map(spot => {
                const update = updates.find(u => u.spotId === spot.id);
                return update ? { ...spot, status: update.status as ParkingSpot['status'] } : spot;
              });
            }
          );
        }
      );

      setRealtimeSubscription(subscription);
    }

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [nearbySpots, queryClient, currentLocation, filters, realtimeSubscription]);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [realtimeSubscription]);

  return {
    nearbySpots,
    isLoading,
    error,
    refetch,
  };
};

export default useParkingData;