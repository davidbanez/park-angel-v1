// Third-Party API Management Types

export interface DeveloperAccount {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  description?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface APIApplication {
  id: string;
  developer_account_id: string;
  name: string;
  description?: string;
  app_type: 'web' | 'mobile' | 'server' | 'other';
  callback_urls?: string[];
  webhook_url?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  developer_account?: DeveloperAccount;
}

export interface APIKey {
  id: string;
  application_id: string;
  key_name: string;
  api_key: string;
  api_secret: string;
  environment: 'development' | 'staging' | 'production';
  permissions: Record<string, any>;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  application?: APIApplication;
}

export interface APIUsageLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  created_at: string;
}

export interface APIPricingPlan {
  id: string;
  name: string;
  description?: string;
  plan_type: 'free' | 'per_call' | 'subscription' | 'revenue_share';
  price_per_call?: number;
  monthly_fee?: number;
  revenue_share_percentage?: number;
  included_calls_per_month: number;
  max_calls_per_minute: number;
  max_calls_per_hour: number;
  max_calls_per_day: number;
  features: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface APISubscription {
  id: string;
  application_id: string;
  pricing_plan_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end?: string;
  calls_used_this_period: number;
  overage_charges: number;
  created_at: string;
  updated_at: string;
  pricing_plan?: APIPricingPlan;
  application?: APIApplication;
}

export interface APIBillingRecord {
  id: string;
  subscription_id: string;
  billing_period_start: string;
  billing_period_end: string;
  base_amount: number;
  usage_amount: number;
  overage_amount: number;
  total_amount: number;
  calls_included: number;
  calls_used: number;
  calls_overage: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoice_number?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  subscription?: APISubscription;
}

export interface APIRateLimit {
  id: string;
  api_key_id: string;
  time_window: 'minute' | 'hour' | 'day';
  window_start: string;
  request_count: number;
  created_at: string;
  updated_at: string;
}

export interface APIDocumentation {
  id: string;
  title: string;
  slug: string;
  content: string;
  section_order: number;
  parent_id?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  children?: APIDocumentation[];
}

// Request/Response types
export interface CreateDeveloperAccountRequest {
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  description?: string;
}

export interface CreateAPIApplicationRequest {
  name: string;
  description?: string;
  app_type: 'web' | 'mobile' | 'server' | 'other';
  callback_urls?: string[];
  webhook_url?: string;
}

export interface CreateAPIKeyRequest {
  key_name: string;
  environment: 'development' | 'staging' | 'production';
  permissions?: Record<string, any>;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  expires_at?: string;
}

export interface UpdateAPIKeyRequest {
  key_name?: string;
  permissions?: Record<string, any>;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  is_active?: boolean;
  expires_at?: string;
}

export interface APIUsageAnalytics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_response_time: number;
  calls_by_endpoint: Record<string, number>;
  calls_by_status: Record<string, number>;
  calls_over_time: Array<{
    date: string;
    calls: number;
  }>;
  top_endpoints: Array<{
    endpoint: string;
    calls: number;
    avg_response_time: number;
  }>;
}

export interface APIRevenueAnalytics {
  total_revenue: number;
  revenue_by_plan: Record<string, number>;
  revenue_over_time: Array<{
    date: string;
    revenue: number;
  }>;
  top_applications: Array<{
    application_name: string;
    revenue: number;
    calls: number;
  }>;
}

export interface DeveloperPortalStats {
  total_developers: number;
  active_applications: number;
  total_api_calls: number;
  total_revenue: number;
  growth_metrics: {
    developers_growth: number;
    applications_growth: number;
    calls_growth: number;
    revenue_growth: number;
  };
}

// Filter and search types
export interface APIUsageFilter {
  api_key_id?: string;
  application_id?: string;
  endpoint?: string;
  status_code?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface DeveloperAccountFilter {
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface APIApplicationFilter {
  developer_account_id?: string;
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  app_type?: 'web' | 'mobile' | 'server' | 'other';
  search?: string;
  limit?: number;
  offset?: number;
}

// Rate limiting types
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset_time: string;
  window: 'minute' | 'hour' | 'day';
}

export interface RateLimitResponse {
  allowed: boolean;
  limits: {
    minute: RateLimitStatus;
    hour: RateLimitStatus;
    day: RateLimitStatus;
  };
}

// API endpoint permissions
export interface APIPermissions {
  parking: {
    read_availability: boolean;
    create_booking: boolean;
    cancel_booking: boolean;
    read_locations: boolean;
  };
  payments: {
    process_payment: boolean;
    refund_payment: boolean;
    read_transactions: boolean;
  };
  users: {
    read_profile: boolean;
    update_profile: boolean;
  };
  analytics: {
    read_usage: boolean;
    read_revenue: boolean;
  };
}

// Webhook types
export interface WebhookEvent {
  id: string;
  event_type: string;
  data: Record<string, any>;
  timestamp: string;
  api_key_id: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_event_id: string;
  webhook_url: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  last_attempt_at?: string;
  response_status?: number;
  response_body?: string;
  created_at: string;
}