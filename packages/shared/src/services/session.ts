import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { UserType, USER_TYPE } from '../types/common';

export interface SessionData {
  id: string;
  userId: string;
  userType: UserType;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface SessionPolicy {
  maxConcurrentSessions: number;
  sessionTimeout: number; // minutes
  idleTimeout: number; // minutes
  requireDeviceVerification: boolean;
  allowMultipleDevices: boolean;
  forceLogoutOnSuspension: boolean;
}

export class SessionService {
  private static readonly DEFAULT_POLICY: SessionPolicy = {
    maxConcurrentSessions: 3,
    sessionTimeout: 480, // 8 hours
    idleTimeout: 60, // 1 hour
    requireDeviceVerification: false,
    allowMultipleDevices: true,
    forceLogoutOnSuspension: true,
  };

  private static activeSessions = new Map<string, SessionData>();
  private static sessionPolicies = new Map<UserType, SessionPolicy>();

  /**
   * Initialize session policies for different user types
   */
  static initializePolicies(): void {
    // Admin sessions - more restrictive
    this.sessionPolicies.set(USER_TYPE.ADMIN, {
      ...this.DEFAULT_POLICY,
      maxConcurrentSessions: 2,
      sessionTimeout: 240, // 4 hours
      idleTimeout: 30, // 30 minutes
      requireDeviceVerification: true,
    });

    // Operator sessions
    this.sessionPolicies.set(USER_TYPE.OPERATOR, {
      ...this.DEFAULT_POLICY,
      maxConcurrentSessions: 3,
      sessionTimeout: 480, // 8 hours
      idleTimeout: 60, // 1 hour
    });

    // POS sessions - longer for shift work
    this.sessionPolicies.set(USER_TYPE.POS, {
      ...this.DEFAULT_POLICY,
      maxConcurrentSessions: 1,
      sessionTimeout: 720, // 12 hours
      idleTimeout: 120, // 2 hours
      allowMultipleDevices: false,
    });

    // Host sessions
    this.sessionPolicies.set(USER_TYPE.HOST, this.DEFAULT_POLICY);

    // Client sessions
    this.sessionPolicies.set(USER_TYPE.CLIENT, {
      ...this.DEFAULT_POLICY,
      maxConcurrentSessions: 5,
      sessionTimeout: 720, // 12 hours
      idleTimeout: 180, // 3 hours
    });
  }

  /**
   * Create new session
   */
  static async createSession(
    user: User,
    session: Session,
    userType: UserType,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    }
  ): Promise<SessionData> {
    const policy = this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
    const now = new Date();

    const sessionData: SessionData = {
      id: session.access_token,
      userId: user.id,
      userType,
      accessToken: session.access_token,
      refreshToken: session.refresh_token || '',
      expiresAt: new Date(now.getTime() + policy.sessionTimeout * 60 * 1000),
      lastActivity: now,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      deviceId: metadata?.deviceId,
      isActive: true,
      metadata: metadata || {},
    };

    // Manage concurrent sessions
    await this.manageConcurrentSessions(user.id, userType, sessionData.id);

    // Store session
    this.activeSessions.set(sessionData.id, sessionData);

    // Persist session to database
    await this.persistSession(sessionData);

    // Log session creation
    await this.logSessionEvent(user.id, 'session_created', {
      sessionId: sessionData.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return sessionData;
  }

  /**
   * Validate session
   */
  static async validateSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      // Try to load from database
      const loadedSession = await this.loadSessionFromDatabase(sessionId);
      if (loadedSession) {
        this.activeSessions.set(sessionId, loadedSession);
        return loadedSession;
      }
      return null;
    }

    const now = new Date();
    const policy =
      this.sessionPolicies.get(sessionData.userType) || this.DEFAULT_POLICY;

    // Check if session has expired
    if (now > sessionData.expiresAt) {
      await this.invalidateSession(sessionId, 'expired');
      return null;
    }

    // Check idle timeout
    const idleTime = now.getTime() - sessionData.lastActivity.getTime();
    const idleTimeoutMs = policy.idleTimeout * 60 * 1000;

    if (idleTime > idleTimeoutMs) {
      await this.invalidateSession(sessionId, 'idle_timeout');
      return null;
    }

    // Update last activity
    sessionData.lastActivity = now;
    this.activeSessions.set(sessionId, sessionData);

    // Update in database periodically (every 5 minutes)
    const timeSinceLastUpdate =
      now.getTime() - sessionData.lastActivity.getTime();
    if (timeSinceLastUpdate > 5 * 60 * 1000) {
      await this.updateSessionActivity(sessionId, now);
    }

    return sessionData;
  }

  /**
   * Refresh session
   */
  static async refreshSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return null;

    try {
      // Refresh with Supabase
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: sessionData.refreshToken,
      });

      if (error || !data.session) {
        await this.invalidateSession(sessionId, 'refresh_failed');
        return null;
      }

      // Update session data
      const policy =
        this.sessionPolicies.get(sessionData.userType) || this.DEFAULT_POLICY;
      const now = new Date();

      sessionData.accessToken = data.session.access_token;
      sessionData.refreshToken =
        data.session.refresh_token || sessionData.refreshToken;
      sessionData.expiresAt = new Date(
        now.getTime() + policy.sessionTimeout * 60 * 1000
      );
      sessionData.lastActivity = now;

      this.activeSessions.set(sessionId, sessionData);
      await this.updateSessionInDatabase(sessionData);

      await this.logSessionEvent(sessionData.userId, 'session_refreshed', {
        sessionId,
      });

      return sessionData;
    } catch (error) {
      console.error('Error refreshing session:', error);
      await this.invalidateSession(sessionId, 'refresh_error');
      return null;
    }
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(
    sessionId: string,
    reason: string
  ): Promise<void> {
    const sessionData = this.activeSessions.get(sessionId);

    if (sessionData) {
      // Mark as inactive
      sessionData.isActive = false;

      // Log session end
      await this.logSessionEvent(sessionData.userId, 'session_ended', {
        sessionId,
        reason,
      });
    }

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    // Update database
    await this.markSessionInactive(sessionId, reason);
  }

  /**
   * Invalidate all sessions for user
   */
  static async invalidateAllUserSessions(
    userId: string,
    reason: string = 'force_logout'
  ): Promise<void> {
    const userSessions = Array.from(this.activeSessions.values()).filter(
      session => session.userId === userId
    );

    for (const session of userSessions) {
      await this.invalidateSession(session.id, reason);
    }

    // Also invalidate any sessions not in memory
    await this.markAllUserSessionsInactive(userId, reason);
  }

  /**
   * Get active sessions for user
   */
  static getActiveSessionsForUser(userId: string): SessionData[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.userId === userId && session.isActive
    );
  }

  /**
   * Manage concurrent sessions
   */
  private static async manageConcurrentSessions(
    userId: string,
    userType: UserType,
    currentSessionId: string
  ): Promise<void> {
    const policy = this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
    const userSessions = this.getActiveSessionsForUser(userId);

    if (userSessions.length >= policy.maxConcurrentSessions) {
      // Sort by last activity (oldest first)
      const sortedSessions = userSessions.sort(
        (a, b) => a.lastActivity.getTime() - b.lastActivity.getTime()
      );

      // Remove oldest sessions
      const sessionsToRemove = sortedSessions.slice(
        0,
        userSessions.length - policy.maxConcurrentSessions + 1
      );

      for (const session of sessionsToRemove) {
        if (session.id !== currentSessionId) {
          await this.invalidateSession(session.id, 'concurrent_limit');
        }
      }
    }
  }

  /**
   * Persist session to database
   */
  private static async persistSession(sessionData: SessionData): Promise<void> {
    try {
      await supabase.from('user_sessions').upsert({
        id: sessionData.id,
        user_id: sessionData.userId,
        access_token_hash: this.hashToken(sessionData.accessToken),
        refresh_token_hash: sessionData.refreshToken
          ? this.hashToken(sessionData.refreshToken)
          : null,
        expires_at: sessionData.expiresAt.toISOString(),
        last_activity: sessionData.lastActivity.toISOString(),
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent,
        device_id: sessionData.deviceId,
        is_active: sessionData.isActive,
        metadata: sessionData.metadata as any,
      });
    } catch (error) {
      console.error('Error persisting session:', error);
    }
  }

  /**
   * Load session from database
   */
  private static async loadSessionFromDatabase(
    sessionId: string
  ): Promise<SessionData | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(
          `
          *,
          users!inner(user_type)
        `
        )
        .eq('id', sessionId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        userType: data.users.user_type as UserType,
        accessToken: sessionId, // We don't store the actual token
        refreshToken: '', // We don't store the actual token
        expiresAt: new Date(data.expires_at),
        lastActivity: new Date(data.last_activity),
        ipAddress: data.ip_address as string,
        userAgent: data.user_agent,
        deviceId: data.device_id,
        isActive: data.is_active,
        metadata: (data.metadata as Record<string, unknown>) || {},
      };
    } catch (error) {
      console.error('Error loading session from database:', error);
      return null;
    }
  }

  /**
   * Update session activity in database
   */
  private static async updateSessionActivity(
    sessionId: string,
    lastActivity: Date
  ): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({
          last_activity: lastActivity.toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Update session in database
   */
  private static async updateSessionInDatabase(
    sessionData: SessionData
  ): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({
          access_token_hash: this.hashToken(sessionData.accessToken),
          refresh_token_hash: sessionData.refreshToken
            ? this.hashToken(sessionData.refreshToken)
            : null,
          expires_at: sessionData.expiresAt.toISOString(),
          last_activity: sessionData.lastActivity.toISOString(),
        })
        .eq('id', sessionData.id);
    } catch (error) {
      console.error('Error updating session in database:', error);
    }
  }

  /**
   * Mark session as inactive in database
   */
  private static async markSessionInactive(
    sessionId: string,
    reason: string
  ): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          end_reason: reason,
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error marking session inactive:', error);
    }
  }

  /**
   * Mark all user sessions as inactive
   */
  private static async markAllUserSessionsInactive(
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          end_reason: reason,
        })
        .eq('user_id', userId)
        .eq('is_active', true);
    } catch (error) {
      console.error('Error marking all user sessions inactive:', error);
    }
  }

  /**
   * Log session event
   */
  private static async logSessionEvent(
    userId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: action,
        resource_type: 'user_session',
        resource_id: metadata.sessionId as string,
        new_values: metadata as any,
      });
    } catch (error) {
      console.error('Error logging session event:', error);
    }
  }

  /**
   * Hash token for storage (simple hash for demo - use proper hashing in production)
   */
  private static hashToken(token: string): string {
    // In production, use a proper cryptographic hash function
    return Buffer.from(token).toString('base64').slice(0, 32);
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();

    // Clean up in-memory sessions
    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      if (now > sessionData.expiresAt) {
        await this.invalidateSession(sessionId, 'expired');
      }
    }

    // Clean up database sessions
    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: now.toISOString(),
          end_reason: 'expired',
        })
        .lt('expires_at', now.toISOString())
        .eq('is_active', true);
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    sessionsByUserType: Record<UserType, number>;
    averageSessionDuration: number;
  }> {
    const activeSessions = Array.from(this.activeSessions.values());
    const sessionsByUserType: Record<string, number> = {
      [USER_TYPE.ADMIN]: 0,
      [USER_TYPE.OPERATOR]: 0,
      [USER_TYPE.POS]: 0,
      [USER_TYPE.HOST]: 0,
      [USER_TYPE.CLIENT]: 0,
    };

    let totalDuration = 0;
    const now = new Date();

    for (const session of activeSessions) {
      sessionsByUserType[session.userType]++;
      totalDuration += now.getTime() - session.lastActivity.getTime();
    }

    return {
      totalActiveSessions: activeSessions.length,
      sessionsByUserType,
      averageSessionDuration:
        activeSessions.length > 0 ? totalDuration / activeSessions.length : 0,
    };
  }

  /**
   * Update session policy for user type
   */
  static updateSessionPolicy(
    userType: UserType,
    policy: Partial<SessionPolicy>
  ): void {
    const currentPolicy =
      this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
    this.sessionPolicies.set(userType, { ...currentPolicy, ...policy });
  }

  /**
   * Get session policy for user type
   */
  static getSessionPolicy(userType: UserType): SessionPolicy {
    return this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
  }
}

// Initialize session policies on module load
SessionService.initializePolicies();

// Set up periodic cleanup (every 15 minutes)
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      SessionService.cleanupExpiredSessions();
    },
    15 * 60 * 1000
  );
}
