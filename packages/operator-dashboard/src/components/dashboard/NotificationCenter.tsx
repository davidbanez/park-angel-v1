import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
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

interface NotificationCenterProps {
  operatorId?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  operatorId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorId) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call - in real implementation, this would fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 600));

        // Generate mock notifications
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Illegal Parking Report',
            message: 'Vehicle ABC-123 reported for illegal parking at Zone A-1',
            type: 'warning',
            timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            isRead: false,
            data: { vehicleId: 'ABC-123', zoneId: 'A-1' },
          },
          {
            id: '2',
            title: 'Payment Received',
            message: 'Payment of ₱150 received for booking #BK-2024-001',
            type: 'success',
            timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            isRead: false,
            data: { amount: 150, bookingId: 'BK-2024-001' },
          },
          {
            id: '3',
            title: 'Spot Maintenance Required',
            message: 'Parking spot B-3 requires maintenance attention',
            type: 'warning',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            isRead: true,
            data: { spotId: 'B-3' },
          },
          {
            id: '4',
            title: 'New Booking',
            message: 'New booking received for Zone C-5, duration: 2 hours',
            type: 'info',
            timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            isRead: true,
            data: { zoneId: 'C-5', duration: 2 },
          },
          {
            id: '5',
            title: 'System Update',
            message: 'Parking management system updated successfully',
            type: 'success',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: true,
          },
        ];

        setNotifications(mockNotifications);
      } catch (err) {
        setError('Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    RealtimeService.subscribeToNotifications(
      operatorId,
      (payload) => {
        console.log('New notification:', payload);
        
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
        }
      }
    );

    return () => {
      RealtimeService.unsubscribe(`notifications-${operatorId}`);
    };
  }, [operatorId]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-secondary-900">
            Recent Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
          className="text-xs text-primary-600 hover:text-primary-700"
        >
          Mark all read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                notification.isRead
                  ? 'border-secondary-200 bg-white'
                  : getNotificationColor(notification.type)
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-sm font-medium truncate ${
                      notification.isRead ? 'text-secondary-700' : 'text-secondary-900'
                    }`}>
                      {notification.title}
                    </h5>
                    <span className="text-xs text-secondary-500 flex-shrink-0 ml-2">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    notification.isRead ? 'text-secondary-500' : 'text-secondary-700'
                  }`}>
                    {notification.message}
                  </p>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real-time Indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-secondary-500 pt-2 border-t border-secondary-200">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Real-time notifications enabled</span>
      </div>
    </div>
  );
};