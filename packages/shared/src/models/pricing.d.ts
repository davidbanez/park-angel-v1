import { Money, Percentage } from './value-objects';
import { VehicleType } from '../types/common';
export declare class PricingConfig {
    readonly id: string;
    baseRate: Money;
    vehicleTypeRates: VehicleTypeRate[];
    timeBasedRates: TimeBasedRate[];
    holidayRates: HolidayRate[];
    occupancyMultiplier: number;
    vatRate: Percentage;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, baseRate: Money, vehicleTypeRates: VehicleTypeRate[], timeBasedRates: TimeBasedRate[], holidayRates: HolidayRate[], occupancyMultiplier: number, vatRate: Percentage, createdAt?: Date, updatedAt?: Date);
    static create(data: CreatePricingConfigData): PricingConfig;
    calculateRate(params: RateCalculationParams): PricingCalculation;
    private getVehicleTypeRate;
    private getTimeBasedRate;
    private getHolidayRate;
    private calculateOccupancyAdjustment;
    addVehicleTypeRate(vehicleTypeRate: VehicleTypeRate): void;
    removeVehicleTypeRate(vehicleType: VehicleType): void;
    addTimeBasedRate(timeBasedRate: TimeBasedRate): void;
    removeTimeBasedRate(id: string): void;
    addHolidayRate(holidayRate: HolidayRate): void;
    removeHolidayRate(id: string): void;
    updateBaseRate(baseRate: Money): void;
    updateVATRate(vatRate: Percentage): void;
    toJSON(): {
        id: string;
        baseRate: {
            value: number;
            currency: string;
        };
        vehicleTypeRates: {
            id: string;
            vehicleType: VehicleType;
            rate: {
                value: number;
                currency: string;
            };
            createdAt: Date;
        }[];
        timeBasedRates: {
            id: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            multiplier: number;
            name: string;
            createdAt: Date;
        }[];
        holidayRates: {
            id: string;
            name: string;
            date: Date;
            multiplier: number;
            isRecurring: boolean;
            createdAt: Date;
        }[];
        occupancyMultiplier: number;
        vatRate: number;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class VehicleTypeRate {
    readonly id: string;
    vehicleType: VehicleType;
    rate: Money;
    readonly createdAt: Date;
    constructor(id: string, vehicleType: VehicleType, rate: Money, createdAt?: Date);
    static create(data: CreateVehicleTypeRateData): VehicleTypeRate;
    updateRate(rate: Money): void;
    toJSON(): {
        id: string;
        vehicleType: VehicleType;
        rate: {
            value: number;
            currency: string;
        };
        createdAt: Date;
    };
}
export declare class TimeBasedRate {
    readonly id: string;
    dayOfWeek: number;
    startTimeInMinutes: number;
    endTimeInMinutes: number;
    multiplier: number;
    name: string;
    readonly createdAt: Date;
    constructor(id: string, dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
    startTimeInMinutes: number, endTimeInMinutes: number, multiplier: number, name: string, createdAt?: Date);
    static create(data: CreateTimeBasedRateData): TimeBasedRate;
    private static timeStringToMinutes;
    private static minutesToTimeString;
    getStartTime(): string;
    getEndTime(): string;
    getDayName(): string;
    updateTime(startTime: string, endTime: string): void;
    updateMultiplier(multiplier: number): void;
    toJSON(): {
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        multiplier: number;
        name: string;
        createdAt: Date;
    };
}
export declare class HolidayRate {
    readonly id: string;
    name: string;
    date: Date;
    multiplier: number;
    isRecurring: boolean;
    readonly createdAt: Date;
    constructor(id: string, name: string, date: Date, multiplier: number, isRecurring: boolean, createdAt?: Date);
    static create(data: CreateHolidayRateData): HolidayRate;
    appliesToDate(date: Date): boolean;
    updateMultiplier(multiplier: number): void;
    updateDate(date: Date): void;
    toJSON(): {
        id: string;
        name: string;
        date: Date;
        multiplier: number;
        isRecurring: boolean;
        createdAt: Date;
    };
}
export declare class PricingCalculation {
    readonly hourlyRate: Money;
    readonly subtotal: Money;
    readonly durationInHours: number;
    readonly occupancyRate?: number | undefined;
    readonly appliedVehicleTypeRate?: VehicleTypeRate | undefined;
    readonly appliedTimeBasedRate?: TimeBasedRate | undefined;
    readonly appliedHolidayRate?: HolidayRate | undefined;
    constructor(hourlyRate: Money, subtotal: Money, durationInHours: number, occupancyRate?: number | undefined, appliedVehicleTypeRate?: VehicleTypeRate | undefined, appliedTimeBasedRate?: TimeBasedRate | undefined, appliedHolidayRate?: HolidayRate | undefined);
    getBreakdown(): PricingBreakdown;
    private calculateOccupancyMultiplier;
    toJSON(): {
        hourlyRate: {
            value: number;
            currency: string;
        };
        subtotal: {
            value: number;
            currency: string;
        };
        durationInHours: number;
        occupancyRate: number | undefined;
        breakdown: PricingBreakdown;
    };
}
export declare class HierarchicalPricingResolver {
    static resolvePricing(locationPricing?: PricingConfig, sectionPricing?: PricingConfig, zonePricing?: PricingConfig, spotPricing?: PricingConfig): PricingConfig;
    private static getDefaultPricing;
    static inheritPricing(parentPricing: PricingConfig, childOverrides?: Partial<CreatePricingConfigData>): PricingConfig;
}
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
