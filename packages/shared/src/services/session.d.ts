import type { User, Session } from '@supabase/supabase-js';
import { UserType } from '../types/common';
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
    sessionTimeout: number;
    idleTimeout: number;
    requireDeviceVerification: boolean;
    allowMultipleDevices: boolean;
    forceLogoutOnSuspension: boolean;
}
export declare class SessionService {
    private static readonly DEFAULT_POLICY;
    private static activeSessions;
    private static sessionPolicies;
    /**
     * Initialize session policies for different user types
     */
    static initializePolicies(): void;
    /**
     * Create new session
     */
    static createSession(user: User, session: Session, userType: UserType, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
    }): Promise<SessionData>;
    /**
     * Validate session
     */
    static validateSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Refresh session
     */
    static refreshSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Invalidate session
     */
    static invalidateSession(sessionId: string, reason: string): Promise<void>;
    /**
     * Invalidate all sessions for user
     */
    static invalidateAllUserSessions(userId: string, reason?: string): Promise<void>;
    /**
     * Get active sessions for user
     */
    static getActiveSessionsForUser(userId: string): SessionData[];
    /**
     * Manage concurrent sessions
     */
    private static manageConcurrentSessions;
    /**
     * Persist session to database
     */
    private static persistSession;
    /**
     * Load session from database
     */
    private static loadSessionFromDatabase;
    /**
     * Update session activity in database
     */
    private static updateSessionActivity;
    /**
     * Update session in database
     */
    private static updateSessionInDatabase;
    /**
     * Mark session as inactive in database
     */
    private static markSessionInactive;
    /**
     * Mark all user sessions as inactive
     */
    private static markAllUserSessionsInactive;
    /**
     * Log session event
     */
    private static logSessionEvent;
    /**
     * Hash token for storage (simple hash for demo - use proper hashing in production)
     */
    private static hashToken;
    /**
     * Clean up expired sessions
     */
    static cleanupExpiredSessions(): Promise<void>;
    /**
     * Get session statistics
     */
    static getSessionStatistics(): Promise<{
        totalActiveSessions: number;
        sessionsByUserType: Record<UserType, number>;
        averageSessionDuration: number;
    }>;
    /**
     * Update session policy for user type
     */
    static updateSessionPolicy(userType: UserType, policy: Partial<SessionPolicy>): void;
    /**
     * Get session policy for user type
     */
    static getSessionPolicy(userType: UserType): SessionPolicy;
}
