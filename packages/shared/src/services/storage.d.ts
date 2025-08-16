export interface UploadOptions {
    bucket: string;
    path: string;
    file: File | Blob;
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
}
export interface UploadResult {
    path: string;
    fullPath: string;
    publicUrl: string;
}
export declare class StorageService {
    static readonly BUCKETS: {
        readonly AVATARS: "avatars";
        readonly VEHICLE_PHOTOS: "vehicle-photos";
        readonly PARKING_PHOTOS: "parking-photos";
        readonly VIOLATION_PHOTOS: "violation-photos";
        readonly ADVERTISEMENT_MEDIA: "advertisement-media";
        readonly DOCUMENTS: "documents";
        readonly RECEIPTS: "receipts";
        readonly FACILITY_LAYOUTS: "facility-layouts";
    };
    /**
     * Initialize storage buckets
     */
    static initializeBuckets(): Promise<void>;
    /**
     * Upload a file to storage
     */
    static uploadFile(options: UploadOptions): Promise<UploadResult>;
    /**
     * Upload multiple files
     */
    static uploadFiles(files: UploadOptions[]): Promise<UploadResult[]>;
    /**
     * Delete a file from storage
     */
    static deleteFile(bucket: string, path: string): Promise<void>;
    /**
     * Delete multiple files
     */
    static deleteFiles(bucket: string, paths: string[]): Promise<void>;
    /**
     * Get public URL for a file
     */
    static getPublicUrl(bucket: string, path: string): string;
    /**
     * Get signed URL for private files
     */
    static getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
    /**
     * List files in a bucket
     */
    static listFiles(bucket: string, path?: string, limit?: number): Promise<import("@supabase/storage-js").FileObject[]>;
    /**
     * Move a file to a new location
     */
    static moveFile(bucket: string, fromPath: string, toPath: string): Promise<void>;
    /**
     * Copy a file to a new location
     */
    static copyFile(bucket: string, fromPath: string, toPath: string): Promise<void>;
    /**
     * Get file metadata
     */
    static getFileInfo(bucket: string, path: string): Promise<import("@supabase/storage-js").FileObject | null>;
    /**
     * Generate unique file path
     */
    static generateFilePath(userId: string, bucket: string, fileName: string): string;
    /**
     * Get allowed MIME types for bucket
     */
    private static getAllowedMimeTypes;
    /**
     * Get file size limit for bucket (in bytes)
     */
    private static getFileSizeLimit;
}
