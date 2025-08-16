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
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { parkingSessionService, SessionReassignmentParams } from '../../services/parkingSessionService';

interface SessionReassignmentModalProps {
  visible: boolean;
  session: any;
  onDismiss: () => void;
  onReassigned: () => void;
}

export function SessionReassignmentModal({
  visible,
  session,
  onDismiss,
  onReassigned,
}: SessionReassignmentModalProps) {
  const [availableSpots, setAvailableSpots] = useState<any[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState('');
  const [reason, setReason] = useState('');
  const [additionalFee, setAdditionalFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && session) {
      loadAvailableSpots();
      resetForm();
    }
  }, [visible, session]);

  const resetForm = () => {
    setSelectedSpotId('');
    setReason('');
    setAdditionalFee('');
    setErrors({});
  };

  const loadAvailableSpots = async () => {
    setLoadingSpots(true);
    try {
      const spots = await parkingSessionService.getSpotOccupancy();
      
      // Filter available spots that match the vehicle type
      const compatibleSpots = spots.filter(spot => 
        spot.status === 'available' && 
        (spot.vehicle_type === session?.vehicleType || spot.vehicle_type === 'any') &&
        spot.id !== session?.spotId
      );
      
      setAvailableSpots(compatibleSpots);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load available spots');
    } finally {
      setLoadingSpots(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedSpotId) {
      newErrors.selectedSpotId = 'Please select a new parking spot';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for reassignment';
    }

    if (additionalFee && (isNaN(parseFloat(additionalFee)) || parseFloat(additionalFee) < 0)) {
      newErrors.additionalFee = 'Additional fee must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReassign = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const params: SessionReassignmentParams = {
        sessionId: session.id,
        newSpotId: selectedSpotId,
        reason: reason.trim(),
        additionalFee: additionalFee ? parseFloat(additionalFee) : undefined,
      };

      await parkingSessionService.reassignSession(params);

      Alert.alert(
        'Success',
        'Parking session has been reassigned successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              onReassigned();
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

  const selectedSpot = availableSpots.find(spot => spot.id === selectedSpotId);

  const reasonOptions = [
    { value: 'customer_request', label: 'Customer Request' },
    { value: 'spot_maintenance', label: 'Original Spot Maintenance' },
    { value: 'accessibility_needs', label: 'Accessibility Needs' },
    { value: 'vehicle_size', label: 'Vehicle Size Issue' },
    { value: 'other', label: 'Other' },
  ];

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
              title="Reassign Parking Session"
              subtitle={`Move ${session.vehiclePlateNumber} to a different spot`}
              left={(props) => <MaterialIcons name="swap-horiz" {...props} color="#7C3AED" />}
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
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>{session.vehicleType}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Current Spot:</Text>
                    <Text style={styles.infoValue}>Spot {session.spotId}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Started:</Text>
                    <Text style={styles.infoValue}>
                      {session.startTime?.toLocaleTimeString('en-PH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Available Spots */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select New Spot</Text>
                
                {loadingSpots ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading available spots...</Text>
                  </View>
                ) : availableSpots.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="info" size={24} color="#6B7280" />
                    <Text style={styles.emptyText}>
                      No compatible spots available for {session.vehicleType}
                    </Text>
                  </View>
                ) : (
                  <RadioButton.Group
                    onValueChange={value => {
                      setSelectedSpotId(value);
                      setErrors(prev => ({ ...prev, selectedSpotId: '' }));
                    }}
                    value={selectedSpotId}
                  >
                    {availableSpots.map((spot) => (
                      <View key={spot.id} style={styles.spotOption}>
                        <RadioButton.Item
                          label={`${spot.name} - ${spot.location?.name || 'Unknown Location'}`}
                          value={spot.id}
                          labelStyle={styles.spotLabel}
                          color="#7C3AED"
                        />
                        <Text style={styles.spotDetails}>
                          Vehicle Type: {spot.vehicle_type || 'Any'} • 
                          Zone: {spot.zone?.name || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </RadioButton.Group>
                )}
                
                <HelperText type="error" visible={!!errors.selectedSpotId}>
                  {errors.selectedSpotId}
                </HelperText>
              </View>

              <Divider style={styles.divider} />

              {/* Reason */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reason for Reassignment</Text>
                
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
                    value={reason === 'other' ? reason : ''}
                    onChangeText={(text) => {
                      setReason(text);
                      setErrors(prev => ({ ...prev, reason: '' }));
                    }}
                    mode="outlined"
                    style={styles.input}
                    theme={{ colors: { primary: '#7C3AED' } }}
                    multiline
                    numberOfLines={2}
                  />
                )}

                <HelperText type="error" visible={!!errors.reason}>
                  {errors.reason}
                </HelperText>
              </View>

              <Divider style={styles.divider} />

              {/* Additional Fee */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Fee (Optional)</Text>
                <Text style={styles.sectionSubtitle}>
                  Charge extra fee for spot reassignment if applicable
                </Text>
                
                <TextInput
                  label="Additional Fee"
                  value={additionalFee}
                  onChangeText={(text) => {
                    setAdditionalFee(text);
                    setErrors(prev => ({ ...prev, additionalFee: '' }));
                  }}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  theme={{ colors: { primary: '#7C3AED' } }}
                  left={<TextInput.Icon icon="currency-php" />}
                  error={!!errors.additionalFee}
                />
                <HelperText type="error" visible={!!errors.additionalFee}>
                  {errors.additionalFee}
                </HelperText>
              </View>

              {/* Summary */}
              {selectedSpot && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reassignment Summary</Text>
                    <View style={styles.summaryContainer}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>From:</Text>
                        <Text style={styles.summaryValue}>Current Spot</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>To:</Text>
                        <Text style={styles.summaryValue}>{selectedSpot.name}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Location:</Text>
                        <Text style={styles.summaryValue}>
                          {selectedSpot.location?.name || 'Unknown'}
                        </Text>
                      </View>
                      {additionalFee && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Additional Fee:</Text>
                          <Text style={[styles.summaryValue, styles.feeValue]}>
                            ₱{parseFloat(additionalFee).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}
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
                onPress={handleReassign}
                loading={loading}
                disabled={loading || !selectedSpotId || !reason || availableSpots.length === 0}
                buttonColor="#7C3AED"
                icon="swap-horiz"
              >
                Reassign
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
    backgroundColor: '#F9FAFB',
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  spotOption: {
    marginBottom: 8,
  },
  spotLabel: {
    fontSize: 14,
  },
  spotDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 32,
    marginTop: -4,
  },
  reasonLabel: {
    fontSize: 14,
  },
  input: {
    marginTop: 8,
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
  feeValue: {
    color: '#7C3AED',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});