import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { PaymentMethod } from '@park-angel/shared/src/types/payment';
import { PaymentService } from '../../services/paymentService';

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | null;
  onSelectPaymentMethod: (paymentMethod: PaymentMethod) => void;
  onAddPaymentMethod: () => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onAddPaymentMethod,
}) => {
  const renderPaymentMethod = (paymentMethod: PaymentMethod) => {
    const displayInfo = PaymentService.getPaymentMethodDisplayInfo(paymentMethod);
    const isSelected = selectedPaymentMethod?.id === paymentMethod.id;

    return (
      <TouchableOpacity
        key={paymentMethod.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.selectedPaymentMethodCard
        ]}
        onPress={() => onSelectPaymentMethod(paymentMethod)}
      >
        <View style={styles.paymentMethodContent}>
          <Text style={styles.paymentMethodIcon}>{displayInfo.icon}</Text>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodTitle}>{displayInfo.title}</Text>
            <Text style={styles.paymentMethodSubtitle}>{displayInfo.subtitle}</Text>
            {paymentMethod.isDefault && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
          <View style={[
            styles.radioButton,
            isSelected && styles.selectedRadioButton
          ]}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <Text style={styles.sectionSubtitle}>
            Select how you'd like to pay for your parking reservation.
          </Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          {paymentMethods.length > 0 ? (
            <View style={styles.paymentMethodsList}>
              {paymentMethods.map(renderPaymentMethod)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💳</Text>
              <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
              <Text style={styles.emptyStateText}>
                Add a payment method to continue with your booking.
              </Text>
            </View>
          )}
        </View>

        {/* Add Payment Method */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addPaymentMethodButton}
            onPress={onAddPaymentMethod}
          >
            <Text style={styles.addPaymentMethodIcon}>+</Text>
            <Text style={styles.addPaymentMethodText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Direct Payment Option */}
        <View style={styles.section}>
          <View style={styles.directPaymentCard}>
            <Text style={styles.directPaymentIcon}>🅿️</Text>
            <View style={styles.directPaymentInfo}>
              <Text style={styles.directPaymentTitle}>Park Angel Direct Payment</Text>
              <Text style={styles.directPaymentSubtitle}>
                Pay directly to Park Angel without external payment gateways
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedPaymentMethod && styles.disabledButton
            ]}
            onPress={() => selectedPaymentMethod && onSelectPaymentMethod(selectedPaymentMethod)}
            disabled={!selectedPaymentMethod}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  selectedPaymentMethodCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F9FAFB',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  defaultBadge: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#8B5CF6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  addPaymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  addPaymentMethodIcon: {
    fontSize: 20,
    color: '#6B7280',
    marginRight: 8,
  },
  addPaymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  directPaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    padding: 16,
  },
  directPaymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  directPaymentInfo: {
    flex: 1,
  },
  directPaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 2,
  },
  directPaymentSubtitle: {
    fontSize: 14,
    color: '#6D28D9',
    lineHeight: 18,
  },
  actionSection: {
    marginTop: 16,
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});