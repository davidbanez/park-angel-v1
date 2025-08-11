import React, { useState } from 'react';
import { Platform } from '../utils/platform';
import { useAuthStore } from '../../stores/authStore';
import { useOperatorStore } from '../../stores/operatorStore';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { Button } from './Button';
import { Modal } from './Modal';

export const Header: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { operatorData } = useOperatorStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications(operatorData?.id);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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

  if (Platform.isNative()) {
    const { View, Text, TouchableOpacity } = require('react-native');
    
    return (
      <View className="bg-primary-500 px-4 py-3 flex-row justify-between items-center">
        <View>
          <Text className="text-white text-lg font-semibold">
            Park Angel Operator
          </Text>
          {operatorData && (
            <Text className="text-primary-100 text-sm">
              {operatorData.company_name}
            </Text>
          )}
        </View>
        <View className="flex-row items-center space-x-3">
          {/* Notification Bell for Mobile */}
          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            className="relative p-2"
          >
            <Text className="text-white text-lg">🔔</Text>
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-primary-600 px-3 py-1 rounded-lg"
          >
            <Text className="text-white text-sm">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b border-secondary-200 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PA</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-secondary-900">
                  Park Angel Operator
                </h1>
                {operatorData && (
                  <p className="text-sm text-secondary-600">
                    {operatorData.company_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="text-right">
              <p className="text-sm font-medium text-secondary-900">
                {user?.email}
              </p>
              <p className="text-xs text-secondary-600">Operator</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
      >
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
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-500">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    notification.isRead
                      ? 'border-secondary-200 bg-white'
                      : 'border-primary-200 bg-primary-50'
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
      </Modal>
    </>
  );
};