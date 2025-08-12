-- Reporting System Tables
-- This migration creates tables to support the comprehensive reporting system

-- Generated reports storage
CREATE TABLE IF NOT EXISTS generated_reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '[]',
    sorting JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Scheduled reports configuration
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    report_type_id TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    schedule JSONB NOT NULL,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics for monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature TEXT NOT NULL,
    response_time INTEGER NOT NULL, -- in milliseconds
    error BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'
);

-- API usage logs for third-party integrations
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER, -- in milliseconds
    request_size INTEGER, -- in bytes
    response_size INTEGER, -- in bytes
    billing_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Violation reports for compliance tracking
CREATE TABLE IF NOT EXISTS violation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    violation_type TEXT NOT NULL,
    description TEXT,
    reported_by UUID REFERENCES auth.users(id),
    vehicle_plate TEXT,
    photos TEXT[], -- URLs to photos
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial reports storage (for caching and audit)
CREATE TABLE IF NOT EXISTS financial_reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    parameters JSONB NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Audit trail for all system actions
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA targets configuration
CREATE TABLE IF NOT EXISTS sla_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature TEXT NOT NULL UNIQUE,
    target_response_time INTEGER NOT NULL, -- in milliseconds
    alert_threshold INTEGER NOT NULL, -- in milliseconds
    escalation_rules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report export history
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL,
    format TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    download_url TEXT,
    exported_by UUID REFERENCES auth.users(id),
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_by ON generated_reports(created_by);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_is_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON scheduled_reports(created_by);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_feature ON performance_metrics(feature);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_violation_reports_location_id ON violation_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_violation_reports_status ON violation_reports(status);
CREATE INDEX IF NOT EXISTS idx_violation_reports_created_at ON violation_reports(created_at);
-- Create index on reported_by column if it exists, otherwise on reporter_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violation_reports' 
        AND column_name = 'reported_by'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_violation_reports_reported_by ON violation_reports(reported_by);
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violation_reports' 
        AND column_name = 'reporter_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_violation_reports_reporter_id ON violation_reports(reporter_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_at ON financial_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_by ON financial_reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_id ON audit_trail(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
-- Create index on created_at column if it exists in audit_trail table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_trail' 
        AND column_name = 'created_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);

CREATE INDEX IF NOT EXISTS idx_report_exports_report_id ON report_exports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_exported_by ON report_exports(exported_by);
CREATE INDEX IF NOT EXISTS idx_report_exports_exported_at ON report_exports(exported_at);

-- RLS Policies
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- Generated reports policies
CREATE POLICY "Users can view their own generated reports" ON generated_reports
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all generated reports" ON generated_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can create generated reports" ON generated_reports
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Scheduled reports policies
CREATE POLICY "Users can view their own scheduled reports" ON scheduled_reports
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all scheduled reports" ON scheduled_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can manage their own scheduled reports" ON scheduled_reports
    FOR ALL USING (created_by = auth.uid());

-- Performance metrics policies
CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "System can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- API usage logs policies
CREATE POLICY "Admins can view all API usage logs" ON api_usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "System can insert API usage logs" ON api_usage_logs
    FOR INSERT WITH CHECK (true);

-- Violation reports policies (handle both reported_by and reporter_id column names)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violation_reports' 
        AND column_name = 'reported_by'
    ) THEN
        -- Use reported_by column
        CREATE POLICY "Users can view violation reports for their locations" ON violation_reports
            FOR SELECT USING (
                reported_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM locations l
                    JOIN user_profiles up ON l.operator_id = up.user_id
                    WHERE l.id = violation_reports.location_id
                    AND up.user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND user_type = 'admin'
                )
            );

        CREATE POLICY "Users can create violation reports" ON violation_reports
            FOR INSERT WITH CHECK (reported_by = auth.uid());
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violation_reports' 
        AND column_name = 'reporter_id'
    ) THEN
        -- Use reporter_id column
        CREATE POLICY "Users can view violation reports for their locations" ON violation_reports
            FOR SELECT USING (
                reporter_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM locations l
                    JOIN user_profiles up ON l.operator_id = up.user_id
                    WHERE l.id = violation_reports.location_id
                    AND up.user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND user_type = 'admin'
                )
            );

        CREATE POLICY "Users can create violation reports" ON violation_reports
            FOR INSERT WITH CHECK (reporter_id = auth.uid());
    END IF;
END $$;

CREATE POLICY "Operators can update violation reports for their locations" ON violation_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM locations l
            JOIN user_profiles up ON l.operator_id = up.user_id
            WHERE l.id = violation_reports.location_id
            AND up.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Financial reports policies
CREATE POLICY "Admins can view all financial reports" ON financial_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "System can create financial reports" ON financial_reports
    FOR INSERT WITH CHECK (generated_by = auth.uid());

-- Audit trail policies
CREATE POLICY "Admins can view all audit trail entries" ON audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "System can create audit trail entries" ON audit_trail
    FOR INSERT WITH CHECK (true);

-- SLA targets policies
CREATE POLICY "Admins can manage SLA targets" ON sla_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Report exports policies
CREATE POLICY "Users can view their own report exports" ON report_exports
    FOR SELECT USING (exported_by = auth.uid());

CREATE POLICY "Admins can view all report exports" ON report_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can create report exports" ON report_exports
    FOR INSERT WITH CHECK (exported_by = auth.uid());

-- Insert default SLA targets
INSERT INTO sla_targets (feature, target_response_time, alert_threshold, escalation_rules) VALUES
    ('booking', 2000, 3000, '[{"threshold": 5000, "action": "notify_admin"}]'),
    ('payment', 5000, 7000, '[{"threshold": 10000, "action": "notify_admin"}]'),
    ('messaging', 1000, 1500, '[{"threshold": 2000, "action": "notify_admin"}]'),
    ('violation_reporting', 3000, 4000, '[{"threshold": 5000, "action": "notify_admin"}]'),
    ('support_tickets', 2000, 3000, '[{"threshold": 4000, "action": "notify_admin"}]')
ON CONFLICT (feature) DO NOTHING;

-- Functions for automated report scheduling
CREATE OR REPLACE FUNCTION update_scheduled_report_next_run()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate next run time based on frequency
    CASE NEW.schedule->>'frequency'
        WHEN 'daily' THEN
            NEW.next_run = (CURRENT_DATE + INTERVAL '1 day' + (NEW.schedule->>'time')::TIME);
        WHEN 'weekly' THEN
            NEW.next_run = (CURRENT_DATE + INTERVAL '1 week' + (NEW.schedule->>'time')::TIME);
        WHEN 'monthly' THEN
            NEW.next_run = (CURRENT_DATE + INTERVAL '1 month' + (NEW.schedule->>'time')::TIME);
        WHEN 'quarterly' THEN
            NEW.next_run = (CURRENT_DATE + INTERVAL '3 months' + (NEW.schedule->>'time')::TIME);
        ELSE
            NEW.next_run = (CURRENT_DATE + INTERVAL '1 day' + (NEW.schedule->>'time')::TIME);
    END CASE;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update next_run when schedule changes
CREATE TRIGGER trigger_update_scheduled_report_next_run
    BEFORE INSERT OR UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_report_next_run();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_entity_id TEXT,
    p_entity_type TEXT,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_trail (entity_id, entity_type, action, user_id, details)
    VALUES (p_entity_id, p_entity_type, p_action, COALESCE(p_user_id, auth.uid()), p_details)
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metric(
    p_feature TEXT,
    p_response_time INTEGER,
    p_error BOOLEAN DEFAULT false,
    p_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO performance_metrics (feature, response_time, error, user_id, metadata)
    VALUES (p_feature, p_response_time, p_error, COALESCE(p_user_id, auth.uid()), p_metadata)
    RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old reports and exports
CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete generated reports older than 90 days
    DELETE FROM generated_reports 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired report exports
    DELETE FROM report_exports 
    WHERE expires_at < NOW();
    
    -- Delete old performance metrics (keep last 30 days)
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old API usage logs (keep last 90 days)
    DELETE FROM api_usage_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (this would need to be set up with pg_cron or similar)
-- SELECT cron.schedule('cleanup-old-reports', '0 2 * * *', 'SELECT cleanup_old_reports();');

COMMENT ON TABLE generated_reports IS 'Stores generated reports for caching and audit purposes';
COMMENT ON TABLE scheduled_reports IS 'Configuration for automated report generation and delivery';
COMMENT ON TABLE performance_metrics IS 'System performance metrics for monitoring and SLA tracking';
COMMENT ON TABLE api_usage_logs IS 'Third-party API usage logs for billing and analytics';
COMMENT ON TABLE violation_reports IS 'Parking violation reports and enforcement tracking';
COMMENT ON TABLE financial_reports IS 'Financial reports cache and audit trail';
COMMENT ON TABLE audit_trail IS 'Comprehensive audit log of all system actions';
COMMENT ON TABLE sla_targets IS 'Service Level Agreement targets and escalation rules';
COMMENT ON TABLE report_exports IS 'History of report exports and download links';