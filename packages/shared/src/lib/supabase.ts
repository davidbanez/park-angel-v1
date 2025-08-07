import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables for Supabase configuration
const supabaseUrl =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ||
  process.env['EXPO_PUBLIC_SUPABASE_URL'] ||
  '';
const supabaseAnonKey =
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
  process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'park-angel-system',
    },
  },
});

// Auth helpers
export const auth = supabase.auth;

// Storage helpers
export const storage = supabase.storage;

// Realtime helpers
export const realtime = supabase.realtime;

// Database helpers with type safety
export const db = supabase;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);

  if (error?.code === 'PGRST301') {
    throw new Error('Resource not found');
  }

  if (error?.code === '23505') {
    throw new Error('Resource already exists');
  }

  if (error?.code === '42501') {
    throw new Error('Insufficient permissions');
  }

  throw new Error(error?.message || 'An unexpected error occurred');
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const {
    data: { session },
  } = await auth.getSession();
  return !!session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await auth.getUser();
  if (error) {
    handleSupabaseError(error);
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await auth.signOut();
  if (error) {
    handleSupabaseError(error);
  }
};
