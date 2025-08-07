import { Money, Percentage, UserId } from './value-objects';
import { VehicleType } from '../types';

export class PricingConfig {
  constructor(
    public readonly id: string,
    public baseRate: Money,
    public vehicleTypeRates: VehicleTypeRate[],
    public timeBasedRates: TimeBasedRate[],
    public holidayRates: HolidayRate[],
    public occupancyMultiplier: number,
    public vatRate: Percentage,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreatePricingConfigData): PricingConfig {
    return new PricingConfig(
      UserId.generate().value,
      new Money(data.baseRate),
      data.vehicleTypeRates?.map(vtr => VehicleTypeRate.create(vtr)) || [],
      data.timeBasedRates?.map(tbr => TimeBasedRate.create(tbr)) || [],
      data.holidayRates?.map(hr => HolidayRate.create(hr)) || [],
      data.occupancyMultiplier || 1.0,
      new Percentage(data.vatRate || 12),
      new Date(),
      new Date()
    );
  }

  calculateRate(params: RateCalculationParams): PricingCalculation {
    let rate = this.baseRate;

    // Apply vehicle type rate
    const vehicleTypeRate = this.getVehicleTypeRate(params.vehicleType);
    if (vehicleTypeRate) {
      rate = vehicleTypeRate.rate;
    }

    // Apply time-based rate
    const timeBasedRate = this.getTimeBasedRate(params.startTime);
    if (timeBasedRate) {
      rate = rate.multiply(timeBasedRate.multiplier);
    }

    // Apply holiday rate
    const holidayRate = this.getHolidayRate(params.startTime);
    if (holidayRate) {
      rate = rate.multiply(holidayRate.multiplier);
    }

    // Apply occupancy multiplier
    if (params.occupancyRate !== undefined) {
      const occupancyAdjustment = this.calculateOccupancyAdjustment(
        params.occupancyRate
      );
      rate = rate.multiply(occupancyAdjustment);
    }

    // Calculate total based on duration
    const durationInHours = params.durationInMinutes / 60;
    const subtotal = rate.multiply(durationInHours);

    return new PricingCalculation(
      rate,
      subtotal,
      durationInHours,
      params.occupancyRate,
      vehicleTypeRate,
      timeBasedRate,
      holidayRate
    );
  }

  private getVehicleTypeRate(
    vehicleType: VehicleType
  ): VehicleTypeRate | undefined {
    return this.vehicleTypeRates.find(vtr => vtr.vehicleType === vehicleType);
  }

  private getTimeBasedRate(dateTime: Date): TimeBasedRate | undefined {
    const dayOfWeek = dateTime.getDay();
    const timeInMinutes = dateTime.getHours() * 60 + dateTime.getMinutes();

    return this.timeBasedRates.find(
      tbr =>
        tbr.dayOfWeek === dayOfWeek &&
        timeInMinutes >= tbr.startTimeInMinutes &&
        timeInMinutes <= tbr.endTimeInMinutes
    );
  }

  private getHolidayRate(dateTime: Date): HolidayRate | undefined {
    return this.holidayRates.find(hr => hr.appliesToDate(dateTime));
  }

  private calculateOccupancyAdjustment(occupancyRate: number): number {
    // Dynamic pricing based on occupancy
    if (occupancyRate >= 90) return 1.5; // 50% increase when 90%+ occupied
    if (occupancyRate >= 75) return 1.25; // 25% increase when 75%+ occupied
    if (occupancyRate >= 50) return 1.1; // 10% increase when 50%+ occupied
    if (occupancyRate <= 25) return 0.9; // 10% discount when 25% or less occupied

    return 1.0; // No adjustment for 26-49% occupancy
  }

  addVehicleTypeRate(vehicleTypeRate: VehicleTypeRate): void {
    const existingIndex = this.vehicleTypeRates.findIndex(
      vtr => vtr.vehicleType === vehicleTypeRate.vehicleType
    );

    if (existingIndex >= 0) {
      this.vehicleTypeRates[existingIndex] = vehicleTypeRate;
    } else {
      this.vehicleTypeRates.push(vehicleTypeRate);
    }

    this.updatedAt = new Date();
  }

  removeVehicleTypeRate(vehicleType: VehicleType): void {
    this.vehicleTypeRates = this.vehicleTypeRates.filter(
      vtr => vtr.vehicleType !== vehicleType
    );
    this.updatedAt = new Date();
  }

  addTimeBasedRate(timeBasedRate: TimeBasedRate): void {
    this.timeBasedRates.push(timeBasedRate);
    this.updatedAt = new Date();
  }

  removeTimeBasedRate(id: string): void {
    this.timeBasedRates = this.timeBasedRates.filter(tbr => tbr.id !== id);
    this.updatedAt = new Date();
  }

  addHolidayRate(holidayRate: HolidayRate): void {
    this.holidayRates.push(holidayRate);
    this.updatedAt = new Date();
  }

  removeHolidayRate(id: string): void {
    this.holidayRates = this.holidayRates.filter(hr => hr.id !== id);
    this.updatedAt = new Date();
  }

  updateBaseRate(baseRate: Money): void {
    this.baseRate = baseRate;
    this.updatedAt = new Date();
  }

  updateVATRate(vatRate: Percentage): void {
    this.vatRate = vatRate;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      baseRate: this.baseRate.toJSON(),
      vehicleTypeRates: this.vehicleTypeRates.map(vtr => vtr.toJSON()),
      timeBasedRates: this.timeBasedRates.map(tbr => tbr.toJSON()),
      holidayRates: this.holidayRates.map(hr => hr.toJSON()),
      occupancyMultiplier: this.occupancyMultiplier,
      vatRate: this.vatRate.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class VehicleTypeRate {
  constructor(
    public readonly id: string,
    public vehicleType: VehicleType,
    public rate: Money,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateVehicleTypeRateData): VehicleTypeRate {
    return new VehicleTypeRate(
      UserId.generate().value,
      data.vehicleType,
      new Money(data.rate),
      new Date()
    );
  }

  updateRate(rate: Money): void {
    this.rate = rate;
  }

  toJSON() {
    return {
      id: this.id,
      vehicleType: this.vehicleType,
      rate: this.rate.toJSON(),
      createdAt: this.createdAt,
    };
  }
}

export class TimeBasedRate {
  constructor(
    public readonly id: string,
    public dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
    public startTimeInMinutes: number,
    public endTimeInMinutes: number,
    public multiplier: number,
    public name: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateTimeBasedRateData): TimeBasedRate {
    const startTimeInMinutes = TimeBasedRate.timeStringToMinutes(
      data.startTime
    );
    const endTimeInMinutes = TimeBasedRate.timeStringToMinutes(data.endTime);

    return new TimeBasedRate(
      UserId.generate().value,
      data.dayOfWeek,
      startTimeInMinutes,
      endTimeInMinutes,
      data.multiplier,
      data.name,
      new Date()
    );
  }

  private static timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  getStartTime(): string {
    return TimeBasedRate.minutesToTimeString(this.startTimeInMinutes);
  }

  getEndTime(): string {
    return TimeBasedRate.minutesToTimeString(this.endTimeInMinutes);
  }

  getDayName(): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[this.dayOfWeek];
  }

  updateTime(startTime: string, endTime: string): void {
    this.startTimeInMinutes = TimeBasedRate.timeStringToMinutes(startTime);
    this.endTimeInMinutes = TimeBasedRate.timeStringToMinutes(endTime);
  }

  updateMultiplier(multiplier: number): void {
    if (multiplier <= 0) {
      throw new Error('Multiplier must be greater than 0');
    }
    this.multiplier = multiplier;
  }

  toJSON() {
    return {
      id: this.id,
      dayOfWeek: this.dayOfWeek,
      startTime: this.getStartTime(),
      endTime: this.getEndTime(),
      multiplier: this.multiplier,
      name: this.name,
      createdAt: this.createdAt,
    };
  }
}

export class HolidayRate {
  constructor(
    public readonly id: string,
    public name: string,
    public date: Date,
    public multiplier: number,
    public isRecurring: boolean,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateHolidayRateData): HolidayRate {
    return new HolidayRate(
      UserId.generate().value,
      data.name,
      data.date,
      data.multiplier,
      data.isRecurring,
      new Date()
    );
  }

  appliesToDate(date: Date): boolean {
    if (this.isRecurring) {
      // For recurring holidays, check month and day only
      return (
        date.getMonth() === this.date.getMonth() &&
        date.getDate() === this.date.getDate()
      );
    } else {
      // For one-time holidays, check exact date
      return (
        date.getFullYear() === this.date.getFullYear() &&
        date.getMonth() === this.date.getMonth() &&
        date.getDate() === this.date.getDate()
      );
    }
  }

  updateMultiplier(multiplier: number): void {
    if (multiplier <= 0) {
      throw new Error('Multiplier must be greater than 0');
    }
    this.multiplier = multiplier;
  }

  updateDate(date: Date): void {
    this.date = date;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      date: this.date,
      multiplier: this.multiplier,
      isRecurring: this.isRecurring,
      createdAt: this.createdAt,
    };
  }
}

export class PricingCalculation {
  constructor(
    public readonly hourlyRate: Money,
    public readonly subtotal: Money,
    public readonly durationInHours: number,
    public readonly occupancyRate?: number,
    public readonly appliedVehicleTypeRate?: VehicleTypeRate,
    public readonly appliedTimeBasedRate?: TimeBasedRate,
    public readonly appliedHolidayRate?: HolidayRate
  ) {}

  getBreakdown(): PricingBreakdown {
    return {
      baseRate: this.hourlyRate,
      duration: this.durationInHours,
      subtotal: this.subtotal,
      vehicleTypeAdjustment: this.appliedVehicleTypeRate
        ? {
            type: this.appliedVehicleTypeRate.vehicleType,
            rate: this.appliedVehicleTypeRate.rate,
          }
        : undefined,
      timeBasedAdjustment: this.appliedTimeBasedRate
        ? {
            name: this.appliedTimeBasedRate.name,
            multiplier: this.appliedTimeBasedRate.multiplier,
          }
        : undefined,
      holidayAdjustment: this.appliedHolidayRate
        ? {
            name: this.appliedHolidayRate.name,
            multiplier: this.appliedHolidayRate.multiplier,
          }
        : undefined,
      occupancyAdjustment: this.occupancyRate
        ? {
            rate: this.occupancyRate,
            multiplier: this.calculateOccupancyMultiplier(),
          }
        : undefined,
    };
  }

  private calculateOccupancyMultiplier(): number {
    if (!this.occupancyRate) return 1.0;

    if (this.occupancyRate >= 90) return 1.5;
    if (this.occupancyRate >= 75) return 1.25;
    if (this.occupancyRate >= 50) return 1.1;
    if (this.occupancyRate <= 25) return 0.9;

    return 1.0;
  }

  toJSON() {
    return {
      hourlyRate: this.hourlyRate.toJSON(),
      subtotal: this.subtotal.toJSON(),
      durationInHours: this.durationInHours,
      occupancyRate: this.occupancyRate,
      breakdown: this.getBreakdown(),
    };
  }
}

// Hierarchical Pricing Inheritance
export class HierarchicalPricingResolver {
  static resolvePricing(
    locationPricing?: PricingConfig,
    sectionPricing?: PricingConfig,
    zonePricing?: PricingConfig,
    spotPricing?: PricingConfig
  ): PricingConfig {
    // Use the most specific pricing available (spot > zone > section > location)
    return (
      spotPricing ||
      zonePricing ||
      sectionPricing ||
      locationPricing ||
      this.getDefaultPricing()
    );
  }

  private static getDefaultPricing(): PricingConfig {
    return PricingConfig.create({
      baseRate: 50, // Default PHP 50 per hour
      vatRate: 12,
      occupancyMultiplier: 1.0,
    });
  }

  static inheritPricing(
    parentPricing: PricingConfig,
    childOverrides?: Partial<CreatePricingConfigData>
  ): PricingConfig {
    if (!childOverrides) {
      return parentPricing;
    }

    return PricingConfig.create({
      baseRate: childOverrides.baseRate ?? parentPricing.baseRate.value,
      vehicleTypeRates:
        childOverrides.vehicleTypeRates ??
        parentPricing.vehicleTypeRates.map(vtr => ({
          vehicleType: vtr.vehicleType,
          rate: vtr.rate.value,
        })),
      timeBasedRates:
        childOverrides.timeBasedRates ??
        parentPricing.timeBasedRates.map(tbr => ({
          dayOfWeek: tbr.dayOfWeek,
          startTime: tbr.getStartTime(),
          endTime: tbr.getEndTime(),
          multiplier: tbr.multiplier,
          name: tbr.name,
        })),
      holidayRates:
        childOverrides.holidayRates ??
        parentPricing.holidayRates.map(hr => ({
          name: hr.name,
          date: hr.date,
          multiplier: hr.multiplier,
          isRecurring: hr.isRecurring,
        })),
      occupancyMultiplier:
        childOverrides.occupancyMultiplier ?? parentPricing.occupancyMultiplier,
      vatRate: childOverrides.vatRate ?? parentPricing.vatRate.value,
    });
  }
}

// Data Transfer Objects and Interfaces
export interface CreatePricingConfigData {
  baseRate: number;
  vehicleTypeRates?: CreateVehicleTypeRateData[];
  timeBasedRates?: CreateTimeBasedRateData[];
  holidayRates?: CreateHolidayRateData[];
  occupancyMultiplier?: number;
  vatRate?: number;
}

export interface CreateVehicleTypeRateData {
  vehicleType: VehicleType;
  rate: number;
}

export interface CreateTimeBasedRateData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  multiplier: number;
  name: string;
}

export interface CreateHolidayRateData {
  name: string;
  date: Date;
  multiplier: number;
  isRecurring: boolean;
}

export interface RateCalculationParams {
  vehicleType: VehicleType;
  startTime: Date;
  durationInMinutes: number;
  occupancyRate?: number;
}

export interface PricingBreakdown {
  baseRate: Money;
  duration: number;
  subtotal: Money;
  vehicleTypeAdjustment?: {
    type: VehicleType;
    rate: Money;
  };
  timeBasedAdjustment?: {
    name: string;
    multiplier: number;
  };
  holidayAdjustment?: {
    name: string;
    multiplier: number;
  };
  occupancyAdjustment?: {
    rate: number;
    multiplier: number;
  };
}
