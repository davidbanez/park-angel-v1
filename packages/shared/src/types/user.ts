// User-related type definitions
export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  authProvider: 'email' | 'google' | 'facebook';
  userType: 'client' | 'host' | 'operator' | 'admin' | 'pos';
  status: 'active' | 'inactive' | 'suspended';
  discountEligibility: DiscountType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  address?: string;
}

export type DiscountType = 'senior' | 'pwd' | 'custom';

// VIP Management Types
export type VIPType = 'vvip' | 'flex_vvip' | 'spot_vip' | 'spot_flex_vip';

export interface VIPAssignment {
  id: string;
  userId: string;
  operatorId: string;
  vipType: VIPType;
  assignedSpots: string[];
  timeLimitHours?: number;
  notes?: string;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Support Types
export interface CustomerSupportConversation {
  id: string;
  customerId: string;
  operatorId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  messages?: CustomerSupportMessage[];
}

export interface CustomerSupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: Date;
}

// Customer Analytics Types
export interface CustomerAnalytics {
  id: string;
  customerId: string;
  operatorId: string;
  totalBookings: number;
  totalSpent: number;
  averageSessionDuration?: number;
  favoriteLocations: string[];
  lastBookingDate?: Date;
  customerSince: Date;
  loyaltyScore: number;
  updatedAt: Date;
}

// Extended Customer Profile for Management
export interface CustomerProfile extends User {
  profile: UserProfile;
  vipAssignments?: VIPAssignment[];
  analytics?: CustomerAnalytics;
  supportConversations?: CustomerSupportConversation[];
}
