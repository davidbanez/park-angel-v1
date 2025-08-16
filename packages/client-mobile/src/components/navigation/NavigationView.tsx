import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { NavigationService, NavigationRoute, NavigationStep } from '../../services/navigationService';
import type { ParkingSpot, Coordinates } from '@park-angel/shared/src/types/parking';

interface NavigationViewProps {
  destination: ParkingSpot;
  onNavigationEnd: () => void;
  onArrival: () => void;
}

const { width, height } = Dimensions.get('window');

export const NavigationView: React.FC<NavigationViewProps> = ({
  destination,
  onNavigationEnd,
  onArrival,
}) => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    initializeNavigation();
    
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOfflineMode(!state.isConnected);
    });

    return () => {
      NavigationService.stopNavigation();
      unsubscribe();
    };
  }, []);

  const initializeNavigation = async () => {
    try {
      // Initialize navigation service
      await NavigationService.initialize();

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      setCurrentLocation(coords);

      // Start navigation
      await NavigationService.startNavigation(
        destination,
        handleRouteUpdate,
        handleStepUpdate,
        handleArrival
      );

      setIsNavigating(true);
    } catch (error) {
      console.error('Error initializing navigation:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to start navigation. Please check your location permissions.',
        [{ text: 'OK', onPress: onNavigationEnd }]
      );
    }
  };

  const handleRouteUpdate = (newRoute: NavigationRoute) => {
    setRoute(newRoute);
    
    // Fit map to show entire route
    if (mapRef.current) {
      const coordinates = [newRoute.origin, newRoute.destination];
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true
      });
    }
  };

  const handleStepUpdate = (step: NavigationStep, index: number) => {
    setCurrentStep(step);
    setStepIndex(index);

    // Update remaining distance and time
    const status = NavigationService.getNavigationStatus();
    setRemainingDistance(status.remainingDistance);
    setRemainingTime(status.remainingTime);

    // Center map on current step with appropriate zoom level
    if (mapRef.current) {
      const zoomLevel = step.distance > 1000 ? 0.02 : 0.01; // Zoom out for longer distances
      mapRef.current.animateToRegion({
        latitude: step.coordinates.latitude,
        longitude: step.coordinates.longitude,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel
      }, 1000);
    }
  };

  const handleArrival = () => {
    setIsNavigating(false);
    Alert.alert(
      'Arrived!',
      'You have arrived at your parking destination.',
      [{ text: 'OK', onPress: onArrival }]
    );
  };

  const handleStopNavigation = async () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await NavigationService.stopNavigation();
            setIsNavigating(false);
            onNavigationEnd();
          }
        }
      ]
    );
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getManeuverIcon = (maneuver: string): string => {
    switch (maneuver) {
      case 'turn-left': return '↰';
      case 'turn-right': return '↱';
      case 'straight': return '↑';
      case 'u-turn': return '↶';
      case 'arrive': return '📍';
      default: return '↑';
    }
  };

  if (!currentLocation || !route) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Starting navigation...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={isNavigating}
        showsCompass={true}
      >
        {/* Route polyline */}
        {route && (
          <Polyline
            coordinates={[route.origin, route.destination]}
            strokeColor="#8B5CF6"
            strokeWidth={4}
          />
        )}

        {/* Destination marker */}
        <Marker
          coordinate={destination.coordinates}
          title={`Spot ${destination.number}`}
          description="Your parking destination"
          pinColor="#8B5CF6"
        />

        {/* Step markers */}
        {route.steps.map((step, index) => (
          <Marker
            key={step.id}
            coordinate={step.coordinates}
            title={step.instruction}
            pinColor={index === stepIndex ? "#10B981" : "#6B7280"}
          />
        ))}
      </MapView>

      {/* Offline Mode Indicator */}
      {isOfflineMode && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📡 Offline Navigation</Text>
        </View>
      )}

      {/* Navigation Instructions Panel */}
      <View style={styles.instructionsPanel}>
        {currentStep && (
          <>
            {/* Current Instruction */}
            <View style={styles.currentInstruction}>
              <View style={styles.maneuverContainer}>
                <Text style={styles.maneuverIcon}>
                  {getManeuverIcon(currentStep.maneuver)}
                </Text>
              </View>
              <View style={styles.instructionTextContainer}>
                <Text style={styles.instructionText}>
                  {currentStep.instruction}
                </Text>
                {currentStep.streetName && (
                  <Text style={styles.streetName}>
                    on {currentStep.streetName}
                  </Text>
                )}
              </View>
              <View style={styles.distanceContainer}>
                <Text style={styles.stepDistance}>
                  {formatDistance(currentStep.distance)}
                </Text>
              </View>
            </View>

            {/* Trip Summary */}
            <View style={styles.tripSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatDistance(remainingDistance)}
                </Text>
                <Text style={styles.summaryLabel}>remaining</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatTime(remainingTime)}
                </Text>
                <Text style={styles.summaryLabel}>ETA</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {stepIndex + 1}/{route.steps.length}
                </Text>
                <Text style={styles.summaryLabel}>steps</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStopNavigation}
        >
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => {
            if (mapRef.current && currentLocation) {
              mapRef.current.animateToRegion({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              });
            }
          }}
        >
          <Text style={styles.recenterButtonText}>📍</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  instructionsPanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  currentInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  maneuverContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  maneuverIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  streetName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  stepDistance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  tripSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recenterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterButtonText: {
    fontSize: 20,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  offlineText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});