import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export interface RealtimeSubscriptionOptions {
    table: string;
    event?: RealtimeEvent | '*';
    schema?: string;
    filter?: string;
}
export interface RealtimeCallback<T extends Record<string, any> = any> {
    (payload: RealtimePostgresChangesPayload<T>): void;
}
export declare class RealtimeService {
    private static channels;
    /**
     * Subscribe to real-time changes on a table
     */
    static subscribe<T extends Record<string, any> = any>(channelName: string, options: RealtimeSubscriptionOptions, callback: RealtimeCallback<T>): RealtimeChannel;
    /**
     * Subscribe to parking spot status changes
     */
    static subscribeToParkingSpots(locationId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to booking status changes
     */
    static subscribeToBookings(userId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to operator bookings
     */
    static subscribeToOperatorBookings(operatorId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to messages in a conversation
     */
    static subscribeToMessages(conversationId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to user conversations
     */
    static subscribeToConversations(userId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to violation reports for operators
     */
    static subscribeToViolationReports(operatorId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to advertisement performance metrics
     */
    static subscribeToAdMetrics(advertiserId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to system notifications
     */
    static subscribeToNotifications(userId: string, callback: RealtimeCallback): RealtimeChannel;
    /**
     * Subscribe to presence (online users)
     */
    static subscribeToPresence(channelName: string, userId: string, userMetadata?: Record<string, any>): RealtimeChannel;
    /**
     * Broadcast a message to a channel
     */
    static broadcast(channelName: string, event: string, payload: Record<string, any>): Promise<void>;
    /**
     * Subscribe to broadcast messages
     */
    static subscribeToBroadcast(channelName: string, event: string, callback: (payload: any) => void): RealtimeChannel;
    /**
     * Unsubscribe from a channel
     */
    static unsubscribe(channelName: string): Promise<void>;
    /**
     * Unsubscribe from all channels
     */
    static unsubscribeAll(): Promise<void>;
    /**
     * Get channel status
     */
    static getChannelStatus(channelName: string): string | null;
    /**
     * Get all active channels
     */
    static getActiveChannels(): string[];
    /**
     * Check if a channel is active
     */
    static isChannelActive(channelName: string): boolean;
    /**
     * Get presence state for a channel
     */
    static getPresenceState(channelName: string): Record<string, any>;
    /**
     * Update presence for current user
     */
    static updatePresence(channelName: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Stop tracking presence for current user
     */
    static stopPresenceTracking(channelName: string): Promise<void>;
}
