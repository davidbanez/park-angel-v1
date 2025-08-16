export interface HostedListing {
    id: string;
    hostId: string;
    spotId: string;
    title: string;
    description: string;
    photos: string[];
    amenities: string[];
    accessInstructions: string;
    pricing: HostPricing;
    availability: AvailabilitySchedule;
    rating: number;
    totalReviews: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface HostPricing {
    baseRate: number;
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
    currency: string;
    specialOffers?: SpecialOffer[];
}
export interface SpecialOffer {
    id: string;
    name: string;
    discountPercentage: number;
    validFrom: Date;
    validTo: Date;
    conditions?: string;
}
export interface AvailabilitySchedule {
    recurring: RecurringAvailability;
    exceptions: AvailabilityException[];
    blackoutDates: Date[];
}
export interface RecurringAvailability {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
}
export interface DayAvailability {
    isAvailable: boolean;
    timeSlots: HostedTimeSlot[];
}
export interface HostedTimeSlot {
    startTime: string;
    endTime: string;
}
export interface AvailabilityException {
    date: Date;
    isAvailable: boolean;
    timeSlots?: HostedTimeSlot[];
    reason?: string;
}
export interface HostProfile {
    id: string;
    userId: string;
    businessName?: string;
    description: string;
    profilePhoto?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verificationDocuments: VerificationDocument[];
    bankDetails?: HostBankDetails;
    rating: number;
    totalReviews: number;
    joinedAt: Date;
    isActive: boolean;
}
export interface VerificationDocument {
    id: string;
    type: 'identity' | 'property_ownership' | 'business_permit';
    fileName: string;
    fileUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: Date;
    reviewedAt?: Date;
    reviewNotes?: string;
}
export interface HostBankDetails {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    accountType: 'checking' | 'savings';
}
export interface HostPayout {
    id: string;
    hostId: string;
    bookingIds: string[];
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    status: 'pending' | 'processed' | 'failed';
    processedAt?: Date;
    createdAt: Date;
}
export interface HostEarnings {
    totalEarnings: number;
    thisMonth: number;
    lastMonth: number;
    pendingPayouts: number;
    completedBookings: number;
    averageRating: number;
    occupancyRate: number;
}
export interface HostAnalytics {
    period: {
        startDate: Date;
        endDate: Date;
    };
    earnings: {
        total: number;
        byMonth: MonthlyEarnings[];
    };
    bookings: {
        total: number;
        completed: number;
        cancelled: number;
        byMonth: MonthlyBookings[];
    };
    occupancy: {
        rate: number;
        totalHours: number;
        bookedHours: number;
    };
    ratings: {
        average: number;
        distribution: RatingDistribution;
        recentReviews: HostReview[];
    };
}
export interface MonthlyEarnings {
    month: string;
    year: number;
    amount: number;
}
export interface MonthlyBookings {
    month: string;
    year: number;
    count: number;
}
export interface RatingDistribution {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
}
export interface HostReview {
    id: string;
    bookingId: string;
    guestId: string;
    guestName: string;
    rating: number;
    comment: string;
    createdAt: Date;
}
export interface HostOnboardingData {
    personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: Date;
    };
    businessInfo?: {
        businessName: string;
        businessType: string;
        taxId: string;
    };
    propertyInfo: {
        address: string;
        propertyType: 'residential' | 'commercial';
        ownershipType: 'owner' | 'tenant' | 'manager';
    };
    bankingInfo: HostBankDetails;
    documents: {
        identityDocument: File;
        propertyDocument: File;
        businessDocument?: File;
    };
}
export interface CreateHostedListingData {
    title: string;
    description: string;
    spotId: string;
    photos: File[];
    amenities: string[];
    accessInstructions: string;
    pricing: HostPricing;
    availability: AvailabilitySchedule;
}
export interface UpdateHostedListingData extends Partial<CreateHostedListingData> {
    id: string;
}
export interface HostGuestMessage {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image' | 'booking_update' | 'system';
    metadata?: Record<string, any>;
    readAt?: Date;
    createdAt: Date;
}
export interface HostGuestConversation {
    id: string;
    hostId: string;
    guestId: string;
    bookingId?: string;
    lastMessage?: HostGuestMessage;
    unreadCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
