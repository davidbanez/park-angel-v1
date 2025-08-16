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
export class DatabaseTypeGuards {
  /**
   * Check if a value is a valid database result (not null, undefined, or error)
   */
  static isValidDatabaseResult(value: unknown): value is Record<string, unknown> {
    return value !== null && 
           value !== undefined && 
           typeof value === 'object' &&
           !Array.isArray(value) &&
           !(value as any).error;
  }

  /**
   * Check if a value is a valid database array result
   */
  static isValidDatabaseArrayResult(value: unknown): value is Record<string, unknown>[] {
    return Array.isArray(value) && 
           value.every(item => this.isValidDatabaseResult(item));
  }

  /**
   * Check if a value has a specific property with a specific type
   */
  static hasProperty<T>(
    obj: unknown,
    property: string,
    typeGuard: TypeGuard<T>
  ): obj is Record<string, unknown> & { [K in typeof property]: T } {
    return this.isValidDatabaseResult(obj) && 
           property in obj && 
           typeGuard((obj as any)[property]);
  }

  /**
   * Check if a value has required string property
   */
  static hasStringProperty(obj: unknown, property: string): obj is Record<string, unknown> & { [K in typeof property]: string } {
    return this.hasProperty(obj, property, (value): value is string => typeof value === 'string' && value.length > 0);
  }

  /**
   * Check if a value has required number property
   */
  static hasNumberProperty(obj: unknown, property: string): obj is Record<string, unknown> & { [K in typeof property]: number } {
    return this.hasProperty(obj, property, (value): value is number => typeof value === 'number' && !isNaN(value));
  }

  /**
   * Check if a value has required boolean property
   */
  static hasBooleanProperty(obj: unknown, property: string): obj is Record<string, unknown> & { [K in typeof property]: boolean } {
    return this.hasProperty(obj, property, (value): value is boolean => typeof value === 'boolean');
  }

  /**
   * Check if a value has required date property (string that can be parsed as date)
   */
  static hasDateProperty(obj: unknown, property: string): obj is Record<string, unknown> & { [K in typeof property]: string } {
    return this.hasProperty(obj, property, (value): value is string => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    });
  }

  /**
   * Check if a value has optional property (can be null/undefined)
   */
  static hasOptionalProperty<T>(
    obj: unknown,
    property: string,
    typeGuard: TypeGuard<T>
  ): obj is Record<string, unknown> & { [K in typeof property]?: T | null } {
    if (!this.isValidDatabaseResult(obj)) return false;
    
    const value = (obj as any)[property];
    return value === null || value === undefined || typeGuard(value);
  }
}

/**
 * Common type guards for business entities
 */
export class EntityTypeGuards {
  /**
   * User entity type guard
   */
  static isUser(value: unknown): value is {
    id: string;
    email: string;
    user_type: string;
    status: string;
    created_at: string;
  } {
    return DatabaseTypeGuards.isValidDatabaseResult(value) &&
           DatabaseTypeGuards.hasStringProperty(value, 'id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'email') &&
           DatabaseTypeGuards.hasStringProperty(value, 'user_type') &&
           DatabaseTypeGuards.hasStringProperty(value, 'status') &&
           DatabaseTypeGuards.hasDateProperty(value, 'created_at');
  }

  /**
   * Parking spot entity type guard
   */
  static isParkingSpot(value: unknown): value is {
    id: string;
    zone_id: string;
    spot_number: string;
    status: string;
    created_at: string;
  } {
    return DatabaseTypeGuards.isValidDatabaseResult(value) &&
           DatabaseTypeGuards.hasStringProperty(value, 'id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'zone_id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'spot_number') &&
           DatabaseTypeGuards.hasStringProperty(value, 'status') &&
           DatabaseTypeGuards.hasDateProperty(value, 'created_at');
  }

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
  } {
    return DatabaseTypeGuards.isValidDatabaseResult(value) &&
           DatabaseTypeGuards.hasStringProperty(value, 'id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'user_id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'spot_id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'status') &&
           DatabaseTypeGuards.hasDateProperty(value, 'start_time') &&
           DatabaseTypeGuards.hasDateProperty(value, 'end_time') &&
           DatabaseTypeGuards.hasDateProperty(value, 'created_at');
  }

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
  } {
    return DatabaseTypeGuards.isValidDatabaseResult(value) &&
           DatabaseTypeGuards.hasStringProperty(value, 'id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'booking_id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'user_id') &&
           DatabaseTypeGuards.hasNumberProperty(value, 'amount') &&
           DatabaseTypeGuards.hasStringProperty(value, 'currency') &&
           DatabaseTypeGuards.hasStringProperty(value, 'status') &&
           DatabaseTypeGuards.hasStringProperty(value, 'provider') &&
           DatabaseTypeGuards.hasDateProperty(value, 'created_at');
  }

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
  } {
    return DatabaseTypeGuards.isValidDatabaseResult(value) &&
           DatabaseTypeGuards.hasStringProperty(value, 'id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'booking_id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'operator_id') &&
           DatabaseTypeGuards.hasNumberProperty(value, 'gross_amount') &&
           DatabaseTypeGuards.hasNumberProperty(value, 'operator_share') &&
           DatabaseTypeGuards.hasNumberProperty(value, 'platform_fee') &&
           DatabaseTypeGuards.hasDateProperty(value, 'created_at');
  }

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
  } {
    return DatabaseTypeGuards.isValidDatabaseResult(value) &&
           DatabaseTypeGuards.hasStringProperty(value, 'id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'operator_id') &&
           DatabaseTypeGuards.hasStringProperty(value, 'company_name') &&
           DatabaseTypeGuards.hasStringProperty(value, 'contact_person') &&
           DatabaseTypeGuards.hasStringProperty(value, 'contact_email') &&
           DatabaseTypeGuards.hasBooleanProperty(value, 'is_verified') &&
           DatabaseTypeGuards.hasDateProperty(value, 'created_at');
  }
}

/**
 * Validation utilities for service operations
 */
export class ValidationUtils {
  /**
   * Validate and transform database result with type guard
   */
  static validateDatabaseResult<T>(
    result: unknown,
    typeGuard: TypeGuard<T>,
    entityName: string = 'entity'
  ): ValidationResult<T> {
    if (!DatabaseTypeGuards.isValidDatabaseResult(result)) {
      return {
        isValid: false,
        errors: [`Invalid database result for ${entityName}`],
      };
    }

    if (!typeGuard(result)) {
      return {
        isValid: false,
        errors: [`Database result does not match expected ${entityName} structure`],
      };
    }

    return {
      isValid: true,
      data: result,
      errors: [],
    };
  }

  /**
   * Validate and transform database array result with type guard
   */
  static validateDatabaseArrayResult<T>(
    result: unknown,
    typeGuard: TypeGuard<T>,
    entityName: string = 'entity'
  ): ValidationResult<T[]> {
    if (!Array.isArray(result)) {
      return {
        isValid: false,
        errors: [`Expected array of ${entityName} but got ${typeof result}`],
      };
    }

    const validatedItems: T[] = [];
    const errors: string[] = [];

    result.forEach((item, index) => {
      const validation = this.validateDatabaseResult(item, typeGuard, entityName);
      if (validation.isValid && validation.data) {
        validatedItems.push(validation.data);
      } else {
        errors.push(`Item at index ${index}: ${validation.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      data: validatedItems,
      errors,
    };
  }

  /**
   * Safely extract property from database result
   */
  static safeExtract<T>(
    obj: unknown,
    property: string,
    typeGuard: TypeGuard<T>,
    defaultValue: T
  ): T {
    if (!DatabaseTypeGuards.isValidDatabaseResult(obj)) {
      return defaultValue;
    }

    const value = (obj as any)[property];
    return typeGuard(value) ? value : defaultValue;
  }

  /**
   * Safely extract string property
   */
  static safeExtractString(obj: unknown, property: string, defaultValue: string = ''): string {
    return this.safeExtract(obj, property, (value): value is string => typeof value === 'string', defaultValue);
  }

  /**
   * Safely extract number property
   */
  static safeExtractNumber(obj: unknown, property: string, defaultValue: number = 0): number {
    return this.safeExtract(obj, property, (value): value is number => typeof value === 'number' && !isNaN(value), defaultValue);
  }

  /**
   * Safely extract boolean property
   */
  static safeExtractBoolean(obj: unknown, property: string, defaultValue: boolean = false): boolean {
    return this.safeExtract(obj, property, (value): value is boolean => typeof value === 'boolean', defaultValue);
  }

  /**
   * Safely extract date property
   */
  static safeExtractDate(obj: unknown, property: string, defaultValue?: Date): Date | undefined {
    const dateString = this.safeExtractString(obj, property);
    if (!dateString) return defaultValue;
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? defaultValue : date;
  }

  /**
   * Validate required fields in an object
   */
  static validateRequiredFields(
    obj: unknown,
    requiredFields: Array<{ name: string; type: 'string' | 'number' | 'boolean' | 'date' }>
  ): ValidationResult<Record<string, unknown>> {
    if (!DatabaseTypeGuards.isValidDatabaseResult(obj)) {
      return {
        isValid: false,
        errors: ['Invalid object structure'],
      };
    }

    const errors: string[] = [];
    const data = obj as Record<string, unknown>;

    for (const field of requiredFields) {
      const value = data[field.name];
      
      if (value === null || value === undefined) {
        errors.push(`Missing required field: ${field.name}`);
        continue;
      }

      switch (field.type) {
        case 'string':
          if (typeof value !== 'string' || value.length === 0) {
            errors.push(`Field ${field.name} must be a non-empty string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`Field ${field.name} must be a valid number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field ${field.name} must be a boolean`);
          }
          break;
        case 'date':
          if (typeof value !== 'string' || isNaN(new Date(value).getTime())) {
            errors.push(`Field ${field.name} must be a valid date string`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? data : undefined,
      errors,
    };
  }

  /**
   * Create a composite type guard from multiple type guards
   */
  static createCompositeTypeGuard<T>(
    typeGuards: Array<TypeGuard<any>>,
    combineLogic: 'and' | 'or' = 'and'
  ): TypeGuard<T> {
    return (value: unknown): value is T => {
      if (combineLogic === 'and') {
        return typeGuards.every(guard => guard(value));
      } else {
        return typeGuards.some(guard => guard(value));
      }
    };
  }

  /**
   * Create a type guard for arrays of a specific type
   */
  static createArrayTypeGuard<T>(itemTypeGuard: TypeGuard<T>): TypeGuard<T[]> {
    return (value: unknown): value is T[] => {
      return Array.isArray(value) && value.every(item => itemTypeGuard(item));
    };
  }

  /**
   * Create a type guard for optional values
   */
  static createOptionalTypeGuard<T>(typeGuard: TypeGuard<T>): TypeGuard<T | null | undefined> {
    return (value: unknown): value is T | null | undefined => {
      return value === null || value === undefined || typeGuard(value);
    };
  }
}

/**
 * Error handling utilities for type validation
 */
export class TypeValidationErrorHandler {
  /**
   * Handle validation errors and convert to service errors
   */
  static handleValidationError(
    validation: ValidationResult<any>,
    operation: string,
    entityName: string = 'entity'
  ): Error {
    const errorMessage = `Type validation failed for ${entityName} during ${operation}: ${validation.errors.join(', ')}`;
    return new Error(errorMessage);
  }

  /**
   * Log validation warnings without throwing errors
   */
  static logValidationWarning(
    validation: ValidationResult<any>,
    operation: string,
    entityName: string = 'entity'
  ): void {
    if (!validation.isValid) {
      console.warn(`Type validation warning for ${entityName} during ${operation}:`, validation.errors);
    }
  }

  /**
   * Create a safe wrapper that handles validation errors gracefully
   */
  static createSafeWrapper<T, R>(
    operation: (data: T) => R,
    typeGuard: TypeGuard<T>,
    entityName: string = 'entity'
  ): (data: unknown) => R | null {
    return (data: unknown): R | null => {
      const validation = ValidationUtils.validateDatabaseResult(data, typeGuard, entityName);
      
      if (!validation.isValid || !validation.data) {
        this.logValidationWarning(validation, 'safe operation', entityName);
        return null;
      }

      try {
        return operation(validation.data);
      } catch (error) {
        console.error(`Error in safe operation for ${entityName}:`, error);
        return null;
      }
    };
  }
}

/**
 * Utility functions for backward compatibility with existing code
 */
export class LegacyCompatibilityUtils {
  /**
   * Legacy safeAccess function for backward compatibility
   */
  static safeAccess<T>(obj: unknown, path: string, defaultValue: T): T {
    return ValidationUtils.safeExtract(
      obj,
      path,
      (value): value is T => value !== null && value !== undefined,
      defaultValue
    );
  }

  /**
   * Legacy isValidDatabaseResult function
   */
  static isValidDatabaseResult(value: unknown): boolean {
    return DatabaseTypeGuards.isValidDatabaseResult(value);
  }

  /**
   * Legacy validateQueryResult function
   */
  static validateQueryResult<T>(result: unknown): T | null {
    return DatabaseTypeGuards.isValidDatabaseResult(result) ? result as T : null;
  }
}