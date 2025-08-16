export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
    jwtSecret?: string;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}
export interface StorageConfig {
    buckets: {
        avatars: string;
        vehiclePhotos: string;
        parkingPhotos: string;
        violationPhotos: string;
        advertisementMedia: string;
        documents: string;
        receipts: string;
        facilityLayouts: string;
    };
    maxFileSize: {
        avatar: number;
        photo: number;
        document: number;
        media: number;
    };
}
export interface AuthConfig {
    providers: {
        email: boolean;
        google: boolean;
        facebook: boolean;
    };
    redirectUrls: {
        web: string;
        mobile: string;
    };
    mfa: {
        enabled: boolean;
        enforced: boolean;
    };
}
export interface RealtimeConfig {
    enabled: boolean;
    eventsPerSecond: number;
    maxConnections: number;
}
export declare const getSupabaseConfig: () => SupabaseConfig;
export declare const getDatabaseConfig: () => DatabaseConfig;
export declare const getStorageConfig: () => StorageConfig;
export declare const getAuthConfig: () => AuthConfig;
export declare const getRealtimeConfig: () => RealtimeConfig;
export declare const validateSupabaseConfig: (config: SupabaseConfig) => void;
export declare const validateDatabaseConfig: (config: DatabaseConfig) => void;
export declare const initializeSupabaseConfig: () => {
    supabase: SupabaseConfig;
    database: DatabaseConfig;
    storage: StorageConfig;
    auth: AuthConfig;
    realtime: RealtimeConfig;
};
export declare const config: {
    supabase: SupabaseConfig;
    database: DatabaseConfig;
    storage: StorageConfig;
    auth: AuthConfig;
    realtime: RealtimeConfig;
};
export { supabase } from '../lib/supabase';
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
export declare const features: {
    mfa: boolean;
    realtime: boolean;
    analytics: boolean;
    monitoring: boolean;
    debugging: boolean;
};
