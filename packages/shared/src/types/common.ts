// Common types and enums shared across the application
// This file should not import from models to avoid circular dependencies

export type DiscountType = 'senior' | 'pwd' | 'custom';

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van' | 'bus' | 'suv';

export type ParkingType = 'street' | 'facility' | 'hosted';

export type SpotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'disabled';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';

// User related enums
export type AuthProvider = 'email' | 'google' | 'facebook';
export type UserType = 'client' | 'host' | 'operator' | 'admin' | 'pos';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// Message related enums
export type MessageType = 'text' | 'image' | 'file' | 'location' | 'system' | 'booking_update' | 'payment_notification';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'deleted' | 'failed';
export type ConversationType = 'user_host' | 'user_operator' | 'user_support' | 'group' | 'system' | 'direct' | 'support';

// Rating related enums
export type RatedType = 'spot' | 'host' | 'operator' | 'user';
export type RatingStatus = 'active' | 'hidden' | 'flagged';
export type ReputationLevel = 'new' | 'poor' | 'average' | 'good' | 'very_good' | 'excellent';

// Permission related types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
}

// Constants for enum values to use in models
export const USER_STATUS = {
  ACTIVE: 'active' as UserStatus,
  INACTIVE: 'inactive' as UserStatus,
  SUSPENDED: 'suspended' as UserStatus,
} as const;

export const USER_TYPE = {
  CLIENT: 'client' as UserType,
  HOST: 'host' as UserType,
  OPERATOR: 'operator' as UserType,
  ADMIN: 'admin' as UserType,
  POS: 'pos' as UserType,
} as const;

export const MESSAGE_STATUS = {
  SENT: 'sent' as MessageStatus,
  DELIVERED: 'delivered' as MessageStatus,
  READ: 'read' as MessageStatus,
  DELETED: 'deleted' as MessageStatus,
  FAILED: 'failed' as MessageStatus,
} as const;

export const MESSAGE_TYPE = {
  TEXT: 'text' as MessageType,
  IMAGE: 'image' as MessageType,
  FILE: 'file' as MessageType,
  LOCATION: 'location' as MessageType,
  SYSTEM: 'system' as MessageType,
  BOOKING_UPDATE: 'booking_update' as MessageType,
  PAYMENT_NOTIFICATION: 'payment_notification' as MessageType,
} as const;

export const CONVERSATION_TYPE = {
  USER_HOST: 'user_host' as ConversationType,
  USER_OPERATOR: 'user_operator' as ConversationType,
  USER_SUPPORT: 'user_support' as ConversationType,
  GROUP: 'group' as ConversationType,
  SYSTEM: 'system' as ConversationType,
  DIRECT: 'direct' as ConversationType,
  SUPPORT: 'support' as ConversationType,
} as const;

export const RATING_STATUS = {
  ACTIVE: 'active' as RatingStatus,
  HIDDEN: 'hidden' as RatingStatus,
  FLAGGED: 'flagged' as RatingStatus,
} as const;

export const RATED_TYPE = {
  SPOT: 'spot' as RatedType,
  HOST: 'host' as RatedType,
  OPERATOR: 'operator' as RatedType,
  USER: 'user' as RatedType,
} as const;

export const REPUTATION_LEVEL = {
  NEW: 'new' as ReputationLevel,
  POOR: 'poor' as ReputationLevel,
  AVERAGE: 'average' as ReputationLevel,
  GOOD: 'good' as ReputationLevel,
  VERY_GOOD: 'very_good' as ReputationLevel,
  EXCELLENT: 'excellent' as ReputationLevel,
} as const;

export const PARKING_TYPE = {
  STREET: 'street' as ParkingType,
  FACILITY: 'facility' as ParkingType,
  HOSTED: 'hosted' as ParkingType,
} as const;

export const SPOT_STATUS = {
  AVAILABLE: 'available' as SpotStatus,
  OCCUPIED: 'occupied' as SpotStatus,
  RESERVED: 'reserved' as SpotStatus,
  MAINTENANCE: 'maintenance' as SpotStatus,
  DISABLED: 'disabled' as SpotStatus,
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending' as BookingStatus,
  CONFIRMED: 'confirmed' as BookingStatus,
  ACTIVE: 'active' as BookingStatus,
  COMPLETED: 'completed' as BookingStatus,
  CANCELLED: 'cancelled' as BookingStatus,
  EXPIRED: 'expired' as BookingStatus,
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending' as PaymentStatus,
  PROCESSING: 'processing' as PaymentStatus,
  PAID: 'paid' as PaymentStatus,
  FAILED: 'failed' as PaymentStatus,
  REFUNDED: 'refunded' as PaymentStatus,
  CANCELLED: 'cancelled' as PaymentStatus,
} as const;