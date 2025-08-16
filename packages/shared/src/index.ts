// Park Angel Shared Library - Main Entry Point

// Export type namespaces (recommended approach)
export * from './types';
export * from './utils';

// Export domain models namespace to avoid conflicts with types
// Models are available through direct imports from './models'
// Removed from main index to avoid conflicts with types

// Legacy exports for backward compatibility (will be deprecated)
export {
  // User models
  User as UserEntity,
  UserProfile as UserProfileEntity,
  UserGroup,
  Permission,

  // Location models
  Location as LocationEntity,
  Section as SectionEntity,
  Zone as ZoneEntity,
  ParkingSpot as ParkingSpotEntity,
  LocationSettings as LocationSettingsEntity,
  OperatingHours as OperatingHoursEntity,
  // Booking models
  Booking as BookingEntity,
  BookingExtension,
  Vehicle,

  // Pricing models
  PricingConfig as PricingConfigEntity,
  VehicleTypeRate as VehicleTypeRateEntity,
  TimeBasedRate as TimeBasedRateEntity,
  HolidayRate as HolidayRateEntity,
  PricingCalculation,
  HierarchicalPricingResolver,

  // Discount models
  DiscountRule as DiscountRuleEntity,
  DiscountCondition as DiscountConditionEntity,
  AppliedDiscount as AppliedDiscountEntity,
  VATCalculator,
  VATCalculation,
  DiscountEngine,
  TransactionCalculation,

  // Message models
  Message,
  Conversation,
  MessageAttachment,
  MessageThread,
  MessageEncryption,

  // Rating models
  Rating,
  RatingAggregate,
  ScoreDistribution,
  RatingFilter,

  // Value objects
  UserId,
  Email,
  PhoneNumber,
  Money,
  Coordinates as CoordinatesVO,
  Address as AddressVO,
  Percentage,
  TimeRange,
} from './models';

// Export Supabase client and configuration
export * from './lib/supabase';
export * from './config/supabase';

// Export services
export * from './services/auth';
export {
  AuthorizationService,
  type AuthorizationContext,
  type ResourcePermission,
} from './services/authorization';
export * from './services/session';
export * from './services/account-verification';
export * from './services/storage';
export * from './services/realtime';

// Export hooks
export * from './hooks/useAuth';
export * from './hooks/usePermissions';
export * from './hooks/useSession';

// Export components
export * from './components/ProtectedRoute';
