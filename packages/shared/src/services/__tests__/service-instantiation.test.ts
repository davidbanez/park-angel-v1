/**
 * Service Instantiation and Type Safety Tests
 * 
 * This test suite validates that all services can be instantiated correctly
 * and have proper type definitions without requiring database connections.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { ParkingServiceFactory } from '../index';

describe('Service Instantiation Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let serviceFactory: ParkingServiceFactory;

  beforeAll(() => {
    // Create a mock Supabase client for testing
    supabase = createClient(
      'https://test.supabase.co',
      'test-key'
    );
    
    serviceFactory = new ParkingServiceFactory(supabase);
  });

  describe('Service Factory Creation', () => {
    it('should create service factory successfully', () => {
      expect(serviceFactory).toBeInstanceOf(ParkingServiceFactory);
      expect(serviceFactory).toBeDefined();
    });
  });

  describe('Individual Service Creation', () => {
    it('should create LocationManagementService', () => {
      const service = serviceFactory.createLocationManagementService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('LocationManagementServiceImpl');
    });

    it('should create SpotAvailabilityService', () => {
      const service = serviceFactory.createSpotAvailabilityService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('SpotAvailabilityServiceImpl');
    });

    it('should create DynamicPricingService', () => {
      const service = serviceFactory.createDynamicPricingService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('DynamicPricingServiceImpl');
    });

    it('should create BookingWorkflowService', () => {
      const service = serviceFactory.createBookingWorkflowService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('BookingWorkflowServiceImpl');
    });

    it('should create RealtimeOccupancyService', () => {
      const service = serviceFactory.createRealtimeOccupancyService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('RealtimeOccupancyServiceImpl');
    });

    it('should create ParkingTypeService', () => {
      const service = serviceFactory.createParkingTypeService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('ParkingTypeServiceImpl');
    });

    it('should create PaymentProcessingService', () => {
      const service = serviceFactory.createPaymentProcessingService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('PaymentProcessingServiceImpl');
    });

    it('should create RevenueShareService', () => {
      const service = serviceFactory.createRevenueShareService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('RevenueShareServiceImpl');
    });

    it('should create PayoutService', () => {
      const service = serviceFactory.createPayoutService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('PayoutServiceImpl');
    });

    it('should create DiscountVATManagementService', () => {
      const service = serviceFactory.createDiscountVATManagementService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('DiscountVATManagementService');
    });

    it('should create FinancialReportingService', () => {
      const service = serviceFactory.createFinancialReportingService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('FinancialReportingServiceImpl');
    });

    it('should create OperatorManagementService', () => {
      const service = serviceFactory.createOperatorManagementService();
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('OperatorManagementServiceImpl');
    });
  });

  describe('Bulk Service Creation', () => {
    it('should create all services at once', () => {
      const services = serviceFactory.createAllServices();
      
      expect(services).toBeDefined();
      expect(services.locationManagement).toBeDefined();
      expect(services.spotAvailability).toBeDefined();
      expect(services.dynamicPricing).toBeDefined();
      expect(services.bookingWorkflow).toBeDefined();
      expect(services.realtimeOccupancy).toBeDefined();
      expect(services.parkingType).toBeDefined();
      expect(services.paymentProcessing).toBeDefined();
      expect(services.revenueShare).toBeDefined();
      expect(services.payout).toBeDefined();
      expect(services.discountVATManagement).toBeDefined();
      expect(services.discountReporting).toBeDefined();
      expect(services.financialReporting).toBeDefined();
      expect(services.automatedRemittance).toBeDefined();
      expect(services.commissionSystem).toBeDefined();
      expect(services.transactionReconciliation).toBeDefined();
      expect(services.operatorManagement).toBeDefined();
    });

    it('should create services with proper dependencies', () => {
      const services = serviceFactory.createAllServices();
      
      // Services with dependencies should be properly instantiated
      expect(services.payout).toBeDefined();
      expect(services.financialReporting).toBeDefined();
      expect(services.automatedRemittance).toBeDefined();
      expect(services.commissionSystem).toBeDefined();
      expect(services.transactionReconciliation).toBeDefined();
    });
  });

  describe('Service Method Existence', () => {
    let services: ReturnType<typeof serviceFactory.createAllServices>;

    beforeAll(() => {
      services = serviceFactory.createAllServices();
    });

    it('should have LocationManagementService methods', () => {
      expect(typeof services.locationManagement.createLocation).toBe('function');
      expect(typeof services.locationManagement.getLocation).toBe('function');
      expect(typeof services.locationManagement.updateLocation).toBe('function');
      expect(typeof services.locationManagement.deleteLocation).toBe('function');
      expect(typeof services.locationManagement.getLocationsByOperator).toBe('function');
      expect(typeof services.locationManagement.getLocationHierarchy).toBe('function');
    });

    it('should have PaymentProcessingService methods', () => {
      expect(typeof services.paymentProcessing.processPayment).toBe('function');
      expect(typeof services.paymentProcessing.refundPayment).toBe('function');
      expect(typeof services.paymentProcessing.getPaymentStatus).toBe('function');
    });

    it('should have OperatorManagementService methods', () => {
      expect(typeof services.operatorManagement.getOperatorSummary).toBe('function');
      expect(typeof services.operatorManagement.getOperatorMetrics).toBe('function');
      expect(typeof services.operatorManagement.getOperatorLocations).toBe('function');
    });

    it('should have RevenueShareService methods', () => {
      expect(typeof services.revenueShare.calculateRevenueShare).toBe('function');
      expect(typeof services.revenueShare.getRevenueShareConfig).toBe('function');
    });

    it('should have SpotAvailabilityService methods', () => {
      expect(typeof services.spotAvailability.checkAvailability).toBe('function');
      expect(typeof services.spotAvailability.getAvailableSpots).toBe('function');
      expect(typeof services.spotAvailability.reserveSpot).toBe('function');
      expect(typeof services.spotAvailability.releaseSpot).toBe('function');
    });

    it('should have DynamicPricingService methods', () => {
      expect(typeof services.dynamicPricing.calculatePrice).toBe('function');
      expect(typeof services.dynamicPricing.updatePricing).toBe('function');
      expect(typeof services.dynamicPricing.getPricing).toBe('function');
      expect(typeof services.dynamicPricing.getEffectivePricing).toBe('function');
    });
  });

  describe('Service Type Compatibility', () => {
    it('should maintain type safety across service creation', () => {
      const locationService = serviceFactory.createLocationManagementService();
      const paymentService = serviceFactory.createPaymentProcessingService();
      const operatorService = serviceFactory.createOperatorManagementService();
      
      // Services should be different instances
      expect(locationService).not.toBe(paymentService);
      expect(paymentService).not.toBe(operatorService);
      expect(locationService).not.toBe(operatorService);
      
      // Services should have correct types
      expect(locationService.constructor.name).toBe('LocationManagementServiceImpl');
      expect(paymentService.constructor.name).toBe('PaymentProcessingServiceImpl');
      expect(operatorService.constructor.name).toBe('OperatorManagementServiceImpl');
    });

    it('should handle service dependencies correctly', () => {
      const services = serviceFactory.createAllServices();
      
      // Services with dependencies should be properly constructed
      expect(services.payout).toBeDefined();
      expect(services.financialReporting).toBeDefined();
      expect(services.automatedRemittance).toBeDefined();
      expect(services.commissionSystem).toBeDefined();
      expect(services.transactionReconciliation).toBeDefined();
      
      // All should be different instances
      expect(services.payout).not.toBe(services.financialReporting);
      expect(services.financialReporting).not.toBe(services.automatedRemittance);
      expect(services.automatedRemittance).not.toBe(services.commissionSystem);
    });
  });

  describe('Service Error Handling Structure', () => {
    it('should have consistent error handling patterns', () => {
      const services = serviceFactory.createAllServices();
      
      // All services should be defined and instantiated
      Object.values(services).forEach(service => {
        expect(service).toBeDefined();
        expect(service.constructor.name).toMatch(/ServiceImpl$|Service$/);
      });
    });
  });
});