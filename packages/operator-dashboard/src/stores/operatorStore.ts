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
  occupiedSpots: number;
  occupancyRate: number;
  averageSessionDuration: number;
  customerSatisfaction: number;
  revenueGrowth: number;
  bookingGrowth: number;
  occupancyGrowth: number;
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

  fetchMetrics: async (timeRange: string = 'week') => {
    set({ isLoading: true, error: null });
    
    try {
      const { operatorData } = get();
      
      if (!operatorData) {
        throw new Error('No operator data available');
      }

      // Simulate API call with time range consideration
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate metrics based on time range
      const baseMetrics = {
        day: { revenue: 1250.75, bookings: 28, growth: 5.2 },
        week: { revenue: 8420.50, bookings: 189, growth: 12.5 },
        month: { revenue: 35420.50, bookings: 742, growth: 18.3 },
        year: { revenue: 425000.00, bookings: 8950, growth: 22.1 },
      };

      const currentMetrics = baseMetrics[timeRange as keyof typeof baseMetrics] || baseMetrics.week;

      const mockMetrics: OperatorMetrics = {
        totalRevenue: currentMetrics.revenue,
        totalBookings: currentMetrics.bookings,
        activeSpots: 45,
        occupiedSpots: 35,
        occupancyRate: 0.78,
        averageSessionDuration: 2.5,
        customerSatisfaction: 4.6,
        revenueGrowth: currentMetrics.growth,
        bookingGrowth: currentMetrics.growth * 0.8,
        occupancyGrowth: currentMetrics.growth * 0.6,
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