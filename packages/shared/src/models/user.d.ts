import { DiscountType, AuthProvider, UserType, UserStatus, PermissionAction, PermissionCondition } from '../types/common';
import { Email, PhoneNumber, UserId } from './value-objects';
export type { UserType, UserStatus, PermissionAction, PermissionCondition } from '../types/common';
export declare class User {
    readonly id: UserId;
    readonly email: Email;
    profile: UserProfile;
    readonly authProvider: AuthProvider;
    userType: UserType;
    status: UserStatus;
    discountEligibility: DiscountType[];
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: UserId, email: Email, profile: UserProfile, authProvider: AuthProvider, userType: UserType, status: UserStatus, discountEligibility: DiscountType[], createdAt: Date, updatedAt: Date);
    static create(data: CreateUserData): User;
    updateProfile(profileData: Partial<UserProfileData>): void;
    activate(): void;
    deactivate(): void;
    suspend(): void;
    addDiscountEligibility(discountType: DiscountType): void;
    removeDiscountEligibility(discountType: DiscountType): void;
    isEligibleForDiscount(discountType: DiscountType): boolean;
    isActive(): boolean;
    canPerformAction(): boolean;
    toJSON(): {
        id: string;
        email: string;
        profile: {
            firstName: string;
            lastName: string;
            phone: string | undefined;
            avatar: string | undefined;
            dateOfBirth: Date | undefined;
        };
        authProvider: AuthProvider;
        userType: UserType;
        status: UserStatus;
        discountEligibility: DiscountType[];
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class UserProfile {
    firstName: string;
    lastName: string;
    phone?: PhoneNumber | undefined;
    avatar?: string | undefined;
    dateOfBirth?: Date | undefined;
    constructor(firstName: string, lastName: string, phone?: PhoneNumber | undefined, avatar?: string | undefined, dateOfBirth?: Date | undefined);
    static create(data: UserProfileData): UserProfile;
    update(data: Partial<UserProfileData>): UserProfile;
    getFullName(): string;
    getAge(): number | null;
    isSeniorCitizen(): boolean;
    toJSON(): {
        firstName: string;
        lastName: string;
        phone: string | undefined;
        avatar: string | undefined;
        dateOfBirth: Date | undefined;
    };
}
export declare class UserGroup {
    readonly id: string;
    name: string;
    description: string;
    permissions: Permission[];
    operatorId?: string | undefined;
    readonly createdAt: Date;
    constructor(id: string, name: string, description: string, permissions: Permission[], operatorId?: string | undefined, createdAt?: Date);
    static create(data: CreateUserGroupData): UserGroup;
    addPermission(permission: Permission): void;
    removePermission(resource: string): void;
    hasPermission(resource: string, action: PermissionAction): boolean;
    toJSON(): {
        id: string;
        name: string;
        description: string;
        permissions: Permission[];
        operatorId: string | undefined;
        createdAt: Date;
    };
}
export declare class Permission {
    resource: string;
    actions: PermissionAction[];
    conditions?: PermissionCondition[] | undefined;
    constructor(resource: string, actions: PermissionAction[], conditions?: PermissionCondition[] | undefined);
    static create(resource: string, actions: PermissionAction[], conditions?: PermissionCondition[]): Permission;
    hasAction(action: PermissionAction): boolean;
    addAction(action: PermissionAction): void;
    removeAction(action: PermissionAction): void;
}
export interface CreateUserData {
    email: string;
    profile: UserProfileData;
    authProvider: AuthProvider;
    userType: UserType;
    discountEligibility?: DiscountType[];
}
export interface UserProfileData {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
}
export interface CreateUserGroupData {
    name: string;
    description: string;
    permissions: Permission[];
    operatorId?: string;
}
