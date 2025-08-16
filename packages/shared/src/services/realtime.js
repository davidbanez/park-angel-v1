import { supabase } from '../lib/supabase';
export class RealtimeService {
    /**
     * Subscribe to real-time changes on a table
     */
    static subscribe(channelName, options, callback) {
        // Remove existing channel if it exists
        this.unsubscribe(channelName);
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', {
            event: options.event || '*',
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter,
        }, callback)
            .subscribe();
        this.channels.set(channelName, channel);
        return channel;
    }
    /**
     * Subscribe to parking spot status changes
     */
    static subscribeToParkingSpots(locationId, callback) {
        return this.subscribe(`parking-spots-${locationId}`, {
            table: 'parking_spots',
            event: 'UPDATE',
            filter: `zone_id=in.(select id from zones where section_id in (select id from sections where location_id=eq.${locationId}))`,
        }, callback);
    }
    /**
     * Subscribe to booking status changes
     */
    static subscribeToBookings(userId, callback) {
        return this.subscribe(`bookings-${userId}`, {
            table: 'bookings',
            event: '*',
            filter: `user_id=eq.${userId}`,
        }, callback);
    }
    /**
     * Subscribe to operator bookings
     */
    static subscribeToOperatorBookings(operatorId, callback) {
        return this.subscribe(`operator-bookings-${operatorId}`, {
            table: 'bookings',
            event: '*',
            filter: `spot_id=in.(select id from parking_spots where zone_id in (select id from zones where section_id in (select id from sections where location_id in (select id from locations where operator_id=eq.${operatorId}))))`,
        }, callback);
    }
    /**
     * Subscribe to messages in a conversation
     */
    static subscribeToMessages(conversationId, callback) {
        return this.subscribe(`messages-${conversationId}`, {
            table: 'messages',
            event: 'INSERT',
            filter: `conversation_id=eq.${conversationId}`,
        }, callback);
    }
    /**
     * Subscribe to user conversations
     */
    static subscribeToConversations(userId, callback) {
        return this.subscribe(`conversations-${userId}`, {
            table: 'conversations',
            event: '*',
            filter: `participants=cs.{${userId}}`,
        }, callback);
    }
    /**
     * Subscribe to violation reports for operators
     */
    static subscribeToViolationReports(operatorId, callback) {
        return this.subscribe(`violations-${operatorId}`, {
            table: 'violation_reports',
            event: 'INSERT',
            filter: `location_id=in.(select id from locations where operator_id=eq.${operatorId})`,
        }, callback);
    }
    /**
     * Subscribe to advertisement performance metrics
     */
    static subscribeToAdMetrics(advertiserId, callback) {
        return this.subscribe(`ad-metrics-${advertiserId}`, {
            table: 'advertisements',
            event: 'UPDATE',
            filter: `created_by=eq.${advertiserId}`,
        }, callback);
    }
    /**
     * Subscribe to system notifications
     */
    static subscribeToNotifications(userId, callback) {
        return this.subscribe(`notifications-${userId}`, {
            table: 'notifications',
            event: 'INSERT',
            filter: `user_id=eq.${userId}`,
        }, callback);
    }
    /**
     * Subscribe to presence (online users)
     */
    static subscribeToPresence(channelName, userId, userMetadata = {}) {
        const channel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });
        channel
            .on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            console.log('Presence sync:', newState);
        })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
        })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
        })
            .subscribe(async (status) => {
            if (status !== 'SUBSCRIBED')
                return;
            const presenceTrackStatus = await channel.track({
                user_id: userId,
                online_at: new Date().toISOString(),
                ...userMetadata,
            });
            console.log('Presence track status:', presenceTrackStatus);
        });
        this.channels.set(channelName, channel);
        return channel;
    }
    /**
     * Broadcast a message to a channel
     */
    static async broadcast(channelName, event, payload) {
        const channel = this.channels.get(channelName);
        if (!channel) {
            throw new Error(`Channel ${channelName} not found`);
        }
        const status = await channel.send({
            type: 'broadcast',
            event,
            payload,
        });
        if (status !== 'ok') {
            throw new Error(`Failed to broadcast message: ${status}`);
        }
    }
    /**
     * Subscribe to broadcast messages
     */
    static subscribeToBroadcast(channelName, event, callback) {
        const channel = supabase
            .channel(channelName)
            .on('broadcast', { event }, callback)
            .subscribe();
        this.channels.set(channelName, channel);
        return channel;
    }
    /**
     * Unsubscribe from a channel
     */
    static async unsubscribe(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            await supabase.removeChannel(channel);
            this.channels.delete(channelName);
        }
    }
    /**
     * Unsubscribe from all channels
     */
    static async unsubscribeAll() {
        const channelNames = Array.from(this.channels.keys());
        await Promise.all(channelNames.map(name => this.unsubscribe(name)));
    }
    /**
     * Get channel status
     */
    static getChannelStatus(channelName) {
        const channel = this.channels.get(channelName);
        return channel?.state || null;
    }
    /**
     * Get all active channels
     */
    static getActiveChannels() {
        return Array.from(this.channels.keys());
    }
    /**
     * Check if a channel is active
     */
    static isChannelActive(channelName) {
        const channel = this.channels.get(channelName);
        return channel?.state === 'joined';
    }
    /**
     * Get presence state for a channel
     */
    static getPresenceState(channelName) {
        const channel = this.channels.get(channelName);
        return channel?.presenceState() || {};
    }
    /**
     * Update presence for current user
     */
    static async updatePresence(channelName, metadata) {
        const channel = this.channels.get(channelName);
        if (!channel) {
            throw new Error(`Channel ${channelName} not found`);
        }
        await channel.track(metadata);
    }
    /**
     * Stop tracking presence for current user
     */
    static async stopPresenceTracking(channelName) {
        const channel = this.channels.get(channelName);
        if (!channel) {
            throw new Error(`Channel ${channelName} not found`);
        }
        await channel.untrack();
    }
}
Object.defineProperty(RealtimeService, "channels", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
