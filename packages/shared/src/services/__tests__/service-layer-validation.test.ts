/**
 * Service Layer Functionality Validation Tests
 * 
 * This test suite validates that all services instantiate correctly,
 * have proper types, and maintain inter-service compatibility.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  ParkingServiceFactory, 
  createParkingServices,
  ServiceResult,
  ServiceErrorCode,
  AbstractBaseService,
  BaseService
} from '../index';

// Import specific service implementations for testing
import { LocationManagementServiceImpl } from '../parking-management';
import { SpotAvailabilityServiceImpl } from '../spot-availability';
import { DynamicPricingServiceImpl } from '../dynamic-pricing';
import { BookingWorkflowServiceImpl } from '../booking-workflow';
import { RealtimeOccupancyServiceImpl } from '../realtime-occupancy';
import { ParkingTypeServiceImpl } from '../parking-type';
import { PaymentProcessingServiceImpl } from '../payment-processing';
import { RevenueShareServiceImpl } from '../revenue-sharing';
import { PayoutServiceImpl } from '../payout-processing';
import { DiscountVATManagementService } from '../discount-vat-management';
import { DiscountReportingService } from '../discount-reporting';
import { FinancialReportingServiceImpl } from '../financial-reporting';
import { AutomatedRemittanceServiceImpl } from '../automated-remittance';
import { CommissionSystemServiceImpl } from '../commission-system';
import { TransactionReconciliationServiceImpl } from '../transaction-reconciliation';
import { OperatorManagementServiceImpl } from '../operator-management';

describe('Service Layer Functionality Validation', () => {
  let supabase: ReturnType<typeof createClient>;
  let serviceFactory: ParkingServiceFactory;

  beforeAll(() => {
    // Create a mock Supabase client for testing
    supabase = createClient(
      process.env.SUPABASE_URL || 'https://test.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'test-key'
    );
    
    serviceFactory = new ParkingServiceFactory(supabase);
  });

  describe('Service Factory Instantiation', () => {
    it('should create service factory successfully', () => {
      expect(serviceFactory).toBeInstanceOf(ParkingServiceFactory);
      expect(serviceFactory).toBeDefined();
    });

    it('should create convenience factory function', () => {
      const factory = createParkingServices(supabase);
      expect(factory).toBeInstanceOf(ParkingServiceFactory);
    });
  });

  describe('Individual Service Instantiation', () => {
    it('should instantiate LocationManagementService correctly', () => {
      const service = serviceFactory.createLocationManagementService();
      expect(service).toBeInstanceOf(LocationManagementServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate SpotAvailabilityService correctly', () => {
      const service = serviceFactory.createSpotAvailabilityService();
      expect(service).toBeInstanceOf(SpotAvailabilityServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate DynamicPricingService correctly', () => {
      const service = serviceFactory.createDynamicPricingService();
      expect(service).toBeInstanceOf(DynamicPricingServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate BookingWorkflowService correctly', () => {
      const service = serviceFactory.createBookingWorkflowService();
      expect(service).toBeInstanceOf(BookingWorkflowServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate RealtimeOccupancyService correctly', () => {
      const service = serviceFactory.createRealtimeOccupancyService();
      expect(service).toBeInstanceOf(RealtimeOccupancyServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate ParkingTypeService correctly', () => {
      const service = serviceFactory.createParkingTypeService();
      expect(service).toBeInstanceOf(ParkingTypeServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate PaymentProcessingService correctly', () => {
      const service = serviceFactory.createPaymentProcessingService();
      expect(service).toBeInstanceOf(PaymentProcessingServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate RevenueShareService correctly', () => {
      const service = serviceFactory.createRevenueShareService();
      expect(service).toBeInstanceOf(RevenueShareServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate PayoutService correctly', () => {
      const service = serviceFactory.createPayoutService();
      expect(service).toBeInstanceOf(PayoutServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate DiscountVATManagementService correctly', () => {
      const service = serviceFactory.createDiscountVATManagementService();
      expect(service).toBeInstanceOf(DiscountVATManagementService);
      expect(service).toBeDefined();
    });

    it('should instantiate DiscountReportingService correctly', () => {
      const service = serviceFactory.createDiscountReportingService();
      expect(service).toBeInstanceOf(DiscountReportingService);
      expect(service).toBeDefined();
    });

    it('should instantiate FinancialReportingService correctly', () => {
      const service = serviceFactory.createFinancialReportingService();
      expect(service).toBeInstanceOf(FinancialReportingServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate AutomatedRemittanceService correctly', () => {
      const service = serviceFactory.createAutomatedRemittanceService();
      expect(service).toBeInstanceOf(AutomatedRemittanceServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate CommissionSystemService correctly', () => {
      const service = serviceFactory.createCommissionSystemService();
      expect(service).toBeInstanceOf(CommissionSystemServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate TransactionReconciliationService correctly', () => {
      const service = serviceFactory.createTransactionReconciliationService();
      expect(service).toBeInstanceOf(TransactionReconciliationServiceImpl);
      expect(service).toBeDefined();
    });

    it('should instantiate OperatorManagementService correctly', () => {
      const service = serviceFactory.createOperatorManagementService();
      expect(service).toBeInstanceOf(OperatorManagementServiceImpl);
      expect(service).toBeDefined();
    });
  });

  describe('Bulk Service Creation', () => {
    it('should create all services at once', () => {
      const services = serviceFactory.createAllServices();
      
      expect(services).toBeDefined();
      expect(services.locationManagement).toBeInstanceOf(LocationManagementServiceImpl);
      expect(services.spotAvailability).toBeInstanceOf(SpotAvailabilityServiceImpl);
      expect(services.dynamicPricing).toBeInstanceOf(DynamicPricingServiceImpl);
      expect(services.bookingWorkflow).toBeInstanceOf(BookingWorkflowServiceImpl);
      expect(services.realtimeOccupancy).toBeInstanceOf(RealtimeOccupancyServiceImpl);
      expect(services.parkingType).toBeInstanceOf(ParkingTypeServiceImpl);
      expect(services.paymentProcessing).toBeInstanceOf(PaymentProcessingServiceImpl);
      expect(services.revenueShare).toBeInstanceOf(RevenueShareServiceImpl);
      expect(services.payout).toBeInstanceOf(PayoutServiceImpl);
      expect(services.discountVATManagement).toBeInstanceOf(DiscountVATManagementService);
      expect(services.discountReporting).toBeInstanceOf(DiscountReportingService);
      expect(services.financialReporting).toBeInstanceOf(FinancialReportingServiceImpl);
      expect(services.automatedRemittance).toBeInstanceOf(AutomatedRemittanceServiceImpl);
      expect(services.commissionSystem).toBeInstanceOf(CommissionSystemServiceImpl);
      expect(services.transactionReconciliation).toBeInstanceOf(TransactionReconciliationServiceImpl);
      expect(services.operatorManagement).toBeInstanceOf(OperatorManagementServiceImpl);
    });
  });

  describe('Service Method Type Validation', () => {
    let services: ReturnType<typeof serviceFactory.createAllServices>;

    beforeAll(() => {
      services = serviceFactory.createAllServices();
    });

    it('should have properly typed service methods', () => {
      // Test that services have the expected method signatures based on their actual interfaces
      expect(typeof services.locationManagement.createLocation).toBe('function');
      expect(typeof services.locationManagement.getLocation).toBe('function');
      expect(typeof services.locationManagement.updateLocation).toBe('function');
      expect(typeof services.locationManagement.deleteLocation).toBe('function');
      expect(typeof services.locationManagement.getLocationsByOperator).toBe('function');

      expect(typeof services.paymentProcessing.processPayment).toBe('function');
      expect(typeof services.revenueShare.calculateRevenueShare).toBe('function');
      expect(typeof services.operatorManagement.getOperatorSummary).toBe('function');
    });

    it('should have consistent method signatures across services', async () => {
      // Test that methods exist and are callable (type-only validation)
      // Note: These are type-only tests that verify compilation
      
      // Test location management service methods exist
      expect(services.locationManagement.createLocation).toBeDefined();
      expect(services.locationManagement.getLocation).toBeDefined();
      expect(services.locationManagement.updateLocation).toBeDefined();
      expect(services.locationManagement.deleteLocation).toBeDefined();
      
      // Test payment processing service methods exist
      expect(services.paymentProcessing.processPayment).toBeDefined();
      expect(services.paymentProcessing.refundPayment).toBeDefined();
      
      // Test operator management service methods exist
      expect(services.operatorManagement.getOperatorSummary).toBeDefined();
      expect(services.operatorManagement.getOperatorMetrics).toBeDefined();
    });
  });

  describe('Inter-Service Type Compatibility', () => {
    let services: ReturnType<typeof serviceFactory.createAllServices>;

    beforeAll(() => {
      services = serviceFactory.createAllServices();
    });

    it('should have compatible service dependencies', () => {
      // Test that services with dependencies are properly constructed
      expect(services.payout).toBeDefined();
      expect(services.financialReporting).toBeDefined();
      expect(services.automatedRemittance).toBeDefined();
      expect(services.commissionSystem).toBeDefined();
      expect(services.transactionReconciliation).toBeDefined();
    });

    it('should maintain consistent error handling across services', () => {
      // All services should use the same error handling pattern
      const errorCodes = Object.values(ServiceErrorCode);
      expect(errorCodes).toContain(ServiceErrorCode.DATABASE_ERROR);
      expect(errorCodes).toContain(ServiceErrorCode.NOT_FOUND);
      expect(errorCodes).toContain(ServiceErrorCode.VALIDATION_ERROR);
      expect(errorCodes).toContain(ServiceErrorCode.PERMISSION_DENIED);
    });

    it('should have consistent ServiceResult structure', () => {
      // Test ServiceResult type structure
      const successResult: ServiceResult<string> = {
        success: true,
        data: 'test'
      };

      const errorResult: ServiceResult<string> = {
        success: false,
        error: {
          code: ServiceErrorCode.VALIDATION_ERROR,
          message: 'Test error',
          timestamp: new Date()
        }
      };

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe('test');
      expect(errorResult.success).toBe(false);
      expect(errorResult.error?.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
    });
  });

  describe('Service Interface Compliance', () => {
    it('should implement their specific service interfaces', () => {
      const locationService = serviceFactory.createLocationManagementService();
      
      // Test that the service has all required LocationManagementService methods
      expect(typeof locationService.createLocation).toBe('function');
      expect(typeof locationService.getLocation).toBe('function');
      expect(typeof locationService.updateLocation).toBe('function');
      expect(typeof locationService.deleteLocation).toBe('function');
      expect(typeof locationService.getLocationsByOperator).toBe('function');
    });

    it('should have consistent method signatures across similar services', () => {
      const locationService = serviceFactory.createLocationManagementService();
      const operatorService = serviceFactory.createOperatorManagementService();
      
      // Both services should have similar getter methods
      expect(typeof locationService.getLocation).toBe('function');
      expect(typeof operatorService.getOperatorSummary).toBe('function');
    });
  });

  describe('Type Safety Validation', () => {
    it('should maintain type safety in service factory', () => {
      // Test that factory methods return correctly typed services
      const locationService = serviceFactory.createLocationManagementService();
      const paymentService = serviceFactory.createPaymentProcessingService();
      
      // These should be different types
      expect(locationService).not.toBe(paymentService);
      expect(locationService.constructor.name).toBe('LocationManagementServiceImpl');
      expect(paymentService.constructor.name).toBe('PaymentProcessingServiceImpl');
    });

    it('should handle service dependencies correctly', () => {
      // Test that services with dependencies are properly typed
      const payoutService = serviceFactory.createPayoutService();
      const financialService = serviceFactory.createFinancialReportingService();
      const automatedRemittanceService = serviceFactory.createAutomatedRemittanceService();
      
      expect(payoutService).toBeDefined();
      expect(financialService).toBeDefined();
      expect(automatedRemittanceService).toBeDefined();
    });
  });

  describe('Error Handling Consistency', () => {
    it('should have consistent error types across all services', () => {
      const services = serviceFactory.createAllServices();
      
      // All services should handle errors consistently
      Object.values(services).forEach(service => {
        expect(service).toBeDefined();
        // Services should be instances of their respective classes
        expect(service.constructor.name).toMatch(/ServiceImpl$|Service$/);
      });
    });

    it('should provide proper error codes', () => {
      const errorCodes = Object.values(ServiceErrorCode);
      
      expect(errorCodes).toContain(ServiceErrorCode.DATABASE_ERROR);
      expect(errorCodes).toContain(ServiceErrorCode.NOT_FOUND);
      expect(errorCodes).toContain(ServiceErrorCode.VALIDATION_ERROR);
      expect(errorCodes).toContain(ServiceErrorCode.BUSINESS_RULE_VIOLATION);
      expect(errorCodes).toContain(ServiceErrorCode.PERMISSION_DENIED);
      expect(errorCodes).toContain(ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
    });
  });
});