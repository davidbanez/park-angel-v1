import { UserType, PermissionAction } from '../types/common';
export interface AuthorizationContext {
    userId: string;
    userType: UserType;
    operatorId?: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, unknown>;
}
export interface ResourcePermission {
    resource: string;
    actions: PermissionAction[];
    conditions?: PermissionCondition[];
}
export interface PermissionCondition {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
    value: unknown;
}
export declare class AuthorizationService {
    private static readonly DEFAULT_PERMISSIONS;
    /**
     * Check if user has permission to perform action on resource
     */
    static hasPermission(context: AuthorizationContext, resource: string, action: PermissionAction, resourceData?: Record<string, unknown>): Promise<boolean>;
    /**
     * Get user's custom permissions from groups
     */
    private static getUserCustomPermissions;
    /**
     * Check if permission resource matches the requested resource
     */
    private static matchesResource;
    /**
     * Evaluate permission conditions
     */
    private static evaluateConditions;
    /**
     * Get nested value from object using dot notation
     */
    private static getNestedValue;
    /**
     * Interpolate template values in condition values
     */
    private static interpolateValue;
    /**
     * Evaluate a single condition
     */
    private static evaluateCondition;
    /**
     * Get all permissions for a user
     */
    static getUserPermissions(userId: string): Promise<ResourcePermission[]>;
    /**
     * Create authorization context from user data
     */
    static createAuthorizationContext(userId: string): Promise<AuthorizationContext>;
    /**
     * Middleware function to check permissions
     */
    static createPermissionMiddleware(resource: string, action: PermissionAction): (userId: string, resourceData?: Record<string, any>) => Promise<boolean>;
    /**
     * Bulk permission check for multiple resources
     */
    static checkMultiplePermissions(context: AuthorizationContext, checks: Array<{
        resource: string;
        action: PermissionAction;
        resourceData?: Record<string, unknown>;
    }>): Promise<Record<string, boolean>>;
    /**
     * Get filtered resources based on user permissions
     */
    static getFilteredResources<T extends Record<string, unknown>>(context: AuthorizationContext, resource: string, action: PermissionAction, items: T[]): Promise<T[]>;
    /**
     * Generate SQL WHERE clause for RLS policies
     */
    static generateRLSCondition(userType: UserType, userId: string, resource: string, action: PermissionAction): string;
}
