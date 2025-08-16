/**
 * Runtime type validation utilities for database results and service operations
 */
/**
 * Type guard function type
 */
export type TypeGuard<T> = (value: unknown) => value is T;
/**
 * Validation result interface
 */
export interface ValidationResult<T> {
    isValid: boolean;
    data?: T;
    errors: string[];
}
/**
 * Database result type guards
 */
export declare class DatabaseTypeGuards {
    /**
     * Check if a value is a valid database result (not null, undefined, or error)
     */
    static isValidDatabaseResult(value: unknown): value is Record<string, unknown>;
    /**
     * Check if a value is a valid database array result
     */
    static isValidDatabaseArrayResult(value: unknown): value is Record<string, unknown>[];
    /**
     * Check if a value has a specific property with a specific type
     */
    static hasProperty<T>(obj: unknown, property: string, typeGuard: TypeGuard<T>): obj is Record<string, unknown> & {
        [K in typeof property]: T;
    };
    /**
     * Check if a value has required string property
     */
    static hasStringProperty(obj: unknown, property: string): obj is Record<string, unknown> & {
        [K in typeof property]: string;
    };
    /**
     * Check if a value has required number property
     */
    static hasNumberProperty(obj: unknown, property: string): obj is Record<string, unknown> & {
        [K in typeof property]: number;
    };
    /**
     * Check if a value has required boolean property
     */
    static hasBooleanProperty(obj: unknown, property: string): obj is Record<string, unknown> & {
        [K in typeof property]: boolean;
    };
    /**
     * Check if a value has required date property (string that can be parsed as date)
     */
    static hasDateProperty(obj: unknown, property: string): obj is Record<string, unknown> & {
        [K in typeof property]: string;
    };
    /**
     * Check if a value has optional property (can be null/undefined)
     */
    static hasOptionalProperty<T>(obj: unknown, property: string, typeGuard: TypeGuard<T>): obj is Record<string, unknown> & {
        [K in typeof property]?: T | null;
    };
}
/**
 * Common type guards for business entities
 */
export declare class EntityTypeGuards {
    /**
     * User entity type guard
     */
    static isUser(value: unknown): value is {
        id: string;
        email: string;
        user_type: string;
        status: string;
        created_at: string;
    };
    /**
     * Parking spot entity type guard
     */
    static isParkingSpot(value: unknown): value is {
        id: string;
        zone_id: string;
        spot_number: string;
        status: string;
        created_at: string;
    };
    /**
     * Booking entity type guard
     */
    static isBooking(value: unknown): value is {
        id: string;
        user_id: string;
        spot_id: string;
        status: string;
        start_time: string;
        end_time: string;
        created_at: string;
    };
    /**
     * Payment transaction entity type guard
     */
    static isPaymentTransaction(value: unknown): value is {
        id: string;
        booking_id: string;
        user_id: string;
        amount: number;
        currency: string;
        status: string;
        provider: string;
        created_at: string;
    };
    /**
     * Revenue share entity type guard
     */
    static isRevenueShare(value: unknown): value is {
        id: string;
        booking_id: string;
        operator_id: string;
        gross_amount: number;
        operator_share: number;
        platform_fee: number;
        created_at: string;
    };
    /**
     * Operator profile entity type guard
     */
    static isOperatorProfile(value: unknown): value is {
        id: string;
        operator_id: string;
        company_name: string;
        contact_person: string;
        contact_email: string;
        is_verified: boolean;
        created_at: string;
    };
}
/**
 * Validation utilities for service operations
 */
export declare class ValidationUtils {
    /**
     * Validate and transform database result with type guard
     */
    static validateDatabaseResult<T>(result: unknown, typeGuard: TypeGuard<T>, entityName?: string): ValidationResult<T>;
    /**
     * Validate and transform database array result with type guard
     */
    static validateDatabaseArrayResult<T>(result: unknown, typeGuard: TypeGuard<T>, entityName?: string): ValidationResult<T[]>;
    /**
     * Safely extract property from database result
     */
    static safeExtract<T>(obj: unknown, property: string, typeGuard: TypeGuard<T>, defaultValue: T): T;
    /**
     * Safely extract string property
     */
    static safeExtractString(obj: unknown, property: string, defaultValue?: string): string;
    /**
     * Safely extract number property
     */
    static safeExtractNumber(obj: unknown, property: string, defaultValue?: number): number;
    /**
     * Safely extract boolean property
     */
    static safeExtractBoolean(obj: unknown, property: string, defaultValue?: boolean): boolean;
    /**
     * Safely extract date property
     */
    static safeExtractDate(obj: unknown, property: string, defaultValue?: Date): Date | undefined;
    /**
     * Validate required fields in an object
     */
    static validateRequiredFields(obj: unknown, requiredFields: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'date';
    }>): ValidationResult<Record<string, unknown>>;
    /**
     * Create a composite type guard from multiple type guards
     */
    static createCompositeTypeGuard<T>(typeGuards: Array<TypeGuard<any>>, combineLogic?: 'and' | 'or'): TypeGuard<T>;
    /**
     * Create a type guard for arrays of a specific type
     */
    static createArrayTypeGuard<T>(itemTypeGuard: TypeGuard<T>): TypeGuard<T[]>;
    /**
     * Create a type guard for optional values
     */
    static createOptionalTypeGuard<T>(typeGuard: TypeGuard<T>): TypeGuard<T | null | undefined>;
}
/**
 * Error handling utilities for type validation
 */
export declare class TypeValidationErrorHandler {
    /**
     * Handle validation errors and convert to service errors
     */
    static handleValidationError(validation: ValidationResult<any>, operation: string, entityName?: string): Error;
    /**
     * Log validation warnings without throwing errors
     */
    static logValidationWarning(validation: ValidationResult<any>, operation: string, entityName?: string): void;
    /**
     * Create a safe wrapper that handles validation errors gracefully
     */
    static createSafeWrapper<T, R>(operation: (data: T) => R, typeGuard: TypeGuard<T>, entityName?: string): (data: unknown) => R | null;
}
/**
 * Utility functions for backward compatibility with existing code
 */
export declare class LegacyCompatibilityUtils {
    /**
     * Legacy safeAccess function for backward compatibility
     */
    static safeAccess<T>(obj: unknown, path: string, defaultValue: T): T;
    /**
     * Legacy isValidDatabaseResult function
     */
    static isValidDatabaseResult(value: unknown): boolean;
    /**
     * Legacy validateQueryResult function
     */
    static validateQueryResult<T>(result: unknown): T | null;
}
