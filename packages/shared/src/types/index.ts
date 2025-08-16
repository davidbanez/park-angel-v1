// Core type definitions for Park Angel system

// Export common types that are shared across the application
export * from './common';

// Export specific types with explicit names to avoid conflicts
export type {
  User as UserInterface,
  UserProfile as UserProfileInterface,
  VIPType,
  VIPAssignment,
  CustomerSupportConversation,
  CustomerSupportMessage,
  CustomerAnalytics,
  CustomerProfile
} from './user';

// Export parking types with explicit names
export type {
  Location as LocationInterface,
  Section as SectionInterface,
  Zone as ZoneInterface,
  ParkingSpot as ParkingSpotInterface,
  LocationSettings,
  OperatingHours
} from './parking';

// Export booking types
export * from './booking';

// Export payment types
export * from './payment';

// Export financial reporting types
export * from './financial-reporting';

// Export advertisement types
export * from './advertisement';

// Export API management types
export * from './api-management';

// Export facility layout types
export * from './facility-layout';

// Export hosted parking types
export * from './hosted-parking';

// Export operator-reporting types with explicit names to avoid conflicts
export type {
  OperatorReport,
  OperatorReportType,
  OperatorReportParams,
  OperatorReportFilters,
  OperatorReportMetadata,
  OperatorRevenueBreakdown,
  OperatorRevenueSummary,
  ReportExportResult,
  ExportFormat
} from './operator-reporting';

// Export operator types with explicit re-export to avoid conflicts
export type {
  OperatorProfile,
  OperatorBankDetails,
  OperatorRevenueConfig,
  OperatorRemittance,
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
