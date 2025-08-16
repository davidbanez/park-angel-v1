import { SessionData } from '../services/session';
export interface SessionState {
    sessionData: SessionData | null;
    activeSessions: SessionData[];
    loading: boolean;
    error: Error | null;
}
export interface SessionActions {
    refreshSession: () => Promise<void>;
    invalidateSession: (sessionId: string, reason?: string) => Promise<void>;
    invalidateAllSessions: (reason?: string) => Promise<void>;
    extendSession: () => boolean;
    getSessionStatistics: () => Promise<{
        totalActiveSessions: number;
        sessionsByUserType: Record<string, number>;
        averageSessionDuration: number;
    }>;
}
export declare function useSession(): SessionState & SessionActions;
export declare function useSessionTimeout(warningMinutes?: number): {
    timeUntilExpiry: number | null;
    isExpiringSoon: boolean;
    isExpired: boolean;
    extendSession: () => void;
};
export default useSession;
