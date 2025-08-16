import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Circle, Path, Text as SvgText } from 'react-native-svg';
import { NavigationService, FacilityNavigationRoute, FacilityNavigationStep } from '../../services/navigationService';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import type { FacilityLayout } from '@park-angel/shared/src/types/facility-layout';

interface FacilityNavigationViewProps {
  facilityId: string;
  targetSpot: ParkingSpot;
  currentFloor: number;
  onNavigationEnd: () => void;
  onArrival: () => void;
}

const { width, height } = Dimensions.get('window');
const LAYOUT_WIDTH = width - 32;
const LAYOUT_HEIGHT = 300;

export const FacilityNavigationView: React.FC<FacilityNavigationViewProps> = ({
  facilityId,
  targetSpot,
  currentFloor,
  onNavigationEnd,
  onArrival,
}) => {
  const [route, setRoute] = useState<FacilityNavigationRoute | null>(null);
  const [currentStep, setCurrentStep] = useState<FacilityNavigationStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [spotLocation, setSpotLocation] = useState<{ coordinates: { x: number; y: number }; instructions: string[] } | null>(null);
  const [showExitRoute, setShowExitRoute] = useState(false);

  useEffect(() => {
    initializeFacilityNavigation();
  }, []);

  const initializeFacilityNavigation = async () => {
    try {
      // Start facility navigation
      const navigationRoute = await NavigationService.startFacilityNavigation(
        facilityId,
        targetSpot,
        currentFloor,
        handleStepUpdate,
        handleArrival
      );

      setRoute(navigationRoute);
      setIsNavigating(true);

      // Find spot location
      const spotInfo = await NavigationService.findSpotInFacility(
        facilityId,
        targetSpot.number
      );
      setSpotLocation(spotInfo);

    } catch (error) {
      console.error('Error initializing facility navigation:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to start facility navigation. The facility layout may not be available.',
        [{ text: 'OK', onPress: onNavigationEnd }]
      );
    }
  };

  const handleStepUpdate = (step: FacilityNavigationStep) => {
    setCurrentStep(step);
    setStepIndex(prev => prev + 1);
  };

  const handleArrival = () => {
    setIsNavigating(false);
    Alert.alert(
      'Arrived!',
      `You have arrived at parking spot ${targetSpot.number}.`,
      [
        { text: 'Show Exit Route', onPress: showExitNavigation },
        { text: 'Done', onPress: onArrival }
      ]
    );
  };

  const showExitNavigation = async () => {
    try {
      setShowExitRoute(true);
      
      // Generate exit route from current spot
      const exitRoute = await NavigationService.generateExitRoute(
        facilityId,
        spotLocation?.coordinates || { x: 0, y: 0 },
        currentFloor
      );

      setRoute(exitRoute);
      setCurrentStep(exitRoute.steps[0]);
      setStepIndex(0);
      setIsNavigating(true);
    } catch (error) {
      console.error('Error generating exit route:', error);
      Alert.alert('Error', 'Failed to generate exit route.');
    }
  };

  const handleStopNavigation = () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop facility navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setIsNavigating(false);
            onNavigationEnd();
          }
        }
      ]
    );
  };

  const renderFacilityLayout = () => {
    if (!spotLocation) {
      return (
        <View style={styles.layoutPlaceholder}>
          <Text style={styles.placeholderText}>Loading facility layout...</Text>
        </View>
      );
    }

    // Simple facility layout visualization
    return (
      <View style={styles.layoutContainer}>
        <Text style={styles.layoutTitle}>Floor {currentFloor} Layout</Text>
        <Svg width={LAYOUT_WIDTH} height={LAYOUT_HEIGHT} style={styles.layoutSvg}>
          {/* Background */}
          <Rect
            x="0"
            y="0"
            width={LAYOUT_WIDTH}
            height={LAYOUT_HEIGHT}
            fill="#F9FAFB"
            stroke="#E5E7EB"
            strokeWidth="2"
          />

          {/* Entrance */}
          <Rect
            x="10"
            y={LAYOUT_HEIGHT - 30}
            width="60"
            height="20"
            fill="#10B981"
            rx="4"
          />
          <SvgText
            x="40"
            y={LAYOUT_HEIGHT - 18}
            fontSize="12"
            fill="white"
            textAnchor="middle"
          >
            Entrance
          </SvgText>

          {/* Parking spots grid */}
          {Array.from({ length: 20 }, (_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = 100 + col * 60;
            const y = 50 + row * 50;
            const isTargetSpot = `P${i + 1}` === targetSpot.number;

            return (
              <React.Fragment key={i}>
                <Rect
                  x={x}
                  y={y}
                  width="50"
                  height="30"
                  fill={isTargetSpot ? "#8B5CF6" : "#E5E7EB"}
                  stroke={isTargetSpot ? "#7C3AED" : "#D1D5DB"}
                  strokeWidth="2"
                  rx="4"
                />
                <SvgText
                  x={x + 25}
                  y={y + 20}
                  fontSize="10"
                  fill={isTargetSpot ? "white" : "#6B7280"}
                  textAnchor="middle"
                >
                  P{i + 1}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Current location indicator */}
          {currentStep && (
            <Circle
              cx={currentStep.coordinates.x * LAYOUT_WIDTH}
              cy={currentStep.coordinates.y * LAYOUT_HEIGHT}
              r="8"
              fill="#EF4444"
              stroke="white"
              strokeWidth="2"
            />
          )}

          {/* Exit */}
          <Rect
            x={LAYOUT_WIDTH - 70}
            y="10"
            width="60"
            height="20"
            fill="#F59E0B"
            rx="4"
          />
          <SvgText
            x={LAYOUT_WIDTH - 40}
            y="22"
            fontSize="12"
            fill="white"
            textAnchor="middle"
          >
            Exit
          </SvgText>
        </Svg>
      </View>
    );
  };

  const getStepIcon = (type: string): string => {
    switch (type) {
      case 'entrance': return '🚪';
      case 'elevator': return '🛗';
      case 'stairs': return '🪜';
      case 'turn': return '↩️';
      case 'arrive': return '📍';
      default: return '➡️';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStopNavigation} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showExitRoute ? 'Exit Navigation' : 'Facility Navigation'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Facility Layout */}
        {renderFacilityLayout()}

        {/* Current Instruction */}
        {currentStep && (
          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <Text style={styles.stepIcon}>{getStepIcon(currentStep.type)}</Text>
              <View style={styles.instructionTextContainer}>
                <Text style={styles.instructionText}>{currentStep.instruction}</Text>
                <Text style={styles.landmarkText}>Landmark: {currentStep.landmark}</Text>
              </View>
            </View>
          </View>
        )}

        {/* All Steps */}
        {route && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Navigation Steps</Text>
            {route.steps.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.stepItem,
                  index === stepIndex && styles.activeStepItem
                ]}
              >
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepInstruction,
                    index === stepIndex && styles.activeStepInstruction
                  ]}>
                    {step.instruction}
                  </Text>
                  <Text style={styles.stepLandmark}>
                    {getStepIcon(step.type)} {step.landmark}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Spot Finding Instructions */}
        {spotLocation && !showExitRoute && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Spot Finding Tips</Text>
            {spotLocation.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionItemText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!showExitRoute && !isNavigating && (
            <TouchableOpacity
              style={styles.exitButton}
              onPress={showExitNavigation}
            >
              <Text style={styles.exitButtonText}>Show Exit Route</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.doneButton}
            onPress={onNavigationEnd}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
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
  },
  layoutContainer: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  layoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  layoutSvg: {
    borderRadius: 8,
  },
  layoutPlaceholder: {
    height: LAYOUT_HEIGHT,
    margin: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
  },
  instructionCard: {
    margin: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  stepsContainer: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeStepItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: -8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  activeStepInstruction: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
  stepLandmark: {
    fontSize: 12,
    color: '#6B7280',
  },
  instructionsContainer: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionBullet: {
    fontSize: 16,
    color: '#8B5CF6',
    marginRight: 8,
    marginTop: 2,
  },
  instructionItemText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionsContainer: {
    margin: 16,
    gap: 12,
  },
  exitButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});