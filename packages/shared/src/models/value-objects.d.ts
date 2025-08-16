export declare abstract class ValueObject<T> {
    readonly value: T;
    constructor(value: T);
    protected abstract validate(value: T): void;
    equals(other: ValueObject<T>): boolean;
    toString(): string;
}
export declare class UserId extends ValueObject<string> {
    protected validate(value: string): void;
    static generate(): UserId;
    static fromString(value: string): UserId;
}
export declare class Email extends ValueObject<string> {
    protected validate(value: string): void;
    getDomain(): string;
    getLocalPart(): string;
}
export declare class PhoneNumber extends ValueObject<string> {
    protected validate(value: string): void;
    getDigitsOnly(): string;
    format(): string;
}
export declare class Money extends ValueObject<number> {
    readonly currency: string;
    constructor(value: number, currency?: string);
    protected validate(value: number): void;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(factor: number): Money;
    divide(divisor: number): Money;
    isZero(): boolean;
    isGreaterThan(other: Money): boolean;
    isLessThan(other: Money): boolean;
    format(): string;
    toJSON(): {
        value: number;
        currency: string;
    };
}
export declare class Coordinates extends ValueObject<{
    latitude: number;
    longitude: number;
}> {
    constructor(latitude: number, longitude: number);
    protected validate(value: {
        latitude: number;
        longitude: number;
    }): void;
    get latitude(): number;
    get longitude(): number;
    distanceTo(other: Coordinates): number;
    private toRadians;
    toString(): string;
    toJSON(): {
        latitude: number;
        longitude: number;
    };
}
export declare class Address extends ValueObject<AddressData> {
    protected validate(value: AddressData): void;
    get street(): string;
    get city(): string;
    get state(): string;
    get zipCode(): string;
    get country(): string;
    getFullAddress(): string;
    toJSON(): AddressData;
}
export declare class Percentage extends ValueObject<number> {
    protected validate(value: number): void;
    asDecimal(): number;
    apply(amount: number): number;
    toString(): string;
}
export declare class TimeRange extends ValueObject<{
    start: Date;
    end: Date;
}> {
    constructor(start: Date, end: Date);
    protected validate(value: {
        start: Date;
        end: Date;
    }): void;
    get start(): Date;
    get end(): Date;
    getDurationInMinutes(): number;
    getDurationInHours(): number;
    contains(date: Date): boolean;
    overlaps(other: TimeRange): boolean;
    toString(): string;
    toJSON(): {
        start: string;
        end: string;
    };
}
export interface AddressData {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
