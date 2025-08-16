export interface POSSession {
  id: string;
  operatorId: string;
  startTime: Date;
  endTime?: Date;
  currentCashAmount: number;
  previousCashAmount: number;
  endCashAmount?: number;
  transactions: POSTransaction[];
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface POSTransaction {
  id: string;
  sessionId: string;
  type: 'parking_fee' | 'discount' | 'cash_adjustment' | 'refund';
  amount: number;
  description: string;
  parkingSessionId?: string;
  vehiclePlateNumber?: string;
  discountType?: 'senior' | 'pwd' | 'custom';
  vatAmount?: number;
  timestamp: Date;
  receiptNumber: string;
}

export interface ViolationReport {
  id: string;
  reportedBy: string;
  vehiclePlateNumber: string;
  violationType: 'illegal_parking' | 'expired_session' | 'no_payment' | 'blocking_access' | 'disabled_spot_violation' | 'other';
  description: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  locationId?: string;
  spotId?: string;
  status: 'reported' | 'in_progress' | 'resolved' | 'dismissed' | 'escalated';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  enforcementAction?: 'warning' | 'towing' | 'clamping' | 'fine' | 'none';
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface EnforcementAction {
  id: string;
  violationReportId: string;
  actionType: 'towing' | 'clamping' | 'warning' | 'fine';
  requestedBy: string;
  assignedTo?: string;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedCost?: number;
  actualCost?: number;
  serviceProvider?: string;
  serviceProviderContact?: string;
  scheduledTime?: Date;
  startedAt?: Date;
  completedAt?: Date;
  completionPhotos?: string[];
  completionNotes?: string;
  customerNotified: boolean;
  customerNotificationMethod?: 'sms' | 'email' | 'call' | 'app';
  paymentStatus: 'pending' | 'paid' | 'disputed' | 'waived';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViolationMonitoringSummary {
  id: string;
  locationId: string;
  operatorId: string;
  reportDate: Date;
  totalViolationsReported: number;
  violationsByType: Record<string, number>;
  totalEnforcementActions: number;
  enforcementByType: Record<string, number>;
  avgResponseTimeMinutes?: number;
  resolutionRate?: number;
  totalFinesIssued: number;
  totalEnforcementCosts: number;
  aiAccuracyRate?: number;
}

export interface ParkingSession {
  id: string;
  operatorId: string;
  spotId: string;
  vehiclePlateNumber: string;
  vehicleType: 'car' | 'motorcycle' | 'truck' | 'van';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  amount: number;
  discounts: AppliedDiscount[];
  vatAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'digital_wallet';
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  receiptNumber: string;
  notes?: string;
}

export interface AppliedDiscount {
  type: 'senior' | 'pwd' | 'custom';
  name: string;
  percentage: number;
  amount: number;
  isVATExempt: boolean;
  documentNumber?: string;
}

export interface CashDrawerOperation {
  id: string;
  sessionId: string;
  type: 'open' | 'close' | 'count' | 'adjustment';
  amount?: number;
  reason?: string;
  timestamp: Date;
  operatorId: string;
}

export interface ReceiptData {
  receiptNumber: string;
  timestamp: Date;
  operatorName: string;
  locationName: string;
  items: ReceiptItem[];
  subtotal: number;
  discounts: AppliedDiscount[];
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  changeAmount?: number;
  customerInfo?: {
    plateNumber: string;
    vehicleType: string;
  };
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LicensePlateRecognition {
  plateNumber: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: Date;
  imageUri: string;
}

export interface POSHardwareStatus {
  cashDrawer: {
    connected: boolean;
    model?: string;
    status: 'closed' | 'open' | 'error';
  };
  printer: {
    connected: boolean;
    model?: string;
    paperStatus: 'ok' | 'low' | 'empty';
    status: 'ready' | 'printing' | 'error';
  };
  scanner: {
    available: boolean;
    type: 'camera' | 'dedicated';
    status: 'ready' | 'scanning' | 'error';
  };
  biometric: {
    available: boolean;
    type: 'fingerprint' | 'face' | 'both';
    enrolled: boolean;
  };
}