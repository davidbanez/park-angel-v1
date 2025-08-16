import { supabase, handleSupabaseError } from '../lib/supabase';
import type { AuthError, User, Session } from '@supabase/supabase-js';
import { UserType, UserStatus, PermissionAction, USER_TYPE, USER_STATUS } from '../types/common';
import { SessionService } from './session';
import { AuthorizationService } from './authorization';
import { AccountVerificationService } from './account-verification';

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
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
  requireMFA: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
}

export class AuthService {
  private static readonly DEFAULT_SECURITY_POLICY: SecurityPolicy = {
    sessionTimeout: 480, // 8 hours
    maxConcurrentSessions: 3,
    requireMFA: false,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30, // 30 minutes
  };

  private static securityPolicy: SecurityPolicy = this.DEFAULT_SECURITY_POLICY;
  private static activeSessions = new Map<string, SessionInfo>();

  /**
   * Sign up with email and password
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`
        );
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            user_type: data.userType,
          },
        },
      });

      if (error) {
        handleSupabaseError(error);
      }

      // Create user profile after successful signup
      if (authData.user) {
        await this.createUserProfile(authData.user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          userType: data.userType,
          email: authData.user.email || data.email,
        });

        // Log audit event
        await this.logAuditEvent(
          authData.user.id,
          'user_signup',
          'users',
          authData.user.id,
          null,
          {
            email: data.email,
            userType: data.userType,
          }
        );
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      // Check for account lockout
      const isLocked = await this.isAccountLocked(data.email);
      if (isLocked) {
        throw new Error(
          'Account is temporarily locked due to too many failed login attempts'
        );
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Track failed login attempt
        await this.trackFailedLogin(data.email);
        handleSupabaseError(error);
      }

      if (authData.user && authData.session) {
        // Clear failed login attempts on successful login
        await this.clearFailedLoginAttempts(data.email);

        // Check if user is active
        const userStatus = await this.getUserStatus(authData.user.id);
        if (userStatus !== USER_STATUS.ACTIVE) {
          await supabase.auth.signOut();
          throw new Error('Account is inactive or suspended');
        }

        // Check for concurrent sessions
        await this.manageConcurrentSessions(authData.user.id);

        // Create session using SessionService
        const userType = await this.getUserType(authData.user.id);
        await SessionService.createSession(
          authData.user,
          authData.session,
          userType
        );

        // Log audit event
        await this.logAuditEvent(
          authData.user.id,
          'user_signin',
          'users',
          authData.user.id,
          null,
          {
            email: data.email,
            sessionId: authData.session.access_token,
          }
        );
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with Facebook OAuth
   */
  static async signInWithFacebook(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      // Get current session before signing out
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error } = await supabase.auth.signOut();

      if (error) {
        handleSupabaseError(error);
      }

      // Invalidate session in SessionService
      if (session) {
        await SessionService.invalidateSession(
          session.access_token,
          'user_signout'
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(
    email: string,
    redirectUrl?: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const result = await AccountVerificationService.sendPasswordResetEmail({
        email,
        redirectUrl,
      });

      if (!result.success) {
        return { error: result.error as AuthError };
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(
    newPassword: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        handleSupabaseError(error);
      }

      return {
        session: data.session,
        error: null,
      };
    } catch (error) {
      return {
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        handleSupabaseError(error);
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Enable Two-Factor Authentication
   */
  static async enableMFA(): Promise<MFAEnrollResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        handleSupabaseError(error);
        return { factorId: '', qrCode: '', secret: '', error };
      }

      // Log audit event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.logAuditEvent(
          user.id,
          'mfa_enabled',
          'users',
          user.id,
          null,
          {
            factorId: data.id,
          }
        );
      }

      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        error: null,
      };
    } catch (error) {
      return {
        factorId: '',
        qrCode: '',
        secret: '',
        error: error as AuthError,
      };
    }
  }

  /**
   * Challenge MFA factor
   */
  static async challengeMFA(factorId: string): Promise<MFAChallengeResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        handleSupabaseError(error);
        return { challengeId: '', error };
      }

      return {
        challengeId: data.id,
        error: null,
      };
    } catch (error) {
      return {
        challengeId: '',
        error: error as AuthError,
      };
    }
  }

  /**
   * Verify MFA challenge
   */
  static async verifyMFA(
    factorId: string,
    challengeId: string,
    code: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        handleSupabaseError(error);
      }

      // Log audit event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.logAuditEvent(
          user.id,
          'mfa_verified',
          'users',
          user.id,
          null,
          {
            factorId,
            challengeId,
          }
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Disable MFA factor
   */
  static async disableMFA(
    factorId: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        handleSupabaseError(error);
      }

      // Log audit event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.logAuditEvent(
          user.id,
          'mfa_disabled',
          'users',
          user.id,
          null,
          {
            factorId,
          }
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * List MFA factors
   */
  static async listMFAFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        handleSupabaseError(error);
      }

      return { factors: data?.totp || [], error: null };
    } catch (error) {
      return { factors: [], error: error as AuthError };
    }
  }

  // ============================================================================
  // AUTHORIZATION METHODS
  // ============================================================================

  /**
   * Get user permissions including groups and individual permissions
   */
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      // Get user type
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get user groups and their permissions
      const { data: groupData, error: groupError } = await supabase
        .from('user_group_memberships')
        .select(
          `
          user_groups (
            id,
            name,
            description,
            permissions,
            operator_id
          )
        `
        )
        .eq('user_id', userId);

      if (groupError) throw groupError;

      const groups: UserGroup[] =
        groupData?.map((membership: any) => ({
          id: membership.user_groups.id,
          name: membership.user_groups.name,
          description: membership.user_groups.description,
          permissions:
            (membership.user_groups.permissions as Permission[]) || [],
          operatorId: membership.user_groups.operator_id,
        })) || [];

      // Aggregate all permissions from groups
      const allPermissions: Permission[] = [];
      groups.forEach(group => {
        if (Array.isArray(group.permissions)) {
          allPermissions.push(...group.permissions);
        }
      });

      return {
        userId,
        userType: userData.user_type as UserType,
        groups,
        permissions: allPermissions,
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {
        userId,
        userType: USER_TYPE.CLIENT,
        groups: [],
        permissions: [],
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: string,
    resource: string,
    action: PermissionAction,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);

      // Admin users have all permissions
      if (permissions.userType === USER_TYPE.ADMIN) {
        return true;
      }

      // Check if user has the specific permission
      const hasPermission = permissions.permissions.some(permission => {
        if (permission.resource !== resource) return false;
        if (!permission.actions.includes(action)) return false;

        // Check conditions if provided
        if (permission.conditions && context) {
          return permission.conditions.every(condition => {
            const contextValue = context[condition.field];
            switch (condition.operator) {
              case 'equals':
                return contextValue === condition.value;
              case 'greater_than':
                return Number(contextValue) > Number(condition.value);
              case 'less_than':
                return Number(contextValue) < Number(condition.value);
              case 'contains':
                return String(contextValue).includes(String(condition.value));
              default:
                return false;
            }
          });
        }

        return true;
      });

      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Create user group
   */
  static async createUserGroup(
    name: string,
    description: string,
    permissions: Permission[],
    operatorId?: string
  ): Promise<{ group: UserGroup | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .insert({
          name,
          description,
          permissions: JSON.stringify(permissions),
          operator_id: operatorId,
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.logAuditEvent(
          user.id,
          'user_group_created',
          'user_groups',
          data.id,
          null,
          {
            name,
            permissions: permissions.length,
          }
        );
      }

      return {
        group: {
          id: data.id,
          name: data.name,
          description: data.description,
          permissions: JSON.parse(data.permissions as string),
          operatorId: data.operator_id,
        },
        error: null,
      };
    } catch (error) {
      return { group: null, error: error as Error };
    }
  }

  /**
   * Add user to group
   */
  static async addUserToGroup(
    userId: string,
    groupId: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('user_group_memberships').insert({
        user_id: userId,
        group_id: groupId,
      });

      if (error) throw error;

      // Log audit event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.logAuditEvent(
          user.id,
          'user_added_to_group',
          'user_group_memberships',
          null,
          null,
          {
            userId,
            groupId,
          }
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Remove user from group
   */
  static async removeUserFromGroup(
    userId: string,
    groupId: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('user_group_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) throw error;

      // Log audit event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.logAuditEvent(
          user.id,
          'user_removed_from_group',
          'user_group_memberships',
          null,
          null,
          {
            userId,
            groupId,
          }
        );
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT METHODS
  // ============================================================================

  /**
   * Validate and refresh session
   */
  static async validateSession(token: string): Promise<SessionInfo | null> {
    const sessionInfo = this.activeSessions.get(token);
    if (!sessionInfo) return null;

    // Check if session has expired
    if (new Date() > sessionInfo.expiresAt) {
      this.activeSessions.delete(token);
      return null;
    }

    // Update last activity
    sessionInfo.lastActivity = new Date();
    this.activeSessions.set(token, sessionInfo);

    return sessionInfo;
  }

  /**
   * Extend session timeout
   */
  static extendSession(token: string): boolean {
    const sessionInfo = this.activeSessions.get(token);
    if (!sessionInfo) return false;

    sessionInfo.expiresAt = new Date(
      Date.now() + this.securityPolicy.sessionTimeout * 60 * 1000
    );
    sessionInfo.lastActivity = new Date();
    this.activeSessions.set(token, sessionInfo);

    return true;
  }

  /**
   * Invalidate session
   */
  static invalidateSession(token: string): void {
    this.activeSessions.delete(token);
  }

  /**
   * Get active sessions for user
   */
  static getActiveSessionsForUser(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.user.id === userId
    );
  }

  /**
   * Manage concurrent sessions
   */
  private static async manageConcurrentSessions(userId: string): Promise<void> {
    const userSessions = this.getActiveSessionsForUser(userId);

    if (userSessions.length >= this.securityPolicy.maxConcurrentSessions) {
      // Remove oldest sessions
      const sortedSessions = userSessions.sort(
        (a, b) => a.lastActivity.getTime() - b.lastActivity.getTime()
      );

      const sessionsToRemove = sortedSessions.slice(
        0,
        userSessions.length - this.securityPolicy.maxConcurrentSessions + 1
      );

      sessionsToRemove.forEach(session => {
        this.activeSessions.delete(session.session.access_token);
      });
    }
  }

  // ============================================================================
  // SECURITY POLICY METHODS
  // ============================================================================

  /**
   * Update security policy
   */
  static updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy };
  }

  /**
   * Get current security policy
   */
  static getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy };
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < this.securityPolicy.passwordMinLength) {
      errors.push(
        `Password must be at least ${this.securityPolicy.passwordMinLength} characters long`
      );
    }

    if (this.securityPolicy.passwordRequireSpecialChars) {
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Track failed login attempt
   */
  private static async trackFailedLogin(email: string): Promise<void> {
    try {
      const key = `failed_login_${email}`;
      const attempts = await this.getFailedLoginAttempts(email);

      // Store in system config or use a cache like Redis in production
      await supabase.from('system_config').upsert({
        key,
        value: {
          attempts: attempts + 1,
          lastAttempt: new Date().toISOString(),
        },
        description: 'Failed login attempts tracking',
        is_public: false,
        updated_by: '00000000-0000-0000-0000-000000000000', // System user
      });
    } catch (error) {
      console.error('Error tracking failed login:', error);
    }
  }

  /**
   * Get failed login attempts count
   */
  private static async getFailedLoginAttempts(email: string): Promise<number> {
    try {
      const key = `failed_login_${email}`;
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', key)
        .single();

      return data?.value ? JSON.parse(data.value as string).attempts || 0 : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear failed login attempts
   */
  private static async clearFailedLoginAttempts(email: string): Promise<void> {
    try {
      const key = `failed_login_${email}`;
      await supabase.from('system_config').delete().eq('key', key);
    } catch (error) {
      console.error('Error clearing failed login attempts:', error);
    }
  }

  /**
   * Check if account is locked
   */
  private static async isAccountLocked(email: string): Promise<boolean> {
    try {
      const attempts = await this.getFailedLoginAttempts(email);
      if (attempts < this.securityPolicy.maxLoginAttempts) {
        return false;
      }

      const key = `failed_login_${email}`;
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', key)
        .single();

      if (!data?.value) return false;

      const value = JSON.parse(data.value as string);

      if (!value.lastAttempt) return false;

      const lastAttempt = new Date(value.lastAttempt);
      const lockoutEnd = new Date(
        lastAttempt.getTime() + this.securityPolicy.lockoutDuration * 60 * 1000
      );

      return new Date() < lockoutEnd;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user status
   */
  private static async getUserStatus(userId: string): Promise<UserStatus> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data.status as UserStatus;
    } catch (error) {
      return USER_STATUS.INACTIVE;
    }
  }

  /**
   * Get user type
   */
  private static async getUserType(userId: string): Promise<UserType> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data.user_type as UserType;
    } catch (error) {
      return USER_TYPE.CLIENT;
    }
  }

  /**
   * Log audit event
   */
  private static async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    oldValues: unknown,
    newValues: unknown
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: JSON.stringify(oldValues),
        new_values: JSON.stringify(newValues),
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Create user profile after successful authentication
   */
  private static async createUserProfile(
    userId: string,
    profileData: {
      firstName: string;
      lastName: string;
      phone?: string;
      userType: UserType;
      email?: string;
    }
  ) {
    const { error } = await supabase.from('user_profiles').insert({
      user_id: userId,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone,
    });

    if (error) {
      console.error('Error creating user profile:', error);
    }

    // Also update the users table with user type
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email: profileData.email || 'unknown@example.com',
      user_type: profileData.userType as 'client' | 'host' | 'operator' | 'admin' | 'pos',
      status: USER_STATUS.ACTIVE,
    });

    if (userError) {
      console.error('Error creating user record:', userError);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if current user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user with profile
   */
  static async getCurrentUserWithProfile(): Promise<{
    user: User | null;
    profile: unknown | null;
    userType: UserType | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { user: null, profile: null, userType: null, error: userError };
      }

      // Get user profile and type
      const { data: userData, error: dataError } = await supabase
        .from('users')
        .select(
          `
          user_type,
          status,
          user_profiles (
            first_name,
            last_name,
            phone,
            avatar_url,
            date_of_birth,
            address,
            discount_eligibility
          )
        `
        )
        .eq('id', user.id)
        .single();

      if (dataError) {
        return { user, profile: null, userType: null, error: dataError };
      }

      return {
        user,
        profile: userData.user_profiles,
        userType: userData.user_type as UserType,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        userType: null,
        error: error as Error,
      };
    }
  }

  /**
   * Require authentication - throws error if not authenticated
   */
  static async requireAuth(): Promise<{ user: User; userType: UserType }> {
    const { user, userType, error } = await this.getCurrentUserWithProfile();

    if (error || !user || !userType) {
      throw new Error('Authentication required');
    }

    return { user, userType };
  }

  /**
   * Require specific user type - throws error if user doesn't have required type
   */
  static async requireUserType(
    requiredTypes: UserType[]
  ): Promise<{ user: User; userType: UserType }> {
    const { user, userType } = await this.requireAuth();

    if (!requiredTypes.includes(userType)) {
      throw new Error(
        `Access denied. Required user types: ${requiredTypes.join(', ')}`
      );
    }

    return { user, userType };
  }

  /**
   * Require permission - throws error if user doesn't have permission
   */
  static async requirePermission(
    resource: string,
    action: PermissionAction,
    resourceData?: Record<string, any>
  ): Promise<{ user: User; userType: UserType }> {
    const { user, userType } = await this.requireAuth();

    const context = await AuthorizationService.createAuthorizationContext(
      user.id
    );
    const hasPermission = await AuthorizationService.hasPermission(
      context,
      resource,
      action,
      resourceData
    );

    if (!hasPermission) {
      throw new Error(
        `Access denied. Missing permission: ${action} on ${resource}`
      );
    }

    return { user, userType };
  }

  /**
   * Create authentication middleware
   */
  static createAuthMiddleware(options?: {
    requiredTypes?: UserType[];
    requiredPermission?: {
      resource: string;
      action: PermissionAction;
    };
  }) {
    return async (context?: Record<string, unknown>) => {
      let result = await this.requireAuth();

      if (options?.requiredTypes) {
        result = await this.requireUserType(options.requiredTypes);
      }

      if (options?.requiredPermission) {
        result = await this.requirePermission(
          options.requiredPermission.resource,
          options.requiredPermission.action,
          context
        );
      }

      return result;
    };
  }
}

// Export related services for convenience
export { SessionService } from './session';
export { AuthorizationService } from './authorization';
export { AccountVerificationService } from './account-verification';
