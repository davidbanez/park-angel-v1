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
import { supabase } from '@park-angel/shared/src/lib/supabase';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import type { PaymentMethod } from '@park-angel/shared/src/types/payment';
import { BookingService, BookingCalculation } from '../../services/bookingService';
import { PaymentService } from '../../services/paymentService';
import { useAuthStore } from '../../stores/authStore';
import { useParkingStore } from '../../stores/parkingStore';

interface ParkNowModalProps {
  visible: boolean;
  spot: ParkingSpot;
  onClose: () => void;
  onBookingComplete: (bookingId: string) => void;
}

export const ParkNowModal: React.FC<ParkNowModalProps> = ({
  visible,
  spot,
  onClose,
  onBookingComplete,
}) => {
  const [duration, setDuration] = useState(2); // Default 2 hours
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [bookingCalculation, setBookingCalculation] = useState<BookingCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { user } = useAuthStore();
  const { setActiveBooking } = useParkingStore();

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
      calculateCost();
    }
  }, [visible, duration]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await PaymentService.getPaymentMethods();
      setPaymentMethods(methods);
      
      // Auto-select default payment method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const calculateCost = async () => {
    try {
      setLoading(true);
      
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      // Get user's default vehicle
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('userId', user?.id)
        .eq('isDefault', true)
        .single();

      const vehicleType = vehicles?.type || 'car';
      
      const calculation = await BookingService.calculateBookingCost(
        spot.id,
        startTime,
        endTime,
        vehicleType,
        []
      );
      
      setBookingCalculation(calculation);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParkNow = async () => {
    if (!selectedPaymentMethod || !bookingCalculation || !user) {
      Alert.alert('Error', 'Please select a payment method.');
      return;
    }

    setProcessing(true);

    try {
      // Get user's default vehicle
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('userId', user.id)
        .eq('isDefault', true)
        .single();

      if (!vehicles) {
        Alert.alert('Error', 'Please add a vehicle to your profile first.');
        return;
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

      // Create booking
      const booking = await BookingService.createBooking({
        spotId: spot.id,
        vehicleId: vehicles.id,
        startTime,
        endTime,
        paymentMethodId: selectedPaymentMethod.id,
        discounts: bookingCalculation.discounts
      });

      // Process payment
      let paymentResult;
      if (selectedPaymentMethod.provider === 'park_angel') {
        paymentResult = await PaymentService.processDirectPayment({
          bookingId: booking.id,
          paymentMethodId: selectedPaymentMethod.id,
          amount: bookingCalculation.totalAmount,
          currency: 'PHP'
        });
      } else {
        paymentResult = await PaymentService.processPayment({
          bookingId: booking.id,
          paymentMethodId: selectedPaymentMethod.id,
          amount: bookingCalculation.totalAmount,
          currency: 'PHP'
        });
      }

      if (paymentResult.status === 'succeeded') {
        // Start parking session immediately
        await BookingService.startParkingSession(booking.id);

        // Update active booking in store
        setActiveBooking({
          id: booking.id,
          spotId: spot.id,
          startTime,
          endTime,
          status: 'active'
        });

        Alert.alert(
          'Parking Started!',
          `You can now park at Spot ${spot.number}. Your session will end at ${endTime.toLocaleTimeString()}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onBookingComplete(booking.id);
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error starting parking:', error);
      Alert.alert('Error', 'Failed to start parking session. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const durationOptions = [1, 2, 3, 4, 6, 8, 12];

  const getSpotTypeInfo = () => {
    switch (spot.type) {
      case 'hosted':
        return { title: 'Hosted Parking', icon: '🏠' };
      case 'street':
        return { title: 'Street Parking', icon: '🛣️' };
      case 'facility':
        return { title: 'Parking Facility', icon: '🏢' };
      default:
        return { title: 'Parking Spot', icon: '🅿️' };
    }
  };

  const typeInfo = getSpotTypeInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={processing ? undefined : onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {!processing && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Park Now</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Spot Info */}
          <View style={styles.section}>
            <View style={styles.spotCard}>
              <View style={styles.spotHeader}>
                <Text style={styles.spotIcon}>{typeInfo.icon}</Text>
                <View style={styles.spotInfo}>
                  <Text style={styles.spotNumber}>Spot {spot.number}</Text>
                  <Text style={styles.spotType}>{typeInfo.title}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How long will you park?</Text>
            <View style={styles.durationGrid}>
              {durationOptions.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.durationButton,
                    duration === hours && styles.selectedDurationButton
                  ]}
                  onPress={() => setDuration(hours)}
                >
                  <Text style={[
                    styles.durationButtonText,
                    duration === hours && styles.selectedDurationButtonText
                  ]}>
                    {hours} hour{hours > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {paymentMethods.length > 0 ? (
              <View style={styles.paymentMethodsList}>
                {paymentMethods.map((method) => {
                  const displayInfo = PaymentService.getPaymentMethodDisplayInfo(method);
                  const isSelected = selectedPaymentMethod?.id === method.id;
                  
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodCard,
                        isSelected && styles.selectedPaymentMethodCard
                      ]}
                      onPress={() => setSelectedPaymentMethod(method)}
                    >
                      <Text style={styles.paymentMethodIcon}>{displayInfo.icon}</Text>
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodTitle}>{displayInfo.title}</Text>
                        <Text style={styles.paymentMethodSubtitle}>{displayInfo.subtitle}</Text>
                      </View>
                      <View style={[
                        styles.radioButton,
                        isSelected && styles.selectedRadioButton
                      ]}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyPaymentMethods}>
                <Text style={styles.emptyPaymentMethodsText}>
                  No payment methods available. Please add a payment method first.
                </Text>
              </View>
            )}
          </View>

          {/* Pricing */}
          {bookingCalculation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.pricingCard}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Duration:</Text>
                  <Text style={styles.pricingValue}>{duration} hour{duration > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Rate:</Text>
                  <Text style={styles.pricingValue}>₱{(bookingCalculation.baseAmount / duration).toFixed(0)}/hour</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Subtotal:</Text>
                  <Text style={styles.pricingValue}>₱{bookingCalculation.baseAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>VAT (12%):</Text>
                  <Text style={styles.pricingValue}>₱{bookingCalculation.vatAmount.toFixed(2)}</Text>
                </View>
                <View style={[styles.pricingRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>₱{bookingCalculation.totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Session Info */}
          <View style={styles.section}>
            <View style={styles.sessionInfoCard}>
              <Text style={styles.sessionInfoTitle}>⏰ Session Details</Text>
              <Text style={styles.sessionInfoText}>
                Your parking session will start immediately and end at{' '}
                {new Date(Date.now() + duration * 60 * 60 * 1000).toLocaleTimeString()}.
              </Text>
              <Text style={styles.sessionInfoText}>
                You can extend your session from the active booking screen.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.parkNowButton,
              (!selectedPaymentMethod || !bookingCalculation || processing) && styles.disabledButton
            ]}
            onPress={handleParkNow}
            disabled={!selectedPaymentMethod || !bookingCalculation || processing}
          >
            <Text style={styles.parkNowButtonText}>
              {processing 
                ? 'Starting Parking...' 
                : bookingCalculation 
                  ? `Park Now - ₱${bookingCalculation.totalAmount.toFixed(2)}`
                  : 'Park Now'
              }
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
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
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDurationButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedDurationButtonText: {
    color: 'white',
  },
  paymentMethodsList: {
    gap: 8,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  selectedPaymentMethodCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F9FAFB',
  },
  paymentMethodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#8B5CF6',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  emptyPaymentMethods: {
    padding: 16,
    alignItems: 'center',
  },
  emptyPaymentMethodsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: '#F9FAFB',
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
    fontWeight: '500',
    color: '#111827',
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
  sessionInfoCard: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    padding: 16,
  },
  sessionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#6D28D9',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  parkNowButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  parkNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});