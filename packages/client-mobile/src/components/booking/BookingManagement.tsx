import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import type { Booking } from '@park-angel/shared/src/types/booking';
import type { PaymentMethod } from '@park-angel/shared/src/types/payment';
import { BookingService } from '../../services/bookingService';
import { PaymentService } from '../../services/paymentService';
import { useParkingStore } from '../../stores/parkingStore';

interface BookingManagementProps {
  booking: Booking;
  onBookingUpdated: (booking: Booking) => void;
  onBookingCancelled: () => void;
  onNavigateToSpot?: (spotId: string) => void;
}

export const BookingManagement: React.FC<BookingManagementProps> = ({
  booking,
  onBookingUpdated,
  onBookingCancelled,
  onNavigateToSpot,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showExtensionOptions, setShowExtensionOptions] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [extending, setExtending] = useState(false);

  const { setActiveBooking } = useParkingStore();

  useEffect(() => {
    const interval = setInterval(updateTimeRemaining, 1000);
    loadPaymentMethods();
    return () => clearInterval(interval);
  }, [booking]);

  const updateTimeRemaining = () => {
    const now = new Date();
    const endTime = new Date(booking.endTime);
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expired');
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await PaymentService.getPaymentMethods();
      setPaymentMethods(methods);
      
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleExtendBooking = async (additionalHours: number) => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method.');
      return;
    }

    setExtending(true);

    try {
      const currentEndTime = new Date(booking.endTime);
      const newEndTime = new Date(currentEndTime.getTime() + additionalHours * 60 * 60 * 1000);

      // Check if spot is available for extension
      const isAvailable = await BookingService.isSpotAvailable(
        booking.spotId,
        currentEndTime,
        newEndTime
      );

      if (!isAvailable) {
        Alert.alert(
          'Extension Not Available',
          'This parking spot is not available for the requested extension time.'
        );
        return;
      }

      // Extend booking
      const updatedBooking = await BookingService.extendBooking({
        bookingId: booking.id,
        newEndTime,
        paymentMethodId: selectedPaymentMethod.id
      });

      // Process payment for extension
      const extensionCost = updatedBooking.totalAmount - booking.totalAmount;
      
      let paymentResult;
      if (selectedPaymentMethod.provider === 'park_angel') {
        paymentResult = await PaymentService.processDirectPayment({
          bookingId: booking.id,
          paymentMethodId: selectedPaymentMethod.id,
          amount: extensionCost,
          currency: 'PHP'
        });
      } else {
        paymentResult = await PaymentService.processPayment({
          bookingId: booking.id,
          paymentMethodId: selectedPaymentMethod.id,
          amount: extensionCost,
          currency: 'PHP'
        });
      }

      if (paymentResult.status === 'succeeded') {
        // Update active booking in store
        setActiveBooking({
          id: updatedBooking.id,
          spotId: updatedBooking.spotId,
          startTime: new Date(updatedBooking.startTime),
          endTime: new Date(updatedBooking.endTime),
          status: updatedBooking.status
        });

        onBookingUpdated(updatedBooking);
        setShowExtensionOptions(false);

        Alert.alert(
          'Booking Extended',
          `Your parking session has been extended until ${newEndTime.toLocaleTimeString()}.`
        );
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error extending booking:', error);
      Alert.alert('Error', 'Failed to extend booking. Please try again.');
    } finally {
      setExtending(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await BookingService.cancelBooking(booking.id, 'Cancelled by user');
              setActiveBooking(null);
              onBookingCancelled();
              
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCompleteSession = () => {
    Alert.alert(
      'Complete Session',
      'Are you sure you want to end your parking session now?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await BookingService.completeParkingSession(booking.id);
              setActiveBooking(null);
              onBookingCancelled(); // This will refresh the parent component
              
              Alert.alert('Session Completed', 'Your parking session has been completed.');
            } catch (error) {
              console.error('Error completing session:', error);
              Alert.alert('Error', 'Failed to complete session. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = () => {
    switch (booking.status) {
      case 'active':
        return '#10B981';
      case 'confirmed':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (booking.status) {
      case 'active':
        return 'Active';
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      default:
        return booking.status;
    }
  };

  const isExpiringSoon = () => {
    const now = new Date();
    const endTime = new Date(booking.endTime);
    const diff = endTime.getTime() - now.getTime();
    return diff <= 30 * 60 * 1000; // 30 minutes
  };

  const extensionOptions = [1, 2, 3, 4];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Text style={styles.spotNumber}>Spot {booking.spot?.number}</Text>
        </View>
        <View style={styles.timeInfo}>
          <Text style={[
            styles.timeRemaining,
            isExpiringSoon() && styles.timeRemainingWarning
          ]}>
            {timeRemaining}
          </Text>
          <Text style={styles.timeLabel}>remaining</Text>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {booking.spot?.zone?.section?.location?.name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Time:</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.startTime).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End Time:</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.endTime).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle:</Text>
            <Text style={styles.detailValue}>
              {booking.vehicle?.plateNumber} ({booking.vehicle?.type})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid:</Text>
            <Text style={styles.detailValue}>₱{booking.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Extension Options */}
      {booking.status === 'active' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.extendButton}
            onPress={() => setShowExtensionOptions(!showExtensionOptions)}
          >
            <Text style={styles.extendButtonIcon}>⏰</Text>
            <Text style={styles.extendButtonText}>Extend Parking Time</Text>
            <Text style={styles.chevron}>{showExtensionOptions ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showExtensionOptions && (
            <View style={styles.extensionOptions}>
              <Text style={styles.extensionTitle}>Extend by:</Text>
              <View style={styles.extensionGrid}>
                {extensionOptions.map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={styles.extensionOptionButton}
                    onPress={() => handleExtendBooking(hours)}
                    disabled={extending}
                  >
                    <Text style={styles.extensionOptionText}>
                      +{hours} hour{hours > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.extensionOptionPrice}>
                      ₱{(hours * 50).toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Method for Extension */}
              {paymentMethods.length > 0 && (
                <View style={styles.extensionPayment}>
                  <Text style={styles.extensionPaymentTitle}>Payment Method:</Text>
                  <View style={styles.paymentMethodsList}>
                    {paymentMethods.slice(0, 2).map((method) => {
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
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Navigation Button */}
        {(booking.status === 'confirmed' || booking.status === 'active') && onNavigateToSpot && (
          <TouchableOpacity
            style={[styles.button, styles.navigationButton]}
            onPress={() => onNavigateToSpot(booking.spotId)}
          >
            <Text style={styles.navigationButtonIcon}>🧭</Text>
            <Text style={styles.navigationButtonText}>Navigate to Spot</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'active' && (
          <TouchableOpacity
            style={[styles.button, styles.completeButton]}
            onPress={handleCompleteSession}
          >
            <Text style={styles.completeButtonText}>Complete Session</Text>
          </TouchableOpacity>
        )}
        
        {(booking.status === 'confirmed' || booking.status === 'pending') && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancelBooking}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Warning for Expiring Soon */}
      {isExpiringSoon() && booking.status === 'active' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Session Expiring Soon</Text>
            <Text style={styles.warningText}>
              Your parking session will end in less than 30 minutes. Consider extending your time to avoid overstay charges.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  spotNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeRemaining: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  timeRemainingWarning: {
    color: '#EF4444',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
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
    flex: 1,
    textAlign: 'right',
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    padding: 16,
  },
  extendButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  extendButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  chevron: {
    fontSize: 16,
    color: '#7C3AED',
  },
  extensionOptions: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  extensionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  extensionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  extensionOptionButton: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  extensionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  extensionOptionPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  extensionPayment: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  extensionPaymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  paymentMethodsList: {
    gap: 8,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  selectedPaymentMethodCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F0FF',
  },
  paymentMethodIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  navigationButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});