import { supabase } from '../lib/supabase';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

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

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to real-time changes on a table
   */
  static subscribe<T extends Record<string, any> = any>(
    channelName: string,
    options: RealtimeSubscriptionOptions,
    callback: RealtimeCallback<T>
  ): RealtimeChannel {
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter,
        } as any,
        callback as any
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to parking spot status changes
   */
  static subscribeToParkingSpots(
    locationId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `parking-spots-${locationId}`,
      {
        table: 'parking_spots',
        event: 'UPDATE',
        filter: `zone_id=in.(select id from zones where section_id in (select id from sections where location_id=eq.${locationId}))`,
      },
      callback
    );
  }

  /**
   * Subscribe to booking status changes
   */
  static subscribeToBookings(
    userId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `bookings-${userId}`,
      {
        table: 'bookings',
        event: '*',
        filter: `user_id=eq.${userId}`,
      },
      callback
    );
  }

  /**
   * Subscribe to operator bookings
   */
  static subscribeToOperatorBookings(
    operatorId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `operator-bookings-${operatorId}`,
      {
        table: 'bookings',
        event: '*',
        filter: `spot_id=in.(select id from parking_spots where zone_id in (select id from zones where section_id in (select id from sections where location_id in (select id from locations where operator_id=eq.${operatorId}))))`,
      },
      callback
    );
  }

  /**
   * Subscribe to messages in a conversation
   */
  static subscribeToMessages(
    conversationId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `messages-${conversationId}`,
      {
        table: 'messages',
        event: 'INSERT',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    );
  }

  /**
   * Subscribe to user conversations
   */
  static subscribeToConversations(
    userId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `conversations-${userId}`,
      {
        table: 'conversations',
        event: '*',
        filter: `participants=cs.{${userId}}`,
      },
      callback
    );
  }

  /**
   * Subscribe to violation reports for operators
   */
  static subscribeToViolationReports(
    operatorId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `violations-${operatorId}`,
      {
        table: 'violation_reports',
        event: 'INSERT',
        filter: `location_id=in.(select id from locations where operator_id=eq.${operatorId})`,
      },
      callback
    );
  }

  /**
   * Subscribe to advertisement performance metrics
   */
  static subscribeToAdMetrics(
    advertiserId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `ad-metrics-${advertiserId}`,
      {
        table: 'advertisements',
        event: 'UPDATE',
        filter: `created_by=eq.${advertiserId}`,
      },
      callback
    );
  }

  /**
   * Subscribe to system notifications
   */
  static subscribeToNotifications(
    userId: string,
    callback: RealtimeCallback
  ): RealtimeChannel {
    return this.subscribe(
      `notifications-${userId}`,
      {
        table: 'notifications',
        event: 'INSERT',
        filter: `user_id=eq.${userId}`,
      },
      callback
    );
  }

  /**
   * Subscribe to presence (online users)
   */
  static subscribeToPresence(
    channelName: string,
    userId: string,
    userMetadata: Record<string, any> = {}
  ): RealtimeChannel {
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
      .subscribe(async status => {
        if (status !== 'SUBSCRIBED') return;

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
  static async broadcast(
    channelName: string,
    event: string,
    payload: Record<string, any>
  ): Promise<void> {
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
  static subscribeToBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
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
  static async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static async unsubscribeAll(): Promise<void> {
    const channelNames = Array.from(this.channels.keys());
    await Promise.all(channelNames.map(name => this.unsubscribe(name)));
  }

  /**
   * Get channel status
   */
  static getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName);
    return channel?.state || null;
  }

  /**
   * Get all active channels
   */
  static getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if a channel is active
   */
  static isChannelActive(channelName: string): boolean {
    const channel = this.channels.get(channelName);
    return channel?.state === 'joined';
  }

  /**
   * Get presence state for a channel
   */
  static getPresenceState(channelName: string): Record<string, any> {
    const channel = this.channels.get(channelName);
    return channel?.presenceState() || {};
  }

  /**
   * Update presence for current user
   */
  static async updatePresence(
    channelName: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not found`);
    }

    await channel.track(metadata);
  }

  /**
   * Stop tracking presence for current user
   */
  static async stopPresenceTracking(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not found`);
    }

    await channel.untrack();
  }
}
