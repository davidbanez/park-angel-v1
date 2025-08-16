import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@park-angel/shared/src/lib/supabase';
import { useAuth } from './useAuth';
import { useOffline } from './useOfflineSync';

interface POSMetrics {
  totalTransactions: number;
  totalRevenue: number;
  currentCash: number;
  activeSessions: number;
  violationReports: number;
  totalSpots: number;
  occupiedSpots: number;
  averageTransactionValue: number;
  hourlyRevenue: { hour: number; revenue: number }[];
}

export function usePOSMetrics() {
  const { user } = useAuth();
  const { isOnline } = useOffline();

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['pos-metrics', user?.id],
    queryFn: fetchPOSMetrics,
    enabled: !!user && isOnline,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  async function fetchPOSMetrics(): Promise<POSMetrics> {
    if (!user) throw new Error('User not authenticated');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch today's transactions
    const { data: transactions, error: transError } = await supabase
      .from('pos_transactions')
      .select('amount, created_at')
      .eq('operator_id', user.id)
      .gte('created_at', today.toISOString());

    if (transError) throw transError;

    // Fetch active parking sessions
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('parking_sessions')
      .select('id')
      .eq('operator_id', user.id)
      .eq('status', 'active');

    if (sessionsError) throw sessionsError;

    // Fetch violation reports
    const { data: violations, error: violationsError } = await supabase
      .from('violation_reports')
      .select('id')
      .eq('reported_by', user.id)
      .gte('created_at', today.toISOString());

    if (violationsError) throw violationsError;

    // Fetch parking spots data
    const { data: spots, error: spotsError } = await supabase
      .from('parking_spots')
      .select('id, status')
      .eq('operator_id', user.id);

    if (spotsError) throw spotsError;

    // Calculate metrics
    const totalTransactions = transactions?.length || 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const totalSpots = spots?.length || 0;
    const occupiedSpots = spots?.filter(s => s.status === 'occupied').length || 0;

    // Calculate hourly revenue
    const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => {
      const hourRevenue = transactions
        ?.filter(t => new Date(t.created_at).getHours() === hour)
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      return { hour, revenue: hourRevenue };
    });

    return {
      totalTransactions,
      totalRevenue,
      currentCash: totalRevenue, // Simplified - in real app, track cash separately
      activeSessions: activeSessions?.length || 0,
      violationReports: violations?.length || 0,
      totalSpots,
      occupiedSpots,
      averageTransactionValue,
      hourlyRevenue,
    };
  }

  return {
    metrics,
    isLoading,
    error,
    refetch,
  };
}