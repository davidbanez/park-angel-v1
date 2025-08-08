// Export existing services
export * from './auth';
export * from './authorization';
export * from './session';
export * from './storage';
export * from './realtime';
export * from './account-verification';

// Export new parking management services
export * from './parking-management';
export * from './spot-availability';
export * from './dynamic-pricing';
export * from './booking-workflow';
export * from './realtime-occupancy';
export * from './parking-type';

// Service factory for creating service instances
import { createClient } from '@supabase/supabase-js';
import { LocationManagementServiceImpl } from './parking-management';
import { SpotAvailabilityServiceImpl } from './spot-availability';
import { DynamicPricingServiceImpl } from './dynamic-pricing';
import { BookingWorkflowServiceImpl } from './booking-workflow';
import { RealtimeOccupancyServiceImpl } from './realtime-occupancy';
import { ParkingTypeServiceImpl } from './parking-type';

export class ParkingServiceFactory {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  createLocationManagementService(): LocationManagementServiceImpl {
    return new LocationManagementServiceImpl(this.supabase);
  }

  createSpotAvailabilityService(): SpotAvailabilityServiceImpl {
    return new SpotAvailabilityServiceImpl(this.supabase);
  }

  createDynamicPricingService(): DynamicPricingServiceImpl {
    return new DynamicPricingServiceImpl(this.supabase);
  }

  createBookingWorkflowService(): BookingWorkflowServiceImpl {
    return new BookingWorkflowServiceImpl(this.supabase);
  }

  createRealtimeOccupancyService(): RealtimeOccupancyServiceImpl {
    return new RealtimeOccupancyServiceImpl(this.supabase);
  }

  createParkingTypeService(): ParkingTypeServiceImpl {
    return new ParkingTypeServiceImpl(this.supabase);
  }

  // Create all services at once
  createAllServices() {
    return {
      locationManagement: this.createLocationManagementService(),
      spotAvailability: this.createSpotAvailabilityService(),
      dynamicPricing: this.createDynamicPricingService(),
      bookingWorkflow: this.createBookingWorkflowService(),
      realtimeOccupancy: this.createRealtimeOccupancyService(),
      parkingType: this.createParkingTypeService()
    };
  }
}

// Convenience function to create service factory
export function createParkingServices(supabase: ReturnType<typeof createClient>) {
  return new ParkingServiceFactory(supabase);
}