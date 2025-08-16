// Parking-related type definitions
import type { VehicleType, ParkingType, SpotStatus } from './common';

export interface Location {
  id: string;
  name: string;
  type: 'hosted' | 'street' | 'facility';
  operatorId: string;
  address: Address;
  coordinates: Coordinates;
  sections: Section[];
  pricing?: any; // Will be properly typed when PricingConfig is available
  settings: LocationSettings;
}

export interface Section {
  id: string;
  locationId: string;
  name: string;
  zones: Zone[];
  pricing?: any; // Will be properly typed when PricingConfig is available
}

export interface Zone {
  id: string;
  sectionId: string;
  name: string;
  spots: ParkingSpot[];
  pricing?: any; // Will be properly typed when PricingConfig is available
}

export interface ParkingSpot {
  id: string;
  zoneId: string;
  number: string;
  type: VehicleType;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  coordinates: Coordinates;
  pricing?: any; // Will be properly typed when PricingConfig is available
  amenities: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationSettings {
  operatingHours: OperatingHours;
  maxBookingDuration: number;
  advanceBookingLimit: number;
}

export interface OperatingHours {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export interface TimeSlot {
  open: string;
  close: string;
  is24Hours: boolean;
}

// VehicleType is now imported from common types
