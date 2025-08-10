// Advertisement System Types

export type AdContentType = 'image' | 'video' | 'text' | 'banner' | 'interstitial';
export type AdStatus = 'pending' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
export type AdTargetType = 'section' | 'zone';

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  contentType: AdContentType;
  contentUrl?: string;
  contentText?: string;
  targetLocationId: string;
  targetType: AdTargetType;
  startDate: Date;
  endDate: Date;
  budget: number;
  costPerImpression: number;
  costPerClick: number;
  status: AdStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdContent {
  type: AdContentType;
  url?: string;
  text?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface AdSchedule {
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

export interface AdMetrics {
  id: string;
  advertisementId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  totalCost: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdPayment {
  id: string;
  advertisementId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentReference?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdConflict {
  ad1Id: string;
  ad1Title: string;
  ad2Id: string;
  ad2Title: string;
  targetLocationId: string;
  targetType: AdTargetType;
  conflictStart: Date;
  conflictEnd: Date;
}

export interface CreateAdvertisementRequest {
  title: string;
  description?: string;
  contentType: AdContentType;
  contentUrl?: string;
  contentText?: string;
  targetLocationId: string;
  targetType: AdTargetType;
  startDate: Date;
  endDate: Date;
  budget: number;
  costPerImpression?: number;
  costPerClick?: number;
}

export interface UpdateAdvertisementRequest {
  title?: string;
  description?: string;
  contentType?: AdContentType;
  contentUrl?: string;
  contentText?: string;
  targetLocationId?: string;
  targetType?: AdTargetType;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  costPerImpression?: number;
  costPerClick?: number;
  status?: AdStatus;
}

export interface AdApprovalRequest {
  advertisementId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface AdPerformanceReport {
  advertisementId: string;
  title: string;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalCost: number;
  averageCTR: number; // Click-through rate
  averageCPC: number; // Cost per click
  averageCPM: number; // Cost per mille (thousand impressions)
  conversionRate: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  dailyMetrics: AdMetrics[];
}

export interface AdFilterOptions {
  status?: AdStatus[];
  targetType?: AdTargetType[];
  targetLocationId?: string;
  createdBy?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  searchQuery?: string;
}

export interface AdSortOptions {
  field: 'title' | 'status' | 'startDate' | 'endDate' | 'budget' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface AdListResponse {
  advertisements: Advertisement[];
  totalCount: number;
  hasMore: boolean;
}

export interface AdAnalytics {
  totalAds: number;
  activeAds: number;
  pendingApproval: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  topPerformingAds: {
    id: string;
    title: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}