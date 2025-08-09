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

// Export payment processing services
export * from './payment-processing';
export * from './revenue-sharing';
export * from './payout-processing';

// Export discount and VAT management services
export * from './discount-vat-management';
export * from './discount-rule-engine';
export * from './discount-reporting';

// Service factory for creating service instances
import { createClient } from '@supabase/supabase-js';
import { LocationManagementServiceImpl } from './parking-management';
import { SpotAvailabilityServiceImpl } from './spot-availability';
import { DynamicPricingServiceImpl } from './dynamic-pricing';
import { BookingWorkflowServiceImpl } from './booking-workflow';
import { RealtimeOccupancyServiceImpl } from './realtime-occupancy';
import { ParkingTypeServiceImpl } from './parking-type';
import { PaymentProcessingServiceImpl } from './payment-processing';
import { RevenueShareServiceImpl } from './revenue-sharing';
import { PayoutServiceImpl } from './payout-processing';
import { DiscountVATManagementService } from './discount-vat-management';
import { DiscountReportingService } from './discount-reporting';

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

  createPaymentProcessingService(): PaymentProcessingServiceImpl {
    return new PaymentProcessingServiceImpl(this.supabase);
  }

  createRevenueShareService(): RevenueShareServiceImpl {
    return new RevenueShareServiceImpl(this.supabase);
  }

  createPayoutService(): PayoutServiceImpl {
    const revenueShareService = this.createRevenueShareService();
    return new PayoutServiceImpl(this.supabase, revenueShareService);
  }

  createDiscountVATManagementService(): DiscountVATManagementService {
    return new DiscountVATManagementService(this.supabase);
  }

  createDiscountReportingService(): DiscountReportingService {
    return new DiscountReportingService(this.supabase);
  }

  // Create all services at once
  createAllServices() {
    const revenueShareService = this.createRevenueShareService();
    
    return {
      locationManagement: this.createLocationManagementService(),
      spotAvailability: this.createSpotAvailabilityService(),
      dynamicPricing: this.createDynamicPricingService(),
      bookingWorkflow: this.createBookingWorkflowService(),
      realtimeOccupancy: this.createRealtimeOccupancyService(),
      parkingType: this.createParkingTypeService(),
      paymentProcessing: this.createPaymentProcessingService(),
      revenueShare: revenueShareService,
      payout: new PayoutServiceImpl(this.supabase, revenueShareService),
      discountVATManagement: this.createDiscountVATManagementService(),
      discountReporting: this.createDiscountReportingService()
    };
  }
}

// Convenience function to create service factory
export function createParkingServices(supabase: ReturnType<typeof createClient>) {
  return new ParkingServiceFactory(supabase);
}