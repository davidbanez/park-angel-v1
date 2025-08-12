import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@park-angel/shared/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: LocalAuthentication.AuthenticationType[];
}

export interface OAuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
}

export class ClientAuthService {
  private static readonly BIOMETRIC_KEY = 'biometric_enabled';
  private static readonly STORED_CREDENTIALS_KEY = 'stored_credentials';

  // ============================================================================
  // OAUTH AUTHENTICATION
  // ============================================================================

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<OAuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            scheme: 'com.parkangel.client',
            path: 'auth/callback',
          }),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // The OAuth flow will redirect to the app, and the session will be handled
      // by the auth state change listener in AuthProvider
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'OAuth failed' 
      };
    }
  }

  /**
   * Sign in with Facebook OAuth
   */
  static async signInWithFacebook(): Promise<OAuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            scheme: 'com.parkangel.client',
            path: 'auth/callback',
          }),
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'OAuth failed' 
      };
    }
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  /**
   * Send email verification
   */
  static async sendEmailVerification(): Promise<EmailVerificationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      if (user.email_confirmed_at) {
        return { success: false, error: 'Email already verified' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send verification email' 
      };
    }
  }

  /**
   * Check if email is verified
   */
  static async isEmailVerified(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user?.email_confirmed_at;
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // BIOMETRIC AUTHENTICATION
  // ============================================================================

  /**
   * Check if biometric authentication is available
   */
  static async isBiometricAvailable(): Promise<{
    available: boolean;
    biometricTypes: LocalAuthentication.AuthenticationType[];
    error?: string;
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { 
          available: false, 
          biometricTypes: [], 
          error: 'Biometric hardware not available' 
        };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { 
          available: false, 
          biometricTypes: [], 
          error: 'No biometric data enrolled' 
        };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        available: true,
        biometricTypes: supportedTypes,
      };
    } catch (error) {
      return { 
        available: false, 
        biometricTypes: [], 
        error: error instanceof Error ? error.message : 'Biometric check failed' 
      };
    }
  }

  /**
   * Enable biometric authentication
   */
  static async enableBiometricAuth(email: string, password: string): Promise<BiometricAuthResult> {
    try {
      const { available, biometricTypes, error } = await this.isBiometricAvailable();
      
      if (!available) {
        return { success: false, error: error || 'Biometric authentication not available' };
      }

      // Test biometric authentication
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!biometricResult.success) {
        return { 
          success: false, 
          error: biometricResult.error || 'Biometric authentication failed' 
        };
      }

      // Store encrypted credentials
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(this.STORED_CREDENTIALS_KEY, credentials);
      await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');

      return { 
        success: true, 
        biometricType: biometricTypes 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to enable biometric auth' 
      };
    }
  }

  /**
   * Authenticate with biometrics
   */
  static async authenticateWithBiometrics(): Promise<{
    success: boolean;
    credentials?: { email: string; password: string };
    error?: string;
  }> {
    try {
      const isBiometricEnabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      if (isBiometricEnabled !== 'true') {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      const { available } = await this.isBiometricAvailable();
      if (!available) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with biometrics',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!biometricResult.success) {
        return { 
          success: false, 
          error: biometricResult.error || 'Biometric authentication failed' 
        };
      }

      // Retrieve stored credentials
      const storedCredentials = await SecureStore.getItemAsync(this.STORED_CREDENTIALS_KEY);
      if (!storedCredentials) {
        return { success: false, error: 'No stored credentials found' };
      }

      const credentials = JSON.parse(storedCredentials);
      return { success: true, credentials };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Biometric authentication failed' 
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometricAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(this.STORED_CREDENTIALS_KEY);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to disable biometric auth' 
      };
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const isEnabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      return isEnabled === 'true';
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Update user profile
   */
  static async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
          date_of_birth: updates.dateOfBirth,
          address: updates.address,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(): Promise<{
    success: boolean;
    profile?: any;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get profile' 
      };
    }
  }

  /**
   * Upload profile avatar
   */
  static async uploadAvatar(uri: string): Promise<{
    success: boolean;
    avatarUrl?: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, avatarUrl: publicUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload avatar' 
      };
    }
  }

  // ============================================================================
  // DISCOUNT APPLICATION
  // ============================================================================

  /**
   * Apply for Senior Citizen discount
   */
  static async applyForSeniorDiscount(documents: {
    seniorIdUri: string;
    validIdUri: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      // Upload documents
      const seniorIdResult = await this.uploadDocument(documents.seniorIdUri, 'senior_id');
      const validIdResult = await this.uploadDocument(documents.validIdUri, 'valid_id');

      if (!seniorIdResult.success || !validIdResult.success) {
        return { 
          success: false, 
          error: 'Failed to upload documents' 
        };
      }

      // Create discount application
      const { error } = await supabase
        .from('discount_applications')
        .insert({
          user_id: user.id,
          discount_type: 'senior',
          status: 'pending',
          documents: {
            senior_id: seniorIdResult.url,
            valid_id: validIdResult.url,
          },
          applied_at: new Date().toISOString(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to apply for discount' 
      };
    }
  }

  /**
   * Apply for PWD discount
   */
  static async applyForPWDDiscount(documents: {
    pwdIdUri: string;
    validIdUri: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      // Upload documents
      const pwdIdResult = await this.uploadDocument(documents.pwdIdUri, 'pwd_id');
      const validIdResult = await this.uploadDocument(documents.validIdUri, 'valid_id');

      if (!pwdIdResult.success || !validIdResult.success) {
        return { 
          success: false, 
          error: 'Failed to upload documents' 
        };
      }

      // Create discount application
      const { error } = await supabase
        .from('discount_applications')
        .insert({
          user_id: user.id,
          discount_type: 'pwd',
          status: 'pending',
          documents: {
            pwd_id: pwdIdResult.url,
            valid_id: validIdResult.url,
          },
          applied_at: new Date().toISOString(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to apply for discount' 
      };
    }
  }

  /**
   * Upload document for discount application
   */
  private static async uploadDocument(uri: string, type: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('discount-documents')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('discount-documents')
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload document' 
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Clear all stored authentication data
   */
  static async clearStoredData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(this.STORED_CREDENTIALS_KEY);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }

  /**
   * Get biometric type display name
   */
  static getBiometricTypeDisplayName(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  }
}