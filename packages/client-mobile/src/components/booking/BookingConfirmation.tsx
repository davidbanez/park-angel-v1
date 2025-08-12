import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import type { PaymentMethod } from '@park-angel/shared/src/types/payment';
import type { BookingCalculation } from '../../services/bookingService';
import { PaymentService } from '../../services/paymentService';

interface BookingConfirmationProps {
  spot: ParkingSpot;
  startTime: Date;
  endTime: Date;
  paymentMethod: PaymentMethod;
  bookingCalculation: BookingCalculation;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  spot,
  startTime,
  endTime,
  paymentMethod,
  bookingCalculation,
  onConfirm,
  onBack,
  loading,
}) => {
  const getSpotTypeInfo = () => {
    switch (spot.type) {
      case 'hosted':
        return {
          title: 'Hosted Parking',
          icon: '🏠',
        };
      case 'street':
        return {
          title: 'Street Parking',
          icon: '🛣️',
        };
      case 'facility':
        return {
          title: 'Parking Facility',
          icon: '🏢',
        };
      default:
        return {
          title: 'Parking Spot',
          icon: '🅿️',
        };
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getDurationText = () => {
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    }
  };

  const typeInfo = getSpotTypeInfo();
  const startDateTime = formatDateTime(startTime);
  const endDateTime = formatDateTime(endTime);
  const paymentDisplayInfo = PaymentService.getPaymentMethodDisplayInfo(paymentMethod);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Your Booking</Text>
          <Text style={styles.sectionSubtitle}>
            Please review your booking details before confirming.
          </Text>
        </View>

        {/* Parking Spot Details */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Parking Spot</Text>
          <View style={styles.spotCard}>
            <View style={styles.spotHeader}>
              <Text style={styles.spotIcon}>{typeInfo.icon}</Text>
              <View style={styles.spotInfo}>
                <Text style={styles.spotNumber}>Spot {spot.number}</Text>
                <Text style={styles.spotType}>{typeInfo.title}</Text>
              </View>
            </View>
            
            {spot.amenities && spot.amenities.length > 0 && (
              <View style={styles.amenitiesContainer}>
                <Text style={styles.amenitiesTitle}>Amenities:</Text>
                <View style={styles.amenitiesList}>
                  {spot.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Booking Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{startDateTime.date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Time:</Text>
              <Text style={styles.detailValue}>{startDateTime.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Time:</Text>
              <Text style={styles.detailValue}>{endDateTime.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{getDurationText()}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentIcon}>{paymentDisplayInfo.icon}</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>{paymentDisplayInfo.title}</Text>
              <Text style={styles.paymentSubtitle}>{paymentDisplayInfo.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onBack} style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Pricing Breakdown</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Amount:</Text>
              <Text style={styles.pricingValue}>₱{bookingCalculation.baseAmount.toFixed(2)}</Text>
            </View>
            
            {bookingCalculation.discountAmount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discounts:</Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>
                  -₱{bookingCalculation.discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            
            {bookingCalculation.discounts.map((discount, index) => (
              <View key={index} style={styles.discountRow}>
                <Text style={styles.discountLabel}>  • {discount.name}:</Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>
                  -₱{discount.amount.toFixed(2)}
                </Text>
              </View>
            ))}
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>VAT (12%):</Text>
              <Text style={styles.pricingValue}>₱{bookingCalculation.vatAmount.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₱{bookingCalculation.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.section}>
          <View style={styles.termsCard}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              • Cancellation is free up to 1 hour before your booking starts{'\n'}
              • Late arrival may result in spot reassignment{'\n'}
              • Overstaying will incur additional charges{'\n'}
              • Follow all parking facility rules and regulations
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onBack}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
            onPress={onConfirm}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Processing...' : `Pay ₱${bookingCalculation.totalAmount.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  spotCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  spotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spotIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  spotInfo: {
    flex: 1,
  },
  spotNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  spotType: {
    fontSize: 14,
    color: '#6B7280',
  },
  amenitiesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  amenitiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  pricingCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginLeft: 8,
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
  discountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  discountValue: {
    color: '#10B981',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  termsCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
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