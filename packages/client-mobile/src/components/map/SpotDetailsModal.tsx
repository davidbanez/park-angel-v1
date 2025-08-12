import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import { ParkingService, SpotAvailability } from '../../services/parkingService';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { SpotSelectionModal } from '../booking/SpotSelectionModal';
import { ParkNowModal } from '../booking/ParkNowModal';
import { BookingFlow } from '../booking/BookingFlow';

interface SpotDetailsModalProps {
  visible: boolean;
  spot: ParkingSpot;
  onClose: () => void;
  onBook: (bookingId: string) => void;
}

// const { height: screenHeight } = Dimensions.get('window');

export const SpotDetailsModal: React.FC<SpotDetailsModalProps> = ({
  visible,
  spot,
  onClose,
  onBook,
}) => {
  const [availability, setAvailability] = useState<SpotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSpotSelection, setShowSpotSelection] = useState(false);
  const [showParkNow, setShowParkNow] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (visible && spot) {
      loadAvailability();
    }
  }, [visible, spot, loadAvailability]);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Next 30 days

      const availabilityData = await ParkingService.getSpotAvailability(
        spot.id,
        startDate,
        endDate
      );
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'Failed to load availability data.');
    } finally {
      setLoading(false);
    }
  }, [spot.id]);

  const getSpotTypeInfo = () => {
    switch (spot.type) {
      case 'hosted':
        return {
          title: 'Hosted Parking',
          description: 'Private parking space hosted by an individual',
          icon: '🏠',
        };
      case 'street':
        return {
          title: 'Street Parking',
          description: 'On-street public parking managed by operator',
          icon: '🛣️',
        };
      case 'facility':
        return {
          title: 'Parking Facility',
          description: 'Off-street parking garage or facility',
          icon: '🏢',
        };
      default:
        return {
          title: 'Parking Spot',
          description: 'Parking space',
          icon: '🅿️',
        };
    }
  };

  const getStatusColor = () => {
    switch (spot.status) {
      case 'available':
        return '#10B981';
      case 'occupied':
        return '#EF4444';
      case 'reserved':
        return '#F59E0B';
      case 'maintenance':
        return '#6B7280';
      default:
        return '#8B5CF6';
    }
  };

  const getStatusText = () => {
    switch (spot.status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Currently Occupied';
      case 'reserved':
        return 'Reserved';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  };

  const typeInfo = getSpotTypeInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Spot Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Spot Info */}
          <View style={styles.spotInfo}>
            <View style={styles.spotHeader}>
              <Text style={styles.spotIcon}>{typeInfo.icon}</Text>
              <View style={styles.spotDetails}>
                <Text style={styles.spotNumber}>Spot {spot.number}</Text>
                <Text style={styles.spotType}>{typeInfo.title}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
            </View>
            <Text style={styles.spotDescription}>{typeInfo.description}</Text>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingCard}>
              <Text style={styles.priceAmount}>₱50</Text>
              <Text style={styles.priceUnit}>per hour</Text>
            </View>
          </View>

          {/* Amenities */}
          {spot.amenities && spot.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                {spot.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>
              {spot.coordinates.latitude.toFixed(6)}, {spot.coordinates.longitude.toFixed(6)}
            </Text>
          </View>

          {/* Availability Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading availability...</Text>
              </View>
            ) : (
              <AvailabilityCalendar
                availability={availability}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowParkNow(true)}
            disabled={spot.status !== 'available'}
          >
            <Text style={styles.secondaryButtonText}>Park Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              spot.status !== 'available' && styles.disabledButton
            ]}
            onPress={() => setShowSpotSelection(true)}
            disabled={spot.status !== 'available'}
          >
            <Text style={styles.primaryButtonText}>
              {spot.status === 'available' ? 'Reserve Parking' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Booking Modals */}
        <SpotSelectionModal
          visible={showSpotSelection}
          spot={spot}
          onClose={() => setShowSpotSelection(false)}
          onSelectTimeSlot={(startTime, endTime) => {
            setSelectedStartTime(startTime);
            setSelectedEndTime(endTime);
            setShowSpotSelection(false);
            setShowBookingFlow(true);
          }}
        />

        <ParkNowModal
          visible={showParkNow}
          spot={spot}
          onClose={() => setShowParkNow(false)}
          onBookingComplete={(bookingId) => {
            setShowParkNow(false);
            onClose();
            onBook(bookingId);
          }}
        />

        {selectedStartTime && selectedEndTime && (
          <BookingFlow
            visible={showBookingFlow}
            spot={spot}
            startTime={selectedStartTime}
            endTime={selectedEndTime}
            onClose={() => {
              setShowBookingFlow(false);
              setSelectedStartTime(null);
              setSelectedEndTime(null);
            }}
            onBookingComplete={(bookingId) => {
              setShowBookingFlow(false);
              setSelectedStartTime(null);
              setSelectedEndTime(null);
              onClose();
              onBook(bookingId);
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  spotInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  spotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  spotDetails: {
    flex: 1,
  },
  spotNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  spotType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  spotDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});