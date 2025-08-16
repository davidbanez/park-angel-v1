import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '../services/session';
import { useAuth } from './useAuth';
export function useSession() {
    const { user, session } = useAuth();
    const [state, setState] = useState({
        sessionData: null,
        activeSessions: [],
        loading: true,
        error: null,
    });
    // Load session data
    useEffect(() => {
        let mounted = true;
        const loadSessionData = async () => {
            if (!session || !user) {
                setState({
                    sessionData: null,
                    activeSessions: [],
                    loading: false,
                    error: null,
                });
                return;
            }
            try {
                // Validate current session
                const sessionData = await SessionService.validateSession(session.access_token);
                // Get all active sessions for user
                const activeSessions = SessionService.getActiveSessionsForUser(user.id);
                if (mounted) {
                    setState({
                        sessionData,
                        activeSessions,
                        loading: false,
                        error: null,
                    });
                }
            }
            catch (error) {
                if (mounted) {
                    setState({
                        sessionData: null,
                        activeSessions: [],
                        loading: false,
                        error: error,
                    });
                }
            }
        };
        loadSessionData();
        return () => {
            mounted = false;
        };
    }, [user, session]);
    // Set up session validation interval
    useEffect(() => {
        if (!session)
            return () => { }; // Return empty cleanup function
        const interval = setInterval(async () => {
            try {
                const sessionData = await SessionService.validateSession(session.access_token);
                if (!sessionData) {
                    // Session is invalid, user will be signed out by auth state change
                    return;
                }
                setState(prev => ({
                    ...prev,
                    sessionData,
                    error: null,
                }));
            }
            catch (error) {
                setState(prev => ({
                    ...prev,
                    error: error,
                }));
            }
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [session]);
    const refreshSession = useCallback(async () => {
        if (!session)
            return;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const refreshedSession = await SessionService.refreshSession(session.access_token);
            if (refreshedSession) {
                setState(prev => ({
                    ...prev,
                    sessionData: refreshedSession,
                    loading: false,
                    error: null,
                }));
            }
            else {
                throw new Error('Failed to refresh session');
            }
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error,
            }));
            throw error;
        }
    }, [session]);
    const invalidateSession = useCallback(async (sessionId, reason = 'user_request') => {
        try {
            await SessionService.invalidateSession(sessionId, reason);
            // Update active sessions list
            if (user) {
                const activeSessions = SessionService.getActiveSessionsForUser(user.id);
                setState(prev => ({
                    ...prev,
                    activeSessions,
                }));
            }
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                error: error,
            }));
            throw error;
        }
    }, [user]);
    const invalidateAllSessions = useCallback(async (reason = 'user_request') => {
        if (!user)
            return;
        try {
            await SessionService.invalidateAllUserSessions(user.id, reason);
            setState(prev => ({
                ...prev,
                activeSessions: [],
            }));
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                error: error,
            }));
            throw error;
        }
    }, [user]);
    const extendSession = useCallback(() => {
        if (!session || !state.sessionData)
            return false;
        // Update session data locally
        setState(prev => ({
            ...prev,
            sessionData: {
                ...prev.sessionData,
                expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
                lastActivity: new Date(),
            },
        }));
        return true;
    }, [session, state.sessionData]);
    const getSessionStatistics = useCallback(async () => {
        return await SessionService.getSessionStatistics();
    }, []);
    return {
        ...state,
        refreshSession,
        invalidateSession,
        invalidateAllSessions,
        extendSession,
        getSessionStatistics,
    };
}
// Hook for session timeout warning
export function useSessionTimeout(warningMinutes = 5) {
    const { sessionData, extendSession } = useSession();
    const [timeUntilExpiry, setTimeUntilExpiry] = useState(null);
    useEffect(() => {
        if (!sessionData) {
            setTimeUntilExpiry(null);
            return () => { }; // Return empty cleanup function
        }
        const updateTimeUntilExpiry = () => {
            const now = new Date();
            const expiryTime = new Date(sessionData.expiresAt);
            const diffMs = expiryTime.getTime() - now.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            setTimeUntilExpiry(Math.max(0, diffMinutes));
        };
        // Update immediately
        updateTimeUntilExpiry();
        // Update every minute
        const interval = setInterval(updateTimeUntilExpiry, 60000);
        return () => clearInterval(interval);
    }, [sessionData]);
    const isExpiringSoon = timeUntilExpiry !== null && timeUntilExpiry <= warningMinutes;
    const isExpired = timeUntilExpiry === 0;
    return {
        timeUntilExpiry,
        isExpiringSoon,
        isExpired,
        extendSession,
    };
}
export default useSession;
