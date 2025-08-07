import { supabase, handleSupabaseError } from '../lib/supabase';
import type { AuthError, User, Session } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'client' | 'host' | 'operator' | 'admin' | 'pos';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            user_type: data.userType,
          },
        },
      });

      if (error) {
        handleSupabaseError(error);
      }

      // Create user profile after successful signup
      if (authData.user) {
        await this.createUserProfile(authData.user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          userType: data.userType,
        });
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        handleSupabaseError(error);
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with Facebook OAuth
   */
  static async signInWithFacebook(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(
    email: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(
    newPassword: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        handleSupabaseError(error);
      }

      return {
        session: data.session,
        error: null,
      };
    } catch (error) {
      return {
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        handleSupabaseError(error);
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Enable Two-Factor Authentication
   */
  static async enableMFA(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Verify MFA challenge
   */
  static async verifyMFA(
    factorId: string,
    challengeId: string,
    code: string
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        handleSupabaseError(error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Create user profile after successful authentication
   */
  private static async createUserProfile(
    userId: string,
    profileData: {
      firstName: string;
      lastName: string;
      phone?: string;
      userType: string;
    }
  ) {
    const { error } = await supabase.from('user_profiles').insert({
      user_id: userId,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone,
    });

    if (error) {
      console.error('Error creating user profile:', error);
    }

    // Also update the users table with user type
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      user_type: profileData.userType as any,
      status: 'active',
    });

    if (userError) {
      console.error('Error creating user record:', userError);
    }
  }
}
