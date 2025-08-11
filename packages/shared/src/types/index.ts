// Core type definitions for Park Angel system
export * from './user';
export * from './parking';
export * from './booking';
export * from './payment';
export * from './financial-reporting';
export * from './advertisement';
export * from './api-management';

// Export operator types with explicit re-export to avoid conflicts
export type {
  OperatorProfile,
  OperatorBankDetails,
  OperatorRevenueConfig,
  OperatorRemittance,
  VIPAssignment,
  OperatorPerformanceMetrics,
  CreateOperatorProfileData,
  CreateOperatorBankDetailsData,
  CreateOperatorRevenueConfigData,
  CreateVIPAssignmentData,
  UpdateOperatorProfileData,
  OperatorSummary,
  OperatorDashboardMetrics,
  RemittanceCalculation,
} from './operator';
