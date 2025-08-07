import { UserId, Coordinates, Address } from './value-objects';
import { PricingConfig } from './pricing';
import { VehicleType } from '../types';

// Vehicle type enum for runtime comparisons
export enum VehicleTypeEnum {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  TRUCK = 'truck',
  VAN = 'van',
  SUV = 'suv',
}

export class Location {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly type: ParkingType,
    public readonly operatorId: UserId,
    public address: Address,
    public coordinates: Coordinates,
    public sections: Section[],
    public pricing: PricingConfig,
    public settings: LocationSettings,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateLocationData): Location {
    return new Location(
      UserId.generate().value,
      data.name,
      data.type,
      data.operatorId,
      new Address(data.address),
      new Coordinates(data.coordinates.latitude, data.coordinates.longitude),
      [],
      data.pricing,
      LocationSettings.create(data.settings),
      new Date(),
      new Date()
    );
  }

  addSection(sectionData: CreateSectionData): Section {
    const section = Section.create({
      ...sectionData,
      locationId: this.id,
    });

    this.sections.push(section);
    this.updatedAt = new Date();
    return section;
  }

  removeSection(sectionId: string): void {
    this.sections = this.sections.filter(s => s.id !== sectionId);
    this.updatedAt = new Date();
  }

  getSection(sectionId: string): Section | undefined {
    return this.sections.find(s => s.id === sectionId);
  }

  getAllSpots(): ParkingSpot[] {
    return this.sections.flatMap(section => section.getAllSpots());
  }

  getAvailableSpots(): ParkingSpot[] {
    return this.getAllSpots().filter(spot => spot.isAvailable());
  }

  getOccupiedSpots(): ParkingSpot[] {
    return this.getAllSpots().filter(spot => spot.isOccupied());
  }

  getTotalCapacity(): number {
    return this.getAllSpots().length;
  }

  getOccupancyRate(): number {
    const totalSpots = this.getTotalCapacity();
    if (totalSpots === 0) return 0;

    const occupiedSpots = this.getOccupiedSpots().length;
    return (occupiedSpots / totalSpots) * 100;
  }

  updatePricing(pricing: PricingConfig): void {
    this.pricing = pricing;
    this.updatedAt = new Date();
  }

  updateSettings(settings: Partial<LocationSettingsData>): void {
    this.settings = this.settings.update(settings);
    this.updatedAt = new Date();
  }

  isOperational(): boolean {
    return this.settings.isCurrentlyOpen();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      operatorId: this.operatorId.value,
      address: this.address.toJSON(),
      coordinates: this.coordinates.toJSON(),
      sections: this.sections.map(s => s.toJSON()),
      pricing: this.pricing.toJSON(),
      settings: this.settings.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class Section {
  constructor(
    public readonly id: string,
    public readonly locationId: string,
    public name: string,
    public zones: Zone[],
    public pricing?: PricingConfig,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateSectionData): Section {
    return new Section(
      UserId.generate().value,
      data.locationId!,
      data.name,
      [],
      data.pricing,
      new Date(),
      new Date()
    );
  }

  addZone(zoneData: CreateZoneData): Zone {
    const zone = Zone.create({
      ...zoneData,
      sectionId: this.id,
    });

    this.zones.push(zone);
    this.updatedAt = new Date();
    return zone;
  }

  removeZone(zoneId: string): void {
    this.zones = this.zones.filter(z => z.id !== zoneId);
    this.updatedAt = new Date();
  }

  getZone(zoneId: string): Zone | undefined {
    return this.zones.find(z => z.id === zoneId);
  }

  getAllSpots(): ParkingSpot[] {
    return this.zones.flatMap(zone => zone.spots);
  }

  getAvailableSpots(): ParkingSpot[] {
    return this.getAllSpots().filter(spot => spot.isAvailable());
  }

  getTotalCapacity(): number {
    return this.getAllSpots().length;
  }

  getOccupancyRate(): number {
    const totalSpots = this.getTotalCapacity();
    if (totalSpots === 0) return 0;

    const occupiedSpots = this.getAllSpots().filter(spot =>
      spot.isOccupied()
    ).length;
    return (occupiedSpots / totalSpots) * 100;
  }

  updatePricing(pricing: PricingConfig): void {
    this.pricing = pricing;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      locationId: this.locationId,
      name: this.name,
      zones: this.zones.map(z => z.toJSON()),
      pricing: this.pricing?.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class Zone {
  constructor(
    public readonly id: string,
    public readonly sectionId: string,
    public name: string,
    public spots: ParkingSpot[],
    public pricing?: PricingConfig,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateZoneData): Zone {
    return new Zone(
      UserId.generate().value,
      data.sectionId!,
      data.name,
      [],
      data.pricing,
      new Date(),
      new Date()
    );
  }

  addSpot(spotData: CreateSpotData): ParkingSpot {
    const spot = ParkingSpot.create({
      ...spotData,
      zoneId: this.id,
    });

    this.spots.push(spot);
    this.updatedAt = new Date();
    return spot;
  }

  removeSpot(spotId: string): void {
    this.spots = this.spots.filter(s => s.id !== spotId);
    this.updatedAt = new Date();
  }

  getSpot(spotId: string): ParkingSpot | undefined {
    return this.spots.find(s => s.id === spotId);
  }

  getAvailableSpots(): ParkingSpot[] {
    return this.spots.filter(spot => spot.isAvailable());
  }

  getOccupiedSpots(): ParkingSpot[] {
    return this.spots.filter(spot => spot.isOccupied());
  }

  getTotalCapacity(): number {
    return this.spots.length;
  }

  getOccupancyRate(): number {
    const totalSpots = this.getTotalCapacity();
    if (totalSpots === 0) return 0;

    const occupiedSpots = this.getOccupiedSpots().length;
    return (occupiedSpots / totalSpots) * 100;
  }

  updatePricing(pricing: PricingConfig): void {
    this.pricing = pricing;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      sectionId: this.sectionId,
      name: this.name,
      spots: this.spots.map(s => s.toJSON()),
      pricing: this.pricing?.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class ParkingSpot {
  constructor(
    public readonly id: string,
    public readonly zoneId: string,
    public number: string,
    public type: VehicleType,
    public status: SpotStatus,
    public coordinates: Coordinates,
    public amenities: string[],
    public pricing?: PricingConfig,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateSpotData): ParkingSpot {
    return new ParkingSpot(
      UserId.generate().value,
      data.zoneId!,
      data.number,
      data.type,
      SpotStatus.AVAILABLE,
      new Coordinates(data.coordinates.latitude, data.coordinates.longitude),
      data.amenities || [],
      data.pricing,
      new Date(),
      new Date()
    );
  }

  reserve(): void {
    if (this.status === SpotStatus.AVAILABLE) {
      this.status = SpotStatus.RESERVED;
      this.updatedAt = new Date();
    } else {
      throw new Error('Cannot reserve spot that is not available');
    }
  }

  occupy(): void {
    if (
      this.status === SpotStatus.AVAILABLE ||
      this.status === SpotStatus.RESERVED
    ) {
      this.status = SpotStatus.OCCUPIED;
      this.updatedAt = new Date();
    } else {
      throw new Error('Cannot occupy spot that is not available or reserved');
    }
  }

  makeAvailable(): void {
    if (this.status !== SpotStatus.MAINTENANCE) {
      this.status = SpotStatus.AVAILABLE;
      this.updatedAt = new Date();
    }
  }

  setMaintenance(): void {
    this.status = SpotStatus.MAINTENANCE;
    this.updatedAt = new Date();
  }

  isAvailable(): boolean {
    return this.status === SpotStatus.AVAILABLE;
  }

  isOccupied(): boolean {
    return this.status === SpotStatus.OCCUPIED;
  }

  isReserved(): boolean {
    return this.status === SpotStatus.RESERVED;
  }

  isInMaintenance(): boolean {
    return this.status === SpotStatus.MAINTENANCE;
  }

  canAccommodateVehicle(vehicleType: VehicleType): boolean {
    // Basic logic - can be extended based on business rules
    if (this.type === VehicleTypeEnum.MOTORCYCLE) {
      return vehicleType === VehicleTypeEnum.MOTORCYCLE;
    }

    if (this.type === VehicleTypeEnum.CAR) {
      return (
        vehicleType === VehicleTypeEnum.CAR ||
        vehicleType === VehicleTypeEnum.MOTORCYCLE
      );
    }

    if (this.type === VehicleTypeEnum.TRUCK) {
      return true; // Truck spots can accommodate all vehicle types
    }

    return this.type === vehicleType;
  }

  addAmenity(amenity: string): void {
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
      this.updatedAt = new Date();
    }
  }

  removeAmenity(amenity: string): void {
    const index = this.amenities.indexOf(amenity);
    if (index > -1) {
      this.amenities.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  updatePricing(pricing: PricingConfig): void {
    this.pricing = pricing;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      zoneId: this.zoneId,
      number: this.number,
      type: this.type,
      status: this.status,
      coordinates: this.coordinates.toJSON(),
      amenities: this.amenities,
      pricing: this.pricing?.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class LocationSettings {
  constructor(
    public operatingHours: OperatingHours,
    public maxBookingDuration: number, // in minutes
    public advanceBookingLimit: number, // in days
    public allowOvernight: boolean = false,
    public requirePrePayment: boolean = true
  ) {}

  static create(data: LocationSettingsData): LocationSettings {
    return new LocationSettings(
      new OperatingHours(data.operatingHours),
      data.maxBookingDuration,
      data.advanceBookingLimit,
      data.allowOvernight,
      data.requirePrePayment
    );
  }

  update(data: Partial<LocationSettingsData>): LocationSettings {
    return new LocationSettings(
      data.operatingHours
        ? new OperatingHours(data.operatingHours)
        : this.operatingHours,
      data.maxBookingDuration ?? this.maxBookingDuration,
      data.advanceBookingLimit ?? this.advanceBookingLimit,
      data.allowOvernight ?? this.allowOvernight,
      data.requirePrePayment ?? this.requirePrePayment
    );
  }

  isCurrentlyOpen(): boolean {
    return this.operatingHours.isCurrentlyOpen();
  }

  isOpenAt(date: Date): boolean {
    return this.operatingHours.isOpenAt(date);
  }

  getMaxBookingEndTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + this.maxBookingDuration * 60 * 1000);
  }

  getMaxAdvanceBookingDate(): Date {
    const now = new Date();
    return new Date(
      now.getTime() + this.advanceBookingLimit * 24 * 60 * 60 * 1000
    );
  }

  toJSON() {
    return {
      operatingHours: this.operatingHours.toJSON(),
      maxBookingDuration: this.maxBookingDuration,
      advanceBookingLimit: this.advanceBookingLimit,
      allowOvernight: this.allowOvernight,
      requirePrePayment: this.requirePrePayment,
    };
  }
}

export class OperatingHours {
  constructor(public schedule: DaySchedule[]) {}

  isCurrentlyOpen(): boolean {
    const now = new Date();
    return this.isOpenAt(now);
  }

  isOpenAt(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daySchedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isOpen) {
      return false;
    }

    if (daySchedule.is24Hours) {
      return true;
    }

    const currentTime = date.getHours() * 60 + date.getMinutes();
    const openTime = this.timeStringToMinutes(daySchedule.openTime!);
    const closeTime = this.timeStringToMinutes(daySchedule.closeTime!);

    if (closeTime < openTime) {
      // Overnight hours (e.g., 22:00 to 06:00)
      return currentTime >= openTime || currentTime <= closeTime;
    } else {
      // Same day hours (e.g., 08:00 to 18:00)
      return currentTime >= openTime && currentTime <= closeTime;
    }
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  toJSON() {
    return {
      schedule: this.schedule,
    };
  }
}

// Enums
export enum ParkingType {
  HOSTED = 'hosted',
  STREET = 'street',
  FACILITY = 'facility',
}

export enum SpotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

// Data Transfer Objects
export interface CreateLocationData {
  name: string;
  type: ParkingType;
  operatorId: UserId;
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
  settings: LocationSettingsData;
}

export interface CreateSectionData {
  locationId?: string;
  name: string;
  pricing?: PricingConfig;
}

export interface CreateZoneData {
  sectionId?: string;
  name: string;
  pricing?: PricingConfig;
}

export interface CreateSpotData {
  zoneId?: string;
  number: string;
  type: VehicleType;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  pricing?: PricingConfig;
}

export interface LocationSettingsData {
  operatingHours: DaySchedule[];
  maxBookingDuration: number;
  advanceBookingLimit: number;
  allowOvernight?: boolean;
  requirePrePayment?: boolean;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  is24Hours: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
}
