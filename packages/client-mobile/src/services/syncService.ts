import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@park-angel/shared/lib/supabase';
import { offlineStorage, OfflineData } from './offlineStorage';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingItems: number;
  failedItems: number;
}

class SyncService {
  private syncInProgress = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private retryAttempts = new Map<string, number>();
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    this.initializeNetworkListener();
    this.startPeriodicSync();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.syncInProgress) {
        this.syncOfflineData();
      }
      this.notifyListeners();
    });
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && !this.syncInProgress) {
        this.syncOfflineData();
      }
    }, 5 * 60 * 1000);
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      const queue = await offlineStorage.getOfflineQueue();
      const unsyncedItems = queue.filter(item => !item.synced);

      for (const item of unsyncedItems) {
        try {
          await this.syncItem(item);
          await offlineStorage.markAsSynced(item.id);
          this.retryAttempts.delete(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          this.handleSyncError(item);
        }
      }

      // Clean up synced items
      await offlineStorage.clearSyncedItems();
      
      // Update last sync time
      await offlineStorage.setUserPreference('lastSyncTime', new Date().toISOString());

    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async syncItem(item: OfflineData): Promise<void> {
    switch (item.type) {
      case 'booking':
        await this.syncBooking(item);
        break;
      case 'payment':
        await this.syncPayment(item);
        break;
      case 'location':
        await this.syncLocation(item);
        break;
      case 'user_action':
        await this.syncUserAction(item);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  private async syncBooking(item: OfflineData): Promise<void> {
    const { data } = item;
    
    if (data.action === 'create') {
      const { error } = await supabase
        .from('bookings')
        .insert(data.booking);
      
      if (error) throw error;
    } else if (data.action === 'update') {
      const { error } = await supabase
        .from('bookings')
        .update(data.updates)
        .eq('id', data.bookingId);
      
      if (error) throw error;
    } else if (data.action === 'cancel') {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', data.bookingId);
      
      if (error) throw error;
    }
  }

  private async syncPayment(item: OfflineData): Promise<void> {
    const { data } = item;
    
    // Sync payment data with backend
    const { error } = await supabase
      .from('transactions')
      .insert(data.transaction);
    
    if (error) throw error;
  }

  private async syncLocation(item: OfflineData): Promise<void> {
    const { data } = item;
    
    // Update user's location preferences or recent locations
    const { error } = await supabase
      .from('user_locations')
      .upsert(data.location);
    
    if (error) throw error;
  }

  private async syncUserAction(item: OfflineData): Promise<void> {
    const { data } = item;
    
    // Sync user actions like ratings, reviews, etc.
    if (data.action === 'rating') {
      const { error } = await supabase
        .from('ratings')
        .insert(data.rating);
      
      if (error) throw error;
    } else if (data.action === 'review') {
      const { error } = await supabase
        .from('reviews')
        .insert(data.review);
      
      if (error) throw error;
    }
  }

  private handleSyncError(item: OfflineData): void {
    const attempts = this.retryAttempts.get(item.id) || 0;
    
    if (attempts < this.MAX_RETRY_ATTEMPTS) {
      this.retryAttempts.set(item.id, attempts + 1);
    } else {
      // Mark as failed after max attempts
      console.error(`Item ${item.id} failed to sync after ${this.MAX_RETRY_ATTEMPTS} attempts`);
      // Could implement a failed items queue here
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const netInfo = await NetInfo.fetch();
    const queue = await offlineStorage.getOfflineQueue();
    const pendingItems = queue.filter(item => !item.synced).length;
    const failedItems = Array.from(this.retryAttempts.values())
      .filter(attempts => attempts >= this.MAX_RETRY_ATTEMPTS).length;
    
    const lastSyncTimeStr = await offlineStorage.getUserPreference<string>('lastSyncTime');
    const lastSyncTime = lastSyncTimeStr ? new Date(lastSyncTimeStr) : null;

    return {
      isOnline: netInfo.isConnected ?? false,
      isSyncing: this.syncInProgress,
      lastSyncTime,
      pendingItems,
      failedItems,
    };
  }

  addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  async forcSync(): Promise<void> {
    await this.syncOfflineData();
  }

  async clearFailedItems(): Promise<void> {
    const queue = await offlineStorage.getOfflineQueue();
    const validItems = queue.filter(item => {
      const attempts = this.retryAttempts.get(item.id) || 0;
      return attempts < this.MAX_RETRY_ATTEMPTS;
    });

    // Clear retry attempts for failed items
    for (const [itemId, attempts] of this.retryAttempts.entries()) {
      if (attempts >= this.MAX_RETRY_ATTEMPTS) {
        this.retryAttempts.delete(itemId);
      }
    }

    // Update queue without failed items
    await offlineStorage.clearAll();
    for (const item of validItems) {
      await offlineStorage.addToOfflineQueue({
        type: item.type,
        data: item.data,
      });
    }
  }
}

export const syncService = new SyncService();