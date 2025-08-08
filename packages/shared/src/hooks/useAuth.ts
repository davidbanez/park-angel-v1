import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  AuthService,
  SessionService,
  AuthorizationService,
} from '../services/auth';
import { UserType, PermissionAction } from '../models/user';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  userType: UserType | null;
  profile: unknown | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: UserType;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (
    resource: string,
    action: PermissionAction,
    context?: Record<string, unknown>
  ) => Promise<boolean>;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    userType: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && mounted) {
          const { user, profile, userType } =
            await AuthService.getCurrentUserWithProfile();
          setState({
            user,
            session,
            userType,
            profile,
            loading: false,
            error: null,
          });
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error as Error,
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        const { user, profile, userType } =
          await AuthService.getCurrentUserWithProfile();
        setState({
          user,
          session,
          userType,
          profile,
          loading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          userType: null,
          profile: null,
          loading: false,
          error: null,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState(prev => ({
          ...prev,
          session,
          error: null,
        }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await AuthService.signIn({ email, password });

      if (error) {
        throw error;
      }

      // State will be updated by the auth state change listener
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      userType: UserType;
    }) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await AuthService.signUp(data);

        if (error) {
          throw error;
        }

        // State will be updated by the auth state change listener
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await AuthService.signOut();

      if (error) {
        throw error;
      }

      // State will be updated by the auth state change listener
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await AuthService.signInWithGoogle();

      if (error) {
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const signInWithFacebook = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await AuthService.signInWithFacebook();

      if (error) {
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await AuthService.resetPassword(email);

      if (error) {
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await AuthService.updatePassword(newPassword);

      if (error) {
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!state.session) return;

    try {
      const refreshedSession = await SessionService.refreshSession(
        state.session.access_token
      );

      if (refreshedSession) {
        setState(prev => ({
          ...prev,
          session: {
            ...prev.session!,
            access_token: refreshedSession.accessToken,
            refresh_token: refreshedSession.refreshToken,
          },
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  }, [state.session]);

  const hasPermission = useCallback(
    async (
      resource: string,
      action: PermissionAction,
      context?: Record<string, unknown>
    ): Promise<boolean> => {
      if (!state.user) return false;

      try {
        const authContext =
          await AuthorizationService.createAuthorizationContext(state.user.id);
        return await AuthorizationService.hasPermission(
          authContext,
          resource,
          action,
          context
        );
      } catch (error) {
        console.error('Error checking permission:', error);
        return false;
      }
    },
    [state.user]
  );

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
    updatePassword,
    refreshSession,
    hasPermission,
  };
}

export default useAuth;
