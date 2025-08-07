import { v4 as uuidv4 } from 'uuid';

// Base Value Object class
export abstract class ValueObject<T> {
  constructor(public readonly value: T) {
    this.validate(value);
  }

  protected abstract validate(value: T): void;

  equals(other: ValueObject<T>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}

// User ID Value Object
export class UserId extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    // UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('User ID must be a valid UUID');
    }
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }
}

// Email Value Object
export class Email extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    if (value.length > 254) {
      throw new Error('Email is too long');
    }
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }
}

// Phone Number Value Object
export class PhoneNumber extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Phone number cannot be empty');
    }

    // Remove all non-digit characters for validation
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      throw new Error('Phone number must be between 10 and 15 digits');
    }
  }

  getDigitsOnly(): string {
    return this.value.replace(/\D/g, '');
  }

  format(): string {
    const digits = this.getDigitsOnly();

    // Philippine format
    if (digits.startsWith('63') && digits.length === 12) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }

    // US format
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // International format
    return `+${digits}`;
  }
}

// Money Value Object
export class Money extends ValueObject<number> {
  constructor(
    value: number,
    public readonly currency: string = 'PHP'
  ) {
    super(value);
  }

  protected validate(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Money value must be a valid number');
    }

    if (value < 0) {
      throw new Error('Money value cannot be negative');
    }

    // Check for reasonable precision (2 decimal places for most currencies)
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new Error('Money value cannot have more than 2 decimal places');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.value + other.value, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Cannot subtract to negative amount');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply by negative factor');
    }
    return new Money(
      Math.round(this.value * factor * 100) / 100,
      this.currency
    );
  }

  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('Cannot divide by zero or negative number');
    }
    return new Money(
      Math.round((this.value / divisor) * 100) / 100,
      this.currency
    );
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.value > other.value;
  }

  isLessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.value < other.value;
  }

  format(): string {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(this.value);
  }

  toJSON(): { value: number; currency: string } {
    return {
      value: this.value,
      currency: this.currency,
    };
  }
}

// Coordinates Value Object
export class Coordinates extends ValueObject<{
  latitude: number;
  longitude: number;
}> {
  constructor(latitude: number, longitude: number) {
    super({ latitude, longitude });
  }

  protected validate(value: { latitude: number; longitude: number }): void {
    const { latitude, longitude } = value;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  get latitude(): number {
    return this.value.latitude;
  }

  get longitude(): number {
    return this.value.longitude;
  }

  distanceTo(other: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other.latitude - this.latitude);
    const dLon = this.toRadians(other.longitude - this.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude)) *
        Math.cos(this.toRadians(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  override toString(): string {
    return `${this.latitude}, ${this.longitude}`;
  }

  toJSON(): { latitude: number; longitude: number } {
    return this.value;
  }
}

// Address Value Object
export class Address extends ValueObject<AddressData> {
  protected validate(value: AddressData): void {
    if (!value.street || value.street.trim().length === 0) {
      throw new Error('Street address is required');
    }
    if (!value.city || value.city.trim().length === 0) {
      throw new Error('City is required');
    }
    if (!value.state || value.state.trim().length === 0) {
      throw new Error('State is required');
    }
    if (!value.zipCode || value.zipCode.trim().length === 0) {
      throw new Error('Zip code is required');
    }
    if (!value.country || value.country.trim().length === 0) {
      throw new Error('Country is required');
    }
  }

  get street(): string {
    return this.value.street;
  }

  get city(): string {
    return this.value.city;
  }

  get state(): string {
    return this.value.state;
  }

  get zipCode(): string {
    return this.value.zipCode;
  }

  get country(): string {
    return this.value.country;
  }

  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }

  toJSON(): AddressData {
    return this.value;
  }
}

// Percentage Value Object
export class Percentage extends ValueObject<number> {
  protected validate(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Percentage must be a valid number');
    }

    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
  }

  asDecimal(): number {
    return this.value / 100;
  }

  apply(amount: number): number {
    return amount * this.asDecimal();
  }

  override toString(): string {
    return `${this.value}%`;
  }
}

// Time Range Value Object
export class TimeRange extends ValueObject<{ start: Date; end: Date }> {
  constructor(start: Date, end: Date) {
    super({ start, end });
  }

  protected validate(value: { start: Date; end: Date }): void {
    if (!(value.start instanceof Date) || !(value.end instanceof Date)) {
      throw new Error('Start and end must be valid dates');
    }

    if (value.start >= value.end) {
      throw new Error('Start time must be before end time');
    }
  }

  get start(): Date {
    return this.value.start;
  }

  get end(): Date {
    return this.value.end;
  }

  getDurationInMinutes(): number {
    return (this.end.getTime() - this.start.getTime()) / (1000 * 60);
  }

  getDurationInHours(): number {
    return this.getDurationInMinutes() / 60;
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  overlaps(other: TimeRange): boolean {
    return this.start < other.end && this.end > other.start;
  }

  override toString(): string {
    return `${this.start.toISOString()} - ${this.end.toISOString()}`;
  }

  toJSON(): { start: string; end: string } {
    return {
      start: this.start.toISOString(),
      end: this.end.toISOString(),
    };
  }
}

// Supporting interfaces
export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
