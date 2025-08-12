import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParkingMap } from '../../components/map/ParkingMap';
import { SearchBar } from '../../components/map/SearchBar';
import { FilterPanel } from '../../components/map/FilterPanel';
import { useParkingStore } from '../../stores/parkingStore';
import type { ParkingSpot, Location } from '@park-angel/shared/src/types/parking';

export default function MapScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const { filters, setCurrentLocation } = useParkingStore();

  const handleLocationSelect = (location: Location) => {
    // Update current location to the selected location
    setCurrentLocation(location.coordinates);
  };

  const handleSpotSelect = (spot: ParkingSpot) => {
    // Handle spot selection - could navigate to booking flow
    console.log('Selected spot:', spot);
  };

  const handleBookingComplete = (bookingId: string) => {
    // Handle successful booking
    console.log('Booking completed:', bookingId);
    Alert.alert(
      'Booking Confirmed!',
      'Your parking spot has been reserved successfully.',
      [{ text: 'OK' }]
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type.length < 3) count++;
    if (filters.maxPrice < 1000) count++;
    if (filters.amenities.length > 0) count++;
    return count;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <SearchBar onLocationSelect={handleLocationSelect} />

      {/* Map */}
      <View style={styles.mapContainer}>
        <ParkingMap onSpotSelect={handleSpotSelect} />
        
        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          <Text style={styles.filterText}>Filter</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Current Location Button */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => {
            // This will be handled by the ParkingMap component
            Alert.alert('Location', 'Centering map on your location...');
          }}
        >
          <Text style={styles.locationIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      <FilterPanel
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => {
          // Filters are automatically applied through the store
          console.log('Filters applied');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  filterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  filterBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: 'white',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationIcon: {
    fontSize: 20,
  },
});