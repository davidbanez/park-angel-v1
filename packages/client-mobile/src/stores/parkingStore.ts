import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'hosted' | 'street' | 'facility';
  status: 'available' | 'occupied' | 'reserved';
  pricing: {
    hourlyRate: number;
    currency: string;
  };
  amenities: string[];
}

interface ActiveBooking {
  id: string;
  spotId: string;
  spotName: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'completed' | 'cancelled';
  amount: number;
}

interface ParkingState {
  // Current location
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  
  // Parking spots
  nearbySpots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  
  // Bookings
  activeBooking: ActiveBooking | null;
  bookingHistory: ActiveBooking[];
  
  // Search & filters
  searchQuery: string;
  filters: {
    type: ('hosted' | 'street' | 'facility')[];
    maxPrice: number;
    amenities: string[];
  };
  
  // Actions
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  setNearbySpots: (spots: ParkingSpot[]) => void;
  setSelectedSpot: (spot: ParkingSpot | null) => void;
  setActiveBooking: (booking: ActiveBooking | null) => void;
  addToBookingHistory: (booking: ActiveBooking) => void;
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<ParkingState['filters']>) => void;
  clearFilters: () => void;
}

const defaultFilters = {
  type: ['hosted', 'street', 'facility'] as ('hosted' | 'street' | 'facility')[],
  maxPrice: 1000,
  amenities: [],
};

export const useParkingStore = create<ParkingState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      nearbySpots: [],
      selectedSpot: null,
      activeBooking: null,
      bookingHistory: [],
      searchQuery: '',
      filters: defaultFilters,

      setCurrentLocation: (location) => set({ currentLocation: location }),

      setNearbySpots: (spots) => set({ nearbySpots: spots }),

      setSelectedSpot: (spot) => set({ selectedSpot: spot }),

      setActiveBooking: (booking) => set({ activeBooking: booking }),

      addToBookingHistory: (booking) => set((state) => ({
        bookingHistory: [booking, ...state.bookingHistory].slice(0, 50) // Keep last 50
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      updateFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      clearFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'parking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeBooking: state.activeBooking,
        bookingHistory: state.bookingHistory,
        filters: state.filters,
      }),
    }
  )
);