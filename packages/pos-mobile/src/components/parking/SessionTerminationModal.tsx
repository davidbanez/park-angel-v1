import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Button,
  TextInput,
  RadioButton,
  HelperText,
  Divider,
  Switch,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { parkingSessionService, ManualTerminationParams } from '../../services/parkingSessionService';

interface SessionTerminationModalProps {
  visible: boolean;
  session: any;
  onDismiss: () => void;
  onTerminated: () => void;
}

export function SessionTerminationModal({
  visible,
  session,
  onDismiss,
  onTerminated,
}: SessionTerminationModalProps) {
  const [endTime, setEndTime] = useState(new Date());
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [hasRefund, setHasRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && session) {
      resetForm();
    }
  }, [visible, session]);

  const resetForm = () => {
    setEndTime(new Date());
    setReason('');
    setCustomReason('');
    setHasRefund(false);
    setRefundAmount('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!reason) {
      newErrors.reason = 'Please select a reason for termination';
    }

    if (reason === 'other' && !customReason.trim()) {
      newErrors.customReason = 'Please specify the reason';
    }

    if (hasRefund) {
      if (!refundAmount || isNaN(parseFloat(refundAmount)) || parseFloat(refundAmount) <= 0) {
        newErrors.refundAmount = 'Please enter a valid refund amount';
      } else if (parseFloat(refundAmount) > session.totalAmount) {
        newErrors.refundAmount = 'Refund amount cannot exceed the original payment';
      }
    }

    // Check if end time is after start time
    if (endTime <= new Date(session.startTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateActualDuration = (): number => {
    const startTime = new Date(session.startTime);
    const diffMs = endTime.getTime() - startTime.getTime();
    return Math.ceil(diffMs / (1000 * 60)); // Convert to minutes
  };

  const calculateRefundSuggestion = (): number => {
    if (!session.endTime) return 0;

    const originalEndTime = new Date(session.endTime);
    const actualEndTime = endTime;
    
    if (actualEndTime >= originalEndTime) return 0;

    // Calculate unused time in minutes
    const unusedMs = originalEndTime.getTime() - actualEndTime.getTime();
    const unusedMinutes = Math.floor(unusedMs / (1000 * 60));
    
    // Calculate refund based on unused time
    const totalMinutes = session.duration || 60;
    const refundRatio = unusedMinutes / totalMinutes;
    
    return Math.round(session.totalAmount * refundRatio * 100) / 100;
  };

  const handleTerminate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const finalReason = reason === 'other' ? customReason.trim() : reason;
      
      const params: ManualTerminationParams = {
        sessionId: session.id,
        endTime,
        reason: finalReason,
        refundAmount: hasRefund ? parseFloat(refundAmount) : undefined,
      };

      await parkingSessionService.terminateSession(params);

      Alert.alert(
        'Success',
        `Parking session terminated successfully${hasRefund ? `\nRefund: ₱${parseFloat(refundAmount).toFixed(2)}` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onTerminated();
              onDismiss();
            }
          }
        ]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const reasonOptions = [
    { value: 'customer_request', label: 'Customer Request' },
    { value: 'early_departure', label: 'Early Departure' },
    { value: 'vehicle_issue', label: 'Vehicle Issue' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'spot_needed', label: 'Spot Needed for Maintenance' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'other', label: 'Other' },
  ];

  const suggestedRefund = calculateRefundSuggestion();
  const actualDuration = calculateActualDuration();

  if (!session) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Card.Title
              title="Terminate Parking Session"
              subtitle={`End session for ${session.vehiclePlateNumber}`}
              left={(props) => <MaterialIcons name="stop" {...props} color="#EF4444" />}
            />
            
            <Card.Content>
              {/* Current Session Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Session</Text>
                <View style={styles.sessionInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Vehicle:</Text>
                    <Text style={styles.infoValue}>{session.vehiclePlateNumber}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Started:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(session.startTime).toLocaleString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  {session.endTime && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Scheduled End:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(session.endTime).toLocaleString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Amount Paid:</Text>
                    <Text style={styles.infoValue}>₱{session.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* End Time */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Termination Time</Text>
                <Text style={styles.sectionSubtitle}>
                  Current time: {endTime.toLocaleString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                
                <View style={styles.durationInfo}>
                  <Text style={styles.durationLabel}>Actual Duration:</Text>
                  <Text style={styles.durationValue}>
                    {Math.floor(actualDuration / 60)}h {actualDuration % 60}m
                  </Text>
                </View>

                <Button
                  mode="outlined"
                  onPress={() => setEndTime(new Date())}
                  style={styles.updateTimeButton}
                  textColor="#7C3AED"
                  icon="update"
                >
                  Update to Current Time
                </Button>

                <HelperText type="error" visible={!!errors.endTime}>
                  {errors.endTime}
                </HelperText>
              </View>

              <Divider style={styles.divider} />

              {/* Reason */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reason for Termination</Text>
                
                <RadioButton.Group
                  onValueChange={value => {
                    setReason(value);
                    setErrors(prev => ({ ...prev, reason: '' }));
                  }}
                  value={reason}
                >
                  {reasonOptions.map((option) => (
                    <RadioButton.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      labelStyle={styles.reasonLabel}
                      color="#7C3AED"
                    />
                  ))}
                </RadioButton.Group>

                {reason === 'other' && (
                  <TextInput
                    label="Please specify"
                    value={customReason}
                    onChangeText={(text) => {
                      setCustomReason(text);
                      setErrors(prev => ({ ...prev, customReason: '' }));
                    }}
                    mode="outlined"
                    style={styles.input}
                    theme={{ colors: { primary: '#7C3AED' } }}
                    multiline
                    numberOfLines={2}
                    error={!!errors.customReason}
                  />
                )}

                <HelperText type="error" visible={!!errors.reason || !!errors.customReason}>
                  {errors.reason || errors.customReason}
                </HelperText>
              </View>

              <Divider style={styles.divider} />

              {/* Refund Section */}
              <View style={styles.section}>
                <View style={styles.refundHeader}>
                  <View style={styles.refundInfo}>
                    <Text style={styles.sectionTitle}>Refund</Text>
                    <Text style={styles.sectionSubtitle}>
                      Issue refund for unused time
                    </Text>
                  </View>
                  <Switch
                    value={hasRefund}
                    onValueChange={setHasRefund}
                    color="#7C3AED"
                  />
                </View>

                {hasRefund && (
                  <>
                    {suggestedRefund > 0 && (
                      <View style={styles.suggestionContainer}>
                        <Text style={styles.suggestionLabel}>Suggested Refund:</Text>
                        <Text style={styles.suggestionValue}>₱{suggestedRefund.toFixed(2)}</Text>
                        <Button
                          mode="outlined"
                          onPress={() => setRefundAmount(suggestedRefund.toString())}
                          style={styles.useSuggestionButton}
                          textColor="#7C3AED"
                          compact
                        >
                          Use
                        </Button>
                      </View>
                    )}

                    <TextInput
                      label="Refund Amount"
                      value={refundAmount}
                      onChangeText={(text) => {
                        setRefundAmount(text);
                        setErrors(prev => ({ ...prev, refundAmount: '' }));
                      }}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      theme={{ colors: { primary: '#7C3AED' } }}
                      left={<TextInput.Icon icon="currency-php" />}
                      error={!!errors.refundAmount}
                    />
                    <HelperText type="error" visible={!!errors.refundAmount}>
                      {errors.refundAmount}
                    </HelperText>
                  </>
                )}
              </View>

              {/* Summary */}
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Termination Summary</Text>
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Vehicle:</Text>
                    <Text style={styles.summaryValue}>{session.vehiclePlateNumber}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Actual Duration:</Text>
                    <Text style={styles.summaryValue}>
                      {Math.floor(actualDuration / 60)}h {actualDuration % 60}m
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Original Payment:</Text>
                    <Text style={styles.summaryValue}>₱{session.totalAmount.toFixed(2)}</Text>
                  </View>
                  {hasRefund && refundAmount && (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Refund:</Text>
                        <Text style={[styles.summaryValue, styles.refundValue]}>
                          -₱{parseFloat(refundAmount).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, styles.finalLabel]}>Final Amount:</Text>
                        <Text style={[styles.summaryValue, styles.finalValue]}>
                          ₱{(session.totalAmount - parseFloat(refundAmount)).toFixed(2)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </Card.Content>

            <Card.Actions style={styles.actions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                disabled={loading}
                textColor="#7C3AED"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleTerminate}
                loading={loading}
                disabled={loading || !reason}
                buttonColor="#EF4444"
                icon="stop"
              >
                Terminate Session
              </Button>
            </Card.Actions>
          </Card>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    maxHeight: '90%',
  },
  card: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  sessionInfo: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    marginVertical: 16,
  },
  durationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: 14,
    color: '#059669',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  updateTimeButton: {
    borderColor: '#7C3AED',
  },
  reasonLabel: {
    fontSize: 14,
  },
  input: {
    marginTop: 8,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundInfo: {
    flex: 1,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionLabel: {
    fontSize: 14,
    color: '#059669',
    flex: 1,
  },
  suggestionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginRight: 12,
  },
  useSuggestionButton: {
    borderColor: '#059669',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  refundValue: {
    color: '#EF4444',
  },
  finalLabel: {
    fontWeight: '600',
    color: '#374151',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  finalValue: {
    fontWeight: '600',
    color: '#7C3AED',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});