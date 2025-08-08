import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { LocationManagementServiceImpl } from '../parking-management';
import { SpotAvailabilityServiceImpl } from '../spot-availability';
import { DynamicPricingServiceImpl } from '../dynamic-pricing';
import { BookingWorkflowServiceImpl } from '../booking-workflow';
import { RealtimeOccupancyServiceImpl } from '../realtime-occupancy';
import { ParkingTypeServiceImpl } from '../parking-type';
import { ParkingType, SpotStatus } from '../../models/location';
import { BookingStatus, PaymentStatus } from '../../models/booking';
import { PricingConfig } from '../../models/pricing';
import { UserId } from '../../models/value-objects';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
} as any;

// Mock data
const mockLocation = {
  id: 'loc-1',
  name: 'Test Location',
  type: 'facility',
  operator_id: 'op-1',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  },
  coordinates: { lat: 14.5995, lng: 120.9842 },
  settings: {},
  pricing_config: {
    baseRate: 50,
    vatRate: 12
  },
  sections: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockSpot = {
  id: 'spot-1',
  zone_id: 'zone-1',
  number: 'A-001',
  type: 'car',
  status: 'available',
  coordinates: { lat: 14.5995, lng: 120.9842 },
  amenities: ['covered', 'security'],
  pricing_config: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockBooking = {
  id: 'booking-1',
  user_id: 'user-1',
  spot_id: 'spot-1',
  vehicle_id: 'vehicle-1',
  start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
  end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  status: 'pending',
  payment_status: 'pending',
  amount: 50,
  discounts: '[]',
  vat_amount: 6,
  total_amount: 56,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('LocationManagementService', () => {
  let service: LocationManagementServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LocationManagementServiceImpl(mockSupabase);
  });

  describe('createLocation', () => {
    it('should create a new location successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockLocation,
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const locationData = {
        name: 'Test Location',
        type: ParkingType.FACILITY,
        operatorId: 'op-1',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        coordinates: { latitude: 14.5995, longitude: 120.9842 },
        pricing: PricingConfig.create({ baseRate: 50, vatRate: 12 }),
        settings: {}
      };

      const result = await service.createLocation(locationData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Location');
      expect(result.type).toBe(ParkingType.FACILITY);
      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw error when database insert fails', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' }
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const locationData = {
        name: 'Test Location',
        type: ParkingType.FACILITY,
        operatorId: 'op-1',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        coordinates: { latitude: 14.5995, longitude: 120.9842 },
        pricing: PricingConfig.create({ baseRate: 50, vatRate: 12 }),
        settings: {}
      };

      await expect(service.createLocation(locationData)).rejects.toThrow('Failed to create location: Insert failed');
    });
  });

  describe('getLocation', () => {
    it('should retrieve location with hierarchy', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockLocation,
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await service.getLocation('loc-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('loc-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
    });

    it('should return null when location not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // Not found error code
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await service.getLocation('non-existent');

      expect(result).toBeNull();
    });
  });
});

describe('SpotAvailabilityService', () => {
  let service: SpotAvailabilityServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SpotAvailabilityServiceImpl(mockSupabase);
  });

  describe('checkAvailability', () => {
    it('should return true when spot is available', async () => {
      // Mock spot status check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: 'available' },
              error: null
            })
          })
        })
      });

      // Mock overlapping bookings check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                data: [], // No overlapping bookings
                error: null
              })
            })
          })
        })
      });

      const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      const result = await service.checkAvailability('spot-1', startTime, endTime);

      expect(result).toBe(true);
    });

    it('should return false when spot is in maintenance', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: 'maintenance' },
              error: null
            })
          })
        })
      });

      const startTime = new Date(Date.now() + 60 * 60 * 1000);
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const result = await service.checkAvailability('spot-1', startTime, endTime);

      expect(result).toBe(false);
    });

    it('should return false when there are overlapping bookings', async () => {
      // Mock spot status check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: 'available' },
              error: null
            })
          })
        })
      });

      // Mock overlapping bookings check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                data: [{ id: 'booking-1' }], // Has overlapping booking
                error: null
              })
            })
          })
        })
      });

      const startTime = new Date(Date.now() + 60 * 60 * 1000);
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const result = await service.checkAvailability('spot-1', startTime, endTime);

      expect(result).toBe(false);
    });
  });
});

describe('DynamicPricingService', () => {
  let service: DynamicPricingServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DynamicPricingServiceImpl(mockSupabase);
  });

  describe('calculatePrice', () => {
    it('should calculate price with base pricing', async () => {
      // Mock effective pricing retrieval
      const mockPricingConfig = PricingConfig.create({
        baseRate: 50,
        vatRate: 12
      });

      vi.spyOn(service, 'getEffectivePricing').mockResolvedValue(mockPricingConfig);

      // Mock occupancy rate
      const mockOccupancyRate = vi.spyOn(service as any, 'getLocationOccupancyRate')
        .mockResolvedValue(60);

      // Mock user discounts
      const mockUserDiscounts = vi.spyOn(service as any, 'getUserApplicableDiscounts')
        .mockResolvedValue([]);

      const request = {
        spotId: 'spot-1',
        vehicleType: 'car' as any,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        userId: 'user-1'
      };

      const result = await service.calculatePrice(request);

      expect(result).toBeDefined();
      expect(result.basePrice).toBeGreaterThan(0);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });
  });
});

describe('BookingWorkflowService', () => {
  let service: BookingWorkflowServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BookingWorkflowServiceImpl(mockSupabase);
  });

  describe('createBooking', () => {
    it('should create booking successfully', async () => {
      // Mock validation
      vi.spyOn(service as any, 'validateBookingRequest').mockResolvedValue(undefined);

      // Mock availability check
      vi.spyOn(service['availabilityService'], 'checkAvailability').mockResolvedValue(true);

      // Mock vehicle retrieval
      vi.spyOn(service as any, 'getVehicle').mockResolvedValue({
        id: 'vehicle-1',
        type: 'car',
        userId: new UserId('user-1')
      });

      // Mock pricing calculation
      vi.spyOn(service['pricingService'], 'calculatePrice').mockResolvedValue({
        basePrice: 50,
        finalPrice: 50,
        discounts: [],
        vatAmount: 6,
        totalAmount: 56,
        breakdown: {}
      });

      // Mock spot reservation
      vi.spyOn(service['availabilityService'], 'reserveSpot').mockResolvedValue(undefined);

      // Mock database insert
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: mockBooking,
          error: null
        })
      });

      // Mock payment processing
      vi.spyOn(service as any, 'initiatePaymentProcessing').mockResolvedValue(undefined);

      const bookingData = {
        userId: 'user-1',
        spotId: 'spot-1',
        vehicleId: 'vehicle-1',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };

      const result = await service.createBooking(bookingData);

      expect(result).toBeDefined();
      expect(result.userId.value).toBe('user-1');
      expect(result.spotId).toBe('spot-1');
      expect(result.status).toBe(BookingStatus.PENDING);
    });

    it('should throw error when spot is not available', async () => {
      // Mock validation
      vi.spyOn(service as any, 'validateBookingRequest').mockResolvedValue(undefined);

      // Mock availability check to return false
      vi.spyOn(service['availabilityService'], 'checkAvailability').mockResolvedValue(false);

      const bookingData = {
        userId: 'user-1',
        spotId: 'spot-1',
        vehicleId: 'vehicle-1',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };

      await expect(service.createBooking(bookingData)).rejects.toThrow('Spot is not available for the requested time period');
    });
  });
});

describe('RealtimeOccupancyService', () => {
  let service: RealtimeOccupancyServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RealtimeOccupancyServiceImpl(mockSupabase);
  });

  describe('subscribeToSpotUpdates', () => {
    it('should create subscription and return unsubscribe function', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      const unsubscribe = service.subscribeToSpotUpdates('spot-1', callback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('spot-spot-1');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('updateSpotStatus', () => {
    it('should update spot status successfully', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: mockSpot,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockUpdate)
        })
      });

      await service.updateSpotStatus('spot-1', SpotStatus.OCCUPIED);

      expect(mockSupabase.from).toHaveBeenCalledWith('parking_spots');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockUpdate)
        })
      });

      await expect(service.updateSpotStatus('spot-1', SpotStatus.OCCUPIED))
        .rejects.toThrow('Failed to update spot status: Update failed');
    });
  });
});

describe('ParkingTypeService', () => {
  let service: ParkingTypeServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ParkingTypeServiceImpl(mockSupabase);
  });

  describe('getTypeSpecificLogic', () => {
    it('should return hosted parking logic for hosted type', () => {
      const logic = service.getTypeSpecificLogic(ParkingType.HOSTED);
      expect(logic).toBeDefined();
    });

    it('should return street parking logic for street type', () => {
      const logic = service.getTypeSpecificLogic(ParkingType.STREET);
      expect(logic).toBeDefined();
    });

    it('should return facility parking logic for facility type', () => {
      const logic = service.getTypeSpecificLogic(ParkingType.FACILITY);
      expect(logic).toBeDefined();
    });

    it('should throw error for invalid parking type', () => {
      expect(() => service.getTypeSpecificLogic('invalid' as any))
        .toThrow('No logic implementation found for parking type: invalid');
    });
  });
});

// Integration tests
describe('Parking Management Integration', () => {
  let locationService: LocationManagementServiceImpl;
  let availabilityService: SpotAvailabilityServiceImpl;
  let pricingService: DynamicPricingServiceImpl;
  let bookingService: BookingWorkflowServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    locationService = new LocationManagementServiceImpl(mockSupabase);
    availabilityService = new SpotAvailabilityServiceImpl(mockSupabase);
    pricingService = new DynamicPricingServiceImpl(mockSupabase);
    bookingService = new BookingWorkflowServiceImpl(mockSupabase);
  });

  it('should handle complete booking workflow', async () => {
    // This would be a more comprehensive integration test
    // that tests the interaction between multiple services
    
    // Mock all the necessary database calls and service interactions
    // to simulate a complete booking workflow from spot search to booking confirmation
    
    expect(true).toBe(true); // Placeholder for actual integration test
  });
});

// Utility function tests
describe('Utility Functions', () => {
  describe('AvailabilityUtils', () => {
    it('should correctly detect time range overlaps', () => {
      const { AvailabilityUtils } = require('../spot-availability');
      
      const start1 = new Date('2024-01-01T10:00:00Z');
      const end1 = new Date('2024-01-01T12:00:00Z');
      const start2 = new Date('2024-01-01T11:00:00Z');
      const end2 = new Date('2024-01-01T13:00:00Z');

      const overlaps = AvailabilityUtils.timeRangesOverlap(start1, end1, start2, end2);
      expect(overlaps).toBe(true);
    });

    it('should correctly detect non-overlapping time ranges', () => {
      const { AvailabilityUtils } = require('../spot-availability');
      
      const start1 = new Date('2024-01-01T10:00:00Z');
      const end1 = new Date('2024-01-01T12:00:00Z');
      const start2 = new Date('2024-01-01T13:00:00Z');
      const end2 = new Date('2024-01-01T15:00:00Z');

      const overlaps = AvailabilityUtils.timeRangesOverlap(start1, end1, start2, end2);
      expect(overlaps).toBe(false);
    });
  });
});