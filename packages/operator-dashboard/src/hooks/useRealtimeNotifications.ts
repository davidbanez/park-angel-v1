import { useEffect, useState } from 'react';
import { RealtimeService } from '@shared/services/realtime';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  data?: Record<string, any>;
}

export const useRealtimeNotifications = (operatorId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!operatorId) return;

    // Subscribe to real-time notifications
    RealtimeService.subscribeToNotifications(
      operatorId,
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newNotification: Notification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type || 'info',
            timestamp: new Date(payload.new.created_at),
            isRead: false,
            data: payload.new.data,
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
            });
          }
        }
      }
    );

    // Subscribe to violation reports
    RealtimeService.subscribeToViolationReports(
      operatorId,
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const violationNotification: Notification = {
            id: `violation-${payload.new.id}`,
            title: 'New Violation Report',
            message: `Illegal parking reported at ${payload.new.location_name}`,
            type: 'warning',
            timestamp: new Date(payload.new.created_at),
            isRead: false,
            data: payload.new,
          };

          setNotifications(prev => [violationNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    // Subscribe to operator bookings for booking notifications
    RealtimeService.subscribeToOperatorBookings(
      operatorId,
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const bookingNotification: Notification = {
            id: `booking-${payload.new.id}`,
            title: 'New Booking',
            message: `New booking received for ${payload.new.duration} hours`,
            type: 'success',
            timestamp: new Date(payload.new.created_at),
            isRead: false,
            data: payload.new,
          };

          setNotifications(prev => [bookingNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    return () => {
      RealtimeService.unsubscribe(`notifications-${operatorId}`);
      RealtimeService.unsubscribe(`violations-${operatorId}`);
      RealtimeService.unsubscribe(`operator-bookings-${operatorId}`);
    };
  }, [operatorId]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};