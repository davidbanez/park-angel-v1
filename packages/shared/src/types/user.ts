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
}

export type DiscountType = 'senior' | 'pwd' | 'custom';
