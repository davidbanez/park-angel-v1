import { createClient } from '@supabase/supabase-js';
import { Location, Section, Zone, ParkingSpot } from '../models/location';
import { ParkingType, SpotStatus } from '../types/common';
import { PricingConfig, HierarchicalPricingResolver } from '../models/pricing';
import { HierarchyLevel } from './hierarchical-pricing';
import { Booking } from '../models/booking';
import { BookingStatus, PaymentStatus } from '../types/common';
import { UserId, Coordinates, Address } from '../models/value-objects';
import { VehicleType } from '../types';

export interface LocationManagementService {
  createLocation(data: CreateLocationRequest): Promise<Location>;
  updateLocation(id: string, data: UpdateLocationRequest): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  getLocation(id: string): Promise<Location | null>;
  getLocationsByOperator(operatorId: string): Promise<Location[]>;
  getLocationHierarchy(locationId: string): Promise<LocationHierarchy>;
  
  // Section management
  createSection(locationId: string, data: CreateSectionRequest): Promise<Section>;
  updateSection(id: string, data: UpdateSectionRequest): Promise<Section>;
  deleteSection(id: string): Promise<void>;
  
  // Zone management
  createZone(sectionId: string, data: CreateZoneRequest): Promise<Zone>;
  updateZone(id: string, data: UpdateZoneRequest): Promise<Zone>;
  deleteZone(id: string): Promise<void>;
  
  // Spot management
  createSpot(zoneId: string, data: CreateSpotRequest): Promise<ParkingSpot>;
  updateSpot(id: string, data: UpdateSpotRequest): Promise<ParkingSpot>;
  deleteSpot(id: string): Promise<void>;
  getSpot(id: string): Promise<ParkingSpot | null>;
}

export interface SpotAvailabilityService {
  checkAvailability(spotId: string, startTime: Date, endTime: Date): Promise<boolean>;
  getAvailableSpots(criteria: AvailabilitySearchCriteria): Promise<ParkingSpot[]>;
  reserveSpot(spotId: string, reservationData: SpotReservationData): Promise<void>;
  releaseSpot(spotId: string): Promise<void>;
  getSpotOccupancy(spotId: string): Promise<SpotOccupancyInfo>;
  getLocationOccupancy(locationId: string): Promise<LocationOccupancyInfo>;
}

export interface DynamicPricingService {
  calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResult>;
  updatePricing(hierarchyLevel: HierarchyLevel, id: string, pricing: PricingConfig): Promise<void>;
  getPricing(hierarchyLevel: HierarchyLevel, id: string): Promise<PricingConfig | null>;
  getEffectivePricing(spotId: string): Promise<PricingConfig>;
}

export interface BookingWorkflowService {
  createBooking(data: CreateBookingRequest): Promise<Booking>;
  confirmBooking(bookingId: string): Promise<Booking>;
  startBooking(bookingId: string): Promise<Booking>;
  completeBooking(bookingId: string): Promise<Booking>;
  cancelBooking(bookingId: string, reason?: string): Promise<Booking>;
  extendBooking(bookingId: string, newEndTime: Date): Promise<Booking>;
  getBooking(id: string): Promise<Booking | null>;
  getUserBookings(userId: string, status?: BookingStatus): Promise<Booking[]>;
  getSpotBookings(spotId: string, dateRange?: DateRange): Promise<Booking[]>;
}

export interface RealtimeOccupancyService {
  subscribeToSpotUpdates(spotId: string, callback: (spot: ParkingSpot) => void): () => void;
  subscribeToLocationUpdates(locationId: string, callback: (occupancy: LocationOccupancyInfo) => void): () => void;
  updateSpotStatus(spotId: string, status: SpotStatus): Promise<void>;
  broadcastOccupancyUpdate(locationId: string): Promise<void>;
}

export interface ParkingTypeService {
  getTypeSpecificLogic(type: ParkingType): ParkingTypeLogic;
  validateTypeSpecificRules(type: ParkingType, data: any): Promise<ValidationResult>;
  getTypeSpecificPricing(type: ParkingType, basePrice: number): Promise<number>;
}

// Implementation classes
export class LocationManagementServiceImpl implements LocationManagementService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async createLocation(data: CreateLocationRequest): Promise<Location> {
    const location = Location.create({
      name: data.name,
      type: data.type,
      operatorId: new UserId(data.operatorId),
      address: data.address,
      coordinates: data.coordinates,
      pricing: data.pricing,
      settings: data.settings
    });

    const { data: insertedData, error } = await this.supabase
      .from('locations')
      .insert({
        id: location.id,
        name: location.name,
        type: location.type,
        operator_id: location.operatorId.value,
        address: location.address.toJSON(),
        coordinates: location.coordinates.toJSON(),
        settings: location.settings.toJSON(),
        pricing_config: location.pricing.toJSON()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create location: ${error.message}`);
    
    return location;
  }

  async updateLocation(id: string, data: UpdateLocationRequest): Promise<Location> {
    const location = await this.getLocation(id);
    if (!location) throw new Error('Location not found');

    if (data.name) location.name = data.name;
    if (data.address) location.address = new Address(data.address);
    if (data.coordinates) location.coordinates = new Coordinates(data.coordinates.latitude, data.coordinates.longitude);
    if (data.pricing) location.updatePricing(data.pricing);
    if (data.settings) location.updateSettings(data.settings);

    const { error } = await this.supabase
      .from('locations')
      .update({
        name: location.name,
        address: location.address.toJSON(),
        coordinates: location.coordinates.toJSON(),
        settings: location.settings.toJSON(),
        pricing_config: location.pricing.toJSON(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to update location: ${error.message}`);
    
    return location;
  }

  async deleteLocation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete location: ${error.message}`);
  }

  async getLocation(id: string): Promise<Location | null> {
    const { data, error } = await this.supabase
      .from('locations')
      .select(`
        *,
        sections (
          *,
          zones (
            *,
            parking_spots (*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get location: ${error.message}`);
    }

    return this.mapToLocationModel(data);
  }

  async getLocationsByOperator(operatorId: string): Promise<Location[]> {
    const { data, error } = await this.supabase
      .from('locations')
      .select(`
        *,
        sections (
          *,
          zones (
            *,
            parking_spots (*)
          )
        )
      `)
      .eq('operator_id', operatorId);

    if (error) throw new Error(`Failed to get locations: ${error.message}`);
    
    return data.map(item => this.mapToLocationModel(item));
  }

  async getLocationHierarchy(locationId: string): Promise<LocationHierarchy> {
    const location = await this.getLocation(locationId);
    if (!location) throw new Error('Location not found');

    return {
      location,
      totalSpots: location.getTotalCapacity(),
      availableSpots: location.getAvailableSpots().length,
      occupancyRate: location.getOccupancyRate(),
      sections: location.sections.map(section => ({
        section,
        totalSpots: section.getTotalCapacity(),
        availableSpots: section.getAvailableSpots().length,
        occupancyRate: section.getOccupancyRate(),
        zones: section.zones.map(zone => ({
          zone,
          totalSpots: zone.getTotalCapacity(),
          availableSpots: zone.getAvailableSpots().length,
          occupancyRate: zone.getOccupancyRate()
        }))
      }))
    };
  }

  async createSection(locationId: string, data: CreateSectionRequest): Promise<Section> {
    const section = Section.create({
      locationId,
      name: data.name,
      pricing: data.pricing
    });

    const { error } = await this.supabase
      .from('sections')
      .insert({
        id: section.id,
        location_id: section.locationId,
        name: section.name,
        pricing_config: section.pricing?.toJSON()
      });

    if (error) throw new Error(`Failed to create section: ${error.message}`);
    
    return section;
  }

  async updateSection(id: string, data: UpdateSectionRequest): Promise<Section> {
    const { data: sectionData, error: fetchError } = await this.supabase
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(`Failed to get section: ${fetchError.message}`);

    const section = this.mapToSectionModel(sectionData);
    
    if (data.name) section.name = data.name;
    if (data.pricing) section.updatePricing(data.pricing);

    const { error } = await this.supabase
      .from('sections')
      .update({
        name: section.name,
        pricing_config: section.pricing?.toJSON(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to update section: ${error.message}`);
    
    return section;
  }

  async deleteSection(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('sections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete section: ${error.message}`);
  }

  async createZone(sectionId: string, data: CreateZoneRequest): Promise<Zone> {
    const zone = Zone.create({
      sectionId,
      name: data.name,
      pricing: data.pricing
    });

    const { error } = await this.supabase
      .from('zones')
      .insert({
        id: zone.id,
        section_id: zone.sectionId,
        name: zone.name,
        pricing_config: zone.pricing?.toJSON()
      });

    if (error) throw new Error(`Failed to create zone: ${error.message}`);
    
    return zone;
  }

  async updateZone(id: string, data: UpdateZoneRequest): Promise<Zone> {
    const { data: zoneData, error: fetchError } = await this.supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(`Failed to get zone: ${fetchError.message}`);

    const zone = this.mapToZoneModel(zoneData);
    
    if (data.name) zone.name = data.name;
    if (data.pricing) zone.updatePricing(data.pricing);

    const { error } = await this.supabase
      .from('zones')
      .update({
        name: zone.name,
        pricing_config: zone.pricing?.toJSON(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to update zone: ${error.message}`);
    
    return zone;
  }

  async deleteZone(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('zones')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete zone: ${error.message}`);
  }

  async createSpot(zoneId: string, data: CreateSpotRequest): Promise<ParkingSpot> {
    const spot = ParkingSpot.create({
      zoneId,
      number: data.number,
      type: data.type,
      coordinates: data.coordinates,
      amenities: data.amenities,
      pricing: data.pricing
    });

    const { error } = await this.supabase
      .from('parking_spots')
      .insert({
        id: spot.id,
        zone_id: spot.zoneId,
        number: spot.number,
        type: spot.type,
        status: spot.status,
        coordinates: spot.coordinates.toJSON(),
        amenities: spot.amenities,
        pricing_config: spot.pricing?.toJSON()
      });

    if (error) throw new Error(`Failed to create parking spot: ${error.message}`);
    
    return spot;
  }

  async updateSpot(id: string, data: UpdateSpotRequest): Promise<ParkingSpot> {
    const { data: spotData, error: fetchError } = await this.supabase
      .from('parking_spots')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(`Failed to get parking spot: ${fetchError.message}`);

    const spot = this.mapToSpotModel(spotData);
    
    if (data.number) spot.number = data.number;
    if (data.type) spot.type = data.type;
    if (data.coordinates) spot.coordinates = new Coordinates(data.coordinates.latitude, data.coordinates.longitude);
    if (data.amenities) spot.amenities = data.amenities;
    if (data.pricing) spot.updatePricing(data.pricing);

    const { error } = await this.supabase
      .from('parking_spots')
      .update({
        number: spot.number,
        type: spot.type,
        coordinates: spot.coordinates.toJSON(),
        amenities: spot.amenities,
        pricing_config: spot.pricing?.toJSON(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to update parking spot: ${error.message}`);
    
    return spot;
  }

  async deleteSpot(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('parking_spots')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete parking spot: ${error.message}`);
  }

  async getSpot(id: string): Promise<ParkingSpot | null> {
    const { data, error } = await this.supabase
      .from('parking_spots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get parking spot: ${error.message}`);
    }

    return this.mapToSpotModel(data);
  }

  private mapToLocationModel(data: any): Location {
    const location = new Location(
      data.id,
      data.name,
      data.type as ParkingType,
      new UserId(data.operator_id),
      new Address(data.address),
      new Coordinates(data.coordinates.lat, data.coordinates.lng),
      [],
      PricingConfig.create(data.pricing_config || {}),
      data.settings,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    if (data.sections) {
      location.sections = data.sections.map((sectionData: any) => {
        const section = this.mapToSectionModel(sectionData);
        if (sectionData.zones) {
          section.zones = sectionData.zones.map((zoneData: any) => {
            const zone = this.mapToZoneModel(zoneData);
            if (zoneData.parking_spots) {
              zone.spots = zoneData.parking_spots.map((spotData: any) => this.mapToSpotModel(spotData));
            }
            return zone;
          });
        }
        return section;
      });
    }

    return location;
  }

  private mapToSectionModel(data: any): Section {
    return new Section(
      data.id,
      data.location_id,
      data.name,
      [],
      data.pricing_config ? PricingConfig.create(data.pricing_config) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  private mapToZoneModel(data: any): Zone {
    return new Zone(
      data.id,
      data.section_id,
      data.name,
      [],
      data.pricing_config ? PricingConfig.create(data.pricing_config) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  private mapToSpotModel(data: any): ParkingSpot {
    return new ParkingSpot(
      data.id,
      data.zone_id,
      data.number,
      data.type as VehicleType,
      data.status as SpotStatus,
      new Coordinates(data.coordinates.lat, data.coordinates.lng),
      data.amenities || [],
      data.pricing_config ? PricingConfig.create(data.pricing_config) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }
}

// Data Transfer Objects
export interface CreateLocationRequest {
  name: string;
  type: ParkingType;
  operatorId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pricing: PricingConfig;
  settings: any;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  pricing?: PricingConfig;
  settings?: any;
}

export interface CreateSectionRequest {
  name: string;
  pricing?: PricingConfig;
}

export interface UpdateSectionRequest {
  name?: string;
  pricing?: PricingConfig;
}

export interface CreateZoneRequest {
  name: string;
  pricing?: PricingConfig;
}

export interface UpdateZoneRequest {
  name?: string;
  pricing?: PricingConfig;
}

export interface CreateSpotRequest {
  number: string;
  type: VehicleType;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  pricing?: PricingConfig;
}

export interface UpdateSpotRequest {
  number?: string;
  type?: VehicleType;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  pricing?: PricingConfig;
}

export interface LocationHierarchy {
  location: Location;
  totalSpots: number;
  availableSpots: number;
  occupancyRate: number;
  sections: SectionHierarchy[];
}

export interface SectionHierarchy {
  section: Section;
  totalSpots: number;
  availableSpots: number;
  occupancyRate: number;
  zones: ZoneHierarchy[];
}

export interface ZoneHierarchy {
  zone: Zone;
  totalSpots: number;
  availableSpots: number;
  occupancyRate: number;
}

export interface AvailabilitySearchCriteria {
  locationId?: string;
  sectionId?: string;
  zoneId?: string;
  vehicleType?: VehicleType;
  startTime: Date;
  endTime: Date;
  amenities?: string[];
  maxPrice?: number;
}

export interface SpotReservationData {
  userId: string;
  startTime: Date;
  endTime: Date;
}

export interface SpotOccupancyInfo {
  spotId: string;
  status: SpotStatus;
  currentBooking?: Booking;
  nextBooking?: Booking;
  availableUntil?: Date;
}

export interface LocationOccupancyInfo {
  locationId: string;
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  reservedSpots: number;
  maintenanceSpots: number;
  occupancyRate: number;
  lastUpdated: Date;
}

export interface PriceCalculationRequest {
  spotId: string;
  vehicleType: VehicleType;
  startTime: Date;
  endTime: Date;
  userId?: string;
}

export interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  discounts: any[];
  vatAmount: number;
  totalAmount: number;
  breakdown: any;
}

export interface CreateBookingRequest {
  userId: string;
  spotId: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}



export interface ParkingTypeLogic {
  validateBooking(booking: any): Promise<ValidationResult>;
  calculatePrice(basePrice: number, params: any): Promise<number>;
  getAccessInstructions(spotId: string): Promise<string>;
}

// Extended interface for hosted parking specific methods
export interface HostedParkingLogicInterface extends ParkingTypeLogic {
  checkHostAvailability(availability: any, startTime: Date, endTime: Date): boolean;
  validateGuestRequirements(userId: string, requirements: any): Promise<ValidationResult>;
  getTimeBasedRate(rates: any[], startTime: Date): any;
  getSeasonalRate(rates: any[], startTime: Date): any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}