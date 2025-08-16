import type { AuthError, User, Session } from '@supabase/supabase-js';
import { UserType, PermissionAction } from '../types/common';
export interface SignUpData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: UserType;
}
export interface SignInData {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}
export interface MFAEnrollResponse {
    factorId: string;
    qrCode: string;
    secret: string;
    error: AuthError | null;
}
export interface MFAChallengeResponse {
    challengeId: string;
    error: AuthError | null;
}
export interface UserPermissions {
    userId: string;
    userType: UserType;
    groups: UserGroup[];
    permissions: Permission[];
}
export interface UserGroup {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    operatorId?: string;
}
export interface Permission {
    resource: string;
    actions: PermissionAction[];
    conditions?: AuthPermissionCondition[];
}
export interface AuthPermissionCondition {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: string | number;
}
export interface SessionInfo {
    user: User;
    session: Session;
    permissions: UserPermissions;
    lastActivity: Date;
    expiresAt: Date;
}
export interface SecurityPolicy {
    sessionTimeout: number;
    maxConcurrentSessions: number;
    requireMFA: boolean;
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
}
export declare class AuthService {
    private static readonly DEFAULT_SECURITY_POLICY;
    private static securityPolicy;
    private static activeSessions;
    /**
     * Sign up with email and password
     */
    static signUp(data: SignUpData): Promise<AuthResponse>;
    /**
     * Sign in with email and password
     */
    static signIn(data: SignInData): Promise<AuthResponse>;
    /**
     * Sign in with Google OAuth
     */
    static signInWithGoogle(): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Sign in with Facebook OAuth
     */
    static signInWithFacebook(): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Sign out current user
     */
    static signOut(): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Reset password
     */
    static resetPassword(email: string, redirectUrl?: string): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Update password
     */
    static updatePassword(newPassword: string): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Get current session
     */
    static getSession(): Promise<{
        session: Session | null;
        error: AuthError | null;
    }>;
    /**
     * Get current user
     */
    static getUser(): Promise<{
        user: User | null;
        error: AuthError | null;
    }>;
    /**
     * Listen to auth state changes
     */
    static onAuthStateChange(callback: (event: string, session: Session | null) => void): {
        data: {
            subscription: import("@supabase/auth-js").Subscription;
        };
    };
    /**
     * Enable Two-Factor Authentication
     */
    static enableMFA(): Promise<MFAEnrollResponse>;
    /**
     * Challenge MFA factor
     */
    static challengeMFA(factorId: string): Promise<MFAChallengeResponse>;
    /**
     * Verify MFA challenge
     */
    static verifyMFA(factorId: string, challengeId: string, code: string): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Disable MFA factor
     */
    static disableMFA(factorId: string): Promise<{
        error: AuthError | null;
    }>;
    /**
     * List MFA factors
     */
    static listMFAFactors(): Promise<{
        factors: import("@supabase/auth-js").Factor[];
        error: null;
    } | {
        factors: never[];
        error: AuthError;
    }>;
    /**
     * Get user permissions including groups and individual permissions
     */
    static getUserPermissions(userId: string): Promise<UserPermissions>;
    /**
     * Check if user has specific permission
     */
    static hasPermission(userId: string, resource: string, action: PermissionAction, context?: Record<string, unknown>): Promise<boolean>;
    /**
     * Create user group
     */
    static createUserGroup(name: string, description: string, permissions: Permission[], operatorId?: string): Promise<{
        group: UserGroup | null;
        error: Error | null;
    }>;
    /**
     * Add user to group
     */
    static addUserToGroup(userId: string, groupId: string): Promise<{
        error: Error | null;
    }>;
    /**
     * Remove user from group
     */
    static removeUserFromGroup(userId: string, groupId: string): Promise<{
        error: Error | null;
    }>;
    /**
     * Validate and refresh session
     */
    static validateSession(token: string): Promise<SessionInfo | null>;
    /**
     * Extend session timeout
     */
    static extendSession(token: string): boolean;
    /**
     * Invalidate session
     */
    static invalidateSession(token: string): void;
    /**
     * Get active sessions for user
     */
    static getActiveSessionsForUser(userId: string): SessionInfo[];
    /**
     * Manage concurrent sessions
     */
    private static manageConcurrentSessions;
    /**
     * Update security policy
     */
    static updateSecurityPolicy(policy: Partial<SecurityPolicy>): void;
    /**
     * Get current security policy
     */
    static getSecurityPolicy(): SecurityPolicy;
    /**
     * Validate password strength
     */
    private static validatePassword;
    /**
     * Track failed login attempt
     */
    private static trackFailedLogin;
    /**
     * Get failed login attempts count
     */
    private static getFailedLoginAttempts;
    /**
     * Clear failed login attempts
     */
    private static clearFailedLoginAttempts;
    /**
     * Check if account is locked
     */
    private static isAccountLocked;
    /**
     * Get user status
     */
    private static getUserStatus;
    /**
     * Get user type
     */
    private static getUserType;
    /**
     * Log audit event
     */
    private static logAuditEvent;
    /**
     * Create user profile after successful authentication
     */
    private static createUserProfile;
    /**
     * Check if current user is authenticated
     */
    static isAuthenticated(): Promise<boolean>;
    /**
     * Get current user with profile
     */
    static getCurrentUserWithProfile(): Promise<{
        user: User | null;
        profile: unknown | null;
        userType: UserType | null;
        error: Error | null;
    }>;
    /**
     * Require authentication - throws error if not authenticated
     */
    static requireAuth(): Promise<{
        user: User;
        userType: UserType;
    }>;
    /**
     * Require specific user type - throws error if user doesn't have required type
     */
    static requireUserType(requiredTypes: UserType[]): Promise<{
        user: User;
        userType: UserType;
    }>;
    /**
     * Require permission - throws error if user doesn't have permission
     */
    static requirePermission(resource: string, action: PermissionAction, resourceData?: Record<string, any>): Promise<{
        user: User;
        userType: UserType;
    }>;
    /**
     * Create authentication middleware
     */
    static createAuthMiddleware(options?: {
        requiredTypes?: UserType[];
        requiredPermission?: {
            resource: string;
            action: PermissionAction;
        };
    }): (context?: Record<string, unknown>) => Promise<{
        user: User;
        userType: UserType;
    }>;
}
export { SessionService } from './session';
export { AuthorizationService } from './authorization';
export { AccountVerificationService } from './account-verification';
