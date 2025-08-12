import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ClientAuthService } from '../../services/authService';

type DiscountType = 'senior' | 'pwd';

export default function DiscountApplicationScreen() {
  const [selectedType, setSelectedType] = useState<DiscountType | null>(null);
  const [documents, setDocuments] = useState<{
    primaryId?: string;
    validId?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleImagePicker = async (type: 'primaryId' | 'validId') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [type]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a discount type');
      return;
    }

    if (!documents.primaryId || !documents.validId) {
      Alert.alert('Error', 'Please upload both required documents');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedType === 'senior') {
        result = await ClientAuthService.applyForSeniorDiscount({
          seniorIdUri: documents.primaryId,
          validIdUri: documents.validId,
        });
      } else {
        result = await ClientAuthService.applyForPWDDiscount({
          pwdIdUri: documents.primaryId,
          validIdUri: documents.validId,
        });
      }

      if (result.success) {
        Alert.alert(
          'Application Submitted',
          'Your discount application has been submitted for review. You will be notified once it\'s processed.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit application');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Apply for Discount
          </Text>
          <Text className="text-gray-600">
            Apply for Senior Citizen or PWD discount eligibility
          </Text>
        </View>

        {/* Discount Type Selection */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Select Discount Type
          </Text>
          
          <TouchableOpacity
            onPress={() => setSelectedType('senior')}
            className={`border-2 rounded-xl p-4 mb-4 ${
              selectedType === 'senior' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 bg-white'
            }`}
          >
            <Text className={`font-semibold text-lg mb-2 ${
              selectedType === 'senior' ? 'text-primary-700' : 'text-gray-900'
            }`}>
              Senior Citizen Discount
            </Text>
            <Text className="text-gray-600 text-sm">
              For citizens aged 60 and above. Provides VAT exemption and discount on parking fees.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedType('pwd')}
            className={`border-2 rounded-xl p-4 ${
              selectedType === 'pwd' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 bg-white'
            }`}
          >
            <Text className={`font-semibold text-lg mb-2 ${
              selectedType === 'pwd' ? 'text-primary-700' : 'text-gray-900'
            }`}>
              PWD (Person with Disability) Discount
            </Text>
            <Text className="text-gray-600 text-sm">
              For persons with disabilities. Provides VAT exemption and discount on parking fees.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Document Upload */}
        {selectedType && (
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Required Documents
            </Text>

            {/* Primary ID */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">
                {selectedType === 'senior' ? 'Senior Citizen ID' : 'PWD ID'}
              </Text>
              <TouchableOpacity
                onPress={() => handleImagePicker('primaryId')}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
              >
                {documents.primaryId ? (
                  <View className="items-center">
                    <Image 
                      source={{ uri: documents.primaryId }} 
                      className="w-32 h-24 rounded-lg mb-2"
                      resizeMode="cover"
                    />
                    <Text className="text-primary-500 font-medium">
                      Tap to change image
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Text className="text-gray-500 text-lg mb-2">📷</Text>
                    <Text className="text-gray-700 font-medium">
                      Upload {selectedType === 'senior' ? 'Senior Citizen ID' : 'PWD ID'}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Tap to select from gallery
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Valid ID */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">
                Valid Government ID
              </Text>
              <TouchableOpacity
                onPress={() => handleImagePicker('validId')}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
              >
                {documents.validId ? (
                  <View className="items-center">
                    <Image 
                      source={{ uri: documents.validId }} 
                      className="w-32 h-24 rounded-lg mb-2"
                      resizeMode="cover"
                    />
                    <Text className="text-primary-500 font-medium">
                      Tap to change image
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Text className="text-gray-500 text-lg mb-2">🆔</Text>
                    <Text className="text-gray-700 font-medium">
                      Upload Valid Government ID
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Driver's License, Passport, etc.
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Requirements Note */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <Text className="text-blue-800 font-medium mb-2">
                Document Requirements:
              </Text>
              <Text className="text-blue-700 text-sm">
                • Images should be clear and readable{'\n'}
                • All text and photos should be visible{'\n'}
                • Documents should be valid and not expired{'\n'}
                • Processing may take 1-3 business days
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        {selectedType && documents.primaryId && documents.validId && (
          <TouchableOpacity
            onPress={handleSubmitApplication}
            disabled={loading}
            className={`py-4 px-8 rounded-xl mb-6 ${
              loading ? 'bg-gray-300' : 'bg-primary-500'
            }`}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="py-4 px-8 rounded-xl border border-gray-300"
        >
          <Text className="text-gray-700 text-lg font-semibold text-center">
            Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}