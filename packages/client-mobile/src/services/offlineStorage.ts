import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// High-performance storage for frequently accessed data
const storage = new MMKV({
  id: 'park-angel-storage',
  encryptionKey: 'park-angel-encryption-key-2024',
});

// Async storage for larger data that doesn't need immediate access
const asyncStorage = AsyncStorage;

export interface OfflineData {
  id: string;
  type: 'booking' | 'payment' | 'location' | 'user_action';
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorageService {
  private readonly OFFLINE_QUEUE_KEY = 'offline_queue';
  private readonly CACHED_DATA_KEY = 'cached_data';
  private readonly USER_PREFERENCES_KEY = 'user_preferences';

  // Offline queue management
  async addToOfflineQueue(data: Omit<OfflineData, 'id' | 'timestamp' | 'synced'>) {
    const offlineItem: OfflineData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
      ...data,
    };

    const queue = await this.getOfflineQueue();
    queue.push(offlineItem);
    
    await asyncStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return offlineItem.id;
  }

  async getOfflineQueue(): Promise<OfflineData[]> {
    try {
      const queueData = await asyncStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  async markAsSynced(itemId: string) {
    const queue = await this.getOfflineQueue();
    const updatedQueue = queue.map(item => 
      item.id === itemId ? { ...item, synced: true } : item
    );
    
    await asyncStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
  }

  async removeFromQueue(itemId: string) {
    const queue = await this.getOfflineQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    
    await asyncStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
  }

  async clearSyncedItems() {
    const queue = await this.getOfflineQueue();
    const unsyncedQueue = queue.filter(item => !item.synced);
    
    await asyncStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(unsyncedQueue));
  }

  // Fast storage for immediate access data
  setString(key: string, value: string) {
    storage.set(key, value);
  }

  getString(key: string): string | undefined {
    return storage.getString(key);
  }

  setObject(key: string, value: object) {
    storage.set(key, JSON.stringify(value));
  }

  getObject<T>(key: string): T | null {
    try {
      const value = storage.getString(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error parsing object for key ${key}:`, error);
      return null;
    }
  }

  setBoolean(key: string, value: boolean) {
    storage.set(key, value);
  }

  getBoolean(key: string): boolean {
    return storage.getBoolean(key) ?? false;
  }

  setNumber(key: string, value: number) {
    storage.set(key, value);
  }

  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  }

  delete(key: string) {
    storage.delete(key);
  }

  contains(key: string): boolean {
    return storage.contains(key);
  }

  // Cache management for API responses
  async setCachedData(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    const cachedData = await this.getCachedDataStore();
    cachedData[key] = cacheItem;
    
    await asyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.getCachedDataStore();
      const item = cachedData[key];
      
      if (!item) return null;
      
      // Check if cache is expired
      if (Date.now() - item.timestamp > item.ttl) {
        delete cachedData[key];
        await asyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error(`Error getting cached data for key ${key}:`, error);
      return null;
    }
  }

  private async getCachedDataStore(): Promise<Record<string, any>> {
    try {
      const data = await asyncStorage.getItem(this.CACHED_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting cached data store:', error);
      return {};
    }
  }

  async clearExpiredCache() {
    try {
      const cachedData = await this.getCachedDataStore();
      const now = Date.now();
      
      const validCache = Object.entries(cachedData).reduce((acc, [key, item]) => {
        if (now - item.timestamp <= item.ttl) {
          acc[key] = item;
        }
        return acc;
      }, {} as Record<string, any>);
      
      await asyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(validCache));
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // User preferences
  async setUserPreference(key: string, value: any) {
    const preferences = await this.getUserPreferences();
    preferences[key] = value;
    
    await asyncStorage.setItem(this.USER_PREFERENCES_KEY, JSON.stringify(preferences));
  }

  async getUserPreference<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const preferences = await this.getUserPreferences();
    return preferences[key] ?? defaultValue;
  }

  private async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const data = await asyncStorage.getItem(this.USER_PREFERENCES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  // Clear all data
  async clearAll() {
    storage.clearAll();
    await asyncStorage.clear();
  }

  // Get storage stats
  getStorageStats() {
    const keys = storage.getAllKeys();
    return {
      totalKeys: keys.length,
      keys,
    };
  }
}

export const offlineStorage = new OfflineStorageService();