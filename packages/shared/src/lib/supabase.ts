import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables for Supabase configuration
// Use import.meta.env for Vite/browser, process.env for Node.js
const getEnvVar = (name: string): string => {
  // For Vite (browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || '';
  }
  // For Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || '';
  }
  return '';
};

const supabaseUrl = 
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  'https://xvawouyzqoqucbokhbiw.supabase.co'; // Fallback

const supabaseAnonKey = 
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YXdvdXl6cW9xdWNib2toYml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjM2NzQsImV4cCI6MjA3MDEzOTY3NH0.HLhb1JzLgQI4ar9pfaDVgk5J1UFWLNQ4eDZq512fsJE'; // Fallback

// Debug logging
console.log('Environment detection:', {
  hasImportMeta: typeof import.meta !== 'undefined',
  hasProcess: typeof process !== 'undefined',
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
  viteUrl: getEnvVar('VITE_SUPABASE_URL') ? 'SET' : 'MISSING',
  viteKey: getEnvVar('VITE_SUPABASE_ANON_KEY') ? 'SET' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables. URL: ${supabaseUrl ? 'SET' : 'MISSING'}, Key: ${supabaseAnonKey ? 'SET' : 'MISSING'}. Please check your .env file.`
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
