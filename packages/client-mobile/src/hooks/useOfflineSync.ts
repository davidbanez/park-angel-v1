import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '../services/syncService';
import { offlineStorage } from '../services/offlineStorage';

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSyncTime: null,
    pendingItems: 0,
    failedItems: 0,
  });

  useEffect(() => {
    // Get initial status
    syncService.getSyncStatus().then(setSyncStatus);

    // Subscribe to status updates
    const unsubscribe = syncService.addSyncListener(setSyncStatus);

    return unsubscribe;
  }, []);

  const addToOfflineQueue = async (
    type: 'booking' | 'payment' | 'location' | 'user_action',
    data: any
  ) => {
    return await offlineStorage.addToOfflineQueue({ type, data });
  };

  const forceSync = async () => {
    await syncService.forcSync();
  };

  const clearFailedItems = async () => {
    await syncService.clearFailedItems();
  };

  return {
    syncStatus,
    addToOfflineQueue,
    forceSync,
    clearFailedItems,
  };
}