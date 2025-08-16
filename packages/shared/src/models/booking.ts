import { UserId, Money, TimeRange } from './value-objects';
import { AppliedDiscount } from './discount';
import { VehicleType, BookingStatus, PaymentStatus, BOOKING_STATUS, PAYMENT_STATUS } from '../types/common';

export class Booking {
  constructor(
    public readonly id: string,
    public readonly userId: UserId,
    public readonly spotId: string,
    public readonly vehicleId: string,
    public timeRange: TimeRange,
    public status: BookingStatus,
    public paymentStatus: PaymentStatus,
    public amount: Money,
    public discounts: AppliedDiscount[],
    public vatAmount: Money,
    public totalAmount: Money,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public confirmedAt?: Date,
    public startedAt?: Date,
    public completedAt?: Date,
    public cancelledAt?: Date,
    public cancellationReason?: string
  ) {}

  static create(data: CreateBookingData): Booking {
    const timeRange = new TimeRange(data.startTime, data.endTime);
    const amount = new Money(data.amount);
    const vatAmount = new Money(data.vatAmount || 0);
    const totalAmount = new Money(data.totalAmount);

    return new Booking(
      UserId.generate().value,
      data.userId,
      data.spotId,
      data.vehicleId,
      timeRange,
      BOOKING_STATUS.PENDING,
      PAYMENT_STATUS.PENDING,
      amount,
      data.discounts || [],
      vatAmount,
      totalAmount,
      new Date(),
      new Date()
    );
  }

  confirm(): void {
    if (this.status !== BOOKING_STATUS.PENDING) {
      throw new Error('Only pending bookings can be confirmed');
    }

    this.status = BOOKING_STATUS.CONFIRMED;
    this.confirmedAt = new Date();
    this.updatedAt = new Date();
  }

  start(): void {
    if (this.status !== BOOKING_STATUS.CONFIRMED) {
      throw new Error('Only confirmed bookings can be started');
    }

    this.status = BOOKING_STATUS.ACTIVE;
    this.startedAt = new Date();
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== BOOKING_STATUS.ACTIVE) {
      throw new Error('Only active bookings can be completed');
    }

    this.status = BOOKING_STATUS.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  cancel(reason?: string): void {
    if (
      this.status === BOOKING_STATUS.COMPLETED ||
      this.status === BOOKING_STATUS.CANCELLED
    ) {
      throw new Error('Cannot cancel completed or already cancelled bookings');
    }

    this.status = BOOKING_STATUS.CANCELLED;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    this.updatedAt = new Date();
  }

  markPaymentPaid(): void {
    if (this.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new Error('Payment is already marked as paid');
    }

    this.paymentStatus = PAYMENT_STATUS.PAID;
    this.updatedAt = new Date();

    // Auto-confirm booking when payment is received
    if (this.status === BOOKING_STATUS.PENDING) {
      this.confirm();
    }
  }

  markPaymentRefunded(): void {
    if (this.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new Error('Can only refund paid payments');
    }

    this.paymentStatus = PAYMENT_STATUS.REFUNDED;
    this.updatedAt = new Date();

    // Auto-cancel booking when payment is refunded
    if (this.status !== BOOKING_STATUS.CANCELLED) {
      this.cancel('Payment refunded');
    }
  }

  extendTime(newEndTime: Date): void {
    if (
      this.status !== BOOKING_STATUS.ACTIVE &&
      this.status !== BOOKING_STATUS.CONFIRMED
    ) {
      throw new Error('Can only extend active or confirmed bookings');
    }

    if (newEndTime <= this.timeRange.end) {
      throw new Error('New end time must be after current end time');
    }

    this.timeRange = new TimeRange(this.timeRange.start, newEndTime);
    this.updatedAt = new Date();
  }

  addDiscount(discount: AppliedDiscount): void {
    // Check if discount type already exists
    const existingIndex = this.discounts.findIndex(
      d => d.type === discount.type
    );

    if (existingIndex >= 0) {
      this.discounts[existingIndex] = discount;
    } else {
      this.discounts.push(discount);
    }

    this.recalculateAmounts();
  }

  removeDiscount(discountType: string): void {
    this.discounts = this.discounts.filter(d => d.type !== discountType);
    this.recalculateAmounts();
  }

  private recalculateAmounts(): void {
    // Recalculate total discount amount
    const totalDiscountAmount = this.discounts.reduce(
      (sum, discount) => sum + discount.amount.value,
      0
    );

    // Calculate discounted amount
    const discountedAmount = Math.max(
      0,
      this.amount.value - totalDiscountAmount
    );

    // Calculate VAT (only if not VAT exempt)
    const hasVATExemptDiscount = this.discounts.some(d => d.isVATExempt);
    const vatRate = hasVATExemptDiscount ? 0 : 0.12; // 12% VAT in Philippines
    const vatAmount = discountedAmount * vatRate;

    this.vatAmount = new Money(Math.round(vatAmount * 100) / 100);
    this.totalAmount = new Money(
      Math.round((discountedAmount + vatAmount) * 100) / 100
    );
    this.updatedAt = new Date();
  }

  getDurationInMinutes(): number {
    return this.timeRange.getDurationInMinutes();
  }

  getDurationInHours(): number {
    return this.timeRange.getDurationInHours();
  }

  isActive(): boolean {
    return this.status === BOOKING_STATUS.ACTIVE;
  }

  isPending(): boolean {
    return this.status === BOOKING_STATUS.PENDING;
  }

  isConfirmed(): boolean {
    return this.status === BOOKING_STATUS.CONFIRMED;
  }

  isCompleted(): boolean {
    return this.status === BOOKING_STATUS.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === BOOKING_STATUS.CANCELLED;
  }

  isPaid(): boolean {
    return this.paymentStatus === PAYMENT_STATUS.PAID;
  }

  isRefunded(): boolean {
    return this.paymentStatus === PAYMENT_STATUS.REFUNDED;
  }

  hasStarted(): boolean {
    const now = new Date();
    return now >= this.timeRange.start;
  }

  hasExpired(): boolean {
    const now = new Date();
    return now > this.timeRange.end;
  }

  isCurrentlyActive(): boolean {
    const now = new Date();
    return this.isActive() && this.timeRange.contains(now);
  }

  canBeCancelled(): boolean {
    return (
      this.status !== BOOKING_STATUS.COMPLETED &&
      this.status !== BOOKING_STATUS.CANCELLED
    );
  }

  canBeExtended(): boolean {
    return (
      (this.status === BOOKING_STATUS.ACTIVE ||
        this.status === BOOKING_STATUS.CONFIRMED) &&
      !this.hasExpired()
    );
  }

  getRefundAmount(): Money {
    if (!this.isPaid()) {
      return new Money(0);
    }

    // Simple refund logic - can be made more sophisticated
    if (this.hasStarted()) {
      // No refund if booking has started
      return new Money(0);
    }

    // Full refund if cancelled before start time
    return this.totalAmount;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId.value,
      spotId: this.spotId,
      vehicleId: this.vehicleId,
      startTime: this.timeRange.start,
      endTime: this.timeRange.end,
      status: this.status,
      paymentStatus: this.paymentStatus,
      amount: this.amount.toJSON(),
      discounts: this.discounts.map(d => d.toJSON()),
      vatAmount: this.vatAmount.toJSON(),
      totalAmount: this.totalAmount.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      confirmedAt: this.confirmedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      cancelledAt: this.cancelledAt,
      cancellationReason: this.cancellationReason,
    };
  }
}

export class BookingExtension {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly originalEndTime: Date,
    public readonly newEndTime: Date,
    public readonly additionalAmount: Money,
    public readonly additionalVAT: Money,
    public readonly totalAdditionalAmount: Money,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateBookingExtensionData): BookingExtension {
    return new BookingExtension(
      UserId.generate().value,
      data.bookingId,
      data.originalEndTime,
      data.newEndTime,
      new Money(data.additionalAmount),
      new Money(data.additionalVAT || 0),
      new Money(data.totalAdditionalAmount),
      new Date()
    );
  }

  getExtensionDurationInMinutes(): number {
    return (
      (this.newEndTime.getTime() - this.originalEndTime.getTime()) / (1000 * 60)
    );
  }

  getExtensionDurationInHours(): number {
    return this.getExtensionDurationInMinutes() / 60;
  }

  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      originalEndTime: this.originalEndTime,
      newEndTime: this.newEndTime,
      additionalAmount: this.additionalAmount.toJSON(),
      additionalVAT: this.additionalVAT.toJSON(),
      totalAdditionalAmount: this.totalAdditionalAmount.toJSON(),
      createdAt: this.createdAt,
    };
  }
}

export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly userId: UserId,
    public type: VehicleType,
    public brand: string,
    public model: string,
    public year: number,
    public color: string,
    public plateNumber: string,
    public isDefault: boolean = false,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateVehicleData): Vehicle {
    return new Vehicle(
      UserId.generate().value,
      data.userId,
      data.type,
      data.brand,
      data.model,
      data.year,
      data.color,
      data.plateNumber.toUpperCase(),
      data.isDefault || false,
      new Date(),
      new Date()
    );
  }

  update(data: Partial<UpdateVehicleData>): void {
    if (data.type !== undefined) this.type = data.type;
    if (data.brand !== undefined) this.brand = data.brand;
    if (data.model !== undefined) this.model = data.model;
    if (data.year !== undefined) this.year = data.year;
    if (data.color !== undefined) this.color = data.color;
    if (data.plateNumber !== undefined)
      this.plateNumber = data.plateNumber.toUpperCase();
    if (data.isDefault !== undefined) this.isDefault = data.isDefault;

    this.updatedAt = new Date();
  }

  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  unsetAsDefault(): void {
    this.isDefault = false;
    this.updatedAt = new Date();
  }

  getDisplayName(): string {
    return `${this.year} ${this.brand} ${this.model}`;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId.value,
      type: this.type,
      brand: this.brand,
      model: this.model,
      year: this.year,
      color: this.color,
      plateNumber: this.plateNumber,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Enums - now imported from common types for consistency

// Data Transfer Objects
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
