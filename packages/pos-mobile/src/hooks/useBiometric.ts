import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useBiometric() {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([]);

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricSettings();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    setIsBiometricSupported(compatible && enrolled);
    setBiometricType(types);
  };

  const loadBiometricSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    }
  };

  const enableBiometric = async () => {
    if (!isBiometricSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable biometric authentication for POS login',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
    });

    if (result.success) {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      setIsBiometricEnabled(true);
      return true;
    }

    return false;
  };

  const disableBiometric = async () => {
    await AsyncStorage.setItem('biometric_enabled', 'false');
    setIsBiometricEnabled(false);
  };

  const authenticateWithBiometric = async () => {
    if (!isBiometricEnabled) {
      throw new Error('Biometric authentication is not enabled');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access POS',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
    });

    return result;
  };

  return {
    isBiometricSupported,
    isBiometricEnabled,
    biometricType,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
  };
}