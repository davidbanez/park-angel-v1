import React, { useState, useEffect } from 'react';
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
import { BookingService } from '../../services/bookingService';
import { AvailabilityCalendar } from '../map/AvailabilityCalendar';
import { FacilityLayoutViewer } from './FacilityLayoutViewer';

interface SpotSelectionModalProps {
  visible: boolean;
  spot: ParkingSpot;
  onClose: () => void;
  onSelectTimeSlot: (startTime: Date, endTime: Date) => void;
}

export const SpotSelectionModal: React.FC<SpotSelectionModalProps> = ({
  visible,
  spot,
  onClose,
  onSelectTimeSlot,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFacilityLayout, setShowFacilityLayout] = useState(false);

  useEffect(() => {
    if (visible && spot) {
      loadAvailability();
    }
  }, [visible, spot, selectedDate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const availabilityData = await BookingService.getSpotAvailability(
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
  };

  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
  };

  const handleConfirmSelection = () => {
    if (selectedStartTime && selectedEndTime) {
      onSelectTimeSlot(selectedStartTime, selectedEndTime);
      onClose();
    } else {
      Alert.alert('Selection Required', 'Please select a time slot.');
    }
  };

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
          <Text style={styles.headerTitle}>Select Time Slot</Text>
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
            </View>
            <Text style={styles.spotDescription}>{typeInfo.description}</Text>
          </View>

          {/* Facility Layout Button (for facility type) */}
          {spot.type === 'facility' && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.facilityLayoutButton}
                onPress={() => setShowFacilityLayout(true)}
              >
                <Text style={styles.facilityLayoutIcon}>🗺️</Text>
                <View style={styles.facilityLayoutInfo}>
                  <Text style={styles.facilityLayoutTitle}>View Facility Layout</Text>
                  <Text style={styles.facilityLayoutSubtitle}>
                    See the exact location of this parking spot
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.dateSelector}>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  selectedDate.toDateString() === new Date().toDateString() && styles.selectedDateButton
                ]}
                onPress={() => setSelectedDate(new Date())}
              >
                <Text style={[
                  styles.dateButtonText,
                  selectedDate.toDateString() === new Date().toDateString() && styles.selectedDateButtonText
                ]}>
                  Today
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  selectedDate.toDateString() === new Date(Date.now() + 86400000).toDateString() && styles.selectedDateButton
                ]}
                onPress={() => setSelectedDate(new Date(Date.now() + 86400000))}
              >
                <Text style={[
                  styles.dateButtonText,
                  selectedDate.toDateString() === new Date(Date.now() + 86400000).toDateString() && styles.selectedDateButtonText
                ]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading availability...</Text>
              </View>
            ) : (
              <AvailabilityCalendar
                availability={availability}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onTimeSlotSelect={handleTimeSlotSelect}
                selectedStartTime={selectedStartTime}
                selectedEndTime={selectedEndTime}
              />
            )}
          </View>

          {/* Pricing Info */}
          {selectedStartTime && selectedEndTime && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.pricingCard}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Duration:</Text>
                  <Text style={styles.pricingValue}>
                    {Math.ceil((selectedEndTime.getTime() - selectedStartTime.getTime()) / (1000 * 60 * 60))} hours
                  </Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Rate:</Text>
                  <Text style={styles.pricingValue}>₱50/hour</Text>
                </View>
                <View style={[styles.pricingRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    ₱{Math.ceil((selectedEndTime.getTime() - selectedStartTime.getTime()) / (1000 * 60 * 60)) * 50}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (!selectedStartTime || !selectedEndTime) && styles.disabledButton
            ]}
            onPress={handleConfirmSelection}
            disabled={!selectedStartTime || !selectedEndTime}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Facility Layout Modal */}
        <FacilityLayoutViewer
          visible={showFacilityLayout}
          spot={spot}
          onClose={() => setShowFacilityLayout(false)}
        />
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
  facilityLayoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  facilityLayoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  facilityLayoutInfo: {
    flex: 1,
  },
  facilityLayoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  facilityLayoutSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  dateSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedDateButtonText: {
    color: 'white',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
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