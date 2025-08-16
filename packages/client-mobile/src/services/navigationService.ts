import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { Coordinates, ParkingSpot } from '@park-angel/shared/src/types/parking';
import type { FacilityLayout } from '@park-angel/shared/src/types/facility-layout';

export interface NavigationRoute {
  id: string;
  origin: Coordinates;
  destination: Coordinates;
  steps: NavigationStep[];
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  coordinates: Coordinates;
  maneuver: 'turn-left' | 'turn-right' | 'straight' | 'u-turn' | 'arrive';
  streetName?: string;
}

export interface FacilityNavigationRoute {
  id: string;
  facilityId: string;
  floor: number;
  steps: FacilityNavigationStep[];
  estimatedWalkTime: number; // in seconds
}

export interface FacilityNavigationStep {
  id: string;
  instruction: string;
  landmark: string;
  coordinates: { x: number; y: number }; // Facility coordinate system
  type: 'entrance' | 'elevator' | 'stairs' | 'turn' | 'arrive';
}

export interface VoiceGuidanceSettings {
  enabled: boolean;
  language: 'en' | 'fil';
  volume: number;
  announceDistance: number; // meters before turn
}

export interface OfflineMapData {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  routes: NavigationRoute[];
  facilityLayouts: FacilityLayout[];
  lastUpdated: Date;
}

export class NavigationService {
  private static currentRoute: NavigationRoute | null = null;
  private static currentStep: number = 0;
  private static isNavigating: boolean = false;
  private static voiceSettings: VoiceGuidanceSettings = {
    enabled: true,
    language: 'en',
    volume: 0.8,
    announceDistance: 100
  };
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static offlineData: OfflineMapData | null = null;

  /**
   * Initialize navigation service
   */
  static async initialize(): Promise<void> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Load voice settings
      await this.loadVoiceSettings();
      
      // Load offline data
      await this.loadOfflineData();

      console.log('Navigation service initialized');
    } catch (error) {
      console.error('Error initializing navigation service:', error);
      throw error;
    }
  }

  /**
   * Start turn-by-turn navigation to a parking spot
   */
  static async startNavigation(
    destination: ParkingSpot,
    onRouteUpdate?: (route: NavigationRoute) => void,
    onStepUpdate?: (step: NavigationStep, stepIndex: number) => void,
    onArrival?: () => void
  ): Promise<void> {
    try {
      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const origin: Coordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      };

      // Calculate route
      const route = await this.calculateRoute(origin, destination.coordinates);
      this.currentRoute = route;
      this.currentStep = 0;
      this.isNavigating = true;

      onRouteUpdate?.(route);

      // Start location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5
        },
        (location) => {
          this.handleLocationUpdate(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            },
            onStepUpdate,
            onArrival
          );
        }
      );

      // Announce first instruction
      if (route.steps.length > 0) {
        await this.announceInstruction(route.steps[0]);
        onStepUpdate?.(route.steps[0], 0);
      }

    } catch (error) {
      console.error('Error starting navigation:', error);
      throw error;
    }
  }

  /**
   * Start facility-specific navigation
   */
  static async startFacilityNavigation(
    facilityId: string,
    targetSpot: ParkingSpot,
    currentFloor: number,
    onStepUpdate?: (step: FacilityNavigationStep) => void,
    onArrival?: () => void
  ): Promise<FacilityNavigationRoute> {
    try {
      // Get facility layout
      const layout = await this.getFacilityLayout(facilityId);
      if (!layout) {
        throw new Error('Facility layout not found');
      }

      // Calculate facility route
      const route = await this.calculateFacilityRoute(
        layout,
        currentFloor,
        targetSpot
      );

      // Start step-by-step guidance
      this.startFacilityGuidance(route, onStepUpdate, onArrival);

      return route;
    } catch (error) {
      console.error('Error starting facility navigation:', error);
      throw error;
    }
  }

  /**
   * Find parking spot within facility using visual guidance
   */
  static async findSpotInFacility(
    facilityId: string,
    spotNumber: string
  ): Promise<{ coordinates: { x: number; y: number }; instructions: string[] }> {
    try {
      const layout = await this.getFacilityLayout(facilityId);
      if (!layout) {
        throw new Error('Facility layout not found');
      }

      // Find spot in layout
      const spot = layout.floors
        .flatMap(floor => floor.elements)
        .find(element => 
          element.type === 'spot' && 
          element.properties.number === spotNumber
        );

      if (!spot) {
        throw new Error('Parking spot not found in facility layout');
      }

      // Generate visual instructions
      const instructions = this.generateSpotFindingInstructions(layout, spot);

      return {
        coordinates: spot.position,
        instructions
      };
    } catch (error) {
      console.error('Error finding spot in facility:', error);
      throw error;
    }
  }

  /**
   * Generate exit route guidance
   */
  static async generateExitRoute(
    facilityId: string,
    currentLocation: { x: number; y: number },
    currentFloor: number
  ): Promise<FacilityNavigationRoute> {
    try {
      const layout = await this.getFacilityLayout(facilityId);
      if (!layout) {
        throw new Error('Facility layout not found');
      }

      // Find nearest exit
      const exits = layout.floors[currentFloor]?.elements.filter(
        element => element.type === 'exit'
      ) || [];

      if (exits.length === 0) {
        throw new Error('No exits found on current floor');
      }

      // Calculate route to nearest exit
      const nearestExit = this.findNearestElement(currentLocation, exits);
      const route = await this.calculateFacilityExitRoute(
        layout,
        currentLocation,
        currentFloor,
        nearestExit
      );

      return route;
    } catch (error) {
      console.error('Error generating exit route:', error);
      throw error;
    }
  }

  /**
   * Enable/disable voice guidance
   */
  static async setVoiceGuidance(settings: Partial<VoiceGuidanceSettings>): Promise<void> {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    await AsyncStorage.setItem('voiceSettings', JSON.stringify(this.voiceSettings));
  }

  /**
   * Download offline map data for a region
   */
  static async downloadOfflineData(
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }
  ): Promise<void> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('Internet connection required to download offline maps');
      }

      // Generate sample routes for the region (in real implementation, this would fetch from API)
      const routes = await this.generateOfflineRoutes(region);
      
      // Get facility layouts in the region (in real implementation, this would fetch from API)
      const facilityLayouts = await this.getFacilityLayoutsInRegion(region);

      const offlineData: OfflineMapData = {
        region,
        routes,
        facilityLayouts,
        lastUpdated: new Date()
      };

      // Store offline data
      await AsyncStorage.setItem('offlineMapData', JSON.stringify(offlineData));
      this.offlineData = offlineData;
      
      console.log('Offline data downloaded for region:', region);
      console.log(`Downloaded ${routes.length} routes and ${facilityLayouts.length} facility layouts`);
    } catch (error) {
      console.error('Error downloading offline data:', error);
      throw error;
    }
  }

  private static async generateOfflineRoutes(
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }
  ): Promise<NavigationRoute[]> {
    const routes: NavigationRoute[] = [];
    
    // Generate sample routes within the region
    const numRoutes = 20; // Generate 20 sample routes
    
    for (let i = 0; i < numRoutes; i++) {
      const origin: Coordinates = {
        latitude: region.latitude + (Math.random() - 0.5) * region.latitudeDelta,
        longitude: region.longitude + (Math.random() - 0.5) * region.longitudeDelta
      };
      
      const destination: Coordinates = {
        latitude: region.latitude + (Math.random() - 0.5) * region.latitudeDelta,
        longitude: region.longitude + (Math.random() - 0.5) * region.longitudeDelta
      };

      const route = this.getSimpleRoute(origin, destination);
      routes.push(route);
    }

    return routes;
  }

  private static async getFacilityLayoutsInRegion(
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }
  ): Promise<FacilityLayout[]> {
    // In a real implementation, this would fetch facility layouts from the API
    // For now, return empty array
    return [];
  }

  /**
   * Check if offline navigation is available for a location
   */
  static isOfflineNavigationAvailable(location: Coordinates): boolean {
    if (!this.offlineData) return false;
    
    return this.isLocationInOfflineRegion(location, this.offlineData.region);
  }

  /**
   * Get offline route if available
   */
  static getOfflineRouteIfAvailable(
    origin: Coordinates,
    destination: Coordinates
  ): NavigationRoute | null {
    if (!this.offlineData) return null;

    // Check if both origin and destination are in offline region
    if (!this.isLocationInOfflineRegion(origin, this.offlineData.region) ||
        !this.isLocationInOfflineRegion(destination, this.offlineData.region)) {
      return null;
    }

    // Find closest matching route
    const threshold = 0.01; // 1km threshold
    const matchingRoute = this.offlineData.routes.find(route => 
      this.calculateDistance(route.origin, origin) < threshold &&
      this.calculateDistance(route.destination, destination) < threshold
    );

    return matchingRoute || null;
  }

  /**
   * Stop navigation
   */
  static async stopNavigation(): Promise<void> {
    this.isNavigating = false;
    this.currentRoute = null;
    this.currentStep = 0;

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Stop any ongoing speech
    await Speech.stop();
  }

  /**
   * Get current navigation status
   */
  static getNavigationStatus(): {
    isNavigating: boolean;
    currentRoute: NavigationRoute | null;
    currentStep: number;
    remainingDistance: number;
    remainingTime: number;
  } {
    let remainingDistance = 0;
    let remainingTime = 0;

    if (this.currentRoute && this.isNavigating) {
      for (let i = this.currentStep; i < this.currentRoute.steps.length; i++) {
        remainingDistance += this.currentRoute.steps[i].distance;
        remainingTime += this.currentRoute.steps[i].duration;
      }
    }

    return {
      isNavigating: this.isNavigating,
      currentRoute: this.currentRoute,
      currentStep: this.currentStep,
      remainingDistance,
      remainingTime
    };
  }

  // Private helper methods

  private static async calculateRoute(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<NavigationRoute> {
    try {
      // Check if we have internet connection
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Try to get route from online service (Google Directions API)
        return await this.getOnlineRoute(origin, destination);
      } else {
        // Use offline route calculation
        return await this.getOfflineRoute(origin, destination);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback to simple route
      return this.getSimpleRoute(origin, destination);
    }
  }

  private static async getOnlineRoute(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<NavigationRoute> {
    // In a real implementation, this would call Google Directions API
    // For now, we'll simulate a more detailed route
    const distance = this.calculateDistance(origin, destination);
    const duration = Math.round(distance / 40 * 3600); // Assume 40 km/h average speed in city

    // Generate intermediate waypoints for better navigation
    const steps: NavigationStep[] = [];
    const numSteps = Math.max(2, Math.floor(distance * 10)); // More steps for longer routes
    
    for (let i = 0; i < numSteps; i++) {
      const progress = i / (numSteps - 1);
      const stepLat = origin.latitude + (destination.latitude - origin.latitude) * progress;
      const stepLng = origin.longitude + (destination.longitude - origin.longitude) * progress;
      
      let instruction: string;
      let maneuver: NavigationStep['maneuver'];
      
      if (i === 0) {
        instruction = 'Head towards your parking destination';
        maneuver = 'straight';
      } else if (i === numSteps - 1) {
        instruction = 'You have arrived at your parking destination';
        maneuver = 'arrive';
      } else {
        // Generate realistic turn instructions
        const turnTypes = ['turn-left', 'turn-right', 'straight'] as const;
        maneuver = turnTypes[Math.floor(Math.random() * turnTypes.length)];
        
        switch (maneuver) {
          case 'turn-left':
            instruction = 'Turn left';
            break;
          case 'turn-right':
            instruction = 'Turn right';
            break;
          default:
            instruction = 'Continue straight';
            maneuver = 'straight';
        }
        
        // Add street name simulation
        const streetNames = ['Main St', 'Park Ave', 'First St', 'Second St', 'Oak St', 'Pine St'];
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        instruction += ` onto ${streetName}`;
      }

      steps.push({
        id: `step_${i}`,
        instruction,
        distance: i === numSteps - 1 ? 0 : (distance * 1000) / (numSteps - 1),
        duration: i === numSteps - 1 ? 0 : duration / (numSteps - 1),
        coordinates: { latitude: stepLat, longitude: stepLng },
        maneuver,
        streetName: i > 0 && i < numSteps - 1 ? `Street ${i}` : undefined
      });
    }

    return {
      id: `route_${Date.now()}`,
      origin,
      destination,
      steps,
      distance: distance * 1000,
      duration,
      polyline: this.encodePolyline([origin, destination])
    };
  }

  private static async getOfflineRoute(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<NavigationRoute> {
    // Check if we have offline data for this region
    if (this.offlineData && this.isLocationInOfflineRegion(origin, this.offlineData.region)) {
      // Use cached route data if available
      const cachedRoute = this.offlineData.routes.find(route => 
        this.calculateDistance(route.origin, origin) < 0.1 &&
        this.calculateDistance(route.destination, destination) < 0.1
      );
      
      if (cachedRoute) {
        return cachedRoute;
      }
    }

    // Generate offline route
    return this.getSimpleRoute(origin, destination);
  }

  private static getSimpleRoute(
    origin: Coordinates,
    destination: Coordinates
  ): NavigationRoute {
    const distance = this.calculateDistance(origin, destination);
    const duration = Math.round(distance / 30 * 3600); // Assume 30 km/h for simple route

    const steps: NavigationStep[] = [
      {
        id: '1',
        instruction: `Head towards your parking destination (${distance.toFixed(1)}km away)`,
        distance: distance * 1000,
        duration,
        coordinates: destination,
        maneuver: 'straight'
      },
      {
        id: '2',
        instruction: 'You have arrived at your parking destination',
        distance: 0,
        duration: 0,
        coordinates: destination,
        maneuver: 'arrive'
      }
    ];

    return {
      id: `simple_route_${Date.now()}`,
      origin,
      destination,
      steps,
      distance: distance * 1000,
      duration,
      polyline: this.encodePolyline([origin, destination])
    };
  }

  private static isLocationInOfflineRegion(
    location: Coordinates,
    region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
  ): boolean {
    return (
      Math.abs(location.latitude - region.latitude) <= region.latitudeDelta / 2 &&
      Math.abs(location.longitude - region.longitude) <= region.longitudeDelta / 2
    );
  }

  private static async calculateFacilityRoute(
    layout: FacilityLayout,
    currentFloor: number,
    targetSpot: ParkingSpot
  ): Promise<FacilityNavigationRoute> {
    // Find target spot in layout
    const targetElement = layout.floors[currentFloor]?.elements.find(
      element => element.type === 'spot' && element.properties.number === targetSpot.number
    );

    if (!targetElement) {
      throw new Error('Target spot not found in facility layout');
    }

    // Find entrance
    const entrance = layout.floors[currentFloor]?.elements.find(
      element => element.type === 'entrance'
    );

    if (!entrance) {
      throw new Error('No entrance found on current floor');
    }

    // Generate detailed navigation steps
    const steps: FacilityNavigationStep[] = [];

    // Step 1: Enter facility
    steps.push({
      id: '1',
      instruction: 'Enter the parking facility through the main entrance',
      landmark: 'Main entrance',
      coordinates: entrance.position,
      type: 'entrance'
    });

    // Check if we need to use elevator or stairs
    const targetFloor = this.findSpotFloor(layout, targetSpot.number);
    if (targetFloor !== currentFloor) {
      const elevator = layout.floors[currentFloor]?.elements.find(
        element => element.type === 'elevator'
      );
      
      const stairs = layout.floors[currentFloor]?.elements.find(
        element => element.type === 'stairs'
      );

      if (elevator) {
        steps.push({
          id: '2',
          instruction: `Take the elevator to floor ${targetFloor}`,
          landmark: 'Elevator',
          coordinates: elevator.position,
          type: 'elevator'
        });
      } else if (stairs) {
        steps.push({
          id: '2',
          instruction: `Take the stairs to floor ${targetFloor}`,
          landmark: 'Stairs',
          coordinates: stairs.position,
          type: 'stairs'
        });
      }
    }

    // Generate path to parking spot
    const pathSteps = this.generateFacilityPath(
      entrance.position,
      targetElement.position,
      layout.floors[targetFloor || currentFloor]
    );

    steps.push(...pathSteps);

    // Final step: Arrive at spot
    steps.push({
      id: `arrive_${targetSpot.number}`,
      instruction: `You have arrived at parking spot ${targetSpot.number}`,
      landmark: `Spot ${targetSpot.number}`,
      coordinates: targetElement.position,
      type: 'arrive'
    });

    // Calculate estimated walk time based on distance
    const totalDistance = this.calculateFacilityRouteDistance(steps);
    const estimatedWalkTime = Math.max(120, totalDistance * 2); // 2 seconds per unit distance, minimum 2 minutes

    return {
      id: `facility_route_${Date.now()}`,
      facilityId: layout.id,
      floor: targetFloor || currentFloor,
      steps,
      estimatedWalkTime
    };
  }

  private static findSpotFloor(layout: FacilityLayout, spotNumber: string): number {
    for (let floorIndex = 0; floorIndex < layout.floors.length; floorIndex++) {
      const floor = layout.floors[floorIndex];
      const spot = floor.elements.find(
        element => element.type === 'spot' && element.properties.number === spotNumber
      );
      if (spot) {
        return floorIndex;
      }
    }
    return 0; // Default to ground floor
  }

  private static generateFacilityPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
    floor: any
  ): FacilityNavigationStep[] {
    const steps: FacilityNavigationStep[] = [];
    
    // Simple pathfinding - in a real implementation, this would use A* or similar
    const midPoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };

    // Add intermediate navigation steps
    if (this.calculateFacilityDistance(start, end) > 50) {
      steps.push({
        id: `nav_${Date.now()}`,
        instruction: 'Continue through the parking area',
        landmark: 'Parking area',
        coordinates: midPoint,
        type: 'turn'
      });
    }

    return steps;
  }

  private static calculateFacilityRouteDistance(steps: FacilityNavigationStep[]): number {
    let totalDistance = 0;
    for (let i = 1; i < steps.length; i++) {
      totalDistance += this.calculateFacilityDistance(
        steps[i - 1].coordinates,
        steps[i].coordinates
      );
    }
    return totalDistance;
  }

  private static async calculateFacilityExitRoute(
    layout: FacilityLayout,
    currentLocation: { x: number; y: number },
    currentFloor: number,
    exitElement: any
  ): Promise<FacilityNavigationRoute> {
    const steps: FacilityNavigationStep[] = [
      {
        id: '1',
        instruction: 'Head towards the exit',
        landmark: 'Exit',
        coordinates: exitElement.position,
        type: 'turn'
      },
      {
        id: '2',
        instruction: 'Exit the facility',
        landmark: 'Exit door',
        coordinates: exitElement.position,
        type: 'arrive'
      }
    ];

    return {
      id: `exit_route_${Date.now()}`,
      facilityId: layout.id,
      floor: currentFloor,
      steps,
      estimatedWalkTime: 180 // 3 minutes estimate
    };
  }

  private static async handleLocationUpdate(
    currentLocation: Coordinates,
    onStepUpdate?: (step: NavigationStep, stepIndex: number) => void,
    onArrival?: () => void
  ): Promise<void> {
    if (!this.currentRoute || !this.isNavigating) return;

    const currentStep = this.currentRoute.steps[this.currentStep];
    if (!currentStep) return;

    // Check if we're close to the current step
    const distanceToStep = this.calculateDistance(currentLocation, currentStep.coordinates);
    
    if (distanceToStep < 0.05) { // Within 50 meters
      // Move to next step
      this.currentStep++;
      
      if (this.currentStep >= this.currentRoute.steps.length) {
        // Arrived at destination
        await this.announceInstruction({ 
          ...currentStep, 
          instruction: 'You have arrived at your destination' 
        });
        onArrival?.();
        await this.stopNavigation();
        return;
      }

      const nextStep = this.currentRoute.steps[this.currentStep];
      await this.announceInstruction(nextStep);
      onStepUpdate?.(nextStep, this.currentStep);
    } else if (distanceToStep < (this.voiceSettings.announceDistance / 1000)) {
      // Announce upcoming turn
      await this.announceInstruction(currentStep);
    }
  }

  private static async startFacilityGuidance(
    route: FacilityNavigationRoute,
    onStepUpdate?: (step: FacilityNavigationStep) => void,
    onArrival?: () => void
  ): Promise<void> {
    for (let i = 0; i < route.steps.length; i++) {
      const step = route.steps[i];
      onStepUpdate?.(step);
      
      if (this.voiceSettings.enabled) {
        await Speech.speak(step.instruction, {
          language: this.voiceSettings.language,
          volume: this.voiceSettings.volume
        });
      }

      // Wait for user to complete step (in real implementation, this would be based on sensors/user input)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    onArrival?.();
  }

  private static async announceInstruction(step: NavigationStep): Promise<void> {
    if (!this.voiceSettings.enabled) return;

    try {
      // Prepare announcement text based on language
      let announcement = step.instruction;
      
      if (this.voiceSettings.language === 'fil') {
        announcement = this.translateToFilipino(step.instruction, step.maneuver);
      }

      // Add distance information for better guidance
      if (step.distance > 0) {
        const distanceText = this.formatDistanceForSpeech(step.distance);
        if (this.voiceSettings.language === 'fil') {
          announcement += ` sa loob ng ${distanceText}`;
        } else {
          announcement += ` in ${distanceText}`;
        }
      }

      // Pause any background audio
      await this.pauseBackgroundAudio();

      // Speak the instruction
      await Speech.speak(announcement, {
        language: this.voiceSettings.language === 'fil' ? 'tl-PH' : 'en-US',
        volume: this.voiceSettings.volume,
        pitch: 1.0,
        rate: 0.9 // Slightly slower for better comprehension
      });

      // Resume background audio after a delay
      setTimeout(() => {
        this.resumeBackgroundAudio();
      }, 2000);

    } catch (error) {
      console.error('Error announcing instruction:', error);
    }
  }

  private static translateToFilipino(instruction: string, maneuver: string): string {
    // Basic translation for common navigation instructions
    const translations: Record<string, string> = {
      'Head towards': 'Pumunta sa',
      'Turn left': 'Kumaliwa',
      'Turn right': 'Kumanan',
      'Continue straight': 'Magpatuloy nang tuwid',
      'You have arrived': 'Nakarating ka na',
      'parking destination': 'parking na patutunguhan',
      'Enter the parking facility': 'Pumasok sa parking facility',
      'Take the elevator': 'Sumakay sa elevator',
      'Take the stairs': 'Umakyat sa hagdan'
    };

    let translated = instruction;
    for (const [english, filipino] of Object.entries(translations)) {
      translated = translated.replace(new RegExp(english, 'gi'), filipino);
    }

    return translated;
  }

  private static formatDistanceForSpeech(meters: number): string {
    if (meters < 100) {
      return `${Math.round(meters)} meters`;
    } else if (meters < 1000) {
      return `${Math.round(meters / 10) * 10} meters`;
    } else {
      const km = (meters / 1000).toFixed(1);
      return `${km} kilometers`;
    }
  }

  private static async pauseBackgroundAudio(): Promise<void> {
    try {
      // In a real implementation, this would pause music/media apps
      // For now, we'll just set audio category to ensure navigation audio is prioritized
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  private static async resumeBackgroundAudio(): Promise<void> {
    try {
      // Reset audio mode to allow background audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        playThroughEarpieceAndroid: false
      });
    } catch (error) {
      console.error('Error resetting audio mode:', error);
    }
  }

  private static generateSpotFindingInstructions(
    layout: FacilityLayout,
    spotElement: any
  ): string[] {
    // Generate visual instructions based on spot location
    const instructions = [
      'Look for the parking spot number on the ground or wall',
      `Your spot ${spotElement.properties.number} should be in this area`,
      'Check for any reserved signs or markings',
      'Park within the designated lines'
    ];

    return instructions;
  }

  private static findNearestElement(
    location: { x: number; y: number },
    elements: any[]
  ): any {
    let nearest = elements[0];
    let minDistance = this.calculateFacilityDistance(location, nearest.position);

    for (const element of elements) {
      const distance = this.calculateFacilityDistance(location, element.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = element;
      }
    }

    return nearest;
  }

  private static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static calculateFacilityDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static encodePolyline(coordinates: Coordinates[]): string {
    // Simple polyline encoding (in real implementation, use proper encoding)
    return coordinates.map(coord => `${coord.latitude},${coord.longitude}`).join('|');
  }

  private static async getFacilityLayout(facilityId: string): Promise<FacilityLayout | null> {
    // In real implementation, this would fetch from API or local storage
    // For now, return null to indicate no layout available
    return null;
  }

  private static async loadVoiceSettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem('voiceSettings');
      if (settings) {
        this.voiceSettings = { ...this.voiceSettings, ...JSON.parse(settings) };
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  }

  private static async loadOfflineData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('offlineMapData');
      if (data) {
        this.offlineData = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }
}