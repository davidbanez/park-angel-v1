import { DiscountType, AuthProvider, UserType, UserStatus, PermissionAction, PermissionCondition, USER_STATUS } from '../types/common';
import { Email, PhoneNumber, UserId } from './value-objects';

// Re-export types for backward compatibility
export type { UserType, UserStatus, PermissionAction, PermissionCondition } from '../types/common';

export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public profile: UserProfile,
    public readonly authProvider: AuthProvider,
    public userType: UserType,
    public status: UserStatus,
    public discountEligibility: DiscountType[],
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static create(data: CreateUserData): User {
    const now = new Date();
    return new User(
      UserId.generate(),
      new Email(data.email),
      UserProfile.create(data.profile),
      data.authProvider,
      data.userType,
      USER_STATUS.ACTIVE,
      data.discountEligibility || [],
      now,
      now
    );
  }

  updateProfile(profileData: Partial<UserProfileData>): void {
    this.profile = this.profile.update(profileData);
    this.updatedAt = new Date();
  }

  activate(): void {
    if (
      this.status === USER_STATUS.INACTIVE ||
      this.status === USER_STATUS.SUSPENDED
    ) {
      this.status = USER_STATUS.ACTIVE;
      this.updatedAt = new Date();
    }
  }

  deactivate(): void {
    if (this.status === USER_STATUS.ACTIVE) {
      this.status = USER_STATUS.INACTIVE;
      this.updatedAt = new Date();
    }
  }

  suspend(): void {
    if (this.status === USER_STATUS.ACTIVE) {
      this.status = USER_STATUS.SUSPENDED;
      this.updatedAt = new Date();
    }
  }

  addDiscountEligibility(discountType: DiscountType): void {
    if (!this.discountEligibility.includes(discountType)) {
      this.discountEligibility.push(discountType);
      this.updatedAt = new Date();
    }
  }

  removeDiscountEligibility(discountType: DiscountType): void {
    const index = this.discountEligibility.indexOf(discountType);
    if (index > -1) {
      this.discountEligibility.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  isEligibleForDiscount(discountType: DiscountType): boolean {
    return this.discountEligibility.includes(discountType);
  }

  isActive(): boolean {
    return this.status === USER_STATUS.ACTIVE;
  }

  canPerformAction(): boolean {
    return this.status === USER_STATUS.ACTIVE;
  }

  toJSON() {
    return {
      id: this.id.value,
      email: this.email.value,
      profile: this.profile.toJSON(),
      authProvider: this.authProvider,
      userType: this.userType,
      status: this.status,
      discountEligibility: this.discountEligibility,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class UserProfile {
  constructor(
    public firstName: string,
    public lastName: string,
    public phone?: PhoneNumber,
    public avatar?: string,
    public dateOfBirth?: Date
  ) {}

  static create(data: UserProfileData): UserProfile {
    return new UserProfile(
      data.firstName,
      data.lastName,
      data.phone ? new PhoneNumber(data.phone) : undefined,
      data.avatar,
      data.dateOfBirth
    );
  }

  update(data: Partial<UserProfileData>): UserProfile {
    return new UserProfile(
      data.firstName ?? this.firstName,
      data.lastName ?? this.lastName,
      data.phone ? new PhoneNumber(data.phone) : this.phone,
      data.avatar ?? this.avatar,
      data.dateOfBirth ?? this.dateOfBirth
    );
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  isSeniorCitizen(): boolean {
    const age = this.getAge();
    return age !== null && age >= 60;
  }

  toJSON() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone?.value,
      avatar: this.avatar,
      dateOfBirth: this.dateOfBirth,
    };
  }
}

export class UserGroup {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public permissions: Permission[],
    public operatorId?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateUserGroupData): UserGroup {
    return new UserGroup(
      UserId.generate().value,
      data.name,
      data.description,
      data.permissions,
      data.operatorId
    );
  }

  addPermission(permission: Permission): void {
    const existingIndex = this.permissions.findIndex(
      p => p.resource === permission.resource
    );

    if (existingIndex >= 0) {
      this.permissions[existingIndex] = permission;
    } else {
      this.permissions.push(permission);
    }
  }

  removePermission(resource: string): void {
    this.permissions = this.permissions.filter(p => p.resource !== resource);
  }

  hasPermission(resource: string, action: PermissionAction): boolean {
    const permission = this.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      permissions: this.permissions,
      operatorId: this.operatorId,
      createdAt: this.createdAt,
    };
  }
}

export class Permission {
  constructor(
    public resource: string,
    public actions: PermissionAction[],
    public conditions?: PermissionCondition[]
  ) {}

  static create(
    resource: string,
    actions: PermissionAction[],
    conditions?: PermissionCondition[]
  ): Permission {
    return new Permission(resource, actions, conditions);
  }

  hasAction(action: PermissionAction): boolean {
    return this.actions.includes(action);
  }

  addAction(action: PermissionAction): void {
    if (!this.actions.includes(action)) {
      this.actions.push(action);
    }
  }

  removeAction(action: PermissionAction): void {
    this.actions = this.actions.filter(a => a !== action);
  }
}

// Enums and Types - now imported from common types
// These are kept for backward compatibility but should use the imported types

// Data Transfer Objects
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
