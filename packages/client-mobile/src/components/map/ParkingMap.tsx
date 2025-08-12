import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useParkingStore } from '../../stores/parkingStore';
import useParkingData from '../../hooks/useParkingData';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import { ParkingMarker } from './ParkingMarker';
import { SpotDetailsModal } from './SpotDetailsModal';

// Custom purple map style
const purpleMapStyle = [
  {
    "featureType": "all",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
];

interface ParkingMapProps {
  onSpotSelect?: (spot: ParkingSpot) => void;
}

export const ParkingMap: React.FC<ParkingMapProps> = ({ onSpotSelect }) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 14.5995, // Manila default
    longitude: 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showSpotDetails, setShowSpotDetails] = useState(false);

  const {
    currentLocation,
    setCurrentLocation,
    setSelectedSpot: setStoreSelectedSpot
  } = useParkingStore();

  // Use the parking data hook for real-time updates
  const { nearbySpots } = useParkingData();

  // Request location permission and get current location
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to find nearby parking spots.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      setRegion({
        ...coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Animate to current location
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    }
  }, [setCurrentLocation]);



  const handleMarkerPress = async (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setStoreSelectedSpot(spot);
    setShowSpotDetails(true);
    onSpotSelect?.(spot);

    // Animate to selected spot
    mapRef.current?.animateToRegion({
      latitude: spot.coordinates.latitude,
      longitude: spot.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleRegionChangeComplete = async (newRegion: Region) => {
    // Update current location to trigger new search
    setCurrentLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        customMapStyle={purpleMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#8B5CF6"
          />
        )}

        {/* Parking spot markers */}
        {nearbySpots.map((spot) => (
          <ParkingMarker
            key={spot.id}
            spot={spot}
            onPress={() => handleMarkerPress(spot)}
            isSelected={selectedSpot?.id === spot.id}
          />
        ))}
      </MapView>

      {/* Spot details modal */}
      {selectedSpot && (
        <SpotDetailsModal
          visible={showSpotDetails}
          spot={selectedSpot}
          onClose={() => {
            setShowSpotDetails(false);
            setSelectedSpot(null);
          }}
          onBook={() => {
            // Navigate to booking flow
            setShowSpotDetails(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});