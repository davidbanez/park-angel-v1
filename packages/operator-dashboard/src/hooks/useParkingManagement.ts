import { useState, useCallback } from 'react';
import { supabase } from '../../../shared/src/lib/supabase';
import type { Location, Section, Zone, ParkingSpot } from '../../../shared/src/types/parking';

interface CreateLocationData {
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

interface UpdateLocationData {
  name?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  settings?: any;
}

export const useParkingManagement = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select(`
          *,
          sections (
            *,
            zones (
              *,
              parking_spots (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedLocations: Location[] = data?.map(mapLocationFromDB) || [];
      setLocations(mappedLocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLocation = useCallback(async (locationData: CreateLocationData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('locations')
        .insert({
          name: locationData.name,
          type: locationData.type,
          operator_id: user.user.id,
          address: locationData.address,
          coordinates: {
            lat: locationData.coordinates.latitude,
            lng: locationData.coordinates.longitude
          },
          settings: locationData.settings || {}
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newLocation = mapLocationFromDB(data);
      setLocations(prev => [newLocation, ...prev]);
      
      return newLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create location';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocation = useCallback(async (id: string, updateData: UpdateLocationData) => {
    setLoading(true);
    setError(null);

    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.address) updatePayload.address = updateData.address;
      if (updateData.coordinates) {
        updatePayload.coordinates = {
          lat: updateData.coordinates.latitude,
          lng: updateData.coordinates.longitude
        };
      }
      if (updateData.settings) updatePayload.settings = updateData.settings;

      const { data, error: updateError } = await supabase
        .from('locations')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedLocation = mapLocationFromDB(data);
      setLocations(prev => prev.map(loc => loc.id === id ? updatedLocation : loc));
      
      return updatedLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setLocations(prev => prev.filter(loc => loc.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocationHierarchy = useCallback(async (locationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select(`
          *,
          sections (
            *,
            zones (
              *,
              parking_spots (*)
            )
          )
        `)
        .eq('id', locationId)
        .single();

      if (fetchError) throw fetchError;

      return mapLocationFromDB(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch location hierarchy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    getLocationHierarchy,
    refreshLocations
  };
};

// Helper function to map database records to domain models
function mapLocationFromDB(data: any): Location {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    operatorId: data.operator_id,
    address: data.address,
    coordinates: {
      latitude: data.coordinates.lat,
      longitude: data.coordinates.lng
    },
    sections: data.sections?.map(mapSectionFromDB) || [],
    pricing: data.pricing_config || {},
    settings: data.settings || {}
  };
}

function mapSectionFromDB(data: any): Section {
  return {
    id: data.id,
    locationId: data.location_id,
    name: data.name,
    zones: data.zones?.map(mapZoneFromDB) || [],
    pricing: data.pricing_config
  };
}

function mapZoneFromDB(data: any): Zone {
  return {
    id: data.id,
    sectionId: data.section_id,
    name: data.name,
    spots: data.parking_spots?.map(mapSpotFromDB) || [],
    pricing: data.pricing_config
  };
}

function mapSpotFromDB(data: any): ParkingSpot {
  return {
    id: data.id,
    zoneId: data.zone_id,
    number: data.number,
    type: data.type,
    status: data.status,
    coordinates: {
      latitude: data.coordinates.lat,
      longitude: data.coordinates.lng
    },
    pricing: data.pricing_config,
    amenities: data.amenities || []
  };
}