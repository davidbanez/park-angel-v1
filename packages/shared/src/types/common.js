// Common types and enums shared across the application
// This file should not import from models to avoid circular dependencies
// Constants for enum values to use in models
export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
};
export const USER_TYPE = {
    CLIENT: 'client',
    HOST: 'host',
    OPERATOR: 'operator',
    ADMIN: 'admin',
    POS: 'pos',
};
export const MESSAGE_STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    DELETED: 'deleted',
    FAILED: 'failed',
};
export const MESSAGE_TYPE = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    LOCATION: 'location',
    SYSTEM: 'system',
    BOOKING_UPDATE: 'booking_update',
    PAYMENT_NOTIFICATION: 'payment_notification',
};
export const CONVERSATION_TYPE = {
    USER_HOST: 'user_host',
    USER_OPERATOR: 'user_operator',
    USER_SUPPORT: 'user_support',
    GROUP: 'group',
    SYSTEM: 'system',
    DIRECT: 'direct',
    SUPPORT: 'support',
};
export const RATING_STATUS = {
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    FLAGGED: 'flagged',
};
export const RATED_TYPE = {
    SPOT: 'spot',
    HOST: 'host',
    OPERATOR: 'operator',
    USER: 'user',
};
export const REPUTATION_LEVEL = {
    NEW: 'new',
    POOR: 'poor',
    AVERAGE: 'average',
    GOOD: 'good',
    VERY_GOOD: 'very_good',
    EXCELLENT: 'excellent',
};
export const PARKING_TYPE = {
    STREET: 'street',
    FACILITY: 'facility',
    HOSTED: 'hosted',
};
export const SPOT_STATUS = {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    RESERVED: 'reserved',
    MAINTENANCE: 'maintenance',
    DISABLED: 'disabled',
};
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
};
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
};
