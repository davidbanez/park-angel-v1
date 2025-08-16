import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, TextInput, Chip, Modal, Portal, SegmentedButtons, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ViolationReport } from '../../types/pos';
import { LicensePlateService } from '../../services/licensePlateService';
import { ViolationService } from '../../services/violationService';

interface ViolationReportingInterfaceProps {
  onReportSubmitted?: (report: ViolationReport) => void;
  initialData?: Partial<ViolationReport>;
}

export default function ViolationReportingInterface({ 
  onReportSubmitted, 
  initialData 
}: ViolationReportingInterfaceProps) {
  const [plateNumber, setPlateNumber] = useState(initialData?.vehiclePlateNumber || '');
  const [violationType, setViolationType] = useState<ViolationReport['violationType']>(
    initialData?.violationType || 'illegal_parking'
  );
  const [priority, setPriority] = useState<ViolationReport['priority']>(
    initialData?.priority || 'normal'
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [location, setLocation] = useState(initialData?.location || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const violationTypes = [
    { key: 'illegal_parking', label: 'Illegal Parking', icon: 'local-parking' },
    { key: 'expired_session', label: 'Expired Session', icon: 'schedule' },
    { key: 'no_payment', label: 'No Payment', icon: 'payment' },
    { key: 'blocking_access', label: 'Blocking Access', icon: 'block' },
    { key: 'disabled_spot_violation', label: 'Disabled Spot Violation', icon: 'accessible' },
    { key: 'other', label: 'Other', icon: 'more-horiz' },
  ] as const;

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to tag violation location');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Current Location',
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleScanPlate = async () => {
    setIsScanning(true);
    try {
      const result = await LicensePlateService.getInstance().scanWithOCRCorrection 
        ? await LicensePlateService.getInstance().scanWithOCRCorrection(await getImageUri())
        : await LicensePlateService.getInstance().captureAndScan();
        
      if (result) {
        const confidencePercentage = (result.confidence * 100).toFixed(1);
        const confidenceColor = result.confidence >= 0.9 ? '🟢' : result.confidence >= 0.7 ? '🟡' : '🔴';
        
        Alert.alert(
          'License Plate Detected',
          `${confidenceColor} Detected: ${result.plateNumber}\nConfidence: ${confidencePercentage}%\n\n${result.confidence < 0.8 ? '⚠️ Low confidence - please verify the plate number' : '✅ High confidence detection'}`,
          [
            { 
              text: 'Use This', 
              onPress: () => setPlateNumber(result.plateNumber),
              style: 'default'
            },
            { 
              text: 'Edit Manually', 
              onPress: () => setPlateNumber(result.plateNumber),
              style: 'default'
            },
            { 
              text: 'Scan Again', 
              onPress: () => handleScanPlate(),
              style: 'cancel'
            },
          ]
        );
      } else {
        Alert.alert(
          'No Plate Detected',
          'Could not detect a license plate in the image. Please try again with better lighting and angle.',
          [
            { text: 'Try Again', onPress: () => handleScanPlate() },
            { text: 'Enter Manually', onPress: () => {} },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Scan Error', error.message || 'Failed to scan license plate');
    } finally {
      setIsScanning(false);
    }
  };

  const getImageUri = async (): Promise<string> => {
    const hasPermission = await LicensePlateService.getInstance().requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    
    throw new Error('No image captured');
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error: any) {
      Alert.alert('Camera Error', error.message);
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setPhotos(prev => prev.filter((_, i) => i !== index));
        }},
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (!plateNumber.trim()) {
      Alert.alert('Error', 'Please enter or scan a license plate number');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'Please take at least one photo as evidence');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required. Please enable location services.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await ViolationService.getInstance().submitViolationReport({
        reportedBy: 'current_operator', // Would be actual operator ID from auth
        vehiclePlateNumber: plateNumber,
        violationType,
        description: description || `${violationTypes.find(t => t.key === violationType)?.label} violation`,
        photos,
        location,
        priority,
        status: 'reported',
      });

      Alert.alert('Success', 'Violation report submitted successfully', [
        {
          text: 'OK',
          onPress: () => {
            setPlateNumber('');
            setDescription('');
            setPhotos([]);
            setViolationType('illegal_parking');
            setPriority('normal');
            onReportSubmitted?.(report);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit violation report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getViolationTypeIcon = (type: string) => {
    const violationType = violationTypes.find(vt => vt.key === type);
    return violationType?.icon || 'report-problem';
  };

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#7C3AED';
      case 'low': return '#10B981';
      default: return '#7C3AED';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title
            title="Report Violation"
            subtitle="Document parking violations with evidence"
            left={(props) => <MaterialIcons name="report-problem" {...props} color="#EF4444" />}
          />
          <Card.Content>
            {/* License Plate Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>License Plate Information</Text>
              <TextInput
                label="License Plate Number"
                value={plateNumber}
                onChangeText={setPlateNumber}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: '#7C3AED' } }}
                right={
                  <TextInput.Icon
                    icon="camera"
                    onPress={handleScanPlate}
                    disabled={isScanning}
                  />
                }
              />
              
              <Button
                mode="outlined"
                onPress={handleScanPlate}
                loading={isScanning}
                disabled={isScanning}
                style={styles.scanButton}
                textColor="#7C3AED"
                icon="qr-code-scanner"
              >
                {isScanning ? 'Scanning...' : 'AI License Plate Scanner'}
              </Button>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setViolationType('illegal_parking');
                    setPriority('high');
                    setDescription('Vehicle parked in unauthorized area');
                  }}
                  style={styles.quickActionButton}
                  textColor="#EF4444"
                  icon="car-off"
                  compact
                >
                  Illegal Parking
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setViolationType('expired_session');
                    setPriority('normal');
                    setDescription('Parking session has expired');
                  }}
                  style={styles.quickActionButton}
                  textColor="#F59E0B"
                  icon="schedule"
                  compact
                >
                  Expired Session
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setViolationType('disabled_spot_violation');
                    setPriority('urgent');
                    setDescription('Vehicle parked in disabled parking spot without permit');
                  }}
                  style={styles.quickActionButton}
                  textColor="#DC2626"
                  icon="accessible"
                  compact
                >
                  Disabled Spot
                </Button>
              </View>
            </View>

            {/* Violation Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Violation Type</Text>
              <View style={styles.chipContainer}>
                {violationTypes.map((type) => (
                  <Chip
                    key={type.key}
                    selected={violationType === type.key}
                    onPress={() => setViolationType(type.key)}
                    style={[
                      styles.chip,
                      violationType === type.key && styles.selectedChip
                    ]}
                    textStyle={violationType === type.key ? styles.selectedChipText : undefined}
                    icon={type.icon}
                  >
                    {type.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Priority Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority Level</Text>
              <SegmentedButtons
                value={priority}
                onValueChange={(value) => setPriority(value as ViolationReport['priority'])}
                buttons={priorityLevels.map(level => ({
                  value: level.value,
                  label: level.label,
                  style: { 
                    backgroundColor: priority === level.value ? getPriorityColor(level.value) : undefined 
                  }
                }))}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                theme={{ colors: { primary: '#7C3AED' } }}
                placeholder="Provide additional details about the violation..."
              />
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={24} color="#7C3AED" />
                <Text style={styles.locationText}>
                  {location?.address || 'Getting location...'}
                </Text>
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={getCurrentLocation}
                />
              </View>
            </View>

            {/* Evidence Photos Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Evidence Photos *</Text>
              
              <Button
                mode="outlined"
                onPress={handleTakePhoto}
                style={styles.photoButton}
                textColor="#7C3AED"
                icon="camera"
              >
                Take Evidence Photo
              </Button>

              {photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPhoto(photo);
                          setShowPhotoModal(true);
                        }}
                      >
                        <Image source={{ uri: photo }} style={styles.photo} />
                      </TouchableOpacity>
                      <IconButton
                        icon="close"
                        size={16}
                        iconColor="#EF4444"
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmitReport}
              loading={isSubmitting}
              disabled={isSubmitting || !plateNumber.trim() || photos.length === 0}
              style={styles.submitButton}
              buttonColor="#EF4444"
              icon="send"
            >
              Submit Violation Report
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* Photo Modal */}
      <Portal>
        <Modal
          visible={showPhotoModal}
          onDismiss={() => setShowPhotoModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedPhoto && (
            <View>
              <Image source={{ uri: selectedPhoto }} style={styles.modalPhoto} />
              <Button
                mode="text"
                onPress={() => setShowPhotoModal(false)}
                style={styles.closeModalButton}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  scanButton: {
    borderColor: '#7C3AED',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#7C3AED',
  },
  selectedChipText: {
    color: '#fff',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    color: '#374151',
  },
  photoButton: {
    borderColor: '#7C3AED',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 75,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitButton: {
    paddingVertical: 8,
    marginTop: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalPhoto: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  closeModalButton: {
    alignSelf: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
  },
});