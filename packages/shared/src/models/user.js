import { Email, PhoneNumber, UserId } from './value-objects';
export class User {
    constructor(id, email, profile, authProvider, userType, status, discountEligibility, createdAt, updatedAt) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "email", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: email
        });
        Object.defineProperty(this, "profile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: profile
        });
        Object.defineProperty(this, "authProvider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: authProvider
        });
        Object.defineProperty(this, "userType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userType
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "discountEligibility", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: discountEligibility
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        const now = new Date();
        return new User(UserId.generate(), new Email(data.email), UserProfile.create(data.profile), data.authProvider, data.userType, UserStatus.ACTIVE, data.discountEligibility || [], now, now);
    }
    updateProfile(profileData) {
        this.profile = this.profile.update(profileData);
        this.updatedAt = new Date();
    }
    activate() {
        if (this.status === UserStatus.INACTIVE ||
            this.status === UserStatus.SUSPENDED) {
            this.status = UserStatus.ACTIVE;
            this.updatedAt = new Date();
        }
    }
    deactivate() {
        if (this.status === UserStatus.ACTIVE) {
            this.status = UserStatus.INACTIVE;
            this.updatedAt = new Date();
        }
    }
    suspend() {
        if (this.status === UserStatus.ACTIVE) {
            this.status = UserStatus.SUSPENDED;
            this.updatedAt = new Date();
        }
    }
    addDiscountEligibility(discountType) {
        if (!this.discountEligibility.includes(discountType)) {
            this.discountEligibility.push(discountType);
            this.updatedAt = new Date();
        }
    }
    removeDiscountEligibility(discountType) {
        const index = this.discountEligibility.indexOf(discountType);
        if (index > -1) {
            this.discountEligibility.splice(index, 1);
            this.updatedAt = new Date();
        }
    }
    isEligibleForDiscount(discountType) {
        return this.discountEligibility.includes(discountType);
    }
    isActive() {
        return this.status === UserStatus.ACTIVE;
    }
    canPerformAction() {
        return this.status === UserStatus.ACTIVE;
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
    constructor(firstName, lastName, phone, avatar, dateOfBirth) {
        Object.defineProperty(this, "firstName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: firstName
        });
        Object.defineProperty(this, "lastName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: lastName
        });
        Object.defineProperty(this, "phone", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: phone
        });
        Object.defineProperty(this, "avatar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: avatar
        });
        Object.defineProperty(this, "dateOfBirth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dateOfBirth
        });
    }
    static create(data) {
        return new UserProfile(data.firstName, data.lastName, data.phone ? new PhoneNumber(data.phone) : undefined, data.avatar, data.dateOfBirth);
    }
    update(data) {
        return new UserProfile(data.firstName ?? this.firstName, data.lastName ?? this.lastName, data.phone ? new PhoneNumber(data.phone) : this.phone, data.avatar ?? this.avatar, data.dateOfBirth ?? this.dateOfBirth);
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    getAge() {
        if (!this.dateOfBirth)
            return null;
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    isSeniorCitizen() {
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
    constructor(id, name, description, permissions, operatorId, createdAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: description
        });
        Object.defineProperty(this, "permissions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: permissions
        });
        Object.defineProperty(this, "operatorId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: operatorId
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
    }
    static create(data) {
        return new UserGroup(UserId.generate().value, data.name, data.description, data.permissions, data.operatorId);
    }
    addPermission(permission) {
        const existingIndex = this.permissions.findIndex(p => p.resource === permission.resource);
        if (existingIndex >= 0) {
            this.permissions[existingIndex] = permission;
        }
        else {
            this.permissions.push(permission);
        }
    }
    removePermission(resource) {
        this.permissions = this.permissions.filter(p => p.resource !== resource);
    }
    hasPermission(resource, action) {
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
    constructor(resource, actions, conditions) {
        Object.defineProperty(this, "resource", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: resource
        });
        Object.defineProperty(this, "actions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: actions
        });
        Object.defineProperty(this, "conditions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: conditions
        });
    }
    static create(resource, actions, conditions) {
        return new Permission(resource, actions, conditions);
    }
    hasAction(action) {
        return this.actions.includes(action);
    }
    addAction(action) {
        if (!this.actions.includes(action)) {
            this.actions.push(action);
        }
    }
    removeAction(action) {
        this.actions = this.actions.filter(a => a !== action);
    }
}
// Enums and Types
export var AuthProvider;
(function (AuthProvider) {
    AuthProvider["EMAIL"] = "email";
    AuthProvider["GOOGLE"] = "google";
    AuthProvider["FACEBOOK"] = "facebook";
})(AuthProvider || (AuthProvider = {}));
export var UserType;
(function (UserType) {
    UserType["CLIENT"] = "client";
    UserType["HOST"] = "host";
    UserType["OPERATOR"] = "operator";
    UserType["ADMIN"] = "admin";
    UserType["POS"] = "pos";
})(UserType || (UserType = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (UserStatus = {}));
