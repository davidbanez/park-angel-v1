import { supabase } from '../lib/supabase';
import { UserType } from '../models/user';
export class SessionService {
    /**
     * Initialize session policies for different user types
     */
    static initializePolicies() {
        // Admin sessions - more restrictive
        this.sessionPolicies.set(UserType.ADMIN, {
            ...this.DEFAULT_POLICY,
            maxConcurrentSessions: 2,
            sessionTimeout: 240, // 4 hours
            idleTimeout: 30, // 30 minutes
            requireDeviceVerification: true,
        });
        // Operator sessions
        this.sessionPolicies.set(UserType.OPERATOR, {
            ...this.DEFAULT_POLICY,
            maxConcurrentSessions: 3,
            sessionTimeout: 480, // 8 hours
            idleTimeout: 60, // 1 hour
        });
        // POS sessions - longer for shift work
        this.sessionPolicies.set(UserType.POS, {
            ...this.DEFAULT_POLICY,
            maxConcurrentSessions: 1,
            sessionTimeout: 720, // 12 hours
            idleTimeout: 120, // 2 hours
            allowMultipleDevices: false,
        });
        // Host sessions
        this.sessionPolicies.set(UserType.HOST, this.DEFAULT_POLICY);
        // Client sessions
        this.sessionPolicies.set(UserType.CLIENT, {
            ...this.DEFAULT_POLICY,
            maxConcurrentSessions: 5,
            sessionTimeout: 720, // 12 hours
            idleTimeout: 180, // 3 hours
        });
    }
    /**
     * Create new session
     */
    static async createSession(user, session, userType, metadata) {
        const policy = this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
        const now = new Date();
        const sessionData = {
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
    static async validateSession(sessionId) {
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
        const policy = this.sessionPolicies.get(sessionData.userType) || this.DEFAULT_POLICY;
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
        const timeSinceLastUpdate = now.getTime() - sessionData.lastActivity.getTime();
        if (timeSinceLastUpdate > 5 * 60 * 1000) {
            await this.updateSessionActivity(sessionId, now);
        }
        return sessionData;
    }
    /**
     * Refresh session
     */
    static async refreshSession(sessionId) {
        const sessionData = this.activeSessions.get(sessionId);
        if (!sessionData)
            return null;
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
            const policy = this.sessionPolicies.get(sessionData.userType) || this.DEFAULT_POLICY;
            const now = new Date();
            sessionData.accessToken = data.session.access_token;
            sessionData.refreshToken =
                data.session.refresh_token || sessionData.refreshToken;
            sessionData.expiresAt = new Date(now.getTime() + policy.sessionTimeout * 60 * 1000);
            sessionData.lastActivity = now;
            this.activeSessions.set(sessionId, sessionData);
            await this.updateSessionInDatabase(sessionData);
            await this.logSessionEvent(sessionData.userId, 'session_refreshed', {
                sessionId,
            });
            return sessionData;
        }
        catch (error) {
            console.error('Error refreshing session:', error);
            await this.invalidateSession(sessionId, 'refresh_error');
            return null;
        }
    }
    /**
     * Invalidate session
     */
    static async invalidateSession(sessionId, reason) {
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
    static async invalidateAllUserSessions(userId, reason = 'force_logout') {
        const userSessions = Array.from(this.activeSessions.values()).filter(session => session.userId === userId);
        for (const session of userSessions) {
            await this.invalidateSession(session.id, reason);
        }
        // Also invalidate any sessions not in memory
        await this.markAllUserSessionsInactive(userId, reason);
    }
    /**
     * Get active sessions for user
     */
    static getActiveSessionsForUser(userId) {
        return Array.from(this.activeSessions.values()).filter(session => session.userId === userId && session.isActive);
    }
    /**
     * Manage concurrent sessions
     */
    static async manageConcurrentSessions(userId, userType, currentSessionId) {
        const policy = this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
        const userSessions = this.getActiveSessionsForUser(userId);
        if (userSessions.length >= policy.maxConcurrentSessions) {
            // Sort by last activity (oldest first)
            const sortedSessions = userSessions.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());
            // Remove oldest sessions
            const sessionsToRemove = sortedSessions.slice(0, userSessions.length - policy.maxConcurrentSessions + 1);
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
    static async persistSession(sessionData) {
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
                metadata: sessionData.metadata,
            });
        }
        catch (error) {
            console.error('Error persisting session:', error);
        }
    }
    /**
     * Load session from database
     */
    static async loadSessionFromDatabase(sessionId) {
        try {
            const { data, error } = await supabase
                .from('user_sessions')
                .select(`
          *,
          users!inner(user_type)
        `)
                .eq('id', sessionId)
                .eq('is_active', true)
                .single();
            if (error || !data)
                return null;
            return {
                id: data.id,
                userId: data.user_id,
                userType: data.users.user_type,
                accessToken: sessionId, // We don't store the actual token
                refreshToken: '', // We don't store the actual token
                expiresAt: new Date(data.expires_at),
                lastActivity: new Date(data.last_activity),
                ipAddress: data.ip_address,
                userAgent: data.user_agent,
                deviceId: data.device_id,
                isActive: data.is_active,
                metadata: data.metadata || {},
            };
        }
        catch (error) {
            console.error('Error loading session from database:', error);
            return null;
        }
    }
    /**
     * Update session activity in database
     */
    static async updateSessionActivity(sessionId, lastActivity) {
        try {
            await supabase
                .from('user_sessions')
                .update({
                last_activity: lastActivity.toISOString(),
            })
                .eq('id', sessionId);
        }
        catch (error) {
            console.error('Error updating session activity:', error);
        }
    }
    /**
     * Update session in database
     */
    static async updateSessionInDatabase(sessionData) {
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
        }
        catch (error) {
            console.error('Error updating session in database:', error);
        }
    }
    /**
     * Mark session as inactive in database
     */
    static async markSessionInactive(sessionId, reason) {
        try {
            await supabase
                .from('user_sessions')
                .update({
                is_active: false,
                ended_at: new Date().toISOString(),
                end_reason: reason,
            })
                .eq('id', sessionId);
        }
        catch (error) {
            console.error('Error marking session inactive:', error);
        }
    }
    /**
     * Mark all user sessions as inactive
     */
    static async markAllUserSessionsInactive(userId, reason) {
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
        }
        catch (error) {
            console.error('Error marking all user sessions inactive:', error);
        }
    }
    /**
     * Log session event
     */
    static async logSessionEvent(userId, action, metadata) {
        try {
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: action,
                resource_type: 'user_session',
                resource_id: metadata.sessionId,
                new_values: metadata,
            });
        }
        catch (error) {
            console.error('Error logging session event:', error);
        }
    }
    /**
     * Hash token for storage (simple hash for demo - use proper hashing in production)
     */
    static hashToken(token) {
        // In production, use a proper cryptographic hash function
        return Buffer.from(token).toString('base64').slice(0, 32);
    }
    /**
     * Clean up expired sessions
     */
    static async cleanupExpiredSessions() {
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
        }
        catch (error) {
            console.error('Error cleaning up expired sessions:', error);
        }
    }
    /**
     * Get session statistics
     */
    static async getSessionStatistics() {
        const activeSessions = Array.from(this.activeSessions.values());
        const sessionsByUserType = {
            [UserType.ADMIN]: 0,
            [UserType.OPERATOR]: 0,
            [UserType.POS]: 0,
            [UserType.HOST]: 0,
            [UserType.CLIENT]: 0,
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
            averageSessionDuration: activeSessions.length > 0 ? totalDuration / activeSessions.length : 0,
        };
    }
    /**
     * Update session policy for user type
     */
    static updateSessionPolicy(userType, policy) {
        const currentPolicy = this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
        this.sessionPolicies.set(userType, { ...currentPolicy, ...policy });
    }
    /**
     * Get session policy for user type
     */
    static getSessionPolicy(userType) {
        return this.sessionPolicies.get(userType) || this.DEFAULT_POLICY;
    }
}
Object.defineProperty(SessionService, "DEFAULT_POLICY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        maxConcurrentSessions: 3,
        sessionTimeout: 480, // 8 hours
        idleTimeout: 60, // 1 hour
        requireDeviceVerification: false,
        allowMultipleDevices: true,
        forceLogoutOnSuspension: true,
    }
});
Object.defineProperty(SessionService, "activeSessions", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(SessionService, "sessionPolicies", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
// Initialize session policies on module load
SessionService.initializePolicies();
// Set up periodic cleanup (every 15 minutes)
if (typeof window !== 'undefined') {
    setInterval(() => {
        SessionService.cleanupExpiredSessions();
    }, 15 * 60 * 1000);
}
