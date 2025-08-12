import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useParkingStore } from '../../stores/parkingStore';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const { filters, updateFilters, clearFilters } = useParkingStore();
  const [tempFilters, setTempFilters] = useState(filters);

  const parkingTypes = [
    { key: 'hosted', label: 'Hosted Parking', icon: '🏠', description: 'Private spaces' },
    { key: 'street', label: 'Street Parking', icon: '🛣️', description: 'On-street spots' },
    { key: 'facility', label: 'Parking Facility', icon: '🏢', description: 'Garages & lots' },
  ] as const;

  const priceRanges = [
    { label: 'Under ₱25/hr', value: 25 },
    { label: 'Under ₱50/hr', value: 50 },
    { label: 'Under ₱100/hr', value: 100 },
    { label: 'Under ₱200/hr', value: 200 },
    { label: 'Any price', value: 1000 },
  ];

  const amenities = [
    'Covered',
    'Security',
    'CCTV',
    'Well-lit',
    'EV Charging',
    'Valet',
    '24/7 Access',
    'Wheelchair Accessible',
    'Car Wash',
    'Restroom',
  ];

  const handleTypeToggle = (type: 'hosted' | 'street' | 'facility') => {
    const currentTypes = tempFilters.type;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setTempFilters({ ...tempFilters, type: newTypes });
  };

  const handlePriceChange = (maxPrice: number) => {
    setTempFilters({ ...tempFilters, maxPrice });
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = tempFilters.amenities;
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setTempFilters({ ...tempFilters, amenities: newAmenities });
  };

  const handleApply = () => {
    updateFilters(tempFilters);
    onApply();
    onClose();
  };

  const handleClear = () => {
    clearFilters();
    setTempFilters({
      type: ['hosted', 'street', 'facility'],
      maxPrice: 1000,
      amenities: [],
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (tempFilters.type.length < 3) count++;
    if (tempFilters.maxPrice < 1000) count++;
    if (tempFilters.amenities.length > 0) count++;
    return count;
  };

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
          <Text style={styles.headerTitle}>Filter Parking</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Parking Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parking Type</Text>
            {parkingTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={styles.typeOption}
                onPress={() => handleTypeToggle(type.key)}
              >
                <View style={styles.typeInfo}>
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <View style={styles.typeDetails}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                </View>
                <Switch
                  value={tempFilters.type.includes(type.key)}
                  onValueChange={() => handleTypeToggle(type.key)}
                  trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                  thumbColor={tempFilters.type.includes(type.key) ? '#8B5CF6' : '#F3F4F6'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum Price</Text>
            {priceRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.priceOption,
                  tempFilters.maxPrice === range.value && styles.selectedOption
                ]}
                onPress={() => handlePriceChange(range.value)}
              >
                <Text style={[
                  styles.priceLabel,
                  tempFilters.maxPrice === range.value && styles.selectedOptionText
                ]}>
                  {range.label}
                </Text>
                {tempFilters.maxPrice === range.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.amenityTag,
                    tempFilters.amenities.includes(amenity) && styles.selectedAmenity
                  ]}
                  onPress={() => handleAmenityToggle(amenity)}
                >
                  <Text style={[
                    styles.amenityText,
                    tempFilters.amenities.includes(amenity) && styles.selectedAmenityText
                  ]}>
                    {amenity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
            style={[styles.button, styles.primaryButton]}
            onPress={handleApply}
          >
            <Text style={styles.primaryButtonText}>
              Apply Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeDetails: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#EDE9FE',
  },
  priceLabel: {
    fontSize: 16,
    color: '#111827',
  },
  selectedOptionText: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAmenity: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  amenityText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedAmenityText: {
    color: '#7C3AED',
    fontWeight: '500',
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