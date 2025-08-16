import { supabase } from '../lib/supabase';
import type { 
  CustomerProfile, 
  VIPAssignment, 
  VIPType, 
  CustomerSupportConversation, 
  CustomerSupportMessage,
  CustomerAnalytics 
} from '../types/user';
import { DiscountType } from '../types/common';

export class CustomerManagementService {
  // Customer Profile Management
  async getCustomers(_operatorId: string, filters?: {
    search?: string;
    status?: string;
    vipType?: VIPType;
    limit?: number;
    offset?: number;
  }): Promise<{ customers: CustomerProfile[]; total: number }> {
    let query = supabase
      .from('users')
      .select(`
        *,
        user_profiles(*),
        vip_assignments!vip_assignments_user_id_fkey(
          *,
          created_by_user:users!vip_assignments_created_by_fkey(email)
        ),
        customer_analytics!customer_analytics_customer_id_fkey(*)
      `)
      .eq('user_type', 'client')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.or(`
        email.ilike.%${filters.search}%,
        user_profiles.first_name.ilike.%${filters.search}%,
        user_profiles.last_name.ilike.%${filters.search}%
      `);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as 'active' | 'inactive' | 'suspended');
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    // Filter by VIP type if specified
    let customers = data || [];
    if (filters?.vipType) {
      customers = customers.filter(customer => 
        customer.vip_assignments?.some((vip: any) => 
          vip.vip_type === filters.vipType && vip.is_active
        )
      );
    }

    // Transform data to match interface
    const transformedCustomers: CustomerProfile[] = customers.map(customer => ({
      id: customer.id,
      email: customer.email,
      userType: customer.user_type,
      status: customer.status as 'active' | 'inactive' | 'suspended',
      discountEligibility: (customer.user_profiles?.discount_eligibility || []) as DiscountType[],
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at),
      authProvider: 'email', // Default, would need to be determined from auth provider
      profile: {
        firstName: customer.user_profiles?.first_name || '',
        lastName: customer.user_profiles?.last_name || '',
        phone: customer.user_profiles?.phone,
        avatar: customer.user_profiles?.avatar_url,
        dateOfBirth: customer.user_profiles?.date_of_birth ? new Date(customer.user_profiles.date_of_birth) : undefined,
        address: customer.user_profiles?.address
      },
      vipAssignments: customer.vip_assignments?.map((vip: any) => ({
        id: vip.id,
        userId: vip.user_id,
        operatorId: vip.operator_id,
        vipType: vip.vip_type,
        assignedSpots: vip.assigned_spots || [],
        timeLimitHours: vip.time_limit_hours,
        notes: vip.notes,
        isActive: vip.is_active,
        validFrom: new Date(vip.valid_from),
        validUntil: vip.valid_until ? new Date(vip.valid_until) : undefined,
        createdBy: vip.created_by,
        createdAt: new Date(vip.created_at),
        updatedAt: new Date(vip.updated_at)
      })) || [],
      analytics: customer.customer_analytics?.[0] ? {
        id: customer.customer_analytics[0].id,
        customerId: customer.customer_analytics[0].customer_id,
        operatorId: customer.customer_analytics[0].operator_id,
        totalBookings: customer.customer_analytics[0].total_bookings,
        totalSpent: customer.customer_analytics[0].total_spent,
        averageSessionDuration: customer.customer_analytics[0].average_session_duration,
        favoriteLocations: customer.customer_analytics[0].favorite_locations || [],
        lastBookingDate: customer.customer_analytics[0].last_booking_date ? new Date(customer.customer_analytics[0].last_booking_date) : undefined,
        customerSince: new Date(customer.customer_analytics[0].customer_since),
        loyaltyScore: customer.customer_analytics[0].loyalty_score,
        updatedAt: new Date(customer.customer_analytics[0].updated_at)
      } : undefined
    }));

    return {
      customers: transformedCustomers,
      total: count || 0
    };
  }

  async getCustomerById(customerId: string): Promise<CustomerProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_profiles(*),
        vip_assignments!vip_assignments_user_id_fkey(*),
        customer_analytics!customer_analytics_customer_id_fkey(*)
      `)
      .eq('id', customerId)
      .eq('user_type', 'client')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      userType: data.user_type,
      status: data.status as 'active' | 'inactive' | 'suspended',
      discountEligibility: (data.user_profiles?.discount_eligibility || []) as DiscountType[],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      authProvider: 'email',
      profile: {
        firstName: data.user_profiles?.first_name || '',
        lastName: data.user_profiles?.last_name || '',
        phone: data.user_profiles?.phone,
        avatar: data.user_profiles?.avatar_url,
        dateOfBirth: data.user_profiles?.date_of_birth ? new Date(data.user_profiles.date_of_birth) : undefined,
        address: data.user_profiles?.address
      },
      vipAssignments: data.vip_assignments?.map((vip: any) => ({
        id: vip.id,
        userId: vip.user_id,
        operatorId: vip.operator_id,
        vipType: vip.vip_type,
        assignedSpots: vip.assigned_spots || [],
        timeLimitHours: vip.time_limit_hours,
        notes: vip.notes,
        isActive: vip.is_active,
        validFrom: new Date(vip.valid_from),
        validUntil: vip.valid_until ? new Date(vip.valid_until) : undefined,
        createdBy: vip.created_by,
        createdAt: new Date(vip.created_at),
        updatedAt: new Date(vip.updated_at)
      })) || [],
      analytics: data.customer_analytics?.[0] ? {
        id: data.customer_analytics[0].id,
        customerId: data.customer_analytics[0].customer_id,
        operatorId: data.customer_analytics[0].operator_id,
        totalBookings: data.customer_analytics[0].total_bookings,
        totalSpent: data.customer_analytics[0].total_spent,
        averageSessionDuration: data.customer_analytics[0].average_session_duration,
        favoriteLocations: data.customer_analytics[0].favorite_locations || [],
        lastBookingDate: data.customer_analytics[0].last_booking_date ? new Date(data.customer_analytics[0].last_booking_date) : undefined,
        customerSince: new Date(data.customer_analytics[0].customer_since),
        loyaltyScore: data.customer_analytics[0].loyalty_score,
        updatedAt: new Date(data.customer_analytics[0].updated_at)
      } : undefined
    };
  }

  async updateCustomerStatus(customerId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (error) {
      throw new Error(`Failed to update customer status: ${error.message}`);
    }
  }

  // VIP Management
  async assignVIP(vipAssignment: Omit<VIPAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<VIPAssignment> {
    const { data, error } = await supabase
      .from('vip_assignments')
      .insert({
        user_id: vipAssignment.userId,
        operator_id: vipAssignment.operatorId,
        vip_type: vipAssignment.vipType,
        assigned_spots: JSON.stringify(vipAssignment.assignedSpots),
        time_limit_hours: vipAssignment.timeLimitHours,
        notes: vipAssignment.notes,
        is_active: vipAssignment.isActive,
        valid_from: vipAssignment.validFrom.toISOString(),
        valid_until: vipAssignment.validUntil?.toISOString(),
        created_by: vipAssignment.createdBy
      })
      .select('*, time_limit_hours, created_by')
      .single();

    if (error) {
      throw new Error(`Failed to assign VIP: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      operatorId: data.operator_id,
      vipType: data.vip_type as VIPType,
      assignedSpots: JSON.parse(data.assigned_spots as string || '[]'),
      timeLimitHours: data.time_limit_hours,
      notes: data.notes,
      isActive: data.is_active,
      validFrom: new Date(data.valid_from),
      validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateVIPAssignment(vipId: string, updates: Partial<VIPAssignment>): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.vipType) updateData.vip_type = updates.vipType;
    if (updates.assignedSpots) updateData.assigned_spots = updates.assignedSpots;
    if (updates.timeLimitHours !== undefined) updateData.time_limit_hours = updates.timeLimitHours;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.validFrom) updateData.valid_from = updates.validFrom.toISOString();
    if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil?.toISOString();

    const { error } = await supabase
      .from('vip_assignments')
      .update(updateData)
      .eq('id', vipId);

    if (error) {
      throw new Error(`Failed to update VIP assignment: ${error.message}`);
    }
  }

  async removeVIPAssignment(vipId: string): Promise<void> {
    const { error } = await supabase
      .from('vip_assignments')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', vipId);

    if (error) {
      throw new Error(`Failed to remove VIP assignment: ${error.message}`);
    }
  }

  // Customer Support
  async createSupportConversation(conversation: Omit<CustomerSupportConversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerSupportConversation> {
    const { data, error } = await supabase
      .from('customer_support_conversations')
      .insert({
        customer_id: conversation.customerId,
        operator_id: conversation.operatorId,
        subject: conversation.subject,
        status: conversation.status,
        priority: conversation.priority
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support conversation: ${error.message}`);
    }

    return {
      id: data.id,
      customerId: data.customer_id,
      operatorId: data.operator_id,
      subject: data.subject,
      status: data.status as 'open' | 'in_progress' | 'resolved' | 'closed',
      priority: data.priority as 'high' | 'medium' | 'low' | 'urgent',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getSupportConversations(operatorId: string, customerId?: string): Promise<CustomerSupportConversation[]> {
    let query = supabase
      .from('customer_support_conversations')
      .select(`
        *,
        customer:users!customer_support_conversations_customer_id_fkey(email, user_profiles(first_name, last_name))
      `)
      .eq('operator_id', operatorId)
      .order('updated_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch support conversations: ${error.message}`);
    }

    return (data || []).map(conv => ({
      id: conv.id,
      customerId: conv.customer_id,
      operatorId: conv.operator_id,
      subject: conv.subject,
      status: conv.status as 'open' | 'in_progress' | 'resolved' | 'closed',
      priority: conv.priority,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at)
    }));
  }

  async addSupportMessage(message: Omit<CustomerSupportMessage, 'id' | 'createdAt'>): Promise<CustomerSupportMessage> {
    const { data, error } = await supabase
      .from('customer_support_messages')
      .insert({
        conversation_id: message.conversationId,
        sender_id: message.senderId,
        message: message.message,
        attachments: message.attachments,
        is_internal: message.isInternal
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add support message: ${error.message}`);
    }

    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      message: data.message,
      attachments: JSON.parse(data.attachments as string || '[]'),
      isInternal: data.is_internal,
      createdAt: new Date(data.created_at)
    };
  }

  async updateConversationStatus(conversationId: string, status: CustomerSupportConversation['status']): Promise<void> {
    const { error } = await supabase
      .from('customer_support_conversations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Failed to update conversation status: ${error.message}`);
    }
  }

  // Customer Analytics
  async getCustomerAnalytics(operatorId: string, customerId?: string): Promise<CustomerAnalytics[]> {
    let query = supabase
      .from('customer_analytics')
      .select('*')
      .eq('operator_id', operatorId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customer analytics: ${error.message}`);
    }

    return (data || []).map(analytics => ({
      id: analytics.id,
      customerId: analytics.customer_id,
      operatorId: analytics.operator_id,
      totalBookings: analytics.total_bookings,
      totalSpent: analytics.total_spent,
      averageSessionDuration: analytics.average_session_duration,
      favoriteLocations: analytics.favorite_locations || [],
      lastBookingDate: analytics.last_booking_date ? new Date(analytics.last_booking_date) : undefined,
      customerSince: new Date(analytics.customer_since),
      loyaltyScore: analytics.loyalty_score,
      updatedAt: new Date(analytics.updated_at)
    }));
  }
}

export const customerManagementService = new CustomerManagementService();