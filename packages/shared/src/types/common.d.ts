export type DiscountType = 'senior' | 'pwd' | 'custom';
export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van' | 'bus' | 'suv';
export type ParkingType = 'street' | 'facility' | 'hosted';
export type SpotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'disabled';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type AuthProvider = 'email' | 'google' | 'facebook';
export type UserType = 'client' | 'host' | 'operator' | 'admin' | 'pos';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type MessageType = 'text' | 'image' | 'file' | 'location' | 'system' | 'booking_update' | 'payment_notification';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'deleted' | 'failed';
export type ConversationType = 'user_host' | 'user_operator' | 'user_support' | 'group' | 'system' | 'direct' | 'support';
export type RatedType = 'spot' | 'host' | 'operator' | 'user';
export type RatingStatus = 'active' | 'hidden' | 'flagged';
export type ReputationLevel = 'new' | 'poor' | 'average' | 'good' | 'very_good' | 'excellent';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export interface PermissionCondition {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: string | number;
}
export declare const USER_STATUS: {
    readonly ACTIVE: UserStatus;
    readonly INACTIVE: UserStatus;
    readonly SUSPENDED: UserStatus;
};
export declare const USER_TYPE: {
    readonly CLIENT: UserType;
    readonly HOST: UserType;
    readonly OPERATOR: UserType;
    readonly ADMIN: UserType;
    readonly POS: UserType;
};
export declare const MESSAGE_STATUS: {
    readonly SENT: MessageStatus;
    readonly DELIVERED: MessageStatus;
    readonly READ: MessageStatus;
    readonly DELETED: MessageStatus;
    readonly FAILED: MessageStatus;
};
export declare const MESSAGE_TYPE: {
    readonly TEXT: MessageType;
    readonly IMAGE: MessageType;
    readonly FILE: MessageType;
    readonly LOCATION: MessageType;
    readonly SYSTEM: MessageType;
    readonly BOOKING_UPDATE: MessageType;
    readonly PAYMENT_NOTIFICATION: MessageType;
};
export declare const CONVERSATION_TYPE: {
    readonly USER_HOST: ConversationType;
    readonly USER_OPERATOR: ConversationType;
    readonly USER_SUPPORT: ConversationType;
    readonly GROUP: ConversationType;
    readonly SYSTEM: ConversationType;
    readonly DIRECT: ConversationType;
    readonly SUPPORT: ConversationType;
};
export declare const RATING_STATUS: {
    readonly ACTIVE: RatingStatus;
    readonly HIDDEN: RatingStatus;
    readonly FLAGGED: RatingStatus;
};
export declare const RATED_TYPE: {
    readonly SPOT: RatedType;
    readonly HOST: RatedType;
    readonly OPERATOR: RatedType;
    readonly USER: RatedType;
};
export declare const REPUTATION_LEVEL: {
    readonly NEW: ReputationLevel;
    readonly POOR: ReputationLevel;
    readonly AVERAGE: ReputationLevel;
    readonly GOOD: ReputationLevel;
    readonly VERY_GOOD: ReputationLevel;
    readonly EXCELLENT: ReputationLevel;
};
export declare const PARKING_TYPE: {
    readonly STREET: ParkingType;
    readonly FACILITY: ParkingType;
    readonly HOSTED: ParkingType;
};
export declare const SPOT_STATUS: {
    readonly AVAILABLE: SpotStatus;
    readonly OCCUPIED: SpotStatus;
    readonly RESERVED: SpotStatus;
    readonly MAINTENANCE: SpotStatus;
    readonly DISABLED: SpotStatus;
};
export declare const BOOKING_STATUS: {
    readonly PENDING: BookingStatus;
    readonly CONFIRMED: BookingStatus;
    readonly ACTIVE: BookingStatus;
    readonly COMPLETED: BookingStatus;
    readonly CANCELLED: BookingStatus;
    readonly EXPIRED: BookingStatus;
};
export declare const PAYMENT_STATUS: {
    readonly PENDING: PaymentStatus;
    readonly PROCESSING: PaymentStatus;
    readonly PAID: PaymentStatus;
    readonly FAILED: PaymentStatus;
    readonly REFUNDED: PaymentStatus;
    readonly CANCELLED: PaymentStatus;
};
