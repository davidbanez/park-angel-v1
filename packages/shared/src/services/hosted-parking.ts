import { createClient } from '@supabase/supabase-js';
import { validateQueryResult, safeAccess, isValidDatabaseResult } from '../lib/supabase';
import type {
  HostedListing,
  HostProfile,
  HostPayout,
  HostEarnings,
  HostAnalytics,
  HostOnboardingData,
  CreateHostedListingData,
  HostBankDetails,
  HostPricing,
  AvailabilitySchedule,
  UpdateHostedListingData,
  HostGuestMessage,
  HostGuestConversation,
  VerificationDocument,
} from '../types/hosted-parking';

export interface HostedParkingService {
  // Host profile management
  createHostProfile(data: HostOnboardingData): Promise<HostProfile>;
  getHostProfile(hostId: string): Promise<HostProfile | null>;
  updateHostProfile(hostId: string, data: Partial<HostProfile>): Promise<HostProfile>;
  verifyHostDocuments(hostId: string, documentId: string, status: 'approved' | 'rejected', notes?: string): Promise<void>;

  // Listing management
  createListing(data: CreateHostedListingData): Promise<HostedListing>;
  getHostListings(hostId: string): Promise<HostedListing[]>;
  getListing(listingId: string): Promise<HostedListing | null>;
  updateListing(data: UpdateHostedListingData): Promise<HostedListing>;
  deleteListing(listingId: string): Promise<void>;
  toggleListingStatus(listingId: string, isActive: boolean): Promise<void>;

  // Earnings and payouts
  getHostEarnings(hostId: string): Promise<HostEarnings>;
  getHostAnalytics(hostId: string, startDate: Date, endDate: Date): Promise<HostAnalytics>;
  getHostPayouts(hostId: string, limit?: number): Promise<HostPayout[]>;
  processHostPayout(hostId: string, bookingIds: string[]): Promise<HostPayout>;

  // Messaging
  getHostConversations(hostId: string): Promise<HostGuestConversation[]>;
  getConversationMessages(conversationId: string): Promise<HostGuestMessage[]>;
  sendMessage(conversationId: string, senderId: string, content: string, type?: string): Promise<HostGuestMessage>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  // Photo management
  uploadListingPhotos(listingId: string, photos: File[]): Promise<string[]>;
  deleteListingPhoto(listingId: string, photoUrl: string): Promise<void>;

  // Document management
  uploadVerificationDocument(hostId: string, type: string, file: File): Promise<VerificationDocument>;
}

export class SupabaseHostedParkingService implements HostedParkingService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async createHostProfile(data: HostOnboardingData): Promise<HostProfile> {
    try {
      // Create host profile
      const { data: profile, error: profileError } = await this.supabase
        .from('host_profiles')
        .insert({
          user_id: data.personalInfo.email, // This should be the actual user ID
          business_name: data.businessInfo?.businessName,
          description: `Host since ${new Date().getFullYear()}`,
          verification_status: 'pending',
          is_active: true,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Upload verification documents
      const documents: VerificationDocument[] = [];
      
      if (data.documents.identityDocument) {
        const identityDoc = await this.uploadVerificationDocument(
          (profile as any).id as string,
          'identity',
          data.documents.identityDocument
        );
        documents.push(identityDoc);
      }

      if (data.documents.propertyDocument) {
        const propertyDoc = await this.uploadVerificationDocument(
          (profile as any).id as string,
          'property_ownership',
          data.documents.propertyDocument
        );
        documents.push(propertyDoc);
      }

      if (data.documents.businessDocument) {
        const businessDoc = await this.uploadVerificationDocument(
          (profile as any).id as string,
          'business_permit',
          data.documents.businessDocument
        );
        documents.push(businessDoc);
      }

      // Update bank details if provided
      if (data.bankingInfo) {
        await this.supabase
          .from('host_profiles')
          .update({
            bank_details: data.bankingInfo,
          })
          .eq('id', profile.id);
      }

      return {
        id: profile.id as string,
        userId: profile.user_id as string,
        businessName: profile.business_name as string,
        description: profile.description as string,
        profilePhoto: profile.profile_photo as string,
        verificationStatus: profile.verification_status as 'pending' | 'verified' | 'rejected',
        verificationDocuments: documents,
        bankDetails: profile.bank_details as HostBankDetails,
        rating: (profile.rating as number) || 0,
        totalReviews: (profile.total_reviews as number) || 0,
        joinedAt: new Date(profile.created_at as string),
        isActive: profile.is_active as boolean,
      };
    } catch (error) {
      console.error('Error creating host profile:', error);
      throw error;
    }
  }

  async getHostProfile(hostId: string): Promise<HostProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('host_profiles')
        .select(`
          *,
          verification_documents (*)
        `)
        .eq('id', hostId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id as string,
        userId: data.user_id as string,
        businessName: data.business_name as string,
        description: data.description as string,
        profilePhoto: data.profile_photo as string,
        verificationStatus: data.verification_status as 'pending' | 'verified' | 'rejected',
        verificationDocuments: (data.verification_documents as unknown as VerificationDocument[]) || [],
        bankDetails: data.bank_details as HostBankDetails,
        rating: (data.rating as number) || 0,
        totalReviews: (data.total_reviews as number) || 0,
        joinedAt: new Date(data.created_at as string),
        isActive: data.is_active as boolean,
      };
    } catch (error) {
      console.error('Error fetching host profile:', error);
      throw error;
    }
  }

  async updateHostProfile(hostId: string, data: Partial<HostProfile>): Promise<HostProfile> {
    try {
      const { data: updated, error } = await this.supabase
        .from('host_profiles')
        .update({
          business_name: data.businessName,
          description: data.description,
          profile_photo: data.profilePhoto,
          bank_details: data.bankDetails,
          is_active: data.isActive,
        })
        .eq('id', hostId)
        .select()
        .single();

      if (error) throw error;

      const profile = await this.getHostProfile(hostId);
      if (!profile) throw new Error('Host profile not found after update');

      return profile;
    } catch (error) {
      console.error('Error updating host profile:', error);
      throw error;
    }
  }

  async verifyHostDocuments(
    hostId: string,
    documentId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('verification_documents')
        .update({
          status,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      // Check if all documents are approved to update host verification status
      const { data: documents } = await this.supabase
        .from('verification_documents')
        .select('status')
        .eq('host_id', hostId);

      if (documents) {
        const allApproved = documents.every(doc => doc.status === 'approved');
        const anyRejected = documents.some(doc => doc.status === 'rejected');

        let verificationStatus: 'pending' | 'verified' | 'rejected' = 'pending';
        if (allApproved) {
          verificationStatus = 'verified';
        } else if (anyRejected) {
          verificationStatus = 'rejected';
        }

        await this.supabase
          .from('host_profiles')
          .update({ verification_status: verificationStatus })
          .eq('id', hostId);
      }
    } catch (error) {
      console.error('Error verifying host documents:', error);
      throw error;
    }
  }

  async createListing(data: CreateHostedListingData): Promise<HostedListing> {
    try {
      const { data: listing, error } = await this.supabase
        .from('hosted_listings')
        .insert({
          host_id: data.spotId, // This should be the actual host ID
          spot_id: data.spotId,
          title: data.title,
          description: data.description,
          amenities: data.amenities,
          access_instructions: data.accessInstructions,
          pricing: data.pricing,
          availability: data.availability,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload photos if provided
      let photoUrls: string[] = [];
      if (data.photos && data.photos.length > 0) {
        photoUrls = await this.uploadListingPhotos(listing.id as string, data.photos);
        
        // Update listing with photo URLs
        await this.supabase
          .from('hosted_listings')
          .update({ photos: photoUrls })
          .eq('id', listing.id);
      }

      return {
        id: listing.id as string,
        hostId: listing.host_id as string,
        spotId: listing.spot_id as string,
        title: listing.title as string,
        description: listing.description as string,
        photos: photoUrls,
        amenities: (listing.amenities as string[]) || [],
        accessInstructions: listing.access_instructions as string,
        pricing: listing.pricing as HostPricing,
        availability: listing.availability as AvailabilitySchedule,
        rating: (listing.rating as number) || 0,
        totalReviews: (listing.total_reviews as number) || 0,
        isActive: listing.is_active as boolean,
        createdAt: new Date(listing.created_at as string),
        updatedAt: new Date(listing.updated_at as string),
      };
    } catch (error) {
      console.error('Error creating hosted listing:', error);
      throw error;
    }
  }

  async getHostListings(hostId: string): Promise<HostedListing[]> {
    try {
      const { data, error } = await this.supabase
        .from('hosted_listings')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(listing => ({
        id: listing.id as string,
        hostId: listing.host_id as string,
        spotId: listing.spot_id as string,
        title: listing.title as string,
        description: listing.description as string,
        photos: (listing.photos as string[]) || [],
        amenities: (listing.amenities as string[]) || [],
        accessInstructions: listing.access_instructions as string,
        pricing: listing.pricing as HostPricing,
        availability: listing.availability as AvailabilitySchedule,
        rating: (listing.rating as number) || 0,
        totalReviews: (listing.total_reviews as number) || 0,
        isActive: listing.is_active as boolean,
        createdAt: new Date(listing.created_at as string),
        updatedAt: new Date(listing.updated_at as string),
      }));
    } catch (error) {
      console.error('Error fetching host listings:', error);
      throw error;
    }
  }

  async getListing(listingId: string): Promise<HostedListing | null> {
    try {
      const { data, error } = await this.supabase
        .from('hosted_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: String(data.id || ''),
        hostId: String(data.host_id || ''),
        spotId: String(data.spot_id || ''),
        title: String(data.title || ''),
        description: String(data.description || ''),
        photos: Array.isArray(data.photos) ? data.photos : [],
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        accessInstructions: String(data.access_instructions || ''),
        pricing: data.pricing && typeof data.pricing === 'object' ? data.pricing as any : { baseRate: 0, currency: 'USD' },
        availability: data.availability && typeof data.availability === 'object' ? data.availability as any : { recurring: [], exceptions: [], blackoutDates: [] },
        rating: typeof data.rating === 'number' ? data.rating : 0,
        totalReviews: typeof data.total_reviews === 'number' ? data.total_reviews : 0,
        isActive: Boolean(data.is_active),
        createdAt: new Date(String(data.created_at || new Date().toISOString())),
        updatedAt: new Date(String(data.updated_at || new Date().toISOString())),
      };
    } catch (error) {
      console.error('Error fetching hosted listing:', error);
      throw error;
    }
  }

  async updateListing(data: UpdateHostedListingData): Promise<HostedListing> {
    try {
      const { data: updated, error } = await this.supabase
        .from('hosted_listings')
        .update({
          title: data.title,
          description: data.description,
          amenities: data.amenities,
          access_instructions: data.accessInstructions,
          pricing: data.pricing,
          availability: data.availability,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;

      // Handle photo updates if provided
      if (data.photos && data.photos.length > 0) {
        const photoUrls = await this.uploadListingPhotos(data.id, data.photos);
        
        await this.supabase
          .from('hosted_listings')
          .update({ photos: photoUrls })
          .eq('id', data.id);

        updated.photos = photoUrls;
      }

      return {
        id: String(updated.id || ''),
        hostId: String(updated.host_id || ''),
        spotId: String(updated.spot_id || ''),
        title: String(updated.title || ''),
        description: String(updated.description || ''),
        photos: Array.isArray(updated.photos) ? updated.photos : [],
        amenities: Array.isArray(updated.amenities) ? updated.amenities : [],
        accessInstructions: String(updated.access_instructions || ''),
        pricing: updated.pricing && typeof updated.pricing === 'object' ? updated.pricing as any : { baseRate: 0, currency: 'USD' },
        availability: updated.availability && typeof updated.availability === 'object' ? updated.availability as any : { recurring: [], exceptions: [], blackoutDates: [] },
        rating: typeof updated.rating === 'number' ? updated.rating : 0,
        totalReviews: typeof updated.total_reviews === 'number' ? updated.total_reviews : 0,
        isActive: Boolean(updated.is_active),
        createdAt: new Date(String(updated.created_at || new Date().toISOString())),
        updatedAt: new Date(String(updated.updated_at || new Date().toISOString())),
      };
    } catch (error) {
      console.error('Error updating hosted listing:', error);
      throw error;
    }
  }

  async deleteListing(listingId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('hosted_listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting hosted listing:', error);
      throw error;
    }
  }

  async toggleListingStatus(listingId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('hosted_listings')
        .update({ is_active: isActive })
        .eq('id', listingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling listing status:', error);
      throw error;
    }
  }

  async getHostEarnings(hostId: string): Promise<HostEarnings> {
    try {
      // This would need to be implemented based on the actual booking and payment tables
      // For now, returning mock data structure
      const currentDate = new Date();
      const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

      // Get earnings data from host_payouts and bookings
      const { data: payouts } = await this.supabase
        .from('host_payouts')
        .select('*')
        .eq('host_id', hostId)
        .eq('status', 'processed');

      const totalEarnings = payouts?.reduce((sum, payout) => {
        const netAmount = typeof payout.net_amount === 'number' ? payout.net_amount : 0;
        return sum + netAmount;
      }, 0) || 0;

      return {
        totalEarnings,
        thisMonth: 0, // Calculate based on current month payouts
        lastMonth: 0, // Calculate based on last month payouts
        pendingPayouts: 0, // Calculate pending payouts
        completedBookings: 0, // Calculate from bookings table
        averageRating: 0, // Calculate from reviews
        occupancyRate: 0, // Calculate based on bookings vs availability
      };
    } catch (error) {
      console.error('Error fetching host earnings:', error);
      throw error;
    }
  }

  async getHostAnalytics(hostId: string, startDate: Date, endDate: Date): Promise<HostAnalytics> {
    try {
      // This would need comprehensive implementation based on actual data
      // For now, returning basic structure
      return {
        period: { startDate, endDate },
        earnings: {
          total: 0,
          byMonth: [],
        },
        bookings: {
          total: 0,
          completed: 0,
          cancelled: 0,
          byMonth: [],
        },
        occupancy: {
          rate: 0,
          totalHours: 0,
          bookedHours: 0,
        },
        ratings: {
          average: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          recentReviews: [],
        },
      };
    } catch (error) {
      console.error('Error fetching host analytics:', error);
      throw error;
    }
  }

  async getHostPayouts(hostId: string, limit = 20): Promise<HostPayout[]> {
    try {
      const { data, error } = await this.supabase
        .from('host_payouts')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(payout => ({
        id: String(payout.id || ''),
        hostId: String(payout.host_id || ''),
        bookingIds: Array.isArray(payout.booking_ids) ? payout.booking_ids : [],
        grossAmount: typeof payout.gross_amount === 'number' ? payout.gross_amount : 0,
        platformFee: typeof payout.platform_fee === 'number' ? payout.platform_fee : 0,
        netAmount: typeof payout.net_amount === 'number' ? payout.net_amount : 0,
        status: (payout.status === 'pending' || payout.status === 'processed' || payout.status === 'failed') 
          ? payout.status 
          : 'pending' as const,
        processedAt: payout.processed_at ? new Date(String(payout.processed_at)) : undefined,
        createdAt: new Date(String(payout.created_at || new Date().toISOString())),
      }));
    } catch (error) {
      console.error('Error fetching host payouts:', error);
      throw error;
    }
  }

  async processHostPayout(hostId: string, bookingIds: string[]): Promise<HostPayout> {
    try {
      // Calculate payout amounts based on bookings
      // This would need to integrate with the actual payment processing system
      const grossAmount = 1000; // Calculate from bookings
      const platformFee = grossAmount * 0.4; // 40% platform fee
      const netAmount = grossAmount - platformFee;

      const { data, error } = await this.supabase
        .from('host_payouts')
        .insert({
          host_id: hostId,
          booking_ids: bookingIds,
          gross_amount: grossAmount,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: String(data.id || ''),
        hostId: String(data.host_id || ''),
        bookingIds: Array.isArray(data.booking_ids) ? data.booking_ids : [],
        grossAmount: typeof data.gross_amount === 'number' ? data.gross_amount : 0,
        platformFee: typeof data.platform_fee === 'number' ? data.platform_fee : 0,
        netAmount: typeof data.net_amount === 'number' ? data.net_amount : 0,
        status: (data.status === 'pending' || data.status === 'processed' || data.status === 'failed') 
          ? data.status 
          : 'pending' as const,
        processedAt: data.processed_at ? new Date(String(data.processed_at)) : undefined,
        createdAt: new Date(String(data.created_at || new Date().toISOString())),
      };
    } catch (error) {
      console.error('Error processing host payout:', error);
      throw error;
    }
  }

  async getHostConversations(hostId: string): Promise<HostGuestConversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            content,
            sender_id,
            created_at
          )
        `)
        .contains('participants', [hostId])
        .eq('type', 'user_host')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(conv => ({
        id: String(conv.id || ''),
        hostId,
        guestId: Array.isArray(conv.participants) 
          ? conv.participants.find((p: string) => p !== hostId) || ''
          : '',
        bookingId: String(conv.booking_id || ''),
        lastMessage: Array.isArray(conv.messages) && conv.messages.length > 0 ? {
          id: String((conv.messages[0] as any).id || ''),
          conversationId: String(conv.id || ''),
          senderId: String((conv.messages[0] as any).sender_id || ''),
          receiverId: Array.isArray(conv.participants) 
            ? conv.participants.find((p: string) => p !== (conv.messages[0] as any).sender_id) || ''
            : '',
          content: String((conv.messages[0] as any).content || ''),
          type: 'text' as const,
          createdAt: new Date(String((conv.messages[0] as any).created_at || new Date().toISOString())),
        } : undefined,
        unreadCount: 0, // Calculate based on read status
        isActive: Boolean(conv.is_active),
        createdAt: new Date(String(conv.created_at || new Date().toISOString())),
        updatedAt: new Date(String(conv.updated_at || new Date().toISOString())),
      }));
    } catch (error) {
      console.error('Error fetching host conversations:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId: string): Promise<HostGuestMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => ({
        id: String(msg.id || ''),
        conversationId: String(msg.conversation_id || ''),
        senderId: String(msg.sender_id || ''),
        receiverId: String(msg.receiver_id || ''),
        content: String(msg.content || ''),
        type: (msg.type === 'text' || msg.type === 'image' || msg.type === 'booking_update' || msg.type === 'system') 
          ? msg.type 
          : 'text' as const,
        metadata: msg.metadata || {},
        readAt: msg.read_at ? new Date(String(msg.read_at)) : undefined,
        createdAt: new Date(String(msg.created_at || new Date().toISOString())),
      }));
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type = 'text'
  ): Promise<HostGuestMessage> {
    try {
      // Get conversation to find receiver
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      if (!conversation) throw new Error('Conversation not found');

      const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
      const receiverId = participants.find((p: string) => p !== senderId);
      if (!receiverId) throw new Error('Receiver not found');

      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          type,
          is_encrypted: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's updated_at
      await this.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return {
        id: String(data.id || ''),
        conversationId: String(data.conversation_id || ''),
        senderId: String(data.sender_id || ''),
        receiverId: String(data.receiver_id || ''),
        content: String(data.content || ''),
        type: (data.type === 'text' || data.type === 'image' || data.type === 'booking_update' || data.type === 'system') 
          ? data.type 
          : 'text' as const,
        metadata: data.metadata || {},
        readAt: data.read_at ? new Date(String(data.read_at)) : undefined,
        createdAt: new Date(String(data.created_at || new Date().toISOString())),
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await this.supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async uploadListingPhotos(listingId: string, photos: File[]): Promise<string[]> {
    try {
      const photoUrls: string[] = [];

      for (const photo of photos) {
        const fileName = `${listingId}/${Date.now()}-${photo.name}`;
        
        const { data, error } = await this.supabase.storage
          .from('listing-photos')
          .upload(fileName, photo);

        if (error) throw error;

        const { data: { publicUrl } } = this.supabase.storage
          .from('listing-photos')
          .getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }

      return photoUrls;
    } catch (error) {
      console.error('Error uploading listing photos:', error);
      throw error;
    }
  }

  async deleteListingPhoto(listingId: string, photoUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const fileName = photoUrl.split('/').pop();
      if (!fileName) throw new Error('Invalid photo URL');

      const { error } = await this.supabase.storage
        .from('listing-photos')
        .remove([`${listingId}/${fileName}`]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting listing photo:', error);
      throw error;
    }
  }

  async uploadVerificationDocument(
    hostId: string,
    type: string,
    file: File
  ): Promise<VerificationDocument> {
    try {
      const fileName = `${hostId}/${type}-${Date.now()}-${file.name}`;
      
      const { data, error } = await this.supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      const { data: document, error: docError } = await this.supabase
        .from('verification_documents')
        .insert({
          host_id: hostId,
          type,
          file_name: file.name,
          file_url: publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (docError) throw docError;

      return {
        id: String(document.id || ''),
        type: (document.type === 'identity' || document.type === 'property_ownership' || document.type === 'business_permit') 
          ? document.type 
          : 'identity' as const,
        fileName: String(document.file_name || ''),
        fileUrl: String(document.file_url || ''),
        status: (document.status === 'pending' || document.status === 'approved' || document.status === 'rejected') 
          ? document.status 
          : 'pending' as const,
        uploadedAt: new Date(String(document.created_at || new Date().toISOString())),
        reviewedAt: document.reviewed_at ? new Date(String(document.reviewed_at)) : undefined,
        reviewNotes: document.review_notes ? String(document.review_notes) : undefined,
      };
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw error;
    }
  }
}