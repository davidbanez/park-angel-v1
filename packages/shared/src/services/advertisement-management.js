// Advertisement Management Service
import { supabase } from '../lib/supabase';
export class AdvertisementManagementService {
    /**
     * Create a new advertisement
     */
    async createAdvertisement(request) {
        // Check for conflicts before creating
        const conflicts = await this.checkConflicts(request.targetLocationId, request.targetType, request.startDate, request.endDate);
        if (conflicts.length > 0) {
            throw new Error(`Advertisement conflicts detected with existing ads: ${conflicts.map(c => c.ad2Title).join(', ')}`);
        }
        const { data, error } = await supabase
            .from('advertisements')
            .insert({
            title: request.title,
            content: {
                type: request.contentType,
                url: request.contentUrl,
                text: request.contentText,
                description: request.description
            },
            target_location: request.targetLocationId,
            target_type: request.targetType,
            schedule: {
                start_date: request.startDate.toISOString(),
                end_date: request.endDate.toISOString()
            },
            budget: request.budget,
            cost_per_impression: request.costPerImpression || 0,
            cost_per_click: request.costPerClick || 0,
            created_by: (await supabase.auth.getUser()).data.user?.id
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create advertisement: ${error.message}`);
        }
        return this.mapDatabaseToAdvertisement(data);
    }
    /**
     * Get advertisement by ID
     */
    async getAdvertisement(id) {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to get advertisement: ${error.message}`);
        }
        return this.mapDatabaseToAdvertisement(data);
    }
    /**
     * List advertisements with filtering and pagination
     */
    async listAdvertisements(filters, sort, page = 1, limit = 20) {
        let query = supabase
            .from('advertisements')
            .select('*', { count: 'exact' });
        // Apply filters
        if (filters?.status && filters.status.length > 0) {
            query = query.in('status', filters.status);
        }
        if (filters?.targetType && filters.targetType.length > 0) {
            query = query.in('target_type', filters.targetType);
        }
        if (filters?.targetLocationId) {
            query = query.eq('target_location_id', filters.targetLocationId);
        }
        if (filters?.createdBy) {
            query = query.eq('created_by', filters.createdBy);
        }
        if (filters?.dateRange) {
            query = query
                .gte('start_date', filters.dateRange.startDate.toISOString())
                .lte('end_date', filters.dateRange.endDate.toISOString());
        }
        if (filters?.searchQuery) {
            query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
        }
        // Apply sorting
        if (sort) {
            const column = this.mapSortFieldToColumn(sort.field);
            query = query.order(column, { ascending: sort.direction === 'asc' });
        }
        else {
            query = query.order('created_at', { ascending: false });
        }
        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error) {
            throw new Error(`Failed to list advertisements: ${error.message}`);
        }
        const advertisements = data?.map((item) => this.mapDatabaseToAdvertisement(item)) || [];
        return {
            advertisements,
            totalCount: count || 0,
            hasMore: (count || 0) > offset + limit
        };
    }
    /**
     * Update advertisement
     */
    async updateAdvertisement(id, request) {
        // Check for conflicts if location or dates are being updated
        if (request.targetLocationId || request.targetType || request.startDate || request.endDate) {
            const current = await this.getAdvertisement(id);
            if (!current) {
                throw new Error('Advertisement not found');
            }
            const conflicts = await this.checkConflicts(request.targetLocationId || current.targetLocationId, request.targetType || current.targetType, request.startDate || current.startDate, request.endDate || current.endDate, id);
            if (conflicts.length > 0) {
                throw new Error(`Advertisement conflicts detected: ${conflicts.map(c => c.ad2Title).join(', ')}`);
            }
        }
        const updateData = {};
        if (request.title !== undefined)
            updateData.title = request.title;
        if (request.description !== undefined)
            updateData.description = request.description;
        if (request.contentType !== undefined)
            updateData.content_type = request.contentType;
        if (request.contentUrl !== undefined)
            updateData.content_url = request.contentUrl;
        if (request.contentText !== undefined)
            updateData.content_text = request.contentText;
        if (request.targetLocationId !== undefined)
            updateData.target_location_id = request.targetLocationId;
        if (request.targetType !== undefined)
            updateData.target_type = request.targetType;
        if (request.startDate !== undefined)
            updateData.start_date = request.startDate.toISOString();
        if (request.endDate !== undefined)
            updateData.end_date = request.endDate.toISOString();
        if (request.budget !== undefined)
            updateData.budget = request.budget;
        if (request.costPerImpression !== undefined)
            updateData.cost_per_impression = request.costPerImpression;
        if (request.costPerClick !== undefined)
            updateData.cost_per_click = request.costPerClick;
        if (request.status !== undefined)
            updateData.status = request.status;
        const { data, error } = await supabase
            .from('advertisements')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update advertisement: ${error.message}`);
        }
        return this.mapDatabaseToAdvertisement(data);
    }
    /**
     * Approve or reject advertisement
     */
    async approveAdvertisement(request) {
        const updateData = {
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString()
        };
        if (request.approved) {
            updateData.status = 'approved';
        }
        else {
            updateData.status = 'rejected';
            updateData.rejection_reason = request.rejectionReason;
        }
        const { data, error } = await supabase
            .from('advertisements')
            .update(updateData)
            .eq('id', request.advertisementId)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to approve advertisement: ${error.message}`);
        }
        return this.mapDatabaseToAdvertisement(data);
    }
    /**
     * Delete advertisement
     */
    async deleteAdvertisement(id) {
        const { error } = await supabase
            .from('advertisements')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete advertisement: ${error.message}`);
        }
    }
    /**
     * Check for advertisement conflicts
     */
    async checkConflicts(targetLocationId, targetType, startDate, endDate, excludeAdId) {
        // Simple conflict check using direct query since RPC function is not available
        let query = supabase
            .from('advertisements')
            .select('id, title')
            .eq('target_location', targetLocationId)
            .eq('target_type', targetType)
            .eq('status', 'active')
            .or(`schedule->>start_date.lte.${endDate.toISOString()},schedule->>end_date.gte.${startDate.toISOString()}`);
        if (excludeAdId) {
            query = query.neq('id', excludeAdId);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to check conflicts: ${error.message}`);
        }
        return data?.map((item) => ({
            ad1Id: excludeAdId || '',
            ad1Title: '',
            ad2Id: item.id,
            ad2Title: item.title,
            targetLocationId,
            targetType,
            conflictStart: new Date(item.conflict_start),
            conflictEnd: new Date(item.conflict_end)
        })) || [];
    }
    /**
     * Get advertisement metrics
     */
    async getAdvertisementMetrics(advertisementId, dateRange) {
        let query = supabase
            .from('advertisement_metrics')
            .select('*')
            .eq('advertisement_id', advertisementId)
            .order('date', { ascending: true });
        if (dateRange) {
            query = query
                .gte('date', dateRange.startDate.toISOString().split('T')[0])
                .lte('date', dateRange.endDate.toISOString().split('T')[0]);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to get advertisement metrics: ${error.message}`);
        }
        return data?.map((item) => ({
            id: item.id,
            advertisementId: item.advertisement_id,
            impressions: item.impressions,
            clicks: item.clicks,
            conversions: item.conversions,
            totalCost: parseFloat(item.total_cost),
            date: new Date(item.date),
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at)
        })) || [];
    }
    /**
     * Update advertisement metrics
     */
    async updateMetrics(advertisementId, impressions = 0, clicks = 0, conversions = 0) {
        const { error } = await supabase
            .rpc('update_advertisement_metrics', {
            p_advertisement_id: advertisementId,
            p_impressions: impressions,
            p_clicks: clicks,
            p_conversions: conversions
        });
        if (error) {
            throw new Error(`Failed to update metrics: ${error.message}`);
        }
    }
    /**
     * Get advertisement performance report
     */
    async getPerformanceReport(advertisementId, dateRange) {
        const advertisement = await this.getAdvertisement(advertisementId);
        if (!advertisement) {
            throw new Error('Advertisement not found');
        }
        const metrics = await this.getAdvertisementMetrics(advertisementId, dateRange);
        const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
        const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
        const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
        const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
        const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const averageCPC = totalClicks > 0 ? totalCost / totalClicks : 0;
        const averageCPM = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        return {
            advertisementId,
            title: advertisement.title,
            totalImpressions,
            totalClicks,
            totalConversions,
            totalCost,
            averageCTR,
            averageCPC,
            averageCPM,
            conversionRate,
            dateRange: dateRange || {
                startDate: advertisement.startDate,
                endDate: advertisement.endDate
            },
            dailyMetrics: metrics
        };
    }
    /**
     * Get advertisement analytics
     */
    async getAnalytics() {
        // Get basic counts
        const { data: counts, error: countsError } = await supabase
            .from('advertisements')
            .select('status')
            .in('status', ['active', 'pending']);
        if (countsError) {
            throw new Error(`Failed to get analytics: ${countsError.message}`);
        }
        const totalAds = counts?.length || 0;
        const activeAds = counts?.filter((ad) => ad.status === 'active').length || 0;
        const pendingApproval = counts?.filter((ad) => ad.status === 'pending').length || 0;
        // Get metrics aggregation
        const { data: metricsData, error: metricsError } = await supabase
            .from('advertisement_metrics')
            .select('impressions, clicks, total_cost');
        if (metricsError) {
            throw new Error(`Failed to get metrics analytics: ${metricsError.message}`);
        }
        const totalImpressions = metricsData?.reduce((sum, m) => sum + m.impressions, 0) || 0;
        const totalClicks = metricsData?.reduce((sum, m) => sum + m.clicks, 0) || 0;
        const totalRevenue = metricsData?.reduce((sum, m) => sum + parseFloat(m.total_cost), 0) || 0;
        const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        // Get top performing ads
        const { data: topAds, error: topAdsError } = await supabase
            .from('advertisement_metrics')
            .select(`
        advertisement_id,
        impressions,
        clicks,
        advertisements!inner(title)
      `)
            .order('clicks', { ascending: false })
            .limit(5);
        if (topAdsError) {
            throw new Error(`Failed to get top performing ads: ${topAdsError.message}`);
        }
        const topPerformingAds = topAds?.map((ad) => ({
            id: ad.advertisement_id,
            title: ad.advertisements.title,
            impressions: ad.impressions,
            clicks: ad.clicks,
            ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0
        })) || [];
        return {
            totalAds,
            activeAds,
            pendingApproval,
            totalRevenue,
            totalImpressions,
            totalClicks,
            averageCTR,
            topPerformingAds
        };
    }
    /**
     * Get advertisement payments
     */
    async getAdvertisementPayments(advertisementId) {
        const { data, error } = await supabase
            .from('advertisement_payments')
            .select('*')
            .eq('advertisement_id', advertisementId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get advertisement payments: ${error.message}`);
        }
        return data?.map((item) => ({
            id: item.id,
            advertisementId: item.advertisement_id,
            amount: parseFloat(item.amount),
            paymentMethod: item.payment_method,
            paymentStatus: item.payment_status,
            paymentReference: item.payment_reference,
            paidAt: item.paid_at ? new Date(item.paid_at) : undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at)
        })) || [];
    }
    /**
     * Create advertisement payment
     */
    async createPayment(advertisementId, amount, paymentMethod) {
        const { data, error } = await supabase
            .from('advertisement_payments')
            .insert({
            advertisement_id: advertisementId,
            amount,
            payment_method: paymentMethod,
            payment_status: 'pending'
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create payment: ${error.message}`);
        }
        return {
            id: data.id,
            advertisementId: data.advertisement_id,
            amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount),
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            paymentReference: data.payment_reference,
            paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    // Helper methods
    mapDatabaseToAdvertisement(data) {
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            contentType: data.content_type,
            contentUrl: data.content_url,
            contentText: data.content_text,
            targetLocationId: data.target_location_id,
            targetType: data.target_type,
            startDate: new Date(data.start_date),
            endDate: new Date(data.end_date),
            budget: parseFloat(data.budget),
            costPerImpression: parseFloat(data.cost_per_impression),
            costPerClick: parseFloat(data.cost_per_click),
            status: data.status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
            rejectionReason: data.rejection_reason,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    mapSortFieldToColumn(field) {
        const mapping = {
            title: 'title',
            status: 'status',
            startDate: 'start_date',
            endDate: 'end_date',
            budget: 'budget',
            createdAt: 'created_at'
        };
        return mapping[field] || 'created_at';
    }
}
export const advertisementService = new AdvertisementManagementService();
