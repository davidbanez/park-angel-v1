import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@park-angel/shared/lib/supabase';
import { ClientAuthService, BiometricAuthResult, OAuthResult } from '../services/authService';
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isEmailVerified: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<OAuthResult>;
  signInWithFacebook: () => Promise<OAuthResult>;
  signInWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  enableBiometricAuth: (email: string, password: string) => Promise<BiometricAuthResult>;
  disableBiometricAuth: () => Promise<{ success: boolean; error?: string }>;
  sendEmailVerification: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
  initialize: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);

  const initialize = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check email verification status
        const emailVerified = await ClientAuthService.isEmailVerified();
        setIsEmailVerified(emailVerified);
      }

      // Check biometric availability
      const biometricCheck = await ClientAuthService.isBiometricAvailable();
      setBiometricAvailable(biometricCheck.available);
      setBiometricTypes(biometricCheck.biometricTypes);

      // Check if biometric is enabled
      const biometricEnabledCheck = await ClientAuthService.isBiometricEnabled();
      setBiometricEnabled(biometricEnabledCheck);
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: 'client',
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // Clear biometric data on sign out
    await ClientAuthService.clearStoredData();
    setBiometricEnabled(false);
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async (): Promise<OAuthResult> => {
    return await ClientAuthService.signInWithGoogle();
  };

  const signInWithFacebook = async (): Promise<OAuthResult> => {
    return await ClientAuthService.signInWithFacebook();
  };

  const signInWithBiometrics = async () => {
    const result = await ClientAuthService.authenticateWithBiometrics();
    if (result.success && result.credentials) {
      await signIn(result.credentials.email, result.credentials.password);
    }
    return { success: result.success, error: result.error };
  };

  const enableBiometricAuth = async (email: string, password: string): Promise<BiometricAuthResult> => {
    const result = await ClientAuthService.enableBiometricAuth(email, password);
    if (result.success) {
      setBiometricEnabled(true);
    }
    return result;
  };

  const disableBiometricAuth = async () => {
    const result = await ClientAuthService.disableBiometricAuth();
    if (result.success) {
      setBiometricEnabled(false);
    }
    return result;
  };

  const sendEmailVerification = async () => {
    const result = await ClientAuthService.sendEmailVerification();
    return result;
  };

  const updateProfile = async (updates: any) => {
    return await ClientAuthService.updateProfile(updates);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check email verification status when user signs in
          const emailVerified = await ClientAuthService.isEmailVerified();
          setIsEmailVerified(emailVerified);
        } else {
          setIsEmailVerified(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    isEmailVerified,
    biometricAvailable,
    biometricEnabled,
    biometricTypes,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    signInWithBiometrics,
    enableBiometricAuth,
    disableBiometricAuth,
    sendEmailVerification,
    updateProfile,
    initialize,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}