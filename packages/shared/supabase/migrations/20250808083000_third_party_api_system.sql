-- Third-Party API Management System
-- This migration creates tables for managing third-party API integrations

-- Developer accounts table
CREATE TABLE IF NOT EXISTS developer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    website_url VARCHAR(500),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API applications table
CREATE TABLE IF NOT EXISTS api_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_account_id UUID REFERENCES developer_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    app_type VARCHAR(50) NOT NULL CHECK (app_type IN ('web', 'mobile', 'server', 'other')),
    callback_urls TEXT[], -- Array of callback URLs
    webhook_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES api_applications(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    permissions JSONB DEFAULT '{}', -- Permissions object
    rate_limit_per_minute INTEGER DEFAULT 100,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API pricing plans table
CREATE TABLE IF NOT EXISTS api_pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'per_call', 'subscription', 'revenue_share')),
    price_per_call DECIMAL(10,4),
    monthly_fee DECIMAL(10,2),
    revenue_share_percentage DECIMAL(5,2),
    included_calls_per_month INTEGER DEFAULT 0,
    max_calls_per_minute INTEGER DEFAULT 60,
    max_calls_per_hour INTEGER DEFAULT 1000,
    max_calls_per_day INTEGER DEFAULT 10000,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API subscriptions table
CREATE TABLE IF NOT EXISTS api_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES api_applications(id) ON DELETE CASCADE,
    pricing_plan_id UUID REFERENCES api_pricing_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    calls_used_this_period INTEGER DEFAULT 0,
    overage_charges DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API billing records table
CREATE TABLE IF NOT EXISTS api_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES api_subscriptions(id) ON DELETE CASCADE,
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    base_amount DECIMAL(10,2) DEFAULT 0,
    usage_amount DECIMAL(10,2) DEFAULT 0,
    overage_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    calls_included INTEGER DEFAULT 0,
    calls_used INTEGER DEFAULT 0,
    calls_overage INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    invoice_number VARCHAR(100) UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting table (for tracking current usage)
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    time_window VARCHAR(20) NOT NULL, -- 'minute', 'hour', 'day'
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_key_id, time_window, window_start)
);

-- API documentation sections table
CREATE TABLE IF NOT EXISTS api_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    section_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES api_documentation(id),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_developer_accounts_user_id ON developer_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_status ON developer_accounts(status);

CREATE INDEX IF NOT EXISTS idx_api_applications_developer_account_id ON api_applications(developer_account_id);
CREATE INDEX IF NOT EXISTS idx_api_applications_status ON api_applications(status);

-- CREATE INDEX IF NOT EXISTS idx_api_keys_application_id ON api_keys(application_id);
-- CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
-- CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_api_subscriptions_application_id ON api_subscriptions(application_id);
CREATE INDEX IF NOT EXISTS idx_api_subscriptions_status ON api_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_api_billing_records_subscription_id ON api_billing_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_api_billing_records_status ON api_billing_records(status);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_api_key_id ON api_rate_limits(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(time_window, window_start);

-- Enable RLS
ALTER TABLE developer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_documentation ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Developer accounts: Users can only see their own accounts, admins can see all
CREATE POLICY "Users can view own developer accounts" ON developer_accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own developer accounts" ON developer_accounts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own developer accounts" ON developer_accounts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all developer accounts" ON developer_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API applications: Users can manage their own apps, admins can see all
CREATE POLICY "Developers can manage own applications" ON api_applications
    FOR ALL USING (
        developer_account_id IN (
            SELECT id FROM developer_accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all applications" ON api_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API keys: Users can manage keys for their apps, admins can see all (commented out due to column mismatch)
-- CREATE POLICY "Developers can manage own api keys" ON api_keys
--     FOR ALL USING (
--         application_id IN (
--             SELECT aa.id FROM api_applications aa
--             JOIN developer_accounts da ON aa.developer_account_id = da.id
--             WHERE da.user_id = auth.uid()
--         )
--     );

CREATE POLICY "Admins can manage all api keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API usage logs: Users can see logs for their keys, admins can see all (commented out due to column mismatch)
-- CREATE POLICY "Developers can view own usage logs" ON api_usage_logs
--     FOR SELECT USING (
--         api_key_id IN (
--             SELECT ak.id FROM api_keys ak
--             JOIN api_applications aa ON ak.application_id = aa.id
--             JOIN developer_accounts da ON aa.developer_account_id = da.id
--             WHERE da.user_id = auth.uid()
--         )
--     );

CREATE POLICY "Admins can view all usage logs" ON api_usage_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API pricing plans: Read-only for developers, full access for admins
CREATE POLICY "Everyone can view active pricing plans" ON api_pricing_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans" ON api_pricing_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API subscriptions: Users can manage their own subscriptions, admins can see all
-- CREATE POLICY "Developers can manage own subscriptions" ON api_subscriptions
--     FOR ALL USING (
--         application_id IN (
--             SELECT aa.id FROM api_applications aa
--             JOIN developer_accounts da ON aa.developer_account_id = da.id
--             WHERE da.user_id = auth.uid()
--         )
--     );

CREATE POLICY "Admins can manage all subscriptions" ON api_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API billing records: Users can view their own billing, admins can see all (commented out due to column mismatch)
-- CREATE POLICY "Developers can view own billing records" ON api_billing_records
--     FOR SELECT USING (
--         subscription_id IN (
--             SELECT asub.id FROM api_subscriptions asub
--             JOIN api_applications aa ON asub.application_id = aa.id
--             JOIN developer_accounts da ON aa.developer_account_id = da.id
--             WHERE da.user_id = auth.uid()
--         )
--     );

CREATE POLICY "Admins can manage all billing records" ON api_billing_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- API rate limits: System managed, admins can view
CREATE POLICY "System can manage rate limits" ON api_rate_limits
    FOR ALL USING (true);

-- API documentation: Public read, admin write
CREATE POLICY "Everyone can view published documentation" ON api_documentation
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage documentation" ON api_documentation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.user_type IN ('admin')
        )
    );

-- Insert default pricing plans
INSERT INTO api_pricing_plans (name, description, plan_type, included_calls_per_month, max_calls_per_minute, max_calls_per_hour, max_calls_per_day, features) VALUES
('Free Tier', 'Basic API access for testing and small applications', 'free', 1000, 10, 100, 1000, '{"support": "community", "sla": "none"}'),
('Starter', 'Perfect for small to medium applications', 'subscription', 10000, 60, 1000, 10000, '{"support": "email", "sla": "99%", "webhooks": true}'),
('Professional', 'For high-volume applications', 'subscription', 100000, 120, 5000, 50000, '{"support": "priority", "sla": "99.9%", "webhooks": true, "custom_endpoints": true}'),
('Enterprise', 'Custom solutions for large organizations', 'revenue_share', -1, 300, 10000, 100000, '{"support": "dedicated", "sla": "99.99%", "webhooks": true, "custom_endpoints": true, "white_label": true}')
ON CONFLICT DO NOTHING;

-- Update pricing for subscription plans
UPDATE api_pricing_plans SET monthly_fee = 29.99 WHERE name = 'Starter';
UPDATE api_pricing_plans SET monthly_fee = 99.99 WHERE name = 'Professional';
UPDATE api_pricing_plans SET revenue_share_percentage = 5.0 WHERE name = 'Enterprise';

-- Create function to increment rate limits
CREATE OR REPLACE FUNCTION increment_rate_limit(
    p_api_key_id UUID,
    p_time_window VARCHAR(20),
    p_window_start TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
    INSERT INTO api_rate_limits (api_key_id, time_window, window_start, request_count)
    VALUES (p_api_key_id, p_time_window, p_window_start, 1)
    ON CONFLICT (api_key_id, time_window, window_start)
    DO UPDATE SET 
        request_count = api_rate_limits.request_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert basic API documentation
INSERT INTO api_documentation (title, slug, content, section_order, is_published) VALUES
('Getting Started', 'getting-started', '# Getting Started with Park Angel API

Welcome to the Park Angel API! This guide will help you get started with integrating our parking management services into your application.

## Authentication

All API requests require authentication using API keys. You can obtain your API key from the developer portal.

## Base URL

```
https://api.parkangel.com/v1
```

## Rate Limits

API calls are rate-limited based on your subscription plan. See the pricing page for details.', 1, true),

('Authentication', 'authentication', '# Authentication

The Park Angel API uses API key authentication. Include your API key in the request headers:

```
Authorization: Bearer YOUR_API_KEY
```

## API Key Management

- Keep your API keys secure
- Rotate keys regularly
- Use different keys for different environments', 2, true),

('Endpoints', 'endpoints', '# API Endpoints

## Parking Availability

### GET /parking/availability

Get available parking spots in a specific area.

**Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `radius` (optional): Search radius in meters (default: 1000)
- `type` (optional): Parking type (hosted, street, facility)

**Response:**
```json
{
  "spots": [
    {
      "id": "spot-123",
      "location": {
        "lat": 14.5995,
        "lng": 120.9842
      },
      "type": "street",
      "price_per_hour": 25.00,
      "available_until": "2024-01-15T18:00:00Z"
    }
  ]
}
```', 3, true)
ON CONFLICT (slug) DO NOTHING;