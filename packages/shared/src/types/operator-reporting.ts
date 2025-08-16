// Operator-specific reporting types for Park Angel

export interface OperatorReport {
  id: string;
  type: OperatorReportType;
  title: string;
  description: string;
  operatorId: string;
  generatedAt: Date;
  generatedBy: string;
  parameters: OperatorReportParams;
  data: any;
  metadata: OperatorReportMetadata;
}

export enum OperatorReportType {
  REVENUE_REPORT = 'revenue_report',
  OCCUPANCY_REPORT = 'occupancy_report',
  USER_BEHAVIOR_REPORT = 'user_behavior_report',
  VIOLATION_REPORT = 'violation_report',
  VIP_USAGE_REPORT = 'vip_usage_report',
  ZONE_PERFORMANCE_REPORT = 'zone_performance_report',
  VEHICLE_TYPE_ANALYTICS = 'vehicle_type_analytics',
  OPERATIONAL_SUMMARY = 'operational_summary',
}

export interface OperatorReportParams {
  type: OperatorReportType;
  startDate: Date;
  endDate: Date;
  operatorId: string;
  generatedBy: string;
  filters?: OperatorReportFilters;
  groupBy?: 'day' | 'week' | 'month' | 'location' | 'zone' | 'vehicle_type';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface OperatorReportFilters {
  locationIds?: string[];
  sectionIds?: string[];
  zoneIds?: string[];
  spotIds?: string[];
  vehicleTypes?: string[];
  userTypes?: ('regular' | 'vip' | 'vvip' | 'flex_vip' | 'flex_vvip')[];
  paymentMethods?: string[];
  discountTypes?: string[];
  violationTypes?: string[];
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export interface OperatorReportMetadata {
  recordCount: number;
  totalAmount?: number;
  currency: string;
  processingTime?: number;
  dataSource?: string;
  exportFormats: ExportFormat[];
}

// Revenue Report Types
export interface OperatorRevenueReportData {
  summary: OperatorRevenueSummary;
  breakdown: OperatorRevenueBreakdown;
  trends: RevenueTrend[];
  locationBreakdown: LocationRevenueData[];
  vehicleTypeBreakdown: VehicleTypeRevenueData[];
  discountImpact: DiscountImpactData;
  comparisons: RevenueComparison[];
}

export interface OperatorRevenueSummary {
  totalRevenue: number;
  operatorShare: number;
  parkAngelShare: number;
  transactionCount: number;
  averageTransactionValue: number;
  growthRate: number;
  previousPeriodRevenue: number;
}

export interface OperatorRevenueBreakdown {
  streetParking: number;
  facilityParking: number;
  hostedParking?: number;
  regularBookings: number;
  vipBookings: number;
  discountedBookings: number;
}

export interface RevenueTrend {
  period: string;
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

export interface LocationRevenueData {
  locationId: string;
  locationName: string;
  locationType: 'street' | 'facility' | 'hosted';
  revenue: number;
  transactionCount: number;
  occupancyRate: number;
  averageSessionDuration: number;
}

export interface VehicleTypeRevenueData {
  vehicleType: string;
  revenue: number;
  transactionCount: number;
  averageValue: number;
  percentage: number;
}

export interface DiscountImpactData {
  totalDiscountAmount: number;
  discountedTransactions: number;
  seniorCitizenDiscounts: number;
  pwdDiscounts: number;
  customDiscounts: number;
  vatExemptions: number;
}

export interface RevenueComparison {
  period: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
}

// Occupancy Report Types
export interface OperatorOccupancyReportData {
  summary: OccupancySummary;
  trends: OccupancyTrend[];
  locationBreakdown: LocationOccupancyData[];
  zoneBreakdown: ZoneOccupancyData[];
  peakHours: PeakHourData[];
  utilizationMetrics: UtilizationMetrics;
}

export interface OccupancySummary {
  averageOccupancyRate: number;
  peakOccupancyRate: number;
  lowOccupancyRate: number;
  totalSpots: number;
  activeSpots: number;
  maintenanceSpots: number;
  averageSessionDuration: number;
  turnoverRate: number;
}

export interface OccupancyTrend {
  period: string;
  occupancyRate: number;
  totalSessions: number;
  averageDuration: number;
}

export interface LocationOccupancyData {
  locationId: string;
  locationName: string;
  totalSpots: number;
  occupancyRate: number;
  averageSessionDuration: number;
  turnoverRate: number;
  peakHours: string[];
}

export interface ZoneOccupancyData {
  zoneId: string;
  zoneName: string;
  locationName: string;
  totalSpots: number;
  occupancyRate: number;
  averageSessionDuration: number;
  revenue: number;
}

export interface PeakHourData {
  hour: number;
  dayOfWeek: string;
  occupancyRate: number;
  sessionCount: number;
}

export interface UtilizationMetrics {
  underutilizedSpots: SpotUtilization[];
  overutilizedSpots: SpotUtilization[];
  optimalUtilizationRate: number;
  recommendations: string[];
}

export interface SpotUtilization {
  spotId: string;
  spotNumber: string;
  locationName: string;
  zoneName: string;
  utilizationRate: number;
  revenue: number;
  sessionCount: number;
}

// User Behavior Report Types
export interface UserBehaviorReportData {
  summary: UserBehaviorSummary;
  userSegments: UserSegmentData[];
  bookingPatterns: BookingPatternData[];
  sessionAnalytics: SessionAnalyticsData;
  loyaltyMetrics: LoyaltyMetrics;
  churnAnalysis: ChurnAnalysisData;
}

export interface UserBehaviorSummary {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionsPerUser: number;
  averageRevenuePerUser: number;
  userRetentionRate: number;
}

export interface UserSegmentData {
  segment: string;
  userCount: number;
  revenue: number;
  averageSessionDuration: number;
  bookingFrequency: number;
  preferredLocations: string[];
}

export interface BookingPatternData {
  pattern: string;
  frequency: number;
  revenue: number;
  averageDuration: number;
  peakTimes: string[];
}

export interface SessionAnalyticsData {
  averageSessionDuration: number;
  shortSessions: number; // < 1 hour
  mediumSessions: number; // 1-4 hours
  longSessions: number; // > 4 hours
  extendedSessions: number;
  cancelledSessions: number;
}

export interface LoyaltyMetrics {
  loyalUsers: number;
  averageLifetimeValue: number;
  repeatBookingRate: number;
  referralRate: number;
  satisfactionScore: number;
}

export interface ChurnAnalysisData {
  churnRate: number;
  churnedUsers: number;
  atRiskUsers: number;
  churnReasons: ChurnReasonData[];
  retentionStrategies: string[];
}

export interface ChurnReasonData {
  reason: string;
  count: number;
  percentage: number;
}

// Violation Report Types
export interface ViolationReportData {
  summary: ViolationSummary;
  violationTypes: ViolationTypeData[];
  locationBreakdown: LocationViolationData[];
  trends: ViolationTrend[];
  enforcementMetrics: EnforcementMetrics;
  resolutionAnalysis: ResolutionAnalysisData;
}

export interface ViolationSummary {
  totalViolations: number;
  resolvedViolations: number;
  pendingViolations: number;
  averageResolutionTime: number;
  enforcementRate: number;
  revenueFromFines: number;
}

export interface ViolationTypeData {
  type: string;
  count: number;
  percentage: number;
  averageResolutionTime: number;
  enforcementRate: number;
}

export interface LocationViolationData {
  locationId: string;
  locationName: string;
  violationCount: number;
  violationRate: number;
  commonViolations: string[];
  enforcementEffectiveness: number;
}

export interface ViolationTrend {
  period: string;
  violationCount: number;
  resolutionRate: number;
  enforcementActions: number;
}

export interface EnforcementMetrics {
  towingRequests: number;
  clampingRequests: number;
  warningsIssued: number;
  finesCollected: number;
  enforcementResponseTime: number;
}

export interface ResolutionAnalysisData {
  averageResolutionTime: number;
  resolutionMethods: ResolutionMethodData[];
  escalationRate: number;
  customerSatisfaction: number;
}

export interface ResolutionMethodData {
  method: string;
  count: number;
  averageTime: number;
  successRate: number;
}

// VIP Usage Report Types
export interface VIPUsageReportData {
  summary: VIPUsageSummary;
  vipTypes: VIPTypeUsageData[];
  locationUsage: VIPLocationUsageData[];
  trends: VIPUsageTrend[];
  benefitAnalysis: VIPBenefitAnalysisData;
  recommendations: VIPRecommendation[];
}

export interface VIPUsageSummary {
  totalVIPUsers: number;
  activeVIPUsers: number;
  vvipUsers: number;
  flexVVIPUsers: number;
  vipUsers: number;
  flexVIPUsers: number;
  totalVIPSessions: number;
  vipRevenueImpact: number;
}

export interface VIPTypeUsageData {
  vipType: 'vvip' | 'flex_vvip' | 'vip' | 'flex_vip';
  userCount: number;
  sessionCount: number;
  averageSessionDuration: number;
  locationUsage: string[];
  benefitUtilization: number;
}

export interface VIPLocationUsageData {
  locationId: string;
  locationName: string;
  vipSessions: number;
  vipOccupancyRate: number;
  revenueImpact: number;
  popularVIPTypes: string[];
}

export interface VIPUsageTrend {
  period: string;
  vipSessions: number;
  newVIPUsers: number;
  vipRetentionRate: number;
}

export interface VIPBenefitAnalysisData {
  freeSessionsProvided: number;
  discountAmountProvided: number;
  priorityBookings: number;
  extendedTimeUsage: number;
  costToOperator: number;
}

export interface VIPRecommendation {
  type: string;
  description: string;
  expectedImpact: string;
  implementationEffort: string;
}

// Zone Performance Report Types
export interface ZonePerformanceReportData {
  summary: ZonePerformanceSummary;
  zoneMetrics: ZoneMetricsData[];
  performanceComparisons: ZoneComparisonData[];
  trends: ZonePerformanceTrend[];
  optimization: ZoneOptimizationData;
}

export interface ZonePerformanceSummary {
  totalZones: number;
  highPerformingZones: number;
  underperformingZones: number;
  averageRevenue: number;
  averageOccupancy: number;
  totalSpots: number;
}

export interface ZoneMetricsData {
  zoneId: string;
  zoneName: string;
  locationName: string;
  sectionName: string;
  revenue: number;
  occupancyRate: number;
  sessionCount: number;
  averageSessionDuration: number;
  turnoverRate: number;
  customerSatisfaction: number;
  performanceScore: number;
  ranking: number;
}

export interface ZoneComparisonData {
  zoneId: string;
  zoneName: string;
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  revenueChange: number;
  occupancyChange: number;
  performanceChange: number;
}

export interface ZonePerformanceTrend {
  period: string;
  zoneId: string;
  zoneName: string;
  revenue: number;
  occupancyRate: number;
  sessionCount: number;
}

export interface ZoneOptimizationData {
  recommendations: ZoneRecommendation[];
  potentialRevenue: number;
  implementationPriority: ZonePriorityData[];
}

export interface ZoneRecommendation {
  zoneId: string;
  zoneName: string;
  recommendation: string;
  expectedImpact: string;
  implementationCost: number;
  roi: number;
}

export interface ZonePriorityData {
  zoneId: string;
  zoneName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  expectedBenefit: string;
}

// Export formats
export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export interface ReportExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  fileName?: string;
  template?: string;
}

export interface ReportExportResult {
  fileName: string;
  mimeType: string;
  url: string;
  size: number;
  expiresAt: Date;
}

// Live search and filtering
export interface ReportSearchOptions {
  query: string;
  fields: string[];
  fuzzy: boolean;
  caseSensitive: boolean;
}

export interface ReportSortOptions {
  field: string;
  order: 'asc' | 'desc';
  type: 'string' | 'number' | 'date';
}

export interface ReportPaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface ReportQueryOptions {
  filters?: OperatorReportFilters;
  search?: ReportSearchOptions;
  sort?: ReportSortOptions;
  pagination?: ReportPaginationOptions;
}