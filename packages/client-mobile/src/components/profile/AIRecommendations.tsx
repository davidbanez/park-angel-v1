import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@park-angel/shared/src/lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface AIPreferences {
  id?: string;
  user_id: string;
  // Parking preferences
  preferred_parking_types: string[];
  max_walking_distance: number; // in meters
  price_sensitivity: 'low' | 'medium' | 'high';
  preferred_amenities: string[];
  // Time preferences
  preferred_booking_lead_time: number; // in minutes
  flexible_timing: boolean;
  // Location preferences
  frequently_visited_locations: string[];
  avoid_locations: string[];
  // Vehicle preferences
  preferred_vehicle_id?: string;
  // Accessibility needs
  accessibility_required: boolean;
  covered_parking_preferred: boolean;
  security_level_preference: 'basic' | 'standard' | 'high';
  // AI settings
  enable_ai_suggestions: boolean;
  learning_enabled: boolean;
  notification_for_suggestions: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ParkingRecommendation {
  id: string;
  spot_id: string;
  location_name: string;
  spot_number: string;
  parking_type: 'hosted' | 'street' | 'facility';
  distance: number;
  walking_time: number;
  price_per_hour: number;
  total_estimated_cost: number;
  confidence_score: number;
  reasons: string[];
  amenities: string[];
  availability_start: string;
  availability_end: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const PARKING_TYPES = [
  { value: 'hosted', label: 'Hosted Parking', icon: 'home' },
  { value: 'street', label: 'Street Parking', icon: 'car' },
  { value: 'facility', label: 'Parking Facility', icon: 'business' },
];

const AMENITIES = [
  'Covered', 'Security Camera', 'Lighting', 'EV Charging', 
  'Valet Service', 'Car Wash', 'Restroom', 'WiFi',
  'Wheelchair Accessible', '24/7 Access', 'Gated', 'Attendant'
];

const WALKING_DISTANCES = [
  { value: 100, label: '100m (1 min walk)' },
  { value: 200, label: '200m (2 min walk)' },
  { value: 500, label: '500m (5 min walk)' },
  { value: 1000, label: '1km (10 min walk)' },
  { value: 2000, label: '2km (20 min walk)' },
];

const PRICE_SENSITIVITY_OPTIONS = [
  { value: 'low', label: 'Price is not important', description: 'Prioritize convenience and quality' },
  { value: 'medium', label: 'Balanced approach', description: 'Consider both price and convenience' },
  { value: 'high', label: 'Price is very important', description: 'Find the cheapest options available' },
];

export default function AIRecommendations() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AIPreferences>({
    user_id: user?.id || '',
    preferred_parking_types: ['hosted', 'street', 'facility'],
    max_walking_distance: 500,
    price_sensitivity: 'medium',
    preferred_amenities: [],
    preferred_booking_lead_time: 15,
    flexible_timing: true,
    frequently_visited_locations: [],
    avoid_locations: [],
    accessibility_required: false,
    covered_parking_preferred: false,
    security_level_preference: 'standard',
    enable_ai_suggestions: true,
    learning_enabled: true,
    notification_for_suggestions: true,
  });
  const [recommendations, setRecommendations] = useState<ParkingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchDuration, setSearchDuration] = useState('2');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          ...preferences,
          user_id: user?.id || '',
        };
        
        const { error: insertError } = await supabase
          .from('user_ai_preferences')
          .insert(defaultPrefs);

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error loading AI preferences:', error);
      Alert.alert('Error', 'Failed to load AI preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_ai_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'AI preferences saved successfully');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save AI preferences');
    } finally {
      setSaving(false);
    }
  };

  const getAIRecommendations = async () => {
    if (!searchLocation.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    try {
      setLoadingRecommendations(true);

      // Call AI recommendation service
      const { data, error } = await supabase.functions.invoke('ai-parking-recommendations', {
        body: {
          user_id: user?.id,
          destination: searchLocation,
          date: searchDate || new Date().toISOString(),
          duration_hours: parseFloat(searchDuration),
          preferences: preferences,
        },
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setShowRecommendations(true);
    } catch (error: any) {
      console.error('Error getting AI recommendations:', error);
      Alert.alert('Error', 'Failed to get parking recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const updatePreference = (key: keyof AIPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleParkingType = (type: string) => {
    const currentTypes = preferences.preferred_parking_types;
    if (currentTypes.includes(type)) {
      updatePreference('preferred_parking_types', currentTypes.filter(t => t !== type));
    } else {
      updatePreference('preferred_parking_types', [...currentTypes, type]);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = preferences.preferred_amenities;
    if (currentAmenities.includes(amenity)) {
      updatePreference('preferred_amenities', currentAmenities.filter(a => a !== amenity));
    } else {
      updatePreference('preferred_amenities', [...currentAmenities, amenity]);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderRecommendationItem = ({ item }: { item: ParkingRecommendation }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons 
              name={item.parking_type === 'hosted' ? 'home' : item.parking_type === 'facility' ? 'business' : 'car'} 
              size={16} 
              color="#8b5cf6" 
            />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              {item.location_name}
            </Text>
          </View>
          <Text className="text-gray-600 mb-1">
            Spot {item.spot_number} • {formatDistance(item.distance)} away
          </Text>
          <Text className="text-gray-600 text-sm">
            {item.walking_time} min walk
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-gray-900">
            {formatCurrency(item.total_estimated_cost)}
          </Text>
          <Text className="text-gray-600 text-sm">
            {formatCurrency(item.price_per_hour)}/hr
          </Text>
          <View className="bg-green-100 px-2 py-1 rounded-full mt-1">
            <Text className="text-green-700 text-xs font-medium">
              {Math.round(item.confidence_score * 100)}% match
            </Text>
          </View>
        </View>
      </View>

      {/* Reasons */}
      <View className="mb-3">
        <Text className="text-gray-700 font-medium mb-2">Why this spot:</Text>
        {item.reasons.map((reason, index) => (
          <View key={index} className="flex-row items-center mb-1">
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text className="text-gray-600 text-sm ml-2">{reason}</Text>
          </View>
        ))}
      </View>

      {/* Amenities */}
      {item.amenities.length > 0 && (
        <View className="mb-3">
          <Text className="text-gray-700 font-medium mb-2">Amenities:</Text>
          <View className="flex-row flex-wrap">
            {item.amenities.map((amenity, index) => (
              <View key={index} className="bg-purple-100 px-2 py-1 rounded-full mr-2 mb-1">
                <Text className="text-purple-700 text-xs">{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Book Button */}
      <TouchableOpacity className="bg-purple-500 py-3 px-4 rounded-xl">
        <Text className="text-white font-semibold text-center">
          Book This Spot
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">Loading AI preferences...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">AI Recommendations</Text>
          <Text className="text-gray-600">Smart parking suggestions just for you</Text>
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

      {/* AI Toggle */}
      <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              Enable AI Suggestions
            </Text>
            <Text className="text-gray-600 text-sm">
              Get personalized parking recommendations based on your preferences
            </Text>
          </View>
          <Switch
            value={preferences.enable_ai_suggestions}
            onValueChange={(value) => updatePreference('enable_ai_suggestions', value)}
            trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
            thumbColor={preferences.enable_ai_suggestions ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        {preferences.enable_ai_suggestions && (
          <>
            <View className="flex-row justify-between items-center py-2 border-t border-gray-100">
              <Text className="text-gray-700">Learning from my behavior</Text>
              <Switch
                value={preferences.learning_enabled}
                onValueChange={(value) => updatePreference('learning_enabled', value)}
                trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                thumbColor={preferences.learning_enabled ? '#ffffff' : '#f3f4f6'}
              />
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-700">Notify me of suggestions</Text>
              <Switch
                value={preferences.notification_for_suggestions}
                onValueChange={(value) => updatePreference('notification_for_suggestions', value)}
                trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                thumbColor={preferences.notification_for_suggestions ? '#ffffff' : '#f3f4f6'}
              />
            </View>
          </>
        )}
      </View>

      {preferences.enable_ai_suggestions && (
        <>
          {/* Get Recommendations */}
          <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Get AI Recommendations
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Destination</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Where are you going?"
                value={searchLocation}
                onChangeText={setSearchLocation}
              />
            </View>

            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Date (optional)</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="YYYY-MM-DD"
                  value={searchDate}
                  onChangeText={setSearchDate}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Duration (hours)</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="2"
                  value={searchDuration}
                  onChangeText={setSearchDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={getAIRecommendations}
              disabled={loadingRecommendations}
              className={`py-4 px-8 rounded-xl ${
                loadingRecommendations ? 'bg-gray-300' : 'bg-purple-500'
              }`}
            >
              <Text className="text-white text-lg font-semibold text-center">
                {loadingRecommendations ? 'Getting Recommendations...' : 'Get AI Recommendations'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Your Preferences
            </Text>

            {/* Parking Types */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Preferred Parking Types</Text>
              <View className="flex-row flex-wrap">
                {PARKING_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => toggleParkingType(type.value)}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg flex-row items-center ${
                      preferences.preferred_parking_types.includes(type.value)
                        ? 'bg-purple-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={16} 
                      color={preferences.preferred_parking_types.includes(type.value) ? 'white' : '#6b7280'} 
                    />
                    <Text
                      className={`ml-1 ${
                        preferences.preferred_parking_types.includes(type.value)
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Walking Distance */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Maximum Walking Distance</Text>
              <View className="flex-row flex-wrap">
                {WALKING_DISTANCES.map((distance) => (
                  <TouchableOpacity
                    key={distance.value}
                    onPress={() => updatePreference('max_walking_distance', distance.value)}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      preferences.max_walking_distance === distance.value
                        ? 'bg-purple-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={
                        preferences.max_walking_distance === distance.value
                          ? 'text-white'
                          : 'text-gray-700'
                      }
                    >
                      {distance.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Sensitivity */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Price Sensitivity</Text>
              {PRICE_SENSITIVITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updatePreference('price_sensitivity', option.value)}
                  className={`mb-2 p-3 rounded-lg border ${
                    preferences.price_sensitivity === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      preferences.price_sensitivity === option.value
                        ? 'text-purple-700'
                        : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amenities */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Preferred Amenities</Text>
              <View className="flex-row flex-wrap">
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    onPress={() => toggleAmenity(amenity)}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      preferences.preferred_amenities.includes(amenity)
                        ? 'bg-purple-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={
                        preferences.preferred_amenities.includes(amenity)
                          ? 'text-white'
                          : 'text-gray-700'
                      }
                    >
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Preferences */}
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700">Accessibility required</Text>
                <Switch
                  value={preferences.accessibility_required}
                  onValueChange={(value) => updatePreference('accessibility_required', value)}
                  trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                  thumbColor={preferences.accessibility_required ? '#ffffff' : '#f3f4f6'}
                />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700">Prefer covered parking</Text>
                <Switch
                  value={preferences.covered_parking_preferred}
                  onValueChange={(value) => updatePreference('covered_parking_preferred', value)}
                  trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                  thumbColor={preferences.covered_parking_preferred ? '#ffffff' : '#f3f4f6'}
                />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700">Flexible with timing</Text>
                <Switch
                  value={preferences.flexible_timing}
                  onValueChange={(value) => updatePreference('flexible_timing', value)}
                  trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                  thumbColor={preferences.flexible_timing ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Recommendations Modal */}
      <Modal visible={showRecommendations} animationType="slide">
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-6 bg-white border-b border-gray-200">
            <Text className="text-xl font-bold">AI Recommendations</Text>
            <TouchableOpacity onPress={() => setShowRecommendations(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {recommendations.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="location-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg mt-4 mb-2">No recommendations found</Text>
              <Text className="text-gray-400 text-center">
                Try adjusting your preferences or search criteria
              </Text>
            </View>
          ) : (
            <FlatList
              data={recommendations}
              keyExtractor={(item) => item.id}
              renderItem={renderRecommendationItem}
              className="flex-1 p-6"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}