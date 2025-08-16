# Node.js 20 Upgrade Fix Implementation Plan

- [x] 1. Regenerate and synchronize database types
  - Generate fresh database types from current Supabase schema
  - Replace existing database.ts with properly typed definitions
  - Ensure all table relationships are correctly typed
  - _Requirements: 2.1, 2.2_

- [x] 2. Fix core database query type issues
  - Update Supabase client configuration for proper type inference
  - Fix SelectQueryError issues in operator-management.ts
  - Resolve relationship query typing problems
  - Add proper error handling for database operations
  - _Requirements: 2.1, 2.3, 3.1_

- [x] 3. Resolve service layer type mismatches
- [x] 3.1 Fix operator management service types
  - Update OperatorSummary interface to match database schema
  - Fix property access on SelectQueryError types
  - Implement proper type guards for database results
  - _Requirements: 2.1, 3.1, 3.2_

- [x] 3.2 Fix parking type system interface conflicts
  - Create unified interface for all parking logic classes
  - Update HostedParkingLogic, StreetParkingLogic, and FacilityParkingLogic
  - Fix Map constructor type parameter issues
  - _Requirements: 3.1, 3.3_

- [x] 3.3 Fix payment and revenue sharing service types
  - Update payment processing service to handle typed database results
  - Fix payout processing type mismatches
  - Resolve revenue sharing calculation type errors
  - _Requirements: 3.1, 3.2_

- [ ] 4. Fix type export and import conflicts
- [x] 4.1 Resolve duplicate type exports in index files
  - Audit all index.ts files for duplicate exports
  - Remove conflicting type exports
  - Implement proper type namespacing
  - _Requirements: 4.1, 4.3_

- [x] 4.2 Fix circular dependency issues
  - Identify and resolve circular import dependencies
  - Restructure type definitions to eliminate cycles
  - Update import statements across affected files
  - _Requirements: 4.1, 4.2_

- [x] 5. Fix specific service type errors
- [x] 5.1 Fix operator reporting service types
  - Add missing generatedBy property to OperatorReportParams interface
  - Fix revenue calculation type errors
  - Update report generation to use proper types
  - _Requirements: 3.1, 3.2_

- [x] 5.2 Fix realtime occupancy service types
  - Update payload type definitions for realtime subscriptions
  - Fix spot_id property access issues
  - Implement proper type guards for payload validation
  - _Requirements: 2.3, 3.2_

- [x] 5.3 Fix transaction reconciliation service types
  - Update transaction amount handling to use proper number types
  - Fix revenue share type access issues
  - Implement proper type validation for financial calculations
  - _Requirements: 3.1, 3.2_

- [x] 6. Update service interfaces and implementations
- [x] 6.1 Create base service interface with proper typing
  - Define generic BaseService interface
  - Implement ServiceResult pattern for consistent error handling
  - Update all services to extend base interface
  - _Requirements: 3.1, 3.2_

- [x] 6.2 Implement runtime type validation utilities
  - Create type guard functions for database results
  - Add validation helpers for critical operations
  - Implement error handling for type mismatches
  - _Requirements: 2.3, 3.2_

- [x] 7. Fix test file type errors
- [x] 7.1 Update test files to use correct types
  - Fix advertisement management test type imports
  - Update API management test type definitions
  - Resolve discount VAT management test type issues
  - _Requirements: 1.4, 5.2_

- [x] 7.2 Fix social features and financial reporting test types
  - Update social features test type definitions
  - Fix financial reporting test type imports
  - Ensure all test files compile without errors
  - _Requirements: 1.4, 5.2_

- [ ] 8. Validate and test the complete fix
- [x] 8.1 Run comprehensive TypeScript compilation test
  - Execute npm run build on shared package
  - Verify zero TypeScript compilation errors
  - Test type checking across all packages
  - _Requirements: 1.1, 1.3_

- [x] 8.2 Validate database type synchronization
  - Test database queries return properly typed results
  - Verify relationship queries work correctly
  - Ensure no SelectQueryError types in results
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8.3 Test service layer functionality
  - Verify all services instantiate correctly
  - Test service method calls with proper types
  - Validate inter-service type compatibility
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8.4 Run integration tests
  - Execute all existing test suites
  - Verify backward compatibility
  - Test core application functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Performance and compatibility validation
- [ ] 9.1 Validate Node.js 20 performance improvements
  - Measure build time improvements
  - Test runtime performance enhancements
  - Verify memory usage optimizations
  - _Requirements: 1.1, 5.4_

- [ ] 9.2 Ensure cross-package compatibility
  - Test imports between packages work correctly
  - Verify type definitions are properly exported
  - Validate package dependency resolution
  - _Requirements: 1.4, 4.2_

- [ ] 10. Documentation and cleanup
- [ ] 10.1 Update type documentation
  - Document new type patterns and interfaces
  - Update service layer documentation
  - Create migration guide for type changes
  - _Requirements: 1.1, 3.1_

- [ ] 10.2 Clean up temporary fixes and deprecated code
  - Remove any temporary type assertions
  - Clean up unused type definitions
  - Update import statements to use new types
  - _Requirements: 4.1, 4.2_