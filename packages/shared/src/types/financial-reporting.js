// Financial reporting types for Park Angel
export var FinancialReportType;
(function (FinancialReportType) {
    FinancialReportType["OPERATOR_REVENUE"] = "operator_revenue";
    FinancialReportType["HOST_REVENUE"] = "host_revenue";
    FinancialReportType["TRANSACTION_RECONCILIATION"] = "transaction_reconciliation";
    FinancialReportType["PAYOUT_SUMMARY"] = "payout_summary";
    FinancialReportType["REVENUE_ANALYSIS"] = "revenue_analysis";
})(FinancialReportType || (FinancialReportType = {}));
export var DiscrepancyType;
(function (DiscrepancyType) {
    DiscrepancyType["AMOUNT_MISMATCH"] = "amount_mismatch";
    DiscrepancyType["MISSING_REVENUE_SHARE"] = "missing_revenue_share";
    DiscrepancyType["MISSING_TRANSACTION"] = "missing_transaction";
    DiscrepancyType["STATUS_MISMATCH"] = "status_mismatch";
    DiscrepancyType["DUPLICATE_ENTRY"] = "duplicate_entry";
})(DiscrepancyType || (DiscrepancyType = {}));
export var ExportFormat;
(function (ExportFormat) {
    ExportFormat["PDF"] = "pdf";
    ExportFormat["EXCEL"] = "excel";
    ExportFormat["CSV"] = "csv";
    ExportFormat["JSON"] = "json";
})(ExportFormat || (ExportFormat = {}));
export var RemittanceFrequency;
(function (RemittanceFrequency) {
    RemittanceFrequency["DAILY"] = "daily";
    RemittanceFrequency["WEEKLY"] = "weekly";
    RemittanceFrequency["BIWEEKLY"] = "biweekly";
    RemittanceFrequency["MONTHLY"] = "monthly";
})(RemittanceFrequency || (RemittanceFrequency = {}));
export var RemittanceStatus;
(function (RemittanceStatus) {
    RemittanceStatus["PENDING"] = "pending";
    RemittanceStatus["PROCESSING"] = "processing";
    RemittanceStatus["COMPLETED"] = "completed";
    RemittanceStatus["FAILED"] = "failed";
    RemittanceStatus["CANCELLED"] = "cancelled";
})(RemittanceStatus || (RemittanceStatus = {}));
export var ReconciliationRuleType;
(function (ReconciliationRuleType) {
    ReconciliationRuleType["AMOUNT_VALIDATION"] = "amount_validation";
    ReconciliationRuleType["STATUS_CHECK"] = "status_check";
    ReconciliationRuleType["DUPLICATE_DETECTION"] = "duplicate_detection";
    ReconciliationRuleType["COMPLETENESS_CHECK"] = "completeness_check";
})(ReconciliationRuleType || (ReconciliationRuleType = {}));
export var FinancialAuditType;
(function (FinancialAuditType) {
    FinancialAuditType["REVENUE_AUDIT"] = "revenue_audit";
    FinancialAuditType["PAYOUT_AUDIT"] = "payout_audit";
    FinancialAuditType["RECONCILIATION_AUDIT"] = "reconciliation_audit";
    FinancialAuditType["COMPLIANCE_AUDIT"] = "compliance_audit";
})(FinancialAuditType || (FinancialAuditType = {}));
export var FinancialAuditStatus;
(function (FinancialAuditStatus) {
    FinancialAuditStatus["PLANNED"] = "planned";
    FinancialAuditStatus["IN_PROGRESS"] = "in_progress";
    FinancialAuditStatus["COMPLETED"] = "completed";
    FinancialAuditStatus["CANCELLED"] = "cancelled";
})(FinancialAuditStatus || (FinancialAuditStatus = {}));
