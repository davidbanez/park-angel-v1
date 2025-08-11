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
export * from './hierarchical-pricing';
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

// Export financial reporting and remittance services
export * from './financial-reporting';
export * from './automated-remittance';
export * from './commission-system';
export * from './transaction-reconciliation';

// Export operator management services
export * from './operator-management';

// Export advertisement management services
export * from './advertisement-management';

// Export API management services
export * from './api-management';

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
import { FinancialReportingServiceImpl } from './financial-reporting';
import { AutomatedRemittanceServiceImpl } from './automated-remittance';
import { CommissionSystemServiceImpl } from './commission-system';
import { TransactionReconciliationServiceImpl } from './transaction-reconciliation';
import { OperatorManagementServiceImpl } from './operator-management';

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

  createFinancialReportingService(): FinancialReportingServiceImpl {
    const revenueShareService = this.createRevenueShareService();
    const payoutService = this.createPayoutService();
    return new FinancialReportingServiceImpl(this.supabase, revenueShareService, payoutService);
  }

  createAutomatedRemittanceService(): AutomatedRemittanceServiceImpl {
    const revenueShareService = this.createRevenueShareService();
    const payoutService = this.createPayoutService();
    const financialReportingService = this.createFinancialReportingService();
    return new AutomatedRemittanceServiceImpl(this.supabase, revenueShareService, payoutService, financialReportingService);
  }

  createCommissionSystemService(): CommissionSystemServiceImpl {
    const financialReportingService = this.createFinancialReportingService();
    return new CommissionSystemServiceImpl(this.supabase, financialReportingService);
  }

  createTransactionReconciliationService(): TransactionReconciliationServiceImpl {
    const financialReportingService = this.createFinancialReportingService();
    return new TransactionReconciliationServiceImpl(this.supabase, financialReportingService);
  }

  createOperatorManagementService(): OperatorManagementServiceImpl {
    return new OperatorManagementServiceImpl(this.supabase);
  }

  // Create all services at once
  createAllServices() {
    const revenueShareService = this.createRevenueShareService();
    const payoutService = new PayoutServiceImpl(this.supabase, revenueShareService);
    const financialReportingService = new FinancialReportingServiceImpl(this.supabase, revenueShareService, payoutService);
    
    return {
      locationManagement: this.createLocationManagementService(),
      spotAvailability: this.createSpotAvailabilityService(),
      dynamicPricing: this.createDynamicPricingService(),
      bookingWorkflow: this.createBookingWorkflowService(),
      realtimeOccupancy: this.createRealtimeOccupancyService(),
      parkingType: this.createParkingTypeService(),
      paymentProcessing: this.createPaymentProcessingService(),
      revenueShare: revenueShareService,
      payout: payoutService,
      discountVATManagement: this.createDiscountVATManagementService(),
      discountReporting: this.createDiscountReportingService(),
      financialReporting: financialReportingService,
      automatedRemittance: new AutomatedRemittanceServiceImpl(this.supabase, revenueShareService, payoutService, financialReportingService),
      commissionSystem: new CommissionSystemServiceImpl(this.supabase, financialReportingService),
      transactionReconciliation: new TransactionReconciliationServiceImpl(this.supabase, financialReportingService),
      operatorManagement: this.createOperatorManagementService()
    };
  }
}

// Convenience function to create service factory
export function createParkingServices(supabase: ReturnType<typeof createClient>) {
  return new ParkingServiceFactory(supabase);
}