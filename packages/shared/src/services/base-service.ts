import { createClient } from '@supabase/supabase-js';

/**
 * Standard error codes for service operations
 */
export enum ServiceErrorCode {
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_PROCESSOR_ERROR = 'PAYMENT_PROCESSOR_ERROR',
  
  // Authentication/Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

/**
 * Service error interface with structured error information
 */
export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  timestamp: Date;
}

/**
 * Standard result wrapper for all service operations
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

/**
 * Pagination parameters for list operations
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Base service interface that all services should implement
 */
export interface BaseService<TEntity, TCreateData, TUpdateData, TId = string> {
  /**
   * Create a new entity
   */
  create(data: TCreateData): Promise<ServiceResult<TEntity>>;

  /**
   * Find entity by ID
   */
  findById(id: TId): Promise<ServiceResult<TEntity | null>>;

  /**
   * Update entity by ID
   */
  update(id: TId, data: TUpdateData): Promise<ServiceResult<TEntity>>;

  /**
   * Delete entity by ID
   */
  delete(id: TId): Promise<ServiceResult<boolean>>;

  /**
   * List entities with optional pagination
   */
  list(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<TEntity>>>;
}

/**
 * Abstract base service implementation with common functionality
 */
export abstract class AbstractBaseService<TEntity, TCreateData, TUpdateData, TId = string> 
  implements BaseService<TEntity, TCreateData, TUpdateData, TId> {
  
  constructor(protected supabase: ReturnType<typeof createClient>) {}

  /**
   * Abstract methods that must be implemented by concrete services
   */
  abstract create(data: TCreateData): Promise<ServiceResult<TEntity>>;
  abstract findById(id: TId): Promise<ServiceResult<TEntity | null>>;
  abstract update(id: TId, data: TUpdateData): Promise<ServiceResult<TEntity>>;
  abstract delete(id: TId): Promise<ServiceResult<boolean>>;
  abstract list(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<TEntity>>>;

  /**
   * Helper method to create successful results
   */
  protected success<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Helper method to create error results
   */
  protected error<T>(
    code: ServiceErrorCode,
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ): ServiceResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        cause,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Helper method to handle database errors
   */
  protected handleDatabaseError<T>(error: any, operation: string): ServiceResult<T> {
    console.error(`Database error during ${operation}:`, error);

    // Map common Supabase/PostgreSQL errors to service error codes
    if (error.code === 'PGRST116') {
      return this.error(ServiceErrorCode.NOT_FOUND, 'Resource not found');
    }

    if (error.code === '23505') {
      return this.error(ServiceErrorCode.DUPLICATE_ENTRY, 'Duplicate entry');
    }

    if (error.code === '23503') {
      return this.error(ServiceErrorCode.CONSTRAINT_VIOLATION, 'Foreign key constraint violation');
    }

    if (error.code === '23514') {
      return this.error(ServiceErrorCode.CONSTRAINT_VIOLATION, 'Check constraint violation');
    }

    // Generic database error
    return this.error(
      ServiceErrorCode.DATABASE_ERROR,
      `Database operation failed: ${operation}`,
      { originalError: error.message },
      error
    );
  }

  /**
   * Helper method to validate required fields
   */
  protected validateRequired<T>(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ServiceResult<T> | null {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      return this.error(
        ServiceErrorCode.VALIDATION_ERROR,
        'Missing required fields',
        { missingFields }
      );
    }

    return null;
  }

  /**
   * Helper method to create paginated results
   */
  protected createPaginatedResult<T>(
    items: T[],
    totalCount: number,
    page: number = 1,
    limit: number = 50
  ): PaginatedResult<T> {
    return {
      items,
      totalCount,
      page,
      limit,
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Helper method to apply pagination to queries
   */
  protected applyPagination(
    query: any,
    params?: PaginationParams
  ): any {
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 50, 100); // Cap at 100 items
    const offset = params?.offset || (page - 1) * limit;

    return query.range(offset, offset + limit - 1);
  }

  /**
   * Helper method to safely access nested properties
   */
  protected safeAccess<T>(
    obj: any,
    path: string,
    defaultValue: T
  ): T {
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current === null || current === undefined) {
          return defaultValue;
        }
        current = current[key];
      }
      
      return current !== undefined ? current : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Helper method to validate database result
   */
  protected isValidDatabaseResult(result: any): boolean {
    return result !== null && 
           result !== undefined && 
           typeof result === 'object' &&
           !result.error;
  }

  /**
   * Helper method to map database errors to service errors
   */
  protected mapDatabaseError(error: any): ServiceError {
    const errorCode = this.getServiceErrorCode(error);
    const message = this.getErrorMessage(error, errorCode);
    
    return {
      code: errorCode,
      message,
      details: {
        originalCode: error.code,
        originalMessage: error.message,
      },
      cause: error,
      timestamp: new Date(),
    };
  }

  /**
   * Get appropriate service error code from database error
   */
  private getServiceErrorCode(error: any): ServiceErrorCode {
    if (error.code === 'PGRST116') return ServiceErrorCode.NOT_FOUND;
    if (error.code === '23505') return ServiceErrorCode.DUPLICATE_ENTRY;
    if (error.code === '23503' || error.code === '23514') return ServiceErrorCode.CONSTRAINT_VIOLATION;
    if (error.message?.includes('permission')) return ServiceErrorCode.PERMISSION_DENIED;
    
    return ServiceErrorCode.DATABASE_ERROR;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any, code: ServiceErrorCode): string {
    switch (code) {
      case ServiceErrorCode.NOT_FOUND:
        return 'The requested resource was not found';
      case ServiceErrorCode.DUPLICATE_ENTRY:
        return 'A record with this information already exists';
      case ServiceErrorCode.CONSTRAINT_VIOLATION:
        return 'The operation violates data integrity constraints';
      case ServiceErrorCode.PERMISSION_DENIED:
        return 'You do not have permission to perform this operation';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
}

/**
 * Utility functions for working with ServiceResult
 */
export class ServiceResultUtils {
  /**
   * Check if a result is successful
   */
  static isSuccess<T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: true; data: T } {
    return result.success && result.data !== undefined;
  }

  /**
   * Check if a result is an error
   */
  static isError<T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: false; error: ServiceError } {
    return !result.success && result.error !== undefined;
  }

  /**
   * Extract data from successful result or throw error
   */
  static unwrap<T>(result: ServiceResult<T>): T {
    if (this.isSuccess(result)) {
      return result.data;
    }
    
    const error = result.error || {
      code: ServiceErrorCode.UNKNOWN_ERROR,
      message: 'Unknown error occurred',
      timestamp: new Date(),
    };
    
    throw new Error(`Service error [${error.code}]: ${error.message}`);
  }

  /**
   * Extract data from successful result or return default value
   */
  static unwrapOr<T>(result: ServiceResult<T>, defaultValue: T): T {
    return this.isSuccess(result) ? result.data : defaultValue;
  }

  /**
   * Transform successful result data
   */
  static map<T, U>(
    result: ServiceResult<T>,
    transform: (data: T) => U
  ): ServiceResult<U> {
    if (this.isSuccess(result)) {
      try {
        return {
          success: true,
          data: transform(result.data),
        };
      } catch (error) {
        return {
          success: false,
          error: {
            code: ServiceErrorCode.UNKNOWN_ERROR,
            message: 'Error transforming result data',
            cause: error as Error,
            timestamp: new Date(),
          },
        };
      }
    }
    
    return {
      success: false,
      error: result.error || {
        code: ServiceErrorCode.UNKNOWN_ERROR,
        message: 'Unknown error occurred',
        timestamp: new Date(),
      },
    };
  }

  /**
   * Chain service operations
   */
  static async flatMap<T, U>(
    result: ServiceResult<T>,
    transform: (data: T) => Promise<ServiceResult<U>>
  ): Promise<ServiceResult<U>> {
    if (this.isSuccess(result)) {
      try {
        return await transform(result.data);
      } catch (error) {
        return {
          success: false,
          error: {
            code: ServiceErrorCode.UNKNOWN_ERROR,
            message: 'Error in service operation chain',
            cause: error as Error,
            timestamp: new Date(),
          },
        };
      }
    }
    
    return {
      success: false,
      error: result.error || {
        code: ServiceErrorCode.UNKNOWN_ERROR,
        message: 'Unknown error occurred',
        timestamp: new Date(),
      },
    };
  }

  /**
   * Combine multiple service results
   */
  static combine<T extends readonly unknown[]>(
    ...results: { [K in keyof T]: ServiceResult<T[K]> }
  ): ServiceResult<T> {
    const errors: ServiceError[] = [];
    const data: unknown[] = [];

    for (const result of results) {
      if (this.isError(result)) {
        errors.push(result.error);
      } else if (this.isSuccess(result)) {
        data.push(result.data);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: ServiceErrorCode.UNKNOWN_ERROR,
          message: `Multiple errors occurred: ${errors.map(e => e.message).join(', ')}`,
          details: { errors },
          timestamp: new Date(),
        },
      };
    }

    return {
      success: true,
      data: data as unknown as T,
    };
  }
}