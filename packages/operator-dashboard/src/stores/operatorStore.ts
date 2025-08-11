import { create } from 'zustand';
import { supabase } from '@shared/lib/supabase';

interface OperatorData {
  id: string;
  name: string;
  email: string;
  company_name: string;
  phone: string;
  address: string;
  tin: string;
  bank_account: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

interface OperatorMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeSpots: number;
  occupancyRate: number;
  averageSessionDuration: number;
  customerSatisfaction: number;
}

interface OperatorState {
  operatorData: OperatorData | null;
  metrics: OperatorMetrics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOperatorData: () => Promise<void>;
  updateOperatorData: (data: Partial<OperatorData>) => Promise<void>;
  fetchMetrics: (timeRange?: string) => Promise<void>;
  clearError: () => void;
}

export const useOperatorStore = create<OperatorState>((set, get) => ({
  operatorData: null,
  metrics: null,
  isLoading: false,
  error: null,

  fetchOperatorData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      set({
        operatorData: data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch operator data',
        isLoading: false,
      });
    }
  },

  updateOperatorData: async (updateData: Partial<OperatorData>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { operatorData } = get();
      
      if (!operatorData) {
        throw new Error('No operator data to update');
      }

      const { data, error } = await supabase
        .from('operators')
        .update(updateData)
        .eq('id', operatorData.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      set({
        operatorData: data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update operator data',
        isLoading: false,
      });
    }
  },

  fetchMetrics: async (_timeRange = '7d') => {
    set({ isLoading: true, error: null });
    
    try {
      const { operatorData } = get();
      
      if (!operatorData) {
        throw new Error('No operator data available');
      }

      // This would typically call a stored procedure or complex query
      // For now, we'll simulate the metrics
      const mockMetrics: OperatorMetrics = {
        totalRevenue: 15420.50,
        totalBookings: 342,
        activeSpots: 45,
        occupancyRate: 0.78,
        averageSessionDuration: 2.5,
        customerSatisfaction: 4.6,
      };

      set({
        metrics: mockMetrics,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));