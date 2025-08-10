// Dashboard types for Park Angel Admin Dashboard

export interface DashboardMetrics {
  activeOperators: number;
  totalParkingSpots: number;
  todayTransactions: number;
  todayRevenue: number;
  occupancyRate: number;
  averageSessionDuration: number;
  totalUsers: number;
  activeBookings: number;
}

export interface OperatorPerformance {
  operatorId: string;
  operatorName: string;
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  occupancyRate: number;
  customerSatisfaction: number;
  responseTime: number;
  violationReports: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ParkingUtilization {
  locationId: string;
  locationName: string;
  locationType: 'hosted' | 'street' | 'facility';
  totalSpots: number;
  occupiedSpots: number;
  occupancyRate: number;
  averageSessionDuration: number;
  revenue: number;
  peakHours: string[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  parkAngelShare: number;
  operatorShare: number;
  hostShare: number;
  transactionCount: number;
  averageTransactionValue: number;
  revenueByType: {
    hosted: number;
    street: number;
    facility: number;
  };
  monthlyTrend: MonthlyRevenue[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  transactionCount: number;
  growth: number;
}

export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageAmount: number;
  paymentMethods: PaymentMethodStats[];
  hourlyDistribution: HourlyStats[];
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface HourlyStats {
  hour: number;
  transactionCount: number;
  revenue: number;
}

export interface CriticalNotification {
  id: string;
  type: 'violation' | 'system_error' | 'payment_failure' | 'operator_issue' | 'security_alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface SystemHealth {
  apiStatus: 'operational' | 'degraded' | 'down';
  databaseStatus: 'healthy' | 'slow' | 'error';
  paymentGatewayStatus: 'connected' | 'disconnected' | 'error';
  realtimeStatus: 'active' | 'inactive' | 'error';
  lastUpdated: Date;
  responseTime: number;
  uptime: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface DashboardFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  operatorIds?: string[];
  locationTypes?: ('hosted' | 'street' | 'facility')[];
  refreshInterval: number; // in seconds
}

export interface PerformanceMetric {
  feature: string;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  slaTarget: number;
  slaStatus: 'met' | 'warning' | 'breach';
  lastUpdated: Date;
}

export interface RealtimeUpdate {
  type: 'metrics' | 'notification' | 'performance' | 'system_health';
  data: any;
  timestamp: Date;
}