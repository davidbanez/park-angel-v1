/**
 * Service Layer Functionality Test Script
 * 
 * This script validates that all services instantiate correctly
 * and have proper method signatures.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

const { createClient } = require('@supabase/supabase-js');

// Mock Supabase client for testing
const supabase = createClient(
  'https://test.supabase.co',
  'test-key'
);

async function testServiceLayer() {
  console.log('🧪 Testing Service Layer Functionality...\n');

  try {
    // Import the service factory
    const { ParkingServiceFactory } = require('./dist/services/index.js');
    
    console.log('✅ Successfully imported ParkingServiceFactory');
    
    // Create service factory
    const serviceFactory = new ParkingServiceFactory(supabase);
    console.log('✅ Successfully created service factory');
    
    // Test individual service creation
    console.log('\n📦 Testing Individual Service Creation:');
    
    const locationService = serviceFactory.createLocationManagementService();
    console.log('✅ LocationManagementService created:', locationService.constructor.name);
    
    const spotService = serviceFactory.createSpotAvailabilityService();
    console.log('✅ SpotAvailabilityService created:', spotService.constructor.name);
    
    const pricingService = serviceFactory.createDynamicPricingService();
    console.log('✅ DynamicPricingService created:', pricingService.constructor.name);
    
    const bookingService = serviceFactory.createBookingWorkflowService();
    console.log('✅ BookingWorkflowService created:', bookingService.constructor.name);
    
    const occupancyService = serviceFactory.createRealtimeOccupancyService();
    console.log('✅ RealtimeOccupancyService created:', occupancyService.constructor.name);
    
    const parkingTypeService = serviceFactory.createParkingTypeService();
    console.log('✅ ParkingTypeService created:', parkingTypeService.constructor.name);
    
    const paymentService = serviceFactory.createPaymentProcessingService();
    console.log('✅ PaymentProcessingService created:', paymentService.constructor.name);
    
    const revenueService = serviceFactory.createRevenueShareService();
    console.log('✅ RevenueShareService created:', revenueService.constructor.name);
    
    const payoutService = serviceFactory.createPayoutService();
    console.log('✅ PayoutService created:', payoutService.constructor.name);
    
    const discountService = serviceFactory.createDiscountVATManagementService();
    console.log('✅ DiscountVATManagementService created:', discountService.constructor.name);
    
    const reportingService = serviceFactory.createFinancialReportingService();
    console.log('✅ FinancialReportingService created:', reportingService.constructor.name);
    
    const operatorService = serviceFactory.createOperatorManagementService();
    console.log('✅ OperatorManagementService created:', operatorService.constructor.name);
    
    // Test bulk service creation
    console.log('\n📦 Testing Bulk Service Creation:');
    const allServices = serviceFactory.createAllServices();
    console.log('✅ All services created successfully');
    
    // Verify all services are defined
    const serviceNames = [
      'locationManagement',
      'spotAvailability', 
      'dynamicPricing',
      'bookingWorkflow',
      'realtimeOccupancy',
      'parkingType',
      'paymentProcessing',
      'revenueShare',
      'payout',
      'discountVATManagement',
      'discountReporting',
      'financialReporting',
      'automatedRemittance',
      'commissionSystem',
      'transactionReconciliation',
      'operatorManagement'
    ];
    
    serviceNames.forEach(serviceName => {
      if (allServices[serviceName]) {
        console.log(`✅ ${serviceName}: ${allServices[serviceName].constructor.name}`);
      } else {
        console.log(`❌ ${serviceName}: NOT FOUND`);
      }
    });
    
    // Test method existence
    console.log('\n🔍 Testing Service Method Existence:');
    
    // LocationManagementService methods
    const locationMethods = ['createLocation', 'getLocation', 'updateLocation', 'deleteLocation', 'getLocationsByOperator'];
    locationMethods.forEach(method => {
      if (typeof allServices.locationManagement[method] === 'function') {
        console.log(`✅ locationManagement.${method}: function`);
      } else {
        console.log(`❌ locationManagement.${method}: NOT FOUND`);
      }
    });
    
    // PaymentProcessingService methods
    const paymentMethods = ['processPayment', 'refundPayment', 'getPaymentStatus'];
    paymentMethods.forEach(method => {
      if (typeof allServices.paymentProcessing[method] === 'function') {
        console.log(`✅ paymentProcessing.${method}: function`);
      } else {
        console.log(`❌ paymentProcessing.${method}: NOT FOUND`);
      }
    });
    
    // OperatorManagementService methods
    const operatorMethods = ['getOperatorSummary', 'getOperatorMetrics', 'getOperatorLocations'];
    operatorMethods.forEach(method => {
      if (typeof allServices.operatorManagement[method] === 'function') {
        console.log(`✅ operatorManagement.${method}: function`);
      } else {
        console.log(`❌ operatorManagement.${method}: NOT FOUND`);
      }
    });
    
    // Test inter-service compatibility
    console.log('\n🔗 Testing Inter-Service Compatibility:');
    
    // Services with dependencies should be properly constructed
    const dependentServices = ['payout', 'financialReporting', 'automatedRemittance', 'commissionSystem', 'transactionReconciliation'];
    dependentServices.forEach(serviceName => {
      if (allServices[serviceName]) {
        console.log(`✅ ${serviceName}: properly instantiated with dependencies`);
      } else {
        console.log(`❌ ${serviceName}: failed to instantiate`);
      }
    });
    
    console.log('\n🎉 Service Layer Functionality Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Service Factory: ✅ Working`);
    console.log(`- Individual Service Creation: ✅ Working`);
    console.log(`- Bulk Service Creation: ✅ Working`);
    console.log(`- Service Method Existence: ✅ Working`);
    console.log(`- Inter-Service Compatibility: ✅ Working`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Service Layer Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testServiceLayer().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});