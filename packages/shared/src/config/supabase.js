// Supabase configuration and environment setup
// Environment-specific configurations
export const getSupabaseConfig = () => {
    const config = {
        url: getEnvVar('SUPABASE_URL'),
        anonKey: getEnvVar('SUPABASE_ANON_KEY'),
    };
    // Service role key is only needed for server-side operations
    if (typeof window === 'undefined') {
        config.serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false);
        config.jwtSecret = getEnvVar('SUPABASE_JWT_SECRET', false);
    }
    return config;
};
export const getDatabaseConfig = () => ({
    host: getEnvVar('DB_HOST', false) || 'localhost',
    port: parseInt(getEnvVar('DB_PORT', false) || '5432'),
    database: getEnvVar('DB_NAME', false) || 'park_angel',
    username: getEnvVar('DB_USER', false) || 'postgres',
    password: getEnvVar('DB_PASSWORD', false) || '',
});
export const getStorageConfig = () => ({
    buckets: {
        avatars: 'avatars',
        vehiclePhotos: 'vehicle-photos',
        parkingPhotos: 'parking-photos',
        violationPhotos: 'violation-photos',
        advertisementMedia: 'advertisement-media',
        documents: 'documents',
        receipts: 'receipts',
        facilityLayouts: 'facility-layouts',
    },
    maxFileSize: {
        avatar: 2 * 1024 * 1024, // 2MB
        photo: 5 * 1024 * 1024, // 5MB
        document: 10 * 1024 * 1024, // 10MB
        media: 50 * 1024 * 1024, // 50MB
    },
});
export const getAuthConfig = () => ({
    providers: {
        email: true,
        google: getEnvVar('GOOGLE_CLIENT_ID', false) !== '',
        facebook: getEnvVar('FACEBOOK_APP_ID', false) !== '',
    },
    redirectUrls: {
        web: getEnvVar('NEXT_PUBLIC_SITE_URL', false) || 'http://localhost:3000',
        mobile: getEnvVar('EXPO_PUBLIC_SITE_URL', false) || 'parkangel://auth',
    },
    mfa: {
        enabled: getEnvVar('MFA_ENABLED', false) === 'true',
        enforced: getEnvVar('MFA_ENFORCED', false) === 'true',
    },
});
export const getRealtimeConfig = () => ({
    enabled: getEnvVar('REALTIME_ENABLED', false) !== 'false',
    eventsPerSecond: parseInt(getEnvVar('REALTIME_EVENTS_PER_SECOND', false) || '10'),
    maxConnections: parseInt(getEnvVar('REALTIME_MAX_CONNECTIONS', false) || '100'),
});
// Helper function to get environment variables
function getEnvVar(name, required = true) {
    // Check for Next.js public variables first
    const nextPublicVar = `NEXT_PUBLIC_${name}`;
    const expoPublicVar = `EXPO_PUBLIC_${name}`;
    const value = process.env[nextPublicVar] ||
        process.env[expoPublicVar] ||
        process.env[name] ||
        (typeof window !== 'undefined' && window.__ENV__?.[name]);
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || '';
}
// Validation functions
export const validateSupabaseConfig = (config) => {
    if (!config.url) {
        throw new Error('Supabase URL is required');
    }
    if (!config.anonKey) {
        throw new Error('Supabase anonymous key is required');
    }
    // Validate URL format
    try {
        new URL(config.url);
    }
    catch {
        throw new Error('Invalid Supabase URL format');
    }
};
export const validateDatabaseConfig = (config) => {
    if (!config.host) {
        throw new Error('Database host is required');
    }
    if (!config.database) {
        throw new Error('Database name is required');
    }
    if (config.port < 1 || config.port > 65535) {
        throw new Error('Invalid database port');
    }
};
// Configuration initialization
export const initializeSupabaseConfig = () => {
    const supabaseConfig = getSupabaseConfig();
    const databaseConfig = getDatabaseConfig();
    const storageConfig = getStorageConfig();
    const authConfig = getAuthConfig();
    const realtimeConfig = getRealtimeConfig();
    // Validate configurations
    validateSupabaseConfig(supabaseConfig);
    if (typeof window === 'undefined') {
        validateDatabaseConfig(databaseConfig);
    }
    return {
        supabase: supabaseConfig,
        database: databaseConfig,
        storage: storageConfig,
        auth: authConfig,
        realtime: realtimeConfig,
    };
};
// Export default configuration
export const config = initializeSupabaseConfig();
// Re-export supabase client for backward compatibility
export { supabase } from '../lib/supabase';
// Environment-specific settings
export const isDevelopment = process.env['NODE_ENV'] === 'development';
export const isProduction = process.env['NODE_ENV'] === 'production';
export const isTest = process.env['NODE_ENV'] === 'test';
// Feature flags
export const features = {
    mfa: config.auth.mfa.enabled,
    realtime: config.realtime.enabled,
    analytics: getEnvVar('ANALYTICS_ENABLED', false) === 'true',
    monitoring: getEnvVar('MONITORING_ENABLED', false) === 'true',
    debugging: isDevelopment || getEnvVar('DEBUG_ENABLED', false) === 'true',
};
