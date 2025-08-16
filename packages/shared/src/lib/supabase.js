import { createClient } from '@supabase/supabase-js';
// Environment variables for Supabase configuration
// Use import.meta.env for Vite/browser, process.env for Node.js
const getEnvVar = (name) => {
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
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
    getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
    'https://xvawouyzqoqucbokhbiw.supabase.co'; // Fallback
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YXdvdXl6cW9xdWNib2toYml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjM2NzQsImV4cCI6MjA3MDEzOTY3NH0.HLhb1JzLgQI4ar9pfaDVgk5J1UFWLNQ4eDZq512fsJE'; // Fallback
// Debug logging (only in development)
if (getEnvVar('NODE_ENV') !== 'production') {
    console.log('Environment detection:', {
        hasImportMeta: typeof import.meta !== 'undefined',
        hasProcess: typeof process !== 'undefined',
        supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
        supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
        viteUrl: getEnvVar('VITE_SUPABASE_URL') ? 'SET' : 'MISSING',
        viteKey: getEnvVar('VITE_SUPABASE_ANON_KEY') ? 'SET' : 'MISSING',
    });
}
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Missing Supabase environment variables. URL: ${supabaseUrl ? 'SET' : 'MISSING'}, Key: ${supabaseAnonKey ? 'SET' : 'MISSING'}. Please check your .env file.`);
}
// Singleton pattern to ensure only one Supabase client instance
let supabaseInstance = null;
const createSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance;
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce', // Use PKCE flow for better security
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'park-angel-auth-token', // Unique storage key
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
        db: {
            schema: 'public',
        },
    });
    return supabaseInstance;
};
// Create and export the singleton Supabase client
export const supabase = createSupabaseClient();
// Auth helpers
export const auth = supabase.auth;
// Storage helpers
export const storage = supabase.storage;
// Realtime helpers
export const realtime = supabase.realtime;
// Database helpers with type safety
export const db = supabase;
// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
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
// Helper function to validate database query results
export const validateQueryResult = (result) => {
    if (!result || typeof result !== 'object') {
        return null;
    }
    // Check if it's a SelectQueryError
    if (result.message && result.message.includes('could not find the relation')) {
        console.warn('Database relationship error:', result.message);
        return null;
    }
    return result;
};
// Helper function to safely access nested properties
export const safeAccess = (obj, path, defaultValue) => {
    try {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }
        return current !== undefined ? current : defaultValue;
    }
    catch {
        return defaultValue;
    }
};
// Type guard for checking if a value is a valid database result
export const isValidDatabaseResult = (value) => {
    return value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !value.message?.includes('could not find the relation');
};
// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
    const { data: { session }, } = await auth.getSession();
    return !!session;
};
// Helper function to get current user
export const getCurrentUser = async () => {
    const { data: { user }, error, } = await auth.getUser();
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
