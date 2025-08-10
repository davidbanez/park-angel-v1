import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '../services/dashboardService';
import { RealtimeUpdate } from '../types/dashboard';

interface UseRealtimeDataOptions {
  refreshInterval?: number; // in seconds
  enableRealtime?: boolean;
}

export const useRealtimeData = <T>(
  fetchData: () => Promise<T>,
  dashboardService: DashboardService,
  options: UseRealtimeDataOptions = {}
) => {
  const { refreshInterval = 30, enableRealtime = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchData();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const handleRealtimeUpdate = useCallback((update: RealtimeUpdate) => {
    // Trigger data refresh when relevant updates are received
    if (update.type === 'metrics' || update.type === 'system_health') {
      loadData();
    }
  }, [loadData]);

  useEffect(() => {
    // Initial load
    loadData();

    // Set up periodic refresh
    const interval = setInterval(loadData, refreshInterval * 1000);

    // Set up real-time subscriptions
    let unsubscribe: (() => void) | undefined;
    if (enableRealtime) {
      unsubscribe = dashboardService.subscribeToRealtimeUpdates(handleRealtimeUpdate);
    }

    return () => {
      clearInterval(interval);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadData, refreshInterval, enableRealtime, dashboardService, handleRealtimeUpdate]);

  const refresh = useCallback(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};