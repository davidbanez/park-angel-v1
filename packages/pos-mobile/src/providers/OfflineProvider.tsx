import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@park-angel/shared/src/lib/supabase';

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  syncPendingData: () => Promise<void>;
  addPendingSync: (data: any, type: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      
      // Auto-sync when coming back online
      if (state.isConnected && pendingSyncCount > 0) {
        syncPendingData();
      }
    });

    // Load pending sync count
    loadPendingSyncCount();

    return unsubscribe;
  }, []);

  const loadPendingSyncCount = async () => {
    try {
      const pendingData = await AsyncStorage.getItem('pending_sync');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        setPendingSyncCount(data.length);
      }
    } catch (error) {
      console.error('Error loading pending sync count:', error);
    }
  };

  const addPendingSync = async (data: any, type: string) => {
    try {
      const pendingData = await AsyncStorage.getItem('pending_sync');
      const pending = pendingData ? JSON.parse(pendingData) : [];
      
      pending.push({
        id: `${type}_${Date.now()}`,
        type,
        data,
        timestamp: new Date().toISOString(),
      });

      await AsyncStorage.setItem('pending_sync', JSON.stringify(pending));
      setPendingSyncCount(pending.length);
    } catch (error) {
      console.error('Error adding pending sync:', error);
    }
  };

  const syncPendingData = async () => {
    if (!isOnline) return;

    try {
      const pendingData = await AsyncStorage.getItem('pending_sync');
      if (!pendingData) return;

      const pending = JSON.parse(pendingData);
      const synced = [];

      for (const item of pending) {
        try {
          await syncItem(item);
          synced.push(item.id);
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
        }
      }

      // Remove synced items
      const remaining = pending.filter((item: any) => !synced.includes(item.id));
      await AsyncStorage.setItem('pending_sync', JSON.stringify(remaining));
      setPendingSyncCount(remaining.length);
    } catch (error) {
      console.error('Error syncing pending data:', error);
    }
  };

  const syncItem = async (item: any) => {
    switch (item.type) {
      case 'transaction':
        await supabase.from('pos_transactions').insert(item.data);
        break;
      case 'session':
        await supabase.from('pos_sessions').insert(item.data);
        break;
      case 'violation_report':
        await supabase.from('violation_reports').insert(item.data);
        break;
      case 'parking_session':
        await supabase.from('parking_sessions').insert(item.data);
        break;
      default:
        console.warn(`Unknown sync type: ${item.type}`);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingSyncCount,
        syncPendingData,
        addPendingSync,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}