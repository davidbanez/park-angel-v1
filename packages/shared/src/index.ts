// Park Angel Shared Types and Utilities
export * from './types';
export * from './utils';

// Export domain models (avoiding conflicts with types)
export {
  // User models
  User as UserEntity,
  UserProfile as UserProfileEntity,
  UserGroup,
  Permission,
  AuthProvider,
  UserType,
  UserStatus,

  // Location models
  Location as LocationEntity,
  Section as SectionEntity,
  Zone as ZoneEntity,
  ParkingSpot as ParkingSpotEntity,
  LocationSettings as LocationSettingsEntity,
  OperatingHours as OperatingHoursEntity,
  ParkingType,
  SpotStatus,

  // Booking models
  Booking as BookingEntity,
  BookingExtension,
  Vehicle,
  BookingStatus,
  PaymentStatus,

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
  MessageType,
  MessageStatus,
  ConversationType,

  // Rating models
  Rating,
  RatingAggregate,
  ScoreDistribution,
  RatingFilter,
  RatedType,
  RatingStatus,
  ReputationLevel,

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
