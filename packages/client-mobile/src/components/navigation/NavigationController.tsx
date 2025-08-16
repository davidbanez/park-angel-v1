import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { NavigationView } from './NavigationView';
import { FacilityNavigationView } from './FacilityNavigationView';
import { VoiceGuidanceSettings } from './VoiceGuidanceSettings';
import { OfflineMapManager } from './OfflineMapManager';
import { NavigationService } from '../../services/navigationService';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';

interface NavigationControllerProps {
  destination: ParkingSpot;
  onNavigationComplete: () => void;
  onCancel: () => void;
}

type NavigationMode = 'street' | 'facility';
type NavigationState = 'preparing' | 'navigating' | 'arrived' | 'facility_navigation';

export const NavigationController: React.FC<NavigationControllerProps> = ({
  destination,
  onNavigationComplete,
  onCancel,
}) => {
  const [navigationState, setNavigationState] = useState<NavigationState>('preparing');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('street');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);

  useEffect(() => {
    initializeNavigation();
  }, []);

  const initializeNavigation = async () => {
    try {
      // Initialize navigation service
      await NavigationService.initialize();

      // Check if destination is in a facility
      const isFacility = destination.type === 'facility' || destination.facilityId;
      setNavigationMode(isFacility ? 'facility' : 'street');

      // Check offline availability
      const offlineAvailable = NavigationService.isOfflineNavigationAvailable(destination.coordinates);
      setIsOfflineAvailable(offlineAvailable);

      // Start navigation
      setNavigationState('navigating');
    } catch (error) {
      console.error('Error initializing navigation:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to initialize navigation. Please check your location permissions.',
        [{ text: 'OK', onPress: onCancel }]
      );
    }
  };

  const handleArrival = () => {
    setNavigationState('arrived');
    
    if (navigationMode === 'facility') {
      // Transition to facility navigation
      setNavigationState('facility_navigation');
    } else {
      // Street parking - navigation complete
      Alert.alert(
        'Arrived!',
        'You have arrived at your parking destination.',
        [{ text: 'OK', onPress: onNavigationComplete }]
      );
    }
  };

  const handleFacilityNavigationComplete = () => {
    Alert.alert(
      'Navigation Complete',
      'You have successfully found your parking spot!',
      [{ text: 'OK', onPress: onNavigationComplete }]
    );
  };

  const handleNavigationEnd = () => {
    Alert.alert(
      'End Navigation',
      'Are you sure you want to end navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: onCancel }
      ]
    );
  };

  const renderNavigationOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setShowVoiceSettings(true)}
      >
        <Text style={styles.optionIcon}>🔊</Text>
        <Text style={styles.optionText}>Voice Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setShowOfflineManager(true)}
      >
        <Text style={styles.optionIcon}>📡</Text>
        <Text style={styles.optionText}>Offline Maps</Text>
      </TouchableOpacity>

      {isOfflineAvailable && (
        <View style={styles.offlineAvailableIndicator}>
          <Text style={styles.offlineAvailableText}>✓ Offline Available</Text>
        </View>
      )}
    </View>
  );

  if (navigationState === 'preparing') {
    return (
      <View style={styles.preparingContainer}>
        <Text style={styles.preparingText}>Preparing navigation...</Text>
        {renderNavigationOptions()}
      </View>
    );
  }

  if (navigationState === 'facility_navigation') {
    return (
      <>
        <FacilityNavigationView
          facilityId={destination.facilityId || 'default'}
          targetSpot={destination}
          currentFloor={currentFloor}
          onNavigationEnd={handleNavigationEnd}
          onArrival={handleFacilityNavigationComplete}
        />
        
        {/* Voice Settings Modal */}
        <VoiceGuidanceSettings
          visible={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
        />

        {/* Offline Map Manager Modal */}
        <OfflineMapManager
          visible={showOfflineManager}
          onClose={() => setShowOfflineManager(false)}
        />
      </>
    );
  }

  return (
    <>
      <NavigationView
        destination={destination}
        onNavigationEnd={handleNavigationEnd}
        onArrival={handleArrival}
      />

      {/* Navigation Options Overlay */}
      <View style={styles.optionsOverlay}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowVoiceSettings(true)}
        >
          <Text style={styles.settingsButtonText}>🔊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowOfflineManager(true)}
        >
          <Text style={styles.settingsButtonText}>📡</Text>
        </TouchableOpacity>
      </View>

      {/* Voice Settings Modal */}
      <VoiceGuidanceSettings
        visible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />

      {/* Offline Map Manager Modal */}
      <OfflineMapManager
        visible={showOfflineManager}
        onClose={() => setShowOfflineManager(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  preparingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  preparingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 40,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  offlineAvailableIndicator: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  offlineAvailableText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsOverlay: {
    position: 'absolute',
    top: 120,
    right: 16,
    gap: 8,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    fontSize: 20,
  },
});