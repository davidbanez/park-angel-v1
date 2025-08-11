// Platform detection utility for shared components
export const Platform = {
  isNative: (): boolean => {
    try {
      // Check if we're in a React Native environment
      return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
    } catch {
      return false;
    }
  },
  
  isWeb: (): boolean => {
    return !Platform.isNative();
  },
  
  isIOS: (): boolean => {
    if (Platform.isNative()) {
      try {
        const { Platform: RNPlatform } = require('react-native');
        return RNPlatform.OS === 'ios';
      } catch {
        return false;
      }
    }
    return false;
  },
  
  isAndroid: (): boolean => {
    if (Platform.isNative()) {
      try {
        const { Platform: RNPlatform } = require('react-native');
        return RNPlatform.OS === 'android';
      } catch {
        return false;
      }
    }
    return false;
  },
};