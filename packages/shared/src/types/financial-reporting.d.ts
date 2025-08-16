export interface FinancialReport {
    id: string;
    type: FinancialReportType;
    title: string;
    description: string;
    generatedAt: Date;
    generatedBy: string;
    parameters: FinancialReportParams;
    data: any;
    metadata: FinancialReportMetadata;
}
export declare enum FinancialReportType {
    OPERATOR_REVENUE = "operator_revenue",
    HOST_REVENUE = "host_revenue",
    TRANSACTION_RECONCILIATION = "transaction_reconciliation",
    PAYOUT_SUMMARY = "payout_summary",
    REVENUE_ANALYSIS = "revenue_analysis"
}
export interface FinancialReportParams {
    type: FinancialReportType;
    startDate: Date;
    endDate: Date;
    entityId?: string;
    filters?: FinancialReportFilters;
    generatedBy: string;
}
export interface FinancialReportFilters {
    parkingType?: 'hosted' | 'street' | 'facility';
    locationIds?: string[];
    paymentStatus?: string[];
    payoutStatus?: string[];
    minAmount?: number;
    maxAmount?: number;
}
export interface FinancialReportMetadata {
    recordCount: number;
    totalAmount: number;
    currency: string;
    processingTime?: number;
    dataSource?: string;
}
export interface OperatorRevenueReport {
    operatorId: string;
    period: DateRange;
    summary: OperatorRevenueSummary;
    breakdown: OperatorRevenueBreakdown;
    transactions: ReportTransaction[];
    payouts: ReportPayout[];
    locationBreakdown: LocationRevenueBreakdown[];
    monthlyTrends: MonthlyTrend[];
    generatedAt: Date;
}
export interface OperatorRevenueSummary {
    totalRevenue: number;
    operatorShare: number;
    parkAngelShare: number;
    transactionCount: number;
    averageTransactionValue: number;
}
export interface OperatorRevenueBreakdown {
    streetParking: number;
    facilityParking: number;
}
export interface HostRevenueReport {
    hostId: string;
    period: DateRange;
    summary: HostRevenueSummary;
    breakdown: HostRevenueBreakdown;
    transactions: ReportTransaction[];
    payouts: ReportPayout[];
    listingBreakdown: ListingRevenueBreakdown[];
    occupancyRates: OccupancyRates;
    generatedAt: Date;
}
export interface HostRevenueSummary {
    totalRevenue: number;
    hostShare: number;
    parkAngelShare: number;
    transactionCount: number;
    averageTransactionValue: number;
}
export interface HostRevenueBreakdown {
    hostedParking: number;
}
export interface TransactionReconciliationReport {
    period: DateRange;
    summary: ReconciliationSummary;
    transactions: ReconciliationTransaction[];
    revenueShares: RevenueShareRecord[];
    payouts: PayoutRecord[];
    discrepancies: Discrepancy[];
    generatedAt: Date;
}
export interface ReconciliationSummary {
    totalTransactions: number;
    totalAmount: number;
    totalRevenueShares: number;
    totalPayouts: number;
    reconciledTransactions: number;
    unreconciledTransactions: number;
}
export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export interface ReportTransaction {
    id: string;
    amount: number;
    operatorShare?: number;
    hostShare?: number;
    parkAngelShare: number;
    calculatedAt: Date;
    location?: string;
    status?: string;
}
export interface ReportPayout {
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
    processedAt?: Date;
    bankAccount?: string;
}
export interface LocationRevenueBreakdown {
    locationId: string;
    locationName: string;
    locationType: string;
    revenue: number;
    transactionCount: number;
}
export interface ListingRevenueBreakdown {
    listingId: string;
    listingName: string;
    revenue: number;
    transactionCount: number;
    occupancyRate: number;
}
export interface MonthlyTrend {
    month: string;
    revenue: number;
    transactionCount: number;
}
export interface OccupancyRates {
    averageOccupancyRate: number;
    peakOccupancyRate: number;
    lowOccupancyRate: number;
}
export interface ReconciliationTransaction {
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
    location?: string;
}
export interface RevenueShareRecord {
    id: string;
    transactionId: string;
    totalAmount: number;
    parkAngelShare: number;
    operatorShare?: number;
    hostShare?: number;
    calculatedAt: Date;
}
export interface PayoutRecord {
    id: string;
    recipientId: string;
    recipientType: string;
    amount: number;
    status: string;
    createdAt: Date;
    processedAt?: Date;
}
export interface Discrepancy {
    type: DiscrepancyType;
    transactionId?: string;
    description: string;
    amount?: number;
    expectedAmount?: number;
    actualAmount?: number;
    difference?: number;
}
export declare enum DiscrepancyType {
    AMOUNT_MISMATCH = "amount_mismatch",
    MISSING_REVENUE_SHARE = "missing_revenue_share",
    MISSING_TRANSACTION = "missing_transaction",
    STATUS_MISMATCH = "status_mismatch",
    DUPLICATE_ENTRY = "duplicate_entry"
}
export interface AuditTrailEntry {
    id: string;
    entityId: string;
    entityType: string;
    action: string;
    userId: string;
    details: Record<string, any>;
    timestamp: Date;
}
export declare enum ExportFormat {
    PDF = "pdf",
    EXCEL = "excel",
    CSV = "csv",
    JSON = "json"
}
export interface ReportExportResult {
    fileName: string;
    mimeType: string;
    url: string;
    size: number;
}
export interface RemittanceSchedule {
    id: string;
    recipientId: string;
    recipientType: 'operator' | 'host';
    frequency: RemittanceFrequency;
    minimumAmount: number;
    bankAccountId: string;
    isActive: boolean;
    nextRunDate: Date;
    lastRunDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum RemittanceFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly"
}
export interface RemittanceRun {
    id: string;
    scheduleId: string;
    recipientId: string;
    recipientType: 'operator' | 'host';
    amount: number;
    transactionIds: string[];
    payoutId?: string;
    status: RemittanceStatus;
    runDate: Date;
    completedAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
}
export declare enum RemittanceStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface CommissionRule {
    id: string;
    parkingType: 'hosted' | 'street' | 'facility';
    hostPercentage: number;
    parkAngelPercentage: number;
    effectiveDate: Date;
    expiryDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CommissionCalculation {
    transactionId: string;
    totalAmount: number;
    hostShare: number;
    parkAngelShare: number;
    commissionRule: CommissionRule;
    calculatedAt: Date;
}
export interface ReconciliationRule {
    id: string;
    name: string;
    description: string;
    ruleType: ReconciliationRuleType;
    conditions: ReconciliationCondition[];
    actions: ReconciliationAction[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ReconciliationRuleType {
    AMOUNT_VALIDATION = "amount_validation",
    STATUS_CHECK = "status_check",
    DUPLICATE_DETECTION = "duplicate_detection",
    COMPLETENESS_CHECK = "completeness_check"
}
export interface ReconciliationCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: any;
}
export interface ReconciliationAction {
    type: 'flag_discrepancy' | 'auto_correct' | 'notify_admin' | 'create_ticket';
    parameters: Record<string, any>;
}
export interface ReconciliationResult {
    ruleId: string;
    ruleName: string;
    passed: boolean;
    discrepancies: Discrepancy[];
    correctedItems: string[];
    notifications: string[];
}
export interface FinancialAudit {
    id: string;
    auditType: FinancialAuditType;
    period: DateRange;
    status: FinancialAuditStatus;
    findings: AuditFinding[];
    recommendations: AuditRecommendation[];
    auditedBy: string;
    auditedAt: Date;
    completedAt?: Date;
}
export declare enum FinancialAuditType {
    REVENUE_AUDIT = "revenue_audit",
    PAYOUT_AUDIT = "payout_audit",
    RECONCILIATION_AUDIT = "reconciliation_audit",
    COMPLIANCE_AUDIT = "compliance_audit"
}
export declare enum FinancialAuditStatus {
    PLANNED = "planned",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface AuditFinding {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    affectedTransactions: string[];
    financialImpact: number;
    evidence: AuditEvidence[];
}
export interface AuditEvidence {
    type: 'document' | 'screenshot' | 'data_export' | 'system_log';
    description: string;
    url?: string;
    metadata: Record<string, any>;
}
export interface AuditRecommendation {
    id: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    implementationSteps: string[];
    estimatedEffort: string;
    expectedBenefit: string;
}
