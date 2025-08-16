// Operator-specific reporting types for Park Angel
export var OperatorReportType;
(function (OperatorReportType) {
    OperatorReportType["REVENUE_REPORT"] = "revenue_report";
    OperatorReportType["OCCUPANCY_REPORT"] = "occupancy_report";
    OperatorReportType["USER_BEHAVIOR_REPORT"] = "user_behavior_report";
    OperatorReportType["VIOLATION_REPORT"] = "violation_report";
    OperatorReportType["VIP_USAGE_REPORT"] = "vip_usage_report";
    OperatorReportType["ZONE_PERFORMANCE_REPORT"] = "zone_performance_report";
    OperatorReportType["VEHICLE_TYPE_ANALYTICS"] = "vehicle_type_analytics";
    OperatorReportType["OPERATIONAL_SUMMARY"] = "operational_summary";
})(OperatorReportType || (OperatorReportType = {}));
// Export formats
export var ExportFormat;
(function (ExportFormat) {
    ExportFormat["PDF"] = "pdf";
    ExportFormat["EXCEL"] = "excel";
    ExportFormat["CSV"] = "csv";
    ExportFormat["JSON"] = "json";
})(ExportFormat || (ExportFormat = {}));
