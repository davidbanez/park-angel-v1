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
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { BookingConfirmation } from './BookingConfirmation';

interface BookingFlowProps {
  visible: boolean;
  spot: ParkingSpot;
  startTime: Date;
  endTime: Date;
  onClose: () => void;
  onBookingComplete: (bookingId: string) => void;
}

type BookingStep = 'payment_method' | 'confirmation' | 'processing' | 'success';

export const BookingFlow: React.FC<BookingFlowProps> = ({
  visible,
  spot,
  startTime,
  endTime,
  onClose,
  onBookingComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('payment_method');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bookingCalculation, setBookingCalculation] = useState<BookingCalculation | null>(null);
  const [loading, setLoading] = useState(false);


  const { user } = useAuthStore();
  const { setActiveBooking } = useParkingStore();

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
      calculateBookingCost();
    }
  }, [visible, spot, startTime, endTime]);

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

  const calculateBookingCost = async () => {
    try {
      setLoading(true);
      
      // Get user's default vehicle for pricing calculation
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
        [] // No discounts for now - would be added later
      );
      
      setBookingCalculation(calculation);
    } catch (error) {
      console.error('Error calculating booking cost:', error);
      Alert.alert('Error', 'Failed to calculate booking cost.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setCurrentStep('confirmation');
  };

  const handleConfirmBooking = async () => {
    if (!selectedPaymentMethod || !bookingCalculation || !user) {
      Alert.alert('Error', 'Missing required information for booking.');
      return;
    }

    setCurrentStep('processing');
    setLoading(true);

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
        setCurrentStep('confirmation');
        return;
      }

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
        // Direct Park Angel payment
        paymentResult = await PaymentService.processDirectPayment({
          bookingId: booking.id,
          paymentMethodId: selectedPaymentMethod.id,
          amount: bookingCalculation.totalAmount,
          currency: 'PHP'
        });
      } else {
        // External payment gateway
        paymentResult = await PaymentService.processPayment({
          bookingId: booking.id,
          paymentMethodId: selectedPaymentMethod.id,
          amount: bookingCalculation.totalAmount,
          currency: 'PHP'
        });
      }

      if (paymentResult.status === 'succeeded') {
        // Update active booking in store
        setActiveBooking({
          id: booking.id,
          spotId: spot.id,
          startTime,
          endTime,
          status: 'confirmed'
        });

        setCurrentStep('success');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onBookingComplete(booking.id);
          onClose();
        }, 3000);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert(
        'Booking Failed',
        'There was an error processing your booking. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setCurrentStep('confirmation')
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPaymentMethod = () => {
    setCurrentStep('payment_method');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'payment_method':
        return (
          <PaymentMethodSelector
            paymentMethods={paymentMethods}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={handlePaymentMethodSelect}
            onAddPaymentMethod={() => {
              // Would open add payment method flow
              Alert.alert('Add Payment Method', 'This feature will be implemented next.');
            }}
          />
        );

      case 'confirmation':
        return (
          <BookingConfirmation
            spot={spot}
            startTime={startTime}
            endTime={endTime}
            paymentMethod={selectedPaymentMethod!}
            bookingCalculation={bookingCalculation!}
            onConfirm={handleConfirmBooking}
            onBack={handleBackToPaymentMethod}
            loading={loading}
          />
        );

      case 'processing':
        return (
          <View style={styles.processingContainer}>
            <Text style={styles.processingIcon}>⏳</Text>
            <Text style={styles.processingTitle}>Processing Your Booking</Text>
            <Text style={styles.processingText}>
              Please wait while we confirm your parking reservation and process your payment.
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successText}>
              Your parking spot has been reserved. You'll receive a confirmation email shortly.
            </Text>
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingDetailsTitle}>Booking Details</Text>
              <Text style={styles.bookingDetailsText}>
                Spot: {spot.number}
              </Text>
              <Text style={styles.bookingDetailsText}>
                Time: {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}
              </Text>
              <Text style={styles.bookingDetailsText}>
                Date: {startTime.toLocaleDateString()}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'payment_method':
        return 'Select Payment Method';
      case 'confirmation':
        return 'Confirm Booking';
      case 'processing':
        return 'Processing';
      case 'success':
        return 'Booking Confirmed';
      default:
        return 'Book Parking';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={currentStep === 'processing' ? undefined : onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep !== 'processing' && currentStep !== 'success' && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                {
                  width: currentStep === 'payment_method' ? '25%' :
                        currentStep === 'confirmation' ? '50%' :
                        currentStep === 'processing' ? '75%' : '100%'
                }
              ]}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  processingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  bookingDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  bookingDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  bookingDetailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});