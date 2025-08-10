import { useEffect, useRef } from 'react';
import { DashboardService } from '../services/dashboardService';

interface PerformanceEntry {
  feature: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export const usePerformanceMonitoring = () => {
  const performanceEntries = useRef<Map<string, PerformanceEntry>>(new Map());

  const startTracking = (feature: string): string => {
    const trackingId = `${feature}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    performanceEntries.current.set(trackingId, {
      feature,
      startTime: performance.now(),
    });
    return trackingId;
  };

  const endTracking = async (trackingId: string): Promise<void> => {
    const entry = performanceEntries.current.get(trackingId);
    if (!entry) return;

    const endTime = performance.now();
    const duration = endTime - entry.startTime;

    entry.endTime = endTime;
    entry.duration = duration;

    // Log performance metric (in a real implementation, this would send to a monitoring service)
    console.log(`Performance: ${entry.feature} took ${duration.toFixed(2)}ms`);

    // Clean up
    performanceEntries.current.delete(trackingId);

    // Report to backend if duration is significant
    if (duration > 1000) { // Report if over 1 second
      try {
        // In a real implementation, you would have a method to report performance metrics
        console.warn(`Slow performance detected: ${entry.feature} took ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.error('Error reporting performance metric:', error);
      }
    }
  };

  const trackAsyncOperation = async <T>(
    feature: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const trackingId = startTracking(feature);
    try {
      const result = await operation();
      await endTracking(trackingId);
      return result;
    } catch (error) {
      await endTracking(trackingId);
      throw error;
    }
  };

  // Clean up any remaining entries on unmount
  useEffect(() => {
    return () => {
      performanceEntries.current.clear();
    };
  }, []);

  return {
    startTracking,
    endTracking,
    trackAsyncOperation,
  };
};