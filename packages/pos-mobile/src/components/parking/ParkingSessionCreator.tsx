import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Button,
  TextInput,
  Chip,
  Divider,
  Switch,
  HelperText,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LicensePlateService } from '../../services/licensePlateService';
import { parkingSessionService, CreateParkingSessionParams } from '../../services/parkingSessionService';
import { AppliedDiscount } from '../../types/pos';

interface ParkingSessionCreatorProps {
  visible: boolean;
  onDismiss: () => void;
  onSessionCreated: (session: any) => void;
}

export function ParkingSessionCreator({
  visible,
  onDismiss,
  onSessionCreated,
}: ParkingSessionCreatorProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle' | 'truck' | 'van'>('car');
  const [duration, setDuration] = useState('60'); // in minutes
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital_wallet'>('cash');
  const [notes, setNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Discount states
  const [hasSeniorDiscount, setHasSeniorDiscount] = useState(false);
  const [hasPWDDiscount, setHasPWDDiscount] = useState(false);
  const [seniorIdNumber, setSeniorIdNumber] = useState('');
  const [pwdIdNumber, setPwdIdNumber] = useState('');
  
  // Payment states
  const [cashReceived, setCashReceived] = useState('');
  const [cardDetails, setCardDetails] = useState({
    last4: '',
    brand: '',
    transactionId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setPlateNumber('');
    setVehicleType('car');
    setDuration('60');
    setPaymentMethod('cash');
    setNotes('');
    setHasSeniorDiscount(false);
    setHasPWDDiscount(false);
    setSeniorIdNumber('');
    setPwdIdNumber('');
    setCashReceived('');
    setCardDetails({ last4: '', brand: '', transactionId: '' });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!plateNumber.trim()) {
      newErrors.plateNumber = 'License plate number is required';
    }

    if (!duration || parseInt(duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    if (hasSeniorDiscount && !seniorIdNumber.trim()) {
      newErrors.seniorIdNumber = 'Senior Citizen ID is required';
    }

    if (hasPWDDiscount && !pwdIdNumber.trim()) {
      newErrors.pwdIdNumber = 'PWD ID is required';
    }

    if (paymentMethod === 'cash' && cashReceived && parseFloat(cashReceived) < calculateTotal()) {
      newErrors.cashReceived = 'Cash received must be at least the total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScanPlate = async () => {
    setIsScanning(true);
    try {
      const result = await LicensePlateService.getInstance().captureAndScan();
      if (result) {
        setPlateNumber(result.plateNumber);
        setErrors(prev => ({ ...prev, plateNumber: '' }));
      }
    } catch (error: any) {
      Alert.alert('Scan Error', error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const calculateDiscounts = (): AppliedDiscount[] => {
    const discounts: AppliedDiscount[] = [];

    if (hasSeniorDiscount) {
      discounts.push({
        type: 'senior',
        name: 'Senior Citizen Discount',
        percentage: 20,
        amount: 0, // Will be calculated by service
        isVATExempt: true,
        documentNumber: seniorIdNumber
      });
    }

    if (hasPWDDiscount) {
      discounts.push({
        type: 'pwd',
        name: 'PWD Discount',
        percentage: 20,
        amount: 0, // Will be calculated by service
        isVATExempt: true,
        documentNumber: pwdIdNumber
      });
    }

    return discounts;
  };

  const calculateTotal = (): number => {
    // Simplified calculation - actual calculation done by service
    const baseRate = vehicleType === 'motorcycle' ? 25 : 50; // per hour
    const hours = parseInt(duration) / 60;
    let subtotal = baseRate * hours;

    // Apply discounts
    if (hasSeniorDiscount) subtotal *= 0.8;
    if (hasPWDDiscount) subtotal *= 0.8;

    // Add VAT if not exempt
    const isVATExempt = hasSeniorDiscount || hasPWDDiscount;
    const vat = isVATExempt ? 0 : subtotal * 0.12;

    return Math.round((subtotal + vat) * 100) / 100;
  };

  const handleCreateSession = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const discounts = calculateDiscounts();
      
      const params: CreateParkingSessionParams = {
        vehiclePlateNumber: plateNumber.trim().toUpperCase(),
        vehicleType,
        duration: parseInt(duration),
        paymentMethod,
        discounts,
        notes: notes.trim() || undefined
      };

      const session = await parkingSessionService.createParkingSession(params);

      // Process payment
      const paymentParams = {
        amount: session.totalAmount,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
        cardDetails: paymentMethod === 'card' ? cardDetails : undefined
      };

      const paymentResult = await parkingSessionService.processPayment(session.id, paymentParams);

      if (paymentResult.success) {
        Alert.alert(
          'Success',
          `Parking session created successfully!\n${paymentResult.changeAmount ? `Change: ₱${paymentResult.changeAmount.toFixed(2)}` : ''}`,
          [
            {
              text: 'Print Receipt',
              onPress: () => {
                // Handle receipt printing
                console.log('Print receipt:', paymentResult.receiptData);
              }
            },
            {
              text: 'OK',
              onPress: () => {
                onSessionCreated(session);
                onDismiss();
              }
            }
          ]
        );
      }

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { key: 'motorcycle', label: 'Motorcycle', icon: 'motorcycle' },
    { key: 'car', label: 'Car', icon: 'directions-car' },
    { key: 'van', label: 'Van', icon: 'airport-shuttle' },
    { key: 'truck', label: 'Truck', icon: 'local-shipping' },
  ] as const;

  const paymentMethods = [
    { key: 'cash', label: 'Cash', icon: 'payments' },
    { key: 'card', label: 'Card', icon: 'credit-card' },
    { key: 'digital_wallet', label: 'Digital Wallet', icon: 'account-balance-wallet' },
  ] as const;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card style={styles.card}>
              <Card.Title
                title="New Parking Session"
                subtitle="Create session for walk-in customer"
                left={(props) => <MaterialIcons name="local-parking" {...props} color="#7C3AED" />}
              />
              
              <Card.Content>
                {/* License Plate Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                  
                  <TextInput
                    label="License Plate Number"
                    value={plateNumber}
                    onChangeText={(text) => {
                      setPlateNumber(text.toUpperCase());
                      setErrors(prev => ({ ...prev, plateNumber: '' }));
                    }}
                    mode="outlined"
                    style={styles.input}
                    theme={{ colors: { primary: '#7C3AED' } }}
                    error={!!errors.plateNumber}
                    right={
                      <TextInput.Icon
                        icon="camera"
                        onPress={handleScanPlate}
                        disabled={isScanning}
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.plateNumber}>
                    {errors.plateNumber}
                  </HelperText>

                  <Button
                    mode="outlined"
                    onPress={handleScanPlate}
                    loading={isScanning}
                    disabled={isScanning}
                    style={styles.scanButton}
                    textColor="#7C3AED"
                    icon="qr-code-scanner"
                  >
                    {isScanning ? 'Scanning...' : 'Scan License Plate'}
                  </Button>

                  <Text style={styles.subSectionTitle}>Vehicle Type</Text>
                  <View style={styles.chipContainer}>
                    {vehicleTypes.map((type) => (
                      <Chip
                        key={type.key}
                        selected={vehicleType === type.key}
                        onPress={() => setVehicleType(type.key)}
                        style={[
                          styles.chip,
                          vehicleType === type.key && styles.selectedChip
                        ]}
                        textStyle={vehicleType === type.key ? styles.selectedChipText : undefined}
                        icon={type.icon}
                      >
                        {type.label}
                      </Chip>
                    ))}
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* Duration Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Parking Duration</Text>
                  
                  <TextInput
                    label="Duration (minutes)"
                    value={duration}
                    onChangeText={(text) => {
                      setDuration(text);
                      setErrors(prev => ({ ...prev, duration: '' }));
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    theme={{ colors: { primary: '#7C3AED' } }}
                    error={!!errors.duration}
                  />
                  <HelperText type="error" visible={!!errors.duration}>
                    {errors.duration}
                  </HelperText>

                  <View style={styles.durationPresets}>
                    {[30, 60, 120, 240].map((preset) => (
                      <Chip
                        key={preset}
                        selected={duration === preset.toString()}
                        onPress={() => setDuration(preset.toString())}
                        style={styles.presetChip}
                      >
                        {preset < 60 ? `${preset}m` : `${preset / 60}h`}
                      </Chip>
                    ))}
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* Discounts Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Discounts</Text>
                  
                  <View style={styles.discountRow}>
                    <View style={styles.discountInfo}>
                      <Text style={styles.discountLabel}>Senior Citizen (20%)</Text>
                      <Text style={styles.discountSubtext}>VAT Exempt</Text>
                    </View>
                    <Switch
                      value={hasSeniorDiscount}
                      onValueChange={setHasSeniorDiscount}
                      color="#7C3AED"
                    />
                  </View>

                  {hasSeniorDiscount && (
                    <TextInput
                      label="Senior Citizen ID Number"
                      value={seniorIdNumber}
                      onChangeText={(text) => {
                        setSeniorIdNumber(text);
                        setErrors(prev => ({ ...prev, seniorIdNumber: '' }));
                      }}
                      mode="outlined"
                      style={styles.input}
                      theme={{ colors: { primary: '#7C3AED' } }}
                      error={!!errors.seniorIdNumber}
                    />
                  )}

                  <View style={styles.discountRow}>
                    <View style={styles.discountInfo}>
                      <Text style={styles.discountLabel}>PWD (20%)</Text>
                      <Text style={styles.discountSubtext}>VAT Exempt</Text>
                    </View>
                    <Switch
                      value={hasPWDDiscount}
                      onValueChange={setHasPWDDiscount}
                      color="#7C3AED"
                    />
                  </View>

                  {hasPWDDiscount && (
                    <TextInput
                      label="PWD ID Number"
                      value={pwdIdNumber}
                      onChangeText={(text) => {
                        setPwdIdNumber(text);
                        setErrors(prev => ({ ...prev, pwdIdNumber: '' }));
                      }}
                      mode="outlined"
                      style={styles.input}
                      theme={{ colors: { primary: '#7C3AED' } }}
                      error={!!errors.pwdIdNumber}
                    />
                  )}
                </View>

                <Divider style={styles.divider} />

                {/* Payment Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Method</Text>
                  
                  <View style={styles.chipContainer}>
                    {paymentMethods.map((method) => (
                      <Chip
                        key={method.key}
                        selected={paymentMethod === method.key}
                        onPress={() => setPaymentMethod(method.key)}
                        style={[
                          styles.chip,
                          paymentMethod === method.key && styles.selectedChip
                        ]}
                        textStyle={paymentMethod === method.key ? styles.selectedChipText : undefined}
                        icon={method.icon}
                      >
                        {method.label}
                      </Chip>
                    ))}
                  </View>

                  {paymentMethod === 'cash' && (
                    <TextInput
                      label="Cash Received"
                      value={cashReceived}
                      onChangeText={(text) => {
                        setCashReceived(text);
                        setErrors(prev => ({ ...prev, cashReceived: '' }));
                      }}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      theme={{ colors: { primary: '#7C3AED' } }}
                      error={!!errors.cashReceived}
                      left={<TextInput.Icon icon="currency-php" />}
                    />
                  )}

                  {paymentMethod === 'card' && (
                    <>
                      <TextInput
                        label="Card Last 4 Digits"
                        value={cardDetails.last4}
                        onChangeText={(text) => setCardDetails(prev => ({ ...prev, last4: text }))}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={4}
                        style={styles.input}
                        theme={{ colors: { primary: '#7C3AED' } }}
                      />
                      <TextInput
                        label="Card Brand"
                        value={cardDetails.brand}
                        onChangeText={(text) => setCardDetails(prev => ({ ...prev, brand: text }))}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { primary: '#7C3AED' } }}
                      />
                    </>
                  )}
                </View>

                <Divider style={styles.divider} />

                {/* Total Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Total Amount</Text>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalAmount}>₱{calculateTotal().toFixed(2)}</Text>
                    {paymentMethod === 'cash' && cashReceived && (
                      <Text style={styles.changeAmount}>
                        Change: ₱{Math.max(0, parseFloat(cashReceived) - calculateTotal()).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Notes Section */}
                <TextInput
                  label="Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  theme={{ colors: { primary: '#7C3AED' } }}
                />
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
                  onPress={handleCreateSession}
                  loading={loading}
                  disabled={loading || !plateNumber.trim()}
                  buttonColor="#7C3AED"
                  icon="plus"
                >
                  Create Session
                </Button>
              </Card.Actions>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    maxHeight: '90%',
  },
  container: {
    flex: 1,
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
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  scanButton: {
    borderColor: '#7C3AED',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F3F4F6',
  },
  selectedChip: {
    backgroundColor: '#7C3AED',
  },
  selectedChipText: {
    color: '#fff',
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
  },
  durationPresets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountInfo: {
    flex: 1,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  discountSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  changeAmount: {
    fontSize: 16,
    color: '#059669',
    marginTop: 4,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});