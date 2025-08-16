import { supabase } from '../lib/supabase';
import { UserType } from '../models/user';
export class AuthorizationService {
    /**
     * Check if user has permission to perform action on resource
     */
    static async hasPermission(context, resource, action, resourceData) {
        try {
            // Admin users have all permissions
            if (context.userType === UserType.ADMIN) {
                return true;
            }
            // Get user's custom permissions from groups
            const customPermissions = await this.getUserCustomPermissions(context.userId);
            // Combine default and custom permissions
            const allPermissions = [
                ...this.DEFAULT_PERMISSIONS[context.userType],
                ...customPermissions,
            ];
            // Check if user has permission
            for (const permission of allPermissions) {
                if (this.matchesResource(permission.resource, resource)) {
                    if (permission.actions.includes(action)) {
                        // Check conditions if they exist
                        if (permission.conditions && resourceData) {
                            const conditionsMet = await this.evaluateConditions(permission.conditions, context, resourceData);
                            if (conditionsMet) {
                                return true;
                            }
                        }
                        else if (!permission.conditions) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }
    /**
     * Get user's custom permissions from groups
     */
    static async getUserCustomPermissions(userId) {
        try {
            const { data, error } = await supabase
                .from('user_group_memberships')
                .select(`
          user_groups (
            permissions
          )
        `)
                .eq('user_id', userId);
            if (error)
                throw error;
            const permissions = [];
            data?.forEach((membership) => {
                const groupPermissions = membership.user_groups?.permissions || [];
                if (Array.isArray(groupPermissions)) {
                    permissions.push(...groupPermissions);
                }
            });
            return permissions;
        }
        catch (error) {
            console.error('Error getting custom permissions:', error);
            return [];
        }
    }
    /**
     * Check if permission resource matches the requested resource
     */
    static matchesResource(permissionResource, requestedResource) {
        // Wildcard permission
        if (permissionResource === '*') {
            return true;
        }
        // Exact match
        if (permissionResource === requestedResource) {
            return true;
        }
        // Pattern matching (e.g., "locations.*" matches "locations.sections")
        if (permissionResource.endsWith('*')) {
            const prefix = permissionResource.slice(0, -1);
            return requestedResource.startsWith(prefix);
        }
        return false;
    }
    /**
     * Evaluate permission conditions
     */
    static async evaluateConditions(conditions, context, resourceData) {
        for (const condition of conditions) {
            const fieldValue = this.getNestedValue(resourceData, condition.field);
            const conditionValue = this.interpolateValue(condition.value, context);
            const result = this.evaluateCondition(fieldValue, condition.operator, conditionValue);
            if (!result) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get nested value from object using dot notation
     */
    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Interpolate template values in condition values
     */
    static interpolateValue(value, context) {
        if (typeof value === 'string') {
            return value
                .replace('{{userId}}', context.userId)
                .replace('{{operatorId}}', context.operatorId || '')
                .replace('{{resourceId}}', context.resourceId || '');
        }
        return value;
    }
    /**
     * Evaluate a single condition
     */
    static evaluateCondition(fieldValue, operator, conditionValue) {
        switch (operator) {
            case 'equals':
                return fieldValue === conditionValue;
            case 'greater_than':
                return Number(fieldValue) > Number(conditionValue);
            case 'less_than':
                return Number(fieldValue) < Number(conditionValue);
            case 'contains':
                if (Array.isArray(fieldValue)) {
                    return fieldValue.includes(conditionValue);
                }
                return String(fieldValue).includes(String(conditionValue));
            case 'in':
                return (Array.isArray(conditionValue) && conditionValue.includes(fieldValue));
            case 'not_in':
                return (Array.isArray(conditionValue) && !conditionValue.includes(fieldValue));
            default:
                return false;
        }
    }
    /**
     * Get all permissions for a user
     */
    static async getUserPermissions(userId) {
        try {
            // Get user type
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_type, operator_id')
                .eq('id', userId)
                .single();
            if (userError)
                throw userError;
            const userType = userData.user_type;
            // Get default permissions
            const defaultPermissions = this.DEFAULT_PERMISSIONS[userType] || [];
            // Get custom permissions from groups
            const customPermissions = await this.getUserCustomPermissions(userId);
            return [...defaultPermissions, ...customPermissions];
        }
        catch (error) {
            console.error('Error getting user permissions:', error);
            return [];
        }
    }
    /**
     * Create authorization context from user data
     */
    static async createAuthorizationContext(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_type, operator_id')
                .eq('id', userId)
                .single();
            if (error)
                throw error;
            return {
                userId,
                userType: data.user_type,
                operatorId: data.operator_id,
            };
        }
        catch (error) {
            console.error('Error creating authorization context:', error);
            return {
                userId,
                userType: UserType.CLIENT,
            };
        }
    }
    /**
     * Middleware function to check permissions
     */
    static createPermissionMiddleware(resource, action) {
        return async (userId, resourceData) => {
            const context = await this.createAuthorizationContext(userId);
            return this.hasPermission(context, resource, action, resourceData);
        };
    }
    /**
     * Bulk permission check for multiple resources
     */
    static async checkMultiplePermissions(context, checks) {
        const results = {};
        for (const check of checks) {
            const key = `${check.resource}:${check.action}`;
            results[key] = await this.hasPermission(context, check.resource, check.action, check.resourceData);
        }
        return results;
    }
    /**
     * Get filtered resources based on user permissions
     */
    static async getFilteredResources(context, resource, action, items) {
        const filteredItems = [];
        for (const item of items) {
            const hasAccess = await this.hasPermission(context, resource, action, item);
            if (hasAccess) {
                filteredItems.push(item);
            }
        }
        return filteredItems;
    }
    /**
     * Generate SQL WHERE clause for RLS policies
     */
    static generateRLSCondition(userType, userId, resource, action) {
        // Admin users can access everything
        if (userType === UserType.ADMIN) {
            return 'true';
        }
        const permissions = this.DEFAULT_PERMISSIONS[userType] || [];
        const relevantPermission = permissions.find(p => this.matchesResource(p.resource, resource) && p.actions.includes(action));
        if (!relevantPermission || !relevantPermission.conditions) {
            return 'false';
        }
        // Convert conditions to SQL
        const sqlConditions = relevantPermission.conditions.map(condition => {
            const field = condition.field.replace(/\./g, '_'); // Convert dot notation to underscore
            const value = String(condition.value).replace('{{userId}}', userId);
            switch (condition.operator) {
                case 'equals':
                    return `${field} = '${value}'`;
                case 'contains':
                    if (field.includes('participants')) {
                        return `'${value}' = ANY(${field})`;
                    }
                    return `${field} ILIKE '%${value}%'`;
                default:
                    return 'false';
            }
        });
        return sqlConditions.join(' AND ');
    }
}
// Default permissions for each user type
Object.defineProperty(AuthorizationService, "DEFAULT_PERMISSIONS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        [UserType.ADMIN]: [
            // Admins have full access to everything
            { resource: '*', actions: ['create', 'read', 'update', 'delete'] },
        ],
        [UserType.OPERATOR]: [
            // Operators can manage their own locations and related resources
            {
                resource: 'locations',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    { field: 'operator_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            {
                resource: 'sections',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    {
                        field: 'location.operator_id',
                        operator: 'equals',
                        value: '{{userId}}',
                    },
                ],
            },
            {
                resource: 'zones',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    {
                        field: 'section.location.operator_id',
                        operator: 'equals',
                        value: '{{userId}}',
                    },
                ],
            },
            {
                resource: 'parking_spots',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    {
                        field: 'zone.section.location.operator_id',
                        operator: 'equals',
                        value: '{{userId}}',
                    },
                ],
            },
            {
                resource: 'bookings',
                actions: ['read', 'update'],
                conditions: [
                    {
                        field: 'spot.zone.section.location.operator_id',
                        operator: 'equals',
                        value: '{{userId}}',
                    },
                ],
            },
            {
                resource: 'user_groups',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    { field: 'operator_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            { resource: 'reports', actions: ['read'] },
            { resource: 'analytics', actions: ['read'] },
        ],
        [UserType.POS]: [
            // POS users can manage bookings and spots for their operator's locations
            {
                resource: 'bookings',
                actions: ['create', 'read', 'update'],
                conditions: [
                    {
                        field: 'spot.zone.section.location.operator_id',
                        operator: 'equals',
                        value: '{{operatorId}}',
                    },
                ],
            },
            {
                resource: 'parking_spots',
                actions: ['read', 'update'],
                conditions: [
                    {
                        field: 'zone.section.location.operator_id',
                        operator: 'equals',
                        value: '{{operatorId}}',
                    },
                ],
            },
            {
                resource: 'violation_reports',
                actions: ['create', 'read', 'update'],
                conditions: [
                    {
                        field: 'location.operator_id',
                        operator: 'equals',
                        value: '{{operatorId}}',
                    },
                ],
            },
            { resource: 'vehicles', actions: ['read'] },
            { resource: 'users', actions: ['read'] },
        ],
        [UserType.HOST]: [
            // Hosts can manage their own listings and bookings
            {
                resource: 'hosted_listings',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    { field: 'host_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            {
                resource: 'bookings',
                actions: ['read', 'update'],
                conditions: [
                    {
                        field: 'spot.hosted_listing.host_id',
                        operator: 'equals',
                        value: '{{userId}}',
                    },
                ],
            },
            {
                resource: 'messages',
                actions: ['create', 'read', 'update'],
                conditions: [
                    { field: 'participants', operator: 'contains', value: '{{userId}}' },
                ],
            },
            {
                resource: 'ratings',
                actions: ['create', 'read'],
                conditions: [
                    {
                        field: 'booking.spot.hosted_listing.host_id',
                        operator: 'equals',
                        value: '{{userId}}',
                    },
                ],
            },
            { resource: 'host_payouts', actions: ['read'] },
        ],
        [UserType.CLIENT]: [
            // Clients can manage their own bookings, vehicles, and profile
            {
                resource: 'bookings',
                actions: ['create', 'read', 'update'],
                conditions: [
                    { field: 'user_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            {
                resource: 'vehicles',
                actions: ['create', 'read', 'update', 'delete'],
                conditions: [
                    { field: 'user_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            {
                resource: 'user_profiles',
                actions: ['read', 'update'],
                conditions: [
                    { field: 'user_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            {
                resource: 'messages',
                actions: ['create', 'read', 'update'],
                conditions: [
                    { field: 'participants', operator: 'contains', value: '{{userId}}' },
                ],
            },
            {
                resource: 'ratings',
                actions: ['create', 'read'],
                conditions: [
                    { field: 'rater_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            {
                resource: 'violation_reports',
                actions: ['create', 'read'],
                conditions: [
                    { field: 'reporter_id', operator: 'equals', value: '{{userId}}' },
                ],
            },
            { resource: 'locations', actions: ['read'] },
            { resource: 'sections', actions: ['read'] },
            { resource: 'zones', actions: ['read'] },
            { resource: 'parking_spots', actions: ['read'] },
            { resource: 'hosted_listings', actions: ['read'] },
        ],
    }
});
