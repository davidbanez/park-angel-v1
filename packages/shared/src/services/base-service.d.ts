import { createClient } from '@supabase/supabase-js';
/**
 * Standard error codes for service operations
 */
export declare enum ServiceErrorCode {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    DATABASE_ERROR = "DATABASE_ERROR",
    NOT_FOUND = "NOT_FOUND",
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
    RESOURCE_UNAVAILABLE = "RESOURCE_UNAVAILABLE",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    PAYMENT_PROCESSOR_ERROR = "PAYMENT_PROCESSOR_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
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
export declare abstract class AbstractBaseService<TEntity, TCreateData, TUpdateData, TId = string> implements BaseService<TEntity, TCreateData, TUpdateData, TId> {
    protected supabase: ReturnType<typeof createClient>;
    constructor(supabase: ReturnType<typeof createClient>);
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
    protected success<T>(data: T): ServiceResult<T>;
    /**
     * Helper method to create error results
     */
    protected error<T>(code: ServiceErrorCode, message: string, details?: Record<string, unknown>, cause?: Error): ServiceResult<T>;
    /**
     * Helper method to handle database errors
     */
    protected handleDatabaseError<T>(error: any, operation: string): ServiceResult<T>;
    /**
     * Helper method to validate required fields
     */
    protected validateRequired<T>(data: Record<string, unknown>, requiredFields: string[]): ServiceResult<T> | null;
    /**
     * Helper method to create paginated results
     */
    protected createPaginatedResult<T>(items: T[], totalCount: number, page?: number, limit?: number): PaginatedResult<T>;
    /**
     * Helper method to apply pagination to queries
     */
    protected applyPagination(query: any, params?: PaginationParams): any;
    /**
     * Helper method to safely access nested properties
     */
    protected safeAccess<T>(obj: any, path: string, defaultValue: T): T;
    /**
     * Helper method to validate database result
     */
    protected isValidDatabaseResult(result: any): boolean;
    /**
     * Helper method to map database errors to service errors
     */
    protected mapDatabaseError(error: any): ServiceError;
    /**
     * Get appropriate service error code from database error
     */
    private getServiceErrorCode;
    /**
     * Get user-friendly error message
     */
    private getErrorMessage;
}
/**
 * Utility functions for working with ServiceResult
 */
export declare class ServiceResultUtils {
    /**
     * Check if a result is successful
     */
    static isSuccess<T>(result: ServiceResult<T>): result is ServiceResult<T> & {
        success: true;
        data: T;
    };
    /**
     * Check if a result is an error
     */
    static isError<T>(result: ServiceResult<T>): result is ServiceResult<T> & {
        success: false;
        error: ServiceError;
    };
    /**
     * Extract data from successful result or throw error
     */
    static unwrap<T>(result: ServiceResult<T>): T;
    /**
     * Extract data from successful result or return default value
     */
    static unwrapOr<T>(result: ServiceResult<T>, defaultValue: T): T;
    /**
     * Transform successful result data
     */
    static map<T, U>(result: ServiceResult<T>, transform: (data: T) => U): ServiceResult<U>;
    /**
     * Chain service operations
     */
    static flatMap<T, U>(result: ServiceResult<T>, transform: (data: T) => Promise<ServiceResult<U>>): Promise<ServiceResult<U>>;
    /**
     * Combine multiple service results
     */
    static combine<T extends readonly unknown[]>(...results: {
        [K in keyof T]: ServiceResult<T[K]>;
    }): ServiceResult<T>;
}
