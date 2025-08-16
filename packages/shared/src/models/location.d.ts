import { UserId, Coordinates, Address } from './value-objects';
import { PricingConfig } from './pricing';
import { VehicleType, ParkingType, SpotStatus } from '../types/common';
export declare class Location {
    readonly id: string;
    name: string;
    readonly type: ParkingType;
    readonly operatorId: UserId;
    address: Address;
    coordinates: Coordinates;
    sections: Section[];
    pricing: PricingConfig;
    settings: LocationSettings;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, name: string, type: ParkingType, operatorId: UserId, address: Address, coordinates: Coordinates, sections: Section[], pricing: PricingConfig, settings: LocationSettings, createdAt?: Date, updatedAt?: Date);
    static create(data: CreateLocationData): Location;
    addSection(sectionData: CreateSectionData): Section;
    removeSection(sectionId: string): void;
    getSection(sectionId: string): Section | undefined;
    getAllSpots(): ParkingSpot[];
    getAvailableSpots(): ParkingSpot[];
    getOccupiedSpots(): ParkingSpot[];
    getTotalCapacity(): number;
    getOccupancyRate(): number;
    updatePricing(pricing: PricingConfig): void;
    updateSettings(settings: Partial<LocationSettingsData>): void;
    isOperational(): boolean;
    toJSON(): {
        id: string;
        name: string;
        type: ParkingType;
        operatorId: string;
        address: import("./value-objects").AddressData;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        sections: {
            id: string;
            locationId: string;
            name: string;
            zones: {
                id: string;
                sectionId: string;
                name: string;
                spots: {
                    id: string;
                    zoneId: string;
                    number: string;
                    type: VehicleType;
                    status: SpotStatus;
                    coordinates: {
                        latitude: number;
                        longitude: number;
                    };
                    amenities: string[];
                    pricing: {
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
                    } | undefined;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                pricing: {
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
                } | undefined;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pricing: {
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
            } | undefined;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pricing: {
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
        settings: {
            operatingHours: {
                schedule: DaySchedule[];
            };
            maxBookingDuration: number;
            advanceBookingLimit: number;
            allowOvernight: boolean;
            requirePrePayment: boolean;
        };
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class Section {
    readonly id: string;
    readonly locationId: string;
    name: string;
    zones: Zone[];
    pricing?: PricingConfig | undefined;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, locationId: string, name: string, zones: Zone[], pricing?: PricingConfig | undefined, createdAt?: Date, updatedAt?: Date);
    static create(data: CreateSectionData): Section;
    addZone(zoneData: CreateZoneData): Zone;
    removeZone(zoneId: string): void;
    getZone(zoneId: string): Zone | undefined;
    getAllSpots(): ParkingSpot[];
    getAvailableSpots(): ParkingSpot[];
    getTotalCapacity(): number;
    getOccupancyRate(): number;
    updatePricing(pricing: PricingConfig): void;
    toJSON(): {
        id: string;
        locationId: string;
        name: string;
        zones: {
            id: string;
            sectionId: string;
            name: string;
            spots: {
                id: string;
                zoneId: string;
                number: string;
                type: VehicleType;
                status: SpotStatus;
                coordinates: {
                    latitude: number;
                    longitude: number;
                };
                amenities: string[];
                pricing: {
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
                } | undefined;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pricing: {
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
            } | undefined;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pricing: {
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
        } | undefined;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class Zone {
    readonly id: string;
    readonly sectionId: string;
    name: string;
    spots: ParkingSpot[];
    pricing?: PricingConfig | undefined;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, sectionId: string, name: string, spots: ParkingSpot[], pricing?: PricingConfig | undefined, createdAt?: Date, updatedAt?: Date);
    static create(data: CreateZoneData): Zone;
    addSpot(spotData: CreateSpotData): ParkingSpot;
    removeSpot(spotId: string): void;
    getSpot(spotId: string): ParkingSpot | undefined;
    getAvailableSpots(): ParkingSpot[];
    getOccupiedSpots(): ParkingSpot[];
    getTotalCapacity(): number;
    getOccupancyRate(): number;
    updatePricing(pricing: PricingConfig): void;
    toJSON(): {
        id: string;
        sectionId: string;
        name: string;
        spots: {
            id: string;
            zoneId: string;
            number: string;
            type: VehicleType;
            status: SpotStatus;
            coordinates: {
                latitude: number;
                longitude: number;
            };
            amenities: string[];
            pricing: {
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
            } | undefined;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pricing: {
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
        } | undefined;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class ParkingSpot {
    readonly id: string;
    readonly zoneId: string;
    number: string;
    type: VehicleType;
    status: SpotStatus;
    coordinates: Coordinates;
    amenities: string[];
    pricing?: PricingConfig | undefined;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, zoneId: string, number: string, type: VehicleType, status: SpotStatus, coordinates: Coordinates, amenities: string[], pricing?: PricingConfig | undefined, createdAt?: Date, updatedAt?: Date);
    static create(data: CreateSpotData): ParkingSpot;
    reserve(): void;
    occupy(): void;
    makeAvailable(): void;
    setMaintenance(): void;
    isAvailable(): boolean;
    isOccupied(): boolean;
    isReserved(): boolean;
    isInMaintenance(): boolean;
    canAccommodateVehicle(vehicleType: VehicleType): boolean;
    addAmenity(amenity: string): void;
    removeAmenity(amenity: string): void;
    updatePricing(pricing: PricingConfig): void;
    toJSON(): {
        id: string;
        zoneId: string;
        number: string;
        type: VehicleType;
        status: SpotStatus;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        amenities: string[];
        pricing: {
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
        } | undefined;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class LocationSettings {
    operatingHours: OperatingHours;
    maxBookingDuration: number;
    advanceBookingLimit: number;
    allowOvernight: boolean;
    requirePrePayment: boolean;
    constructor(operatingHours: OperatingHours, maxBookingDuration: number, // in minutes
    advanceBookingLimit: number, // in days
    allowOvernight?: boolean, requirePrePayment?: boolean);
    static create(data: LocationSettingsData): LocationSettings;
    update(data: Partial<LocationSettingsData>): LocationSettings;
    isCurrentlyOpen(): boolean;
    isOpenAt(date: Date): boolean;
    getMaxBookingEndTime(): Date;
    getMaxAdvanceBookingDate(): Date;
    toJSON(): {
        operatingHours: {
            schedule: DaySchedule[];
        };
        maxBookingDuration: number;
        advanceBookingLimit: number;
        allowOvernight: boolean;
        requirePrePayment: boolean;
    };
}
export declare class OperatingHours {
    schedule: DaySchedule[];
    constructor(schedule: DaySchedule[]);
    isCurrentlyOpen(): boolean;
    isOpenAt(date: Date): boolean;
    private timeStringToMinutes;
    toJSON(): {
        schedule: DaySchedule[];
    };
}
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
    dayOfWeek: number;
    isOpen: boolean;
    is24Hours: boolean;
    openTime?: string;
    closeTime?: string;
}
