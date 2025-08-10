-- Advertisement System Tables
-- This migration creates tables for the advertisement management system

-- Advertisement content types
CREATE TYPE ad_content_type AS ENUM ('image', 'video', 'text', 'banner', 'interstitial');
CREATE TYPE ad_status AS ENUM ('pending', 'approved', 'active', 'paused', 'completed', 'rejected');
CREATE TYPE ad_target_type AS ENUM ('section', 'zone');

-- Advertisement table
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type ad_content_type NOT NULL,
    content_url TEXT, -- URL for images/videos
    content_text TEXT, -- Text content for text ads
    target_location_id UUID NOT NULL,
    target_type ad_target_type NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    budget DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_per_impression DECIMAL(10,4) DEFAULT 0,
    cost_per_click DECIMAL(10,4) DEFAULT 0,
    status ad_status NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_budget CHECK (budget >= 0),
    CONSTRAINT valid_costs CHECK (cost_per_impression >= 0 AND cost_per_click >= 0)
);

-- Advertisement metrics table
CREATE TABLE advertisement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate metrics for same ad on same date
    UNIQUE(advertisement_id, date)
);

-- Advertisement payments table
CREATE TABLE advertisement_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_payment_amount CHECK (amount > 0)
);

-- Advertisement schedule conflicts view
CREATE VIEW advertisement_conflicts AS
SELECT 
    a1.id as ad1_id,
    a1.title as ad1_title,
    a2.id as ad2_id,
    a2.title as ad2_title,
    a1.target_location_id,
    a1.target_type,
    GREATEST(a1.start_date, a2.start_date) as conflict_start,
    LEAST(a1.end_date, a2.end_date) as conflict_end
FROM advertisements a1
JOIN advertisements a2 ON a1.id < a2.id
WHERE a1.target_location_id = a2.target_location_id
    AND a1.target_type = a2.target_type
    AND a1.status IN ('approved', 'active')
    AND a2.status IN ('approved', 'active')
    AND a1.start_date < a2.end_date
    AND a1.end_date > a2.start_date;

-- Indexes for performance
CREATE INDEX idx_advertisements_target_location ON advertisements(target_location_id);
CREATE INDEX idx_advertisements_status ON advertisements(status);
CREATE INDEX idx_advertisements_dates ON advertisements(start_date, end_date);
CREATE INDEX idx_advertisement_metrics_ad_date ON advertisement_metrics(advertisement_id, date);
CREATE INDEX idx_advertisement_payments_ad_id ON advertisement_payments(advertisement_id);

-- RLS Policies
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisement_payments ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all advertisements
CREATE POLICY "Super admins can manage advertisements" ON advertisements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.user_type = 'admin'
        )
    );

-- Users can view their own advertisement applications
CREATE POLICY "Users can view own advertisements" ON advertisements
    FOR SELECT USING (created_by = auth.uid());

-- Users can create advertisement applications
CREATE POLICY "Users can create advertisements" ON advertisements
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Metrics policies
CREATE POLICY "Admins can manage advertisement metrics" ON advertisement_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.user_type = 'admin'
        )
    );

-- Payment policies
CREATE POLICY "Users can view own advertisement payments" ON advertisement_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM advertisements a
            WHERE a.id = advertisement_id
            AND a.created_by = auth.uid()
        )
    );

CREATE POLICY "Admins can manage advertisement payments" ON advertisement_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.user_type = 'admin'
        )
    );

-- Functions for advertisement management
CREATE OR REPLACE FUNCTION check_advertisement_conflicts(
    p_target_location_id UUID,
    p_target_type ad_target_type,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_exclude_ad_id UUID DEFAULT NULL
)
RETURNS TABLE(
    conflicting_ad_id UUID,
    conflicting_ad_title VARCHAR(255),
    conflict_start TIMESTAMP WITH TIME ZONE,
    conflict_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        GREATEST(a.start_date, p_start_date) as conflict_start,
        LEAST(a.end_date, p_end_date) as conflict_end
    FROM advertisements a
    WHERE a.target_location_id = p_target_location_id
        AND a.target_type = p_target_type
        AND a.status IN ('approved', 'active')
        AND (p_exclude_ad_id IS NULL OR a.id != p_exclude_ad_id)
        AND a.start_date < p_end_date
        AND a.end_date > p_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update advertisement metrics
CREATE OR REPLACE FUNCTION update_advertisement_metrics(
    p_advertisement_id UUID,
    p_impressions INTEGER DEFAULT 0,
    p_clicks INTEGER DEFAULT 0,
    p_conversions INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
    v_cost_per_impression DECIMAL(10,4);
    v_cost_per_click DECIMAL(10,4);
    v_total_cost DECIMAL(10,2);
BEGIN
    -- Get cost rates from advertisement
    SELECT cost_per_impression, cost_per_click
    INTO v_cost_per_impression, v_cost_per_click
    FROM advertisements
    WHERE id = p_advertisement_id;
    
    -- Calculate total cost
    v_total_cost := (p_impressions * v_cost_per_impression) + (p_clicks * v_cost_per_click);
    
    -- Insert or update metrics
    INSERT INTO advertisement_metrics (
        advertisement_id, impressions, clicks, conversions, total_cost, date
    ) VALUES (
        p_advertisement_id, p_impressions, p_clicks, p_conversions, v_total_cost, v_date
    )
    ON CONFLICT (advertisement_id, date)
    DO UPDATE SET
        impressions = advertisement_metrics.impressions + p_impressions,
        clicks = advertisement_metrics.clicks + p_clicks,
        conversions = advertisement_metrics.conversions + p_conversions,
        total_cost = advertisement_metrics.total_cost + v_total_cost,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON advertisements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisement_metrics_updated_at
    BEFORE UPDATE ON advertisement_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisement_payments_updated_at
    BEFORE UPDATE ON advertisement_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();