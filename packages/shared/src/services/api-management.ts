import { supabase } from '../config/supabase';
import type {
  DeveloperAccount,
  APIApplication,
  APIKey,
  APIUsageLog,
  APIPricingPlan,
  APISubscription,
  APIBillingRecord,
  APIDocumentation,
  CreateDeveloperAccountRequest,
  CreateAPIApplicationRequest,
  CreateAPIKeyRequest,
  UpdateAPIKeyRequest,
  APIUsageAnalytics,
  APIRevenueAnalytics,
  DeveloperPortalStats,
  APIUsageFilter,
  DeveloperAccountFilter,
  APIApplicationFilter,
  RateLimitResponse,
  APIPermissions
} from '../types/api-management';

export class APIManagementService {
  // Developer Account Management
  async createDeveloperAccount(data: CreateDeveloperAccountRequest): Promise<DeveloperAccount> {
    const { data: account, error } = await supabase
      .from('developer_accounts')
      .insert({
        ...data,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return account;
  }

  async getDeveloperAccounts(filter: DeveloperAccountFilter = {}): Promise<DeveloperAccount[]> {
    let query = supabase
      .from('developer_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.search) {
      query = query.or(`company_name.ilike.%${filter.search}%,contact_email.ilike.%${filter.search}%`);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getDeveloperAccount(id: string): Promise<DeveloperAccount | null> {
    const { data, error } = await supabase
      .from('developer_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateDeveloperAccountStatus(
    id: string, 
    status: 'approved' | 'suspended' | 'rejected',
    approvedBy?: string
  ): Promise<DeveloperAccount> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_by = approvedBy;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('developer_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // API Application Management
  async createAPIApplication(
    developerAccountId: string,
    data: CreateAPIApplicationRequest
  ): Promise<APIApplication> {
    const { data: application, error } = await supabase
      .from('api_applications')
      .insert({
        ...data,
        developer_account_id: developerAccountId
      })
      .select(`
        *,
        developer_account:developer_accounts(*)
      `)
      .single();

    if (error) throw error;
    return application;
  }

  async getAPIApplications(filter: APIApplicationFilter = {}): Promise<APIApplication[]> {
    let query = supabase
      .from('api_applications')
      .select(`
        *,
        developer_account:developer_accounts(*)
      `)
      .order('created_at', { ascending: false });

    if (filter.developer_account_id) {
      query = query.eq('developer_account_id', filter.developer_account_id);
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.app_type) {
      query = query.eq('app_type', filter.app_type);
    }

    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAPIApplication(id: string): Promise<APIApplication | null> {
    const { data, error } = await supabase
      .from('api_applications')
      .select(`
        *,
        developer_account:developer_accounts(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateAPIApplicationStatus(
    id: string,
    status: 'approved' | 'suspended' | 'rejected',
    approvedBy?: string
  ): Promise<APIApplication> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_by = approvedBy;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('api_applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        developer_account:developer_accounts(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // API Key Management
  async createAPIKey(applicationId: string, data: CreateAPIKeyRequest): Promise<APIKey> {
    // Generate API key and secret
    const apiKey = this.generateAPIKey();
    const apiSecret = this.generateAPISecret();

    const { data: key, error } = await supabase
      .from('api_keys')
      .insert({
        ...data,
        application_id: applicationId,
        api_key: apiKey,
        api_secret: apiSecret,
        rate_limit_per_minute: data.rate_limit_per_minute || 100,
        rate_limit_per_hour: data.rate_limit_per_hour || 1000,
        rate_limit_per_day: data.rate_limit_per_day || 10000
      })
      .select(`
        *,
        application:api_applications(*)
      `)
      .single();

    if (error) throw error;
    return key;
  }

  async getAPIKeys(applicationId?: string): Promise<APIKey[]> {
    let query = supabase
      .from('api_keys')
      .select(`
        *,
        application:api_applications(*)
      `)
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAPIKey(id: string): Promise<APIKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        *,
        application:api_applications(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateAPIKey(id: string, data: UpdateAPIKeyRequest): Promise<APIKey> {
    const { data: key, error } = await supabase
      .from('api_keys')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        application:api_applications(*)
      `)
      .single();

    if (error) throw error;
    return key;
  }

  async deleteAPIKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async rotateAPIKey(id: string): Promise<APIKey> {
    const newApiKey = this.generateAPIKey();
    const newApiSecret = this.generateAPISecret();

    const { data, error } = await supabase
      .from('api_keys')
      .update({
        api_key: newApiKey,
        api_secret: newApiSecret,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        application:api_applications(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Usage Tracking
  async logAPIUsage(usage: Omit<APIUsageLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('api_usage_logs')
      .insert(usage);

    if (error) throw error;
  }

  async getAPIUsage(filter: APIUsageFilter = {}): Promise<APIUsageLog[]> {
    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter.api_key_id) {
      query = query.eq('api_key_id', filter.api_key_id);
    }

    if (filter.endpoint) {
      query = query.eq('endpoint', filter.endpoint);
    }

    if (filter.status_code) {
      query = query.eq('status_code', filter.status_code);
    }

    if (filter.date_from) {
      query = query.gte('created_at', filter.date_from);
    }

    if (filter.date_to) {
      query = query.lte('created_at', filter.date_to);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 100) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAPIUsageAnalytics(
    apiKeyId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<APIUsageAnalytics> {
    let query = supabase
      .from('api_usage_logs')
      .select('*');

    if (apiKeyId) {
      query = query.eq('api_key_id', apiKeyId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = data || [];
    
    // Calculate analytics
    const totalCalls = logs.length;
    const successfulCalls = logs.filter(log => log.status_code >= 200 && log.status_code < 400).length;
    const failedCalls = totalCalls - successfulCalls;
    const averageResponseTime = logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalCalls || 0;

    // Group by endpoint
    const callsByEndpoint: Record<string, number> = {};
    logs.forEach(log => {
      callsByEndpoint[log.endpoint] = (callsByEndpoint[log.endpoint] || 0) + 1;
    });

    // Group by status code
    const callsByStatus: Record<string, number> = {};
    logs.forEach(log => {
      const statusGroup = Math.floor(log.status_code / 100) * 100;
      const key = `${statusGroup}xx`;
      callsByStatus[key] = (callsByStatus[key] || 0) + 1;
    });

    // Calls over time (daily)
    const callsByDate: Record<string, number> = {};
    logs.forEach(log => {
      const date = log.created_at.split('T')[0];
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    });

    const callsOverTime = Object.entries(callsByDate).map(([date, calls]) => ({
      date,
      calls
    }));

    // Top endpoints with response times
    const endpointStats: Record<string, { calls: number; totalResponseTime: number }> = {};
    logs.forEach(log => {
      if (!endpointStats[log.endpoint]) {
        endpointStats[log.endpoint] = { calls: 0, totalResponseTime: 0 };
      }
      endpointStats[log.endpoint].calls++;
      endpointStats[log.endpoint].totalResponseTime += log.response_time_ms || 0;
    });

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        calls: stats.calls,
        avg_response_time: stats.totalResponseTime / stats.calls || 0
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    return {
      total_calls: totalCalls,
      successful_calls: successfulCalls,
      failed_calls: failedCalls,
      average_response_time: averageResponseTime,
      calls_by_endpoint: callsByEndpoint,
      calls_by_status: callsByStatus,
      calls_over_time: callsOverTime,
      top_endpoints: topEndpoints
    };
  }

  // Rate Limiting
  async checkRateLimit(apiKeyId: string): Promise<RateLimitResponse> {
    const apiKey = await this.getAPIKey(apiKeyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const now = new Date();
    const windows = {
      minute: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()),
        limit: apiKey.rate_limit_per_minute
      },
      hour: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()),
        limit: apiKey.rate_limit_per_hour
      },
      day: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        limit: apiKey.rate_limit_per_day
      }
    };

    const limits: any = {};
    let allowed = true;

    for (const [window, config] of Object.entries(windows)) {
      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('request_count')
        .eq('api_key_id', apiKeyId)
        .eq('time_window', window)
        .eq('window_start', config.start.toISOString())
        .single();

      const currentCount = data?.request_count || 0;
      const remaining = Math.max(0, config.limit - currentCount);
      
      limits[window] = {
        limit: config.limit,
        remaining,
        reset_time: new Date(config.start.getTime() + (window === 'minute' ? 60000 : window === 'hour' ? 3600000 : 86400000)).toISOString(),
        window
      };

      if (remaining <= 0) {
        allowed = false;
      }
    }

    return { allowed, limits };
  }

  async incrementRateLimit(apiKeyId: string): Promise<void> {
    const now = new Date();
    const windows = [
      {
        window: 'minute',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())
      },
      {
        window: 'hour', 
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
      },
      {
        window: 'day',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    ];

    for (const { window, start } of windows) {
      await supabase
        .from('api_rate_limits')
        .upsert({
          api_key_id: apiKeyId,
          time_window: window,
          window_start: start.toISOString(),
          request_count: 1
        }, {
          onConflict: 'api_key_id,time_window,window_start',
          ignoreDuplicates: false
        });

      // Increment if exists
      await supabase.rpc('increment_rate_limit', {
        p_api_key_id: apiKeyId,
        p_time_window: window,
        p_window_start: start.toISOString()
      });
    }
  }

  // Pricing Plans
  async getPricingPlans(): Promise<APIPricingPlan[]> {
    const { data, error } = await supabase
      .from('api_pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_fee', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createPricingPlan(plan: Omit<APIPricingPlan, 'id' | 'created_at' | 'updated_at'>): Promise<APIPricingPlan> {
    const { data, error } = await supabase
      .from('api_pricing_plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePricingPlan(id: string, updates: Partial<APIPricingPlan>): Promise<APIPricingPlan> {
    const { data, error } = await supabase
      .from('api_pricing_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Subscriptions
  async createSubscription(applicationId: string, pricingPlanId: string): Promise<APISubscription> {
    const { data, error } = await supabase
      .from('api_subscriptions')
      .insert({
        application_id: applicationId,
        pricing_plan_id: pricingPlanId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select(`
        *,
        pricing_plan:api_pricing_plans(*),
        application:api_applications(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async getSubscriptions(applicationId?: string): Promise<APISubscription[]> {
    let query = supabase
      .from('api_subscriptions')
      .select(`
        *,
        pricing_plan:api_pricing_plans(*),
        application:api_applications(*)
      `)
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Documentation
  async getDocumentation(): Promise<APIDocumentation[]> {
    const { data, error } = await supabase
      .from('api_documentation')
      .select('*')
      .eq('is_published', true)
      .order('section_order');

    if (error) throw error;
    return data || [];
  }

  async createDocumentation(doc: Omit<APIDocumentation, 'id' | 'created_at' | 'updated_at'>): Promise<APIDocumentation> {
    const { data, error } = await supabase
      .from('api_documentation')
      .insert(doc)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDocumentation(id: string, updates: Partial<APIDocumentation>): Promise<APIDocumentation> {
    const { data, error } = await supabase
      .from('api_documentation')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics and Stats
  async getDeveloperPortalStats(): Promise<DeveloperPortalStats> {
    // Get current stats
    const [developersResult, applicationsResult, usageResult, revenueResult] = await Promise.all([
      supabase.from('developer_accounts').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('api_applications').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('api_usage_logs').select('id', { count: 'exact' }),
      supabase.from('api_billing_records').select('total_amount').eq('status', 'paid')
    ]);

    const totalDevelopers = developersResult.count || 0;
    const activeApplications = applicationsResult.count || 0;
    const totalApiCalls = usageResult.count || 0;
    const totalRevenue = revenueResult.data?.reduce((sum, record) => sum + record.total_amount, 0) || 0;

    // Calculate growth metrics (simplified - would need historical data for real growth)
    return {
      total_developers: totalDevelopers,
      active_applications: activeApplications,
      total_api_calls: totalApiCalls,
      total_revenue: totalRevenue,
      growth_metrics: {
        developers_growth: 0, // Would calculate from historical data
        applications_growth: 0,
        calls_growth: 0,
        revenue_growth: 0
      }
    };
  }

  // Utility methods
  private generateAPIKey(): string {
    const prefix = 'pk_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix + randomPart;
  }

  private generateAPISecret(): string {
    const prefix = 'sk_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix + randomPart;
  }

  // Validate API key format
  validateAPIKey(apiKey: string): boolean {
    return /^pk_[a-f0-9]{64}$/.test(apiKey);
  }

  // Get API key from request headers
  extractAPIKey(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export const apiManagementService = new APIManagementService();