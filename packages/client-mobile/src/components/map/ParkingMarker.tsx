import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';

interface ParkingMarkerProps {
  spot: ParkingSpot;
  onPress: () => void;
  isSelected?: boolean;
}

export const ParkingMarker: React.FC<ParkingMarkerProps> = ({
  spot,
  onPress,
  isSelected = false,
}) => {
  const getMarkerColor = () => {
    switch (spot.status) {
      case 'available':
        return '#10B981'; // Green
      case 'occupied':
        return '#EF4444'; // Red
      case 'reserved':
        return '#F59E0B'; // Yellow
      case 'maintenance':
        return '#6B7280'; // Gray
      default:
        return '#8B5CF6'; // Purple
    }
  };

  const getTypeIcon = () => {
    switch (spot.type) {
      case 'hosted':
        return '🏠';
      case 'street':
        return '🛣️';
      case 'facility':
        return '🏢';
      default:
        return '🅿️';
    }
  };

  const getPriceDisplay = () => {
    if (spot.pricing) {
      // This would be calculated from the pricing config
      return '₱50/hr';
    }
    return 'N/A';
  };

  return (
    <Marker
      coordinate={spot.coordinates}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={[
        styles.markerContainer,
        { borderColor: getMarkerColor() },
        isSelected && styles.selectedMarker
      ]}>
        <View style={[styles.markerContent, { backgroundColor: getMarkerColor() }]}>
          <Text style={styles.typeIcon}>{getTypeIcon()}</Text>
          <Text style={styles.spotNumber}>{spot.number}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{getPriceDisplay()}</Text>
        </View>
        <View style={[styles.markerTail, { borderTopColor: getMarkerColor() }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    borderWidth: 3,
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.1 }],
  },
  markerContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  spotNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceTag: {
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  priceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: 2,
  },
});