import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { supabase } from '@park-angel/shared/src/lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface NotificationPreferences {
  id?: string;
  user_id: string;
  // Parking notifications
  parking_expiration_alerts: boolean;
  parking_expiration_minutes: number;
  parking_reminders: boolean;
  parking_reminder_minutes: number;
  // Payment notifications
  payment_confirmations: boolean;
  payment_failures: boolean;
  refund_notifications: boolean;
  // Booking notifications
  booking_confirmations: boolean;
  booking_cancellations: boolean;
  booking_modifications: boolean;
  // Host notifications (for hosted parking)
  host_booking_requests: boolean;
  host_guest_messages: boolean;
  host_payment_notifications: boolean;
  // Support notifications
  support_ticket_updates: boolean;
  support_messages: boolean;
  // Marketing notifications
  promotional_offers: boolean;
  feature_updates: boolean;
  newsletter: boolean;
  // System notifications
  system_maintenance: boolean;
  security_alerts: boolean;
  // Delivery preferences
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'user_id'> = {
  // Parking notifications
  parking_expiration_alerts: true,
  parking_expiration_minutes: 15,
  parking_reminders: true,
  parking_reminder_minutes: 30,
  // Payment notifications
  payment_confirmations: true,
  payment_failures: true,
  refund_notifications: true,
  // Booking notifications
  booking_confirmations: true,
  booking_cancellations: true,
  booking_modifications: true,
  // Host notifications
  host_booking_requests: true,
  host_guest_messages: true,
  host_payment_notifications: true,
  // Support notifications
  support_ticket_updates: true,
  support_messages: true,
  // Marketing notifications
  promotional_offers: false,
  feature_updates: true,
  newsletter: false,
  // System notifications
  system_maintenance: true,
  security_alerts: true,
  // Delivery preferences
  push_notifications: true,
  email_notifications: true,
  sms_notifications: false,
  // Quiet hours
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
];

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_PREFERENCES,
    user_id: user?.id || '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>('undetermined');

  useEffect(() => {
    if (user) {
      loadPreferences();
      checkPushPermissions();
    }
  }, [user]);

  const checkPushPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPushPermissionStatus(status);
    } catch (error) {
      console.error('Error checking push permissions:', error);
    }
  };

  const requestPushPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPushPermissionStatus(status);
      
      if (status === 'granted') {
        Alert.alert('Success', 'Push notifications enabled successfully');
        setPreferences(prev => ({ ...prev, push_notifications: true }));
      } else {
        Alert.alert(
          'Permission Denied',
          'Push notifications are disabled. You can enable them in your device settings.'
        );
        setPreferences(prev => ({ ...prev, push_notifications: false }));
      }
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      Alert.alert('Error', 'Failed to request push notification permissions');
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          ...DEFAULT_PREFERENCES,
          user_id: user?.id || '',
        };
        
        const { error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert(defaultPrefs);

        if (insertError) throw insertError;
        setPreferences(defaultPrefs);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Notification preferences saved successfully');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handlePushToggle = async (value: boolean) => {
    if (value && pushPermissionStatus !== 'granted') {
      await requestPushPermissions();
    } else {
      updatePreference('push_notifications', value);
    }
  };

  const PreferenceSection = ({ 
    title, 
    icon, 
    children 
  }: { 
    title: string; 
    icon: string; 
    children: React.ReactNode;
  }) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-4">
        <Ionicons name={icon as any} size={20} color="#8b5cf6" />
        <Text className="text-lg font-semibold text-gray-900 ml-2">{title}</Text>
      </View>
      <View className="bg-white rounded-xl p-4 border border-gray-200">
        {children}
      </View>
    </View>
  );

  const PreferenceToggle = ({ 
    label, 
    description, 
    value, 
    onToggle,
    disabled = false,
  }: { 
    label: string; 
    description?: string; 
    value: boolean; 
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <View className="flex-1 mr-4">
        <Text className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </Text>
        {description && (
          <Text className="text-gray-600 text-sm mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
        thumbColor={value ? '#ffffff' : '#f3f4f6'}
      />
    </View>
  );

  const TimeSelector = ({ 
    label, 
    value, 
    onSelect 
  }: { 
    label: string; 
    value: number; 
    onSelect: (value: number) => void;
  }) => (
    <View className="py-3 border-b border-gray-100 last:border-b-0">
      <Text className="font-medium text-gray-900 mb-3">{label}</Text>
      <View className="flex-row flex-wrap">
        {REMINDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
              value === option.value ? 'bg-purple-500' : 'bg-gray-200'
            }`}
          >
            <Text
              className={
                value === option.value ? 'text-white' : 'text-gray-700'
              }
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
          <Text className="text-gray-600">Manage your notification preferences</Text>
        </View>
        <TouchableOpacity
          onPress={savePreferences}
          disabled={saving}
          className={`px-4 py-2 rounded-xl ${
            saving ? 'bg-gray-300' : 'bg-purple-500'
          }`}
        >
          <Text className="text-white font-semibold">
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Methods */}
        <PreferenceSection title="Delivery Methods" icon="send">
          <PreferenceToggle
            label="Push Notifications"
            description="Receive notifications on your device"
            value={preferences.push_notifications}
            onToggle={handlePushToggle}
          />
          <PreferenceToggle
            label="Email Notifications"
            description="Receive notifications via email"
            value={preferences.email_notifications}
            onToggle={(value) => updatePreference('email_notifications', value)}
          />
          <PreferenceToggle
            label="SMS Notifications"
            description="Receive notifications via text message"
            value={preferences.sms_notifications}
            onToggle={(value) => updatePreference('sms_notifications', value)}
          />
        </PreferenceSection>

        {/* Parking Notifications */}
        <PreferenceSection title="Parking" icon="car">
          <PreferenceToggle
            label="Parking Expiration Alerts"
            description="Get notified before your parking expires"
            value={preferences.parking_expiration_alerts}
            onToggle={(value) => updatePreference('parking_expiration_alerts', value)}
          />
          {preferences.parking_expiration_alerts && (
            <TimeSelector
              label="Alert me before expiration"
              value={preferences.parking_expiration_minutes}
              onSelect={(value) => updatePreference('parking_expiration_minutes', value)}
            />
          )}
          <PreferenceToggle
            label="Parking Reminders"
            description="Get reminded about your active parking sessions"
            value={preferences.parking_reminders}
            onToggle={(value) => updatePreference('parking_reminders', value)}
          />
          {preferences.parking_reminders && (
            <TimeSelector
              label="Remind me every"
              value={preferences.parking_reminder_minutes}
              onSelect={(value) => updatePreference('parking_reminder_minutes', value)}
            />
          )}
        </PreferenceSection>

        {/* Payment Notifications */}
        <PreferenceSection title="Payments" icon="card">
          <PreferenceToggle
            label="Payment Confirmations"
            description="Get notified when payments are successful"
            value={preferences.payment_confirmations}
            onToggle={(value) => updatePreference('payment_confirmations', value)}
          />
          <PreferenceToggle
            label="Payment Failures"
            description="Get notified when payments fail"
            value={preferences.payment_failures}
            onToggle={(value) => updatePreference('payment_failures', value)}
          />
          <PreferenceToggle
            label="Refund Notifications"
            description="Get notified about refunds"
            value={preferences.refund_notifications}
            onToggle={(value) => updatePreference('refund_notifications', value)}
          />
        </PreferenceSection>

        {/* Booking Notifications */}
        <PreferenceSection title="Bookings" icon="calendar">
          <PreferenceToggle
            label="Booking Confirmations"
            description="Get notified when bookings are confirmed"
            value={preferences.booking_confirmations}
            onToggle={(value) => updatePreference('booking_confirmations', value)}
          />
          <PreferenceToggle
            label="Booking Cancellations"
            description="Get notified when bookings are cancelled"
            value={preferences.booking_cancellations}
            onToggle={(value) => updatePreference('booking_cancellations', value)}
          />
          <PreferenceToggle
            label="Booking Modifications"
            description="Get notified when bookings are modified"
            value={preferences.booking_modifications}
            onToggle={(value) => updatePreference('booking_modifications', value)}
          />
        </PreferenceSection>

        {/* Host Notifications */}
        <PreferenceSection title="Hosting" icon="home">
          <PreferenceToggle
            label="Booking Requests"
            description="Get notified about new booking requests for your spaces"
            value={preferences.host_booking_requests}
            onToggle={(value) => updatePreference('host_booking_requests', value)}
          />
          <PreferenceToggle
            label="Guest Messages"
            description="Get notified when guests send you messages"
            value={preferences.host_guest_messages}
            onToggle={(value) => updatePreference('host_guest_messages', value)}
          />
          <PreferenceToggle
            label="Payment Notifications"
            description="Get notified about host payments and earnings"
            value={preferences.host_payment_notifications}
            onToggle={(value) => updatePreference('host_payment_notifications', value)}
          />
        </PreferenceSection>

        {/* Support Notifications */}
        <PreferenceSection title="Support" icon="help-circle">
          <PreferenceToggle
            label="Ticket Updates"
            description="Get notified about support ticket status changes"
            value={preferences.support_ticket_updates}
            onToggle={(value) => updatePreference('support_ticket_updates', value)}
          />
          <PreferenceToggle
            label="Support Messages"
            description="Get notified about new messages from support"
            value={preferences.support_messages}
            onToggle={(value) => updatePreference('support_messages', value)}
          />
        </PreferenceSection>

        {/* Marketing Notifications */}
        <PreferenceSection title="Marketing" icon="megaphone">
          <PreferenceToggle
            label="Promotional Offers"
            description="Get notified about special offers and discounts"
            value={preferences.promotional_offers}
            onToggle={(value) => updatePreference('promotional_offers', value)}
          />
          <PreferenceToggle
            label="Feature Updates"
            description="Get notified about new features and improvements"
            value={preferences.feature_updates}
            onToggle={(value) => updatePreference('feature_updates', value)}
          />
          <PreferenceToggle
            label="Newsletter"
            description="Receive our periodic newsletter"
            value={preferences.newsletter}
            onToggle={(value) => updatePreference('newsletter', value)}
          />
        </PreferenceSection>

        {/* System Notifications */}
        <PreferenceSection title="System" icon="settings">
          <PreferenceToggle
            label="System Maintenance"
            description="Get notified about scheduled maintenance"
            value={preferences.system_maintenance}
            onToggle={(value) => updatePreference('system_maintenance', value)}
          />
          <PreferenceToggle
            label="Security Alerts"
            description="Get notified about security-related events"
            value={preferences.security_alerts}
            onToggle={(value) => updatePreference('security_alerts', value)}
          />
        </PreferenceSection>

        {/* Quiet Hours */}
        <PreferenceSection title="Quiet Hours" icon="moon">
          <PreferenceToggle
            label="Enable Quiet Hours"
            description="Disable non-urgent notifications during specified hours"
            value={preferences.quiet_hours_enabled}
            onToggle={(value) => updatePreference('quiet_hours_enabled', value)}
          />
          {preferences.quiet_hours_enabled && (
            <View className="pt-3">
              <Text className="text-gray-600 text-sm">
                Quiet hours: {preferences.quiet_hours_start} - {preferences.quiet_hours_end}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                Only urgent notifications (security alerts, payment failures) will be delivered during quiet hours.
              </Text>
            </View>
          )}
        </PreferenceSection>

        {/* Push Permission Status */}
        {pushPermissionStatus !== 'granted' && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text className="text-yellow-800 font-medium ml-2">
                Push Notifications Disabled
              </Text>
            </View>
            <Text className="text-yellow-700 text-sm mb-3">
              Push notifications are currently disabled. Enable them to receive important alerts.
            </Text>
            <TouchableOpacity
              onPress={requestPushPermissions}
              className="bg-yellow-500 py-2 px-4 rounded-lg"
            >
              <Text className="text-white font-medium text-center">
                Enable Push Notifications
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}