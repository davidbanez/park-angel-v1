import { UserId, Money, TimeRange } from './value-objects';
import { AppliedDiscount } from './discount';
import { VehicleType, BookingStatus, PaymentStatus } from '../types/common';
export declare class Booking {
    readonly id: string;
    readonly userId: UserId;
    readonly spotId: string;
    readonly vehicleId: string;
    timeRange: TimeRange;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    amount: Money;
    discounts: AppliedDiscount[];
    vatAmount: Money;
    totalAmount: Money;
    readonly createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    cancellationReason?: string | undefined;
    constructor(id: string, userId: UserId, spotId: string, vehicleId: string, timeRange: TimeRange, status: BookingStatus, paymentStatus: PaymentStatus, amount: Money, discounts: AppliedDiscount[], vatAmount: Money, totalAmount: Money, createdAt?: Date, updatedAt?: Date, confirmedAt?: Date | undefined, startedAt?: Date | undefined, completedAt?: Date | undefined, cancelledAt?: Date | undefined, cancellationReason?: string | undefined);
    static create(data: CreateBookingData): Booking;
    confirm(): void;
    start(): void;
    complete(): void;
    cancel(reason?: string): void;
    markPaymentPaid(): void;
    markPaymentRefunded(): void;
    extendTime(newEndTime: Date): void;
    addDiscount(discount: AppliedDiscount): void;
    removeDiscount(discountType: string): void;
    private recalculateAmounts;
    getDurationInMinutes(): number;
    getDurationInHours(): number;
    isActive(): boolean;
    isPending(): boolean;
    isConfirmed(): boolean;
    isCompleted(): boolean;
    isCancelled(): boolean;
    isPaid(): boolean;
    isRefunded(): boolean;
    hasStarted(): boolean;
    hasExpired(): boolean;
    isCurrentlyActive(): boolean;
    canBeCancelled(): boolean;
    canBeExtended(): boolean;
    getRefundAmount(): Money;
    toJSON(): {
        id: string;
        userId: string;
        spotId: string;
        vehicleId: string;
        startTime: Date;
        endTime: Date;
        status: BookingStatus;
        paymentStatus: PaymentStatus;
        amount: {
            value: number;
            currency: string;
        };
        discounts: {
            id: string;
            type: import("..").DiscountType;
            name: string;
            percentage: number;
            amount: {
                value: number;
                currency: string;
            };
            isVATExempt: boolean;
            appliedAt: Date;
        }[];
        vatAmount: {
            value: number;
            currency: string;
        };
        totalAmount: {
            value: number;
            currency: string;
        };
        createdAt: Date;
        updatedAt: Date;
        confirmedAt: Date | undefined;
        startedAt: Date | undefined;
        completedAt: Date | undefined;
        cancelledAt: Date | undefined;
        cancellationReason: string | undefined;
    };
}
export declare class BookingExtension {
    readonly id: string;
    readonly bookingId: string;
    readonly originalEndTime: Date;
    readonly newEndTime: Date;
    readonly additionalAmount: Money;
    readonly additionalVAT: Money;
    readonly totalAdditionalAmount: Money;
    readonly createdAt: Date;
    constructor(id: string, bookingId: string, originalEndTime: Date, newEndTime: Date, additionalAmount: Money, additionalVAT: Money, totalAdditionalAmount: Money, createdAt?: Date);
    static create(data: CreateBookingExtensionData): BookingExtension;
    getExtensionDurationInMinutes(): number;
    getExtensionDurationInHours(): number;
    toJSON(): {
        id: string;
        bookingId: string;
        originalEndTime: Date;
        newEndTime: Date;
        additionalAmount: {
            value: number;
            currency: string;
        };
        additionalVAT: {
            value: number;
            currency: string;
        };
        totalAdditionalAmount: {
            value: number;
            currency: string;
        };
        createdAt: Date;
    };
}
export declare class Vehicle {
    readonly id: string;
    readonly userId: UserId;
    type: VehicleType;
    brand: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    isDefault: boolean;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, userId: UserId, type: VehicleType, brand: string, model: string, year: number, color: string, plateNumber: string, isDefault?: boolean, createdAt?: Date, updatedAt?: Date);
    static create(data: CreateVehicleData): Vehicle;
    update(data: Partial<UpdateVehicleData>): void;
    setAsDefault(): void;
    unsetAsDefault(): void;
    getDisplayName(): string;
    toJSON(): {
        id: string;
        userId: string;
        type: VehicleType;
        brand: string;
        model: string;
        year: number;
        color: string;
        plateNumber: string;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}
export interface CreateBookingData {
    userId: UserId;
    spotId: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    amount: number;
    vatAmount?: number;
    totalAmount: number;
    discounts?: AppliedDiscount[];
}
export interface CreateBookingExtensionData {
    bookingId: string;
    originalEndTime: Date;
    newEndTime: Date;
    additionalAmount: number;
    additionalVAT?: number;
    totalAdditionalAmount: number;
}
export interface CreateVehicleData {
    userId: UserId;
    type: VehicleType;
    brand: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    isDefault?: boolean;
}
export interface UpdateVehicleData {
    type?: VehicleType;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    plateNumber?: string;
    isDefault?: boolean;
}
