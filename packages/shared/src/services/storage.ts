import { supabase, handleSupabaseError } from '../lib/supabase';

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

export class StorageService {
  // Storage bucket names
  static readonly BUCKETS = {
    AVATARS: 'avatars',
    VEHICLE_PHOTOS: 'vehicle-photos',
    PARKING_PHOTOS: 'parking-photos',
    VIOLATION_PHOTOS: 'violation-photos',
    ADVERTISEMENT_MEDIA: 'advertisement-media',
    DOCUMENTS: 'documents',
    RECEIPTS: 'receipts',
    FACILITY_LAYOUTS: 'facility-layouts',
  } as const;

  /**
   * Initialize storage buckets
   */
  static async initializeBuckets(): Promise<void> {
    const buckets = Object.values(this.BUCKETS);

    for (const bucketName of buckets) {
      try {
        // Check if bucket exists
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(
          bucket => bucket.name === bucketName
        );

        if (!bucketExists) {
          // Create bucket if it doesn't exist
          const { error } = await supabase.storage.createBucket(bucketName, {
            public:
              bucketName === this.BUCKETS.AVATARS ||
              bucketName === this.BUCKETS.PARKING_PHOTOS,
            allowedMimeTypes: this.getAllowedMimeTypes(bucketName),
            fileSizeLimit: this.getFileSizeLimit(bucketName),
          });

          if (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
          } else {
            console.log(`Created storage bucket: ${bucketName}`);
          }
        }
      } catch (error) {
        console.error(`Error initializing bucket ${bucketName}:`, error);
      }
    }
  }

  /**
   * Upload a file to storage
   */
  static async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const {
        bucket,
        path,
        file,
        contentType,
        cacheControl = '3600',
        upsert = false,
      } = options;

      const uploadOptions: any = {
        cacheControl,
        upsert,
      };

      if (contentType) {
        uploadOptions.contentType = contentType;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, uploadOptions);

      if (error) {
        handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      const publicUrl = this.getPublicUrl(bucket, data.path);

      return {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(files: UploadOptions[]): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(bucket: string, paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Get signed URL for private files
   */
  static async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Failed to create signed URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }
  }

  /**
   * List files in a bucket
   */
  static async listFiles(bucket: string, path?: string, limit?: number) {
    try {
      const listOptions: any = {
        sortBy: { column: 'created_at', order: 'desc' },
      };

      if (limit) {
        listOptions.limit = limit;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, listOptions);

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Move a file to a new location
   */
  static async moveFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }

  /**
   * Copy a file to a new location
   */
  static async copyFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error copying file:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  static async getFileInfo(bucket: string, path: string) {
    try {
      const fileName = path.split('/').pop();
      const searchOptions: any = {};

      if (fileName) {
        searchOptions.search = fileName;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), searchOptions);

      if (error) {
        handleSupabaseError(error);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }

  /**
   * Generate unique file path
   */
  static generateFilePath(
    userId: string,
    bucket: string,
    fileName: string
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop();

    return `${userId}/${bucket}/${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Get allowed MIME types for bucket
   */
  private static getAllowedMimeTypes(bucket: string): string[] {
    switch (bucket) {
      case this.BUCKETS.AVATARS:
      case this.BUCKETS.PARKING_PHOTOS:
      case this.BUCKETS.VIOLATION_PHOTOS:
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      case this.BUCKETS.ADVERTISEMENT_MEDIA:
        return [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/webm',
        ];

      case this.BUCKETS.DOCUMENTS:
        return ['application/pdf', 'image/jpeg', 'image/png'];

      case this.BUCKETS.RECEIPTS:
        return ['application/pdf', 'image/jpeg', 'image/png'];

      case this.BUCKETS.FACILITY_LAYOUTS:
        return ['image/jpeg', 'image/png', 'image/svg+xml', 'application/json'];

      default:
        return ['*/*'];
    }
  }

  /**
   * Get file size limit for bucket (in bytes)
   */
  private static getFileSizeLimit(bucket: string): number {
    switch (bucket) {
      case this.BUCKETS.AVATARS:
        return 2 * 1024 * 1024; // 2MB

      case this.BUCKETS.VEHICLE_PHOTOS:
      case this.BUCKETS.PARKING_PHOTOS:
      case this.BUCKETS.VIOLATION_PHOTOS:
        return 5 * 1024 * 1024; // 5MB

      case this.BUCKETS.ADVERTISEMENT_MEDIA:
        return 50 * 1024 * 1024; // 50MB

      case this.BUCKETS.DOCUMENTS:
      case this.BUCKETS.RECEIPTS:
        return 10 * 1024 * 1024; // 10MB

      case this.BUCKETS.FACILITY_LAYOUTS:
        return 5 * 1024 * 1024; // 5MB

      default:
        return 10 * 1024 * 1024; // 10MB
    }
  }
}
