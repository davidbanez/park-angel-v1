// Operator management types
export interface OperatorProfile {
  id: string;
  operatorId: string;
  companyName: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  businessAddress: Address;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  businessType?: 'individual' | 'corporation' | 'partnership';
  licenseNumber?: string;
  licenseExpiryDate?: Date;
  isVerified: boolean;
  verificationDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorBankDetails {
  id: string;
  operatorId: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  branchName?: string;
  branchAddress?: string;
  accountType: 'checking' | 'savings';
  isPrimary: boolean;
  isVerified: boolean;
  verificationDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorRevenueConfig {
  id: string;
  operatorId: string;
  parkingType: 'hosted' | 'street' | 'facility';
  operatorPercentage: number;
  parkAngelPercentage: number;
  isActive: boolean;
  effectiveDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorRemittance {
  id: string;
  operatorId: string;
  bankDetailId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  operatorShare: number;
  parkAngelShare: number;
  transactionCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentReference?: string;
  processedAt?: Date;
  processedBy?: string;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VIPAssignment {
  id: string;
  userId: string;
  operatorId: string;
  vipType: 'VVIP' | 'Flex VVIP' | 'VIP' | 'Spot VIP';
  locationId?: string;
  spotIds: string[];
  timeLimitMinutes?: number;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
  assignedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorPerformanceMetrics {
  id: string;
  operatorId: string;
  metricDate: Date;
  totalSpots: number;
  occupiedSpots: number;
  occupancyRate: number;
  totalRevenue: number;
  transactionCount: number;
  averageSessionDuration: number;
  customerSatisfactionScore?: number;
  violationReports: number;
  responseTimeAvg?: number;
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

// Data Transfer Objects
export interface CreateOperatorProfileData {
  operatorId: string;
  companyName: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  businessAddress: Address;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  businessType?: 'individual' | 'corporation' | 'partnership';
  licenseNumber?: string;
  licenseExpiryDate?: Date;
  verificationDocuments?: string[];
}

export interface CreateOperatorBankDetailsData {
  operatorId: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  branchName?: string;
  branchAddress?: string;
  accountType: 'checking' | 'savings';
  isPrimary?: boolean;
  verificationDocuments?: string[];
}

export interface CreateOperatorRevenueConfigData {
  operatorId: string;
  parkingType: 'hosted' | 'street' | 'facility';
  operatorPercentage: number;
  parkAngelPercentage: number;
  effectiveDate?: Date;
  createdBy: string;
}

export interface CreateVIPAssignmentData {
  userId: string;
  operatorId: string;
  vipType: 'VVIP' | 'Flex VVIP' | 'VIP' | 'Spot VIP';
  locationId?: string;
  spotIds?: string[];
  timeLimitMinutes?: number;
  validFrom?: Date;
  validUntil?: Date;
  assignedBy: string;
  notes?: string;
}

export interface UpdateOperatorProfileData {
  companyName?: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  businessAddress?: Address;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  businessType?: 'individual' | 'corporation' | 'partnership';
  licenseNumber?: string;
  licenseExpiryDate?: Date;
  verificationDocuments?: string[];
}

export interface OperatorSummary {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  isVerified: boolean;
  totalLocations: number;
  totalSpots: number;
  currentOccupancyRate: number;
  monthlyRevenue: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}

export interface OperatorDashboardMetrics {
  operatorId: string;
  totalLocations: number;
  totalSpots: number;
  occupiedSpots: number;
  occupancyRate: number;
  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalTransactions: number;
  averageSessionDuration: number;
  customerSatisfactionScore: number;
  pendingRemittances: number;
  lastRemittanceDate?: Date;
  vipUsersCount: number;
  violationReports: number;
}

export interface RemittanceCalculation {
  operatorId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  operatorShare: number;
  parkAngelShare: number;
  transactionCount: number;
  breakdown: {
    streetParking: number;
    facilityParking: number;
    hostedParking: number;
  };
}