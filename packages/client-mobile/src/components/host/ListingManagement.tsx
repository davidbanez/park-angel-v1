import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { 
  HostedListing, 
  CreateHostedListingData, 
  UpdateHostedListingData,
  HostPricing,
  AvailabilitySchedule,
  DayAvailability,
  TimeSlot 
} from '@park-angel/shared/types';

interface ListingManagementProps {
  hostId: string;
  listings: HostedListing[];
  onCreateListing: (data: CreateHostedListingData) => Promise<void>;
  onUpdateListing: (data: UpdateHostedListingData) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onToggleStatus: (listingId: string, isActive: boolean) => Promise<void>;
}

export default function ListingManagement({
  hostId,
  listings,
  onCreateListing,
  onUpdateListing,
  onDeleteListing,
  onToggleStatus,
}: ListingManagementProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<HostedListing | null>(null);
  const [formData, setFormData] = useState<Partial<CreateHostedListingData>>({
    title: '',
    description: '',
    spotId: '',
    photos: [],
    amenities: [],
    accessInstructions: '',
    pricing: {
      baseRate: 0,
      currency: 'PHP',
    },
    availability: {
      recurring: {
        monday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
        tuesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
        wednesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
        thursday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
        friday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
        saturday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
        sunday: { isAvailable: false, timeSlots: [] },
      },
      exceptions: [],
      blackoutDates: [],
    },
  });

  const commonAmenities = [
    'Covered Parking',
    'Security Camera',
    'Well Lit',
    'Easy Access',
    'Electric Vehicle Charging',
    'Motorcycle Parking',
    'Disabled Access',
    '24/7 Access',
    'Gated Community',
    'Valet Service',
  ];

  const handleCreateListing = async () => {
    try {
      if (!validateForm()) return;
      
      await onCreateListing(formData as CreateHostedListingData);
      setShowCreateForm(false);
      resetForm();
      Alert.alert('Success', 'Listing created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create listing');
    }
  };

  const handleUpdateListing = async () => {
    try {
      if (!editingListing || !validateForm()) return;
      
      await onUpdateListing({
        id: editingListing.id,
        ...formData,
      } as UpdateHostedListingData);
      
      setEditingListing(null);
      resetForm();
      Alert.alert('Success', 'Listing updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update listing');
    }
  };

  const handleDeleteListing = (listing: HostedListing) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteListing(listing.id);
              Alert.alert('Success', 'Listing deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!formData.title?.trim()) {
      Alert.alert('Error', 'Please enter a title for your listing');
      return false;
    }
    if (!formData.description?.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.pricing?.baseRate || formData.pricing.baseRate <= 0) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      spotId: '',
      photos: [],
      amenities: [],
      accessInstructions: '',
      pricing: {
        baseRate: 0,
        currency: 'PHP',
      },
      availability: {
        recurring: {
          monday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
          tuesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
          wednesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
          thursday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
          friday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
          saturday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
          sunday: { isAvailable: false, timeSlots: [] },
        },
        exceptions: [],
        blackoutDates: [],
      },
    });
  };

  const startEditing = (listing: HostedListing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      description: listing.description,
      spotId: listing.spotId,
      photos: [], // Photos would need to be converted back to File objects
      amenities: listing.amenities,
      accessInstructions: listing.accessInstructions,
      pricing: listing.pricing,
      availability: listing.availability,
    });
    setShowCreateForm(true);
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset as unknown as File);
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...newPhotos],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const updateDayAvailability = (day: keyof AvailabilitySchedule['recurring'], isAvailable: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability!,
        recurring: {
          ...prev.availability!.recurring,
          [day]: {
            isAvailable,
            timeSlots: isAvailable ? [{ startTime: '08:00', endTime: '18:00' }] : [],
          },
        },
      },
    }));
  };

  const renderListingCard = ({ item: listing }: { item: HostedListing }) => (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      {listing.photos.length > 0 && (
        <Image
          source={{ uri: listing.photos[0] }}
          className="w-full h-48 rounded-t-lg"
          resizeMode="cover"
        />
      )}
      
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold text-gray-900 flex-1">
            {listing.title}
          </Text>
          <View className={`px-2 py-1 rounded-full ${
            listing.isActive ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Text className={`text-xs font-medium ${
              listing.isActive ? 'text-green-800' : 'text-gray-600'
            }`}>
              {listing.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <Text className="text-gray-600 mb-3" numberOfLines={2}>
          {listing.description}
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-primary-600">
            ₱{listing.pricing.baseRate}/hour
          </Text>
          <View className="flex-row items-center">
            <Text className="text-yellow-500 mr-1">⭐</Text>
            <Text className="text-gray-600">
              {listing.rating.toFixed(1)} ({listing.totalReviews})
            </Text>
          </View>
        </View>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 bg-primary-500 py-2 px-4 rounded-lg"
            onPress={() => startEditing(listing)}
          >
            <Text className="text-white font-medium text-center">Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-lg ${
              listing.isActive ? 'bg-gray-500' : 'bg-green-500'
            }`}
            onPress={() => onToggleStatus(listing.id, !listing.isActive)}
          >
            <Text className="text-white font-medium text-center">
              {listing.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-red-500 py-2 px-4 rounded-lg"
            onPress={() => handleDeleteListing(listing)}
          >
            <Text className="text-white font-medium text-center">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCreateForm = () => (
    <ScrollView className="flex-1 px-4">
      <View className="py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            {editingListing ? 'Edit Listing' : 'Create New Listing'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowCreateForm(false);
              setEditingListing(null);
              resetForm();
            }}
          >
            <Text className="text-gray-500 text-lg">✕</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-6">
          {/* Basic Information */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Basic Information</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Title *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Secure Covered Parking in Makati CBD"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Description *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Describe your parking space, location, and any special features"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Access Instructions</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.accessInstructions}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, accessInstructions: text }))}
                  placeholder="How should guests access your parking space?"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Photos */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Photos</Text>
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-lg py-8 px-4"
              onPress={pickImages}
            >
              <Text className="text-center text-gray-600">
                📷 Tap to add photos of your parking space
              </Text>
              <Text className="text-center text-gray-500 text-sm mt-2">
                {formData.photos?.length || 0} photos selected
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pricing */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Pricing</Text>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Hourly Rate (₱) *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                value={formData.pricing?.baseRate?.toString()}
                onChangeText={(text) => 
                  setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing!, baseRate: parseFloat(text) || 0 },
                  }))
                }
                placeholder="Enter hourly rate"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Amenities */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Amenities</Text>
            <View className="flex-row flex-wrap">
              {commonAmenities.map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  className={`mr-2 mb-2 py-2 px-3 rounded-full border ${
                    formData.amenities?.includes(amenity)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Text className={`text-sm ${
                    formData.amenities?.includes(amenity)
                      ? 'text-primary-700'
                      : 'text-gray-700'
                  }`}>
                    {amenity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Availability</Text>
            <View className="space-y-3">
              {Object.entries(formData.availability?.recurring || {}).map(([day, dayAvailability]) => (
                <View key={day} className="flex-row items-center justify-between py-2">
                  <Text className="text-gray-900 font-medium capitalize">
                    {day}
                  </Text>
                  <TouchableOpacity
                    className={`py-2 px-4 rounded-lg ${
                      dayAvailability.isAvailable
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-gray-100 border border-gray-300'
                    }`}
                    onPress={() => updateDayAvailability(
                      day as keyof AvailabilitySchedule['recurring'], 
                      !dayAvailability.isAvailable
                    )}
                  >
                    <Text className={`text-sm font-medium ${
                      dayAvailability.isAvailable ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {dayAvailability.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 mb-4">
          <TouchableOpacity
            className="bg-primary-500 py-4 px-6 rounded-lg"
            onPress={editingListing ? handleUpdateListing : handleCreateListing}
          >
            <Text className="text-white font-semibold text-center text-lg">
              {editingListing ? 'Update Listing' : 'Create Listing'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (showCreateForm) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {renderCreateForm()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-gray-900">My Listings</Text>
            <TouchableOpacity
              className="bg-primary-500 py-2 px-4 rounded-lg"
              onPress={() => setShowCreateForm(true)}
            >
              <Text className="text-white font-medium">+ Add Listing</Text>
            </TouchableOpacity>
          </View>
        </View>

        {listings.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-xl font-semibold text-gray-900 mb-2">No listings yet</Text>
            <Text className="text-gray-600 text-center mb-6">
              Create your first parking space listing to start earning money
            </Text>
            <TouchableOpacity
              className="bg-primary-500 py-3 px-6 rounded-lg"
              onPress={() => setShowCreateForm(true)}
            >
              <Text className="text-white font-semibold">Create Your First Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderListingCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}