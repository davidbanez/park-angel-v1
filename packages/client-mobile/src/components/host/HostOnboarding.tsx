import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { HostOnboardingData } from '@park-angel/shared/types';

interface HostOnboardingProps {
  onComplete: (data: HostOnboardingData) => void;
  onCancel: () => void;
}

export default function HostOnboarding({ onComplete, onCancel }: HostOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<HostOnboardingData>>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
    },
    businessInfo: {
      businessName: '',
      businessType: '',
      taxId: '',
    },
    propertyInfo: {
      address: '',
      propertyType: 'residential',
      ownershipType: 'owner',
    },
    bankingInfo: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      accountType: 'checking',
    },
    documents: {
      identityDocument: undefined,
      propertyDocument: undefined,
      businessDocument: undefined,
    },
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const handleComplete = () => {
    if (formData as HostOnboardingData) {
      onComplete(formData as HostOnboardingData);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.personalInfo?.firstName &&
          formData.personalInfo?.lastName &&
          formData.personalInfo?.email &&
          formData.personalInfo?.phone
        );
      case 2:
        return !!(
          formData.propertyInfo?.address &&
          formData.propertyInfo?.propertyType &&
          formData.propertyInfo?.ownershipType
        );
      case 3:
        return !!(
          formData.bankingInfo?.accountName &&
          formData.bankingInfo?.accountNumber &&
          formData.bankingInfo?.bankName
        );
      case 4:
        return !!(
          formData.documents?.identityDocument &&
          formData.documents?.propertyDocument
        );
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const pickDocument = async (type: 'identity' | 'property' | 'business') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [`${type}Document`]: file as File,
          },
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center mb-6">
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          className={`w-8 h-8 rounded-full mx-1 flex items-center justify-center ${
            index + 1 <= currentStep ? 'bg-primary-500' : 'bg-gray-300'
          }`}
        >
          <Text className={`text-sm font-semibold ${
            index + 1 <= currentStep ? 'text-white' : 'text-gray-600'
          }`}>
            {index + 1}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Personal Information</Text>
      
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">First Name *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.personalInfo?.firstName}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo!, firstName: text },
            }))
          }
          placeholder="Enter your first name"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Last Name *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.personalInfo?.lastName}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo!, lastName: text },
            }))
          }
          placeholder="Enter your last name"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Email *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.personalInfo?.email}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo!, email: text },
            }))
          }
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.personalInfo?.phone}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo!, phone: text },
            }))
          }
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderPropertyInfoStep = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Property Information</Text>
      
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Property Address *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.propertyInfo?.address}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              propertyInfo: { ...prev.propertyInfo!, address: text },
            }))
          }
          placeholder="Enter the full address of your parking space"
          multiline
          numberOfLines={3}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Property Type *</Text>
        <View className="flex-row space-x-4">
          {['residential', 'commercial'].map((type) => (
            <TouchableOpacity
              key={type}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                formData.propertyInfo?.propertyType === type
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-white'
              }`}
              onPress={() =>
                setFormData(prev => ({
                  ...prev,
                  propertyInfo: { 
                    ...prev.propertyInfo!, 
                    propertyType: type as 'residential' | 'commercial' 
                  },
                }))
              }
            >
              <Text className={`text-center font-medium ${
                formData.propertyInfo?.propertyType === type
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Ownership Type *</Text>
        <View className="space-y-2">
          {[
            { key: 'owner', label: 'Property Owner' },
            { key: 'tenant', label: 'Tenant with Permission' },
            { key: 'manager', label: 'Property Manager' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              className={`py-3 px-4 rounded-lg border ${
                formData.propertyInfo?.ownershipType === option.key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-white'
              }`}
              onPress={() =>
                setFormData(prev => ({
                  ...prev,
                  propertyInfo: { 
                    ...prev.propertyInfo!, 
                    ownershipType: option.key as 'owner' | 'tenant' | 'manager' 
                  },
                }))
              }
            >
              <Text className={`font-medium ${
                formData.propertyInfo?.ownershipType === option.key
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBankingInfoStep = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Banking Information</Text>
      <Text className="text-gray-600 mb-4">
        We need your banking details to send your earnings. This information is encrypted and secure.
      </Text>
      
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Account Name *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.bankingInfo?.accountName}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              bankingInfo: { ...prev.bankingInfo!, accountName: text },
            }))
          }
          placeholder="Name on bank account"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Account Number *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.bankingInfo?.accountNumber}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              bankingInfo: { ...prev.bankingInfo!, accountNumber: text },
            }))
          }
          placeholder="Bank account number"
          keyboardType="numeric"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Bank Name *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={formData.bankingInfo?.bankName}
          onChangeText={(text) =>
            setFormData(prev => ({
              ...prev,
              bankingInfo: { ...prev.bankingInfo!, bankName: text },
            }))
          }
          placeholder="Name of your bank"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Account Type *</Text>
        <View className="flex-row space-x-4">
          {['checking', 'savings'].map((type) => (
            <TouchableOpacity
              key={type}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                formData.bankingInfo?.accountType === type
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-white'
              }`}
              onPress={() =>
                setFormData(prev => ({
                  ...prev,
                  bankingInfo: { 
                    ...prev.bankingInfo!, 
                    accountType: type as 'checking' | 'savings' 
                  },
                }))
              }
            >
              <Text className={`text-center font-medium ${
                formData.bankingInfo?.accountType === type
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDocumentsStep = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Document Verification</Text>
      <Text className="text-gray-600 mb-4">
        Please upload the required documents for verification. All documents should be clear and readable.
      </Text>
      
      <View className="space-y-4">
        <View className="border border-gray-300 rounded-lg p-4">
          <Text className="font-semibold text-gray-900 mb-2">Identity Document *</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Valid government-issued ID (Driver's License, Passport, etc.)
          </Text>
          <TouchableOpacity
            className="bg-primary-500 py-2 px-4 rounded-lg"
            onPress={() => pickDocument('identity')}
          >
            <Text className="text-white font-medium text-center">
              {formData.documents?.identityDocument ? 'Document Selected ✓' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="border border-gray-300 rounded-lg p-4">
          <Text className="font-semibold text-gray-900 mb-2">Property Document *</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Proof of property ownership or permission to rent (Title, Lease Agreement, etc.)
          </Text>
          <TouchableOpacity
            className="bg-primary-500 py-2 px-4 rounded-lg"
            onPress={() => pickDocument('property')}
          >
            <Text className="text-white font-medium text-center">
              {formData.documents?.propertyDocument ? 'Document Selected ✓' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>

        {formData.businessInfo?.businessName && (
          <View className="border border-gray-300 rounded-lg p-4">
            <Text className="font-semibold text-gray-900 mb-2">Business Document</Text>
            <Text className="text-gray-600 text-sm mb-3">
              Business registration or permit (if applicable)
            </Text>
            <TouchableOpacity
              className="bg-primary-500 py-2 px-4 rounded-lg"
              onPress={() => pickDocument('business')}
            >
              <Text className="text-white font-medium text-center">
                {formData.documents?.businessDocument ? 'Document Selected ✓' : 'Upload Document'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View className="space-y-6">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Review Your Information</Text>
      
      <View className="bg-gray-50 rounded-lg p-4">
        <Text className="font-semibold text-gray-900 mb-2">Personal Information</Text>
        <Text className="text-gray-700">
          {formData.personalInfo?.firstName} {formData.personalInfo?.lastName}
        </Text>
        <Text className="text-gray-700">{formData.personalInfo?.email}</Text>
        <Text className="text-gray-700">{formData.personalInfo?.phone}</Text>
      </View>

      <View className="bg-gray-50 rounded-lg p-4">
        <Text className="font-semibold text-gray-900 mb-2">Property Information</Text>
        <Text className="text-gray-700">{formData.propertyInfo?.address}</Text>
        <Text className="text-gray-700">
          {formData.propertyInfo?.propertyType} - {formData.propertyInfo?.ownershipType}
        </Text>
      </View>

      <View className="bg-gray-50 rounded-lg p-4">
        <Text className="font-semibold text-gray-900 mb-2">Banking Information</Text>
        <Text className="text-gray-700">{formData.bankingInfo?.accountName}</Text>
        <Text className="text-gray-700">{formData.bankingInfo?.bankName}</Text>
        <Text className="text-gray-700">
          {formData.bankingInfo?.accountType} account ending in{' '}
          {formData.bankingInfo?.accountNumber?.slice(-4)}
        </Text>
      </View>

      <View className="bg-primary-50 rounded-lg p-4">
        <Text className="font-semibold text-primary-900 mb-2">Next Steps</Text>
        <Text className="text-primary-700">
          After submitting your application, our team will review your documents within 2-3 business days. 
          You'll receive an email notification once your account is verified.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfoStep();
      case 2:
        return renderPropertyInfoStep();
      case 3:
        return renderBankingInfoStep();
      case 4:
        return renderDocumentsStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          {renderStepIndicator()}
          {renderCurrentStep()}
        </View>
      </ScrollView>

      <View className="px-4 py-4 border-t border-gray-200">
        <View className="flex-row space-x-4">
          <TouchableOpacity
            className="flex-1 py-3 px-4 rounded-lg border border-gray-300"
            onPress={handleBack}
          >
            <Text className="text-gray-700 font-medium text-center">
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg ${
              validateCurrentStep()
                ? 'bg-primary-500'
                : 'bg-gray-300'
            }`}
            onPress={handleNext}
            disabled={!validateCurrentStep()}
          >
            <Text className="text-white font-medium text-center">
              {currentStep === totalSteps ? 'Submit Application' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}