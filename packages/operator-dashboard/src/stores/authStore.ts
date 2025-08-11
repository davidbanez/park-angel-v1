import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@shared/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          if (data.user && data.session) {
            // Check if this is a first-time login by checking user metadata
            const isFirstTime = !data.user.user_metadata?.last_sign_in_at;
            
            if (isFirstTime) {
              // For first-time users, we need OTP verification
              // Send OTP email
              const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  shouldCreateUser: false,
                }
              });

              if (otpError) {
                throw otpError;
              }

              // Don't set authenticated yet, wait for OTP verification
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
            } else {
              // Regular login for returning users
              set({
                user: data.user,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            throw error;
          }

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false,
          });
          throw error;
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
          });

          if (error) {
            throw error;
          }

          if (data.user && data.session) {
            // Update user metadata to mark as verified
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                last_sign_in_at: new Date().toISOString(),
                otp_verified: true 
              }
            });

            if (updateError) {
              console.warn('Failed to update user metadata:', updateError);
            }

            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'OTP verification failed',
            isLoading: false,
          });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setSession: (session: Session | null) => {
        set({ session });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'operator-auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);