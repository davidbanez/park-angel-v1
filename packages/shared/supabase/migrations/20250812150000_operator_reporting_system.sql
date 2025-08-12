-- Operator Reporting System Tables
-- Migration: 20250812150000_operator_reporting_system.sql

-- Create operator_reports table
CREATE TABLE IF NOT EXISTS operator_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN (
        'revenue_report',
        'occupancy_report', 
        'user_behavior_report',
        'violation_report',
        'vip_usage_report',
        'zone_performance_report',
        'vehicle_type_analytics',
        'operational_summary'
    )),
    title TEXT NOT NULL,
    description TEXT,
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by UUID NOT NULL REFERENCES auth.users(id),
    parameters JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create operator_scheduled_reports table (different name to avoid conflict)
CREATE TABLE IF NOT EXISTS operator_scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'revenue_report',
        'occupancy_report',
        'user_behavior_report', 
        'violation_report',
        'vip_usage_report',
        'zone_performance_report',
        'vehicle_type_analytics',
        'operational_summary'
    )),
    parameters JSONB NOT NULL DEFAULT '{}',
    schedule TEXT NOT NULL, -- Cron expression
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create operator_report_exports table (different name to avoid conflict)
CREATE TABLE IF NOT EXISTS operator_report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES operator_reports(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operator_reports_operator_id ON operator_reports(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_reports_type ON operator_reports(type);
CREATE INDEX IF NOT EXISTS idx_operator_reports_generated_at ON operator_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_reports_operator_type ON operator_reports(operator_id, type);

CREATE INDEX IF NOT EXISTS idx_operator_scheduled_reports_operator_id ON operator_scheduled_reports(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_scheduled_reports_active ON operator_scheduled_reports(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_operator_scheduled_reports_next_run ON operator_scheduled_reports(next_run_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_operator_report_exports_report_id ON operator_report_exports(report_id);
CREATE INDEX IF NOT EXISTS idx_operator_report_exports_status ON operator_report_exports(status);
CREATE INDEX IF NOT EXISTS idx_operator_report_exports_expires_at ON operator_report_exports(expires_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_operator_reports_updated_at 
    BEFORE UPDATE ON operator_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_scheduled_reports_updated_at 
    BEFORE UPDATE ON operator_scheduled_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_report_exports_updated_at 
    BEFORE UPDATE ON operator_report_exports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE operator_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_report_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operator_reports
CREATE POLICY "Operators can view their own reports" ON operator_reports
    FOR SELECT USING (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

CREATE POLICY "Operators can create their own reports" ON operator_reports
    FOR INSERT WITH CHECK (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

CREATE POLICY "Operators can update their own reports" ON operator_reports
    FOR UPDATE USING (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

CREATE POLICY "Operators can delete their own reports" ON operator_reports
    FOR DELETE USING (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

-- RLS Policies for operator_scheduled_reports
CREATE POLICY "Operators can view their own scheduled reports" ON operator_scheduled_reports
    FOR SELECT USING (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

CREATE POLICY "Operators can create their own scheduled reports" ON operator_scheduled_reports
    FOR INSERT WITH CHECK (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

CREATE POLICY "Operators can update their own scheduled reports" ON operator_scheduled_reports
    FOR UPDATE USING (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

CREATE POLICY "Operators can delete their own scheduled reports" ON operator_scheduled_reports
    FOR DELETE USING (
        operator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'operator'
            AND id = operator_id
        )
    );

-- RLS Policies for operator_report_exports
CREATE POLICY "Users can view exports for their reports" ON operator_report_exports
    FOR SELECT USING (
        report_id IN (
            SELECT id FROM operator_reports
            WHERE operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can create exports for their reports" ON operator_report_exports
    FOR INSERT WITH CHECK (
        report_id IN (
            SELECT id FROM operator_reports
            WHERE operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can update exports for their reports" ON operator_report_exports
    FOR UPDATE USING (
        report_id IN (
            SELECT id FROM operator_reports
            WHERE operator_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete exports for their reports" ON operator_report_exports
    FOR DELETE USING (
        report_id IN (
            SELECT id FROM operator_reports
            WHERE operator_id = auth.uid()
        )
    );

-- Super admin policies
CREATE POLICY "Super admins can manage all reports" ON operator_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Super admins can manage all scheduled reports" ON operator_scheduled_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Super admins can manage all report exports" ON operator_report_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Create function to clean up expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
    DELETE FROM operator_report_exports 
    WHERE expires_at < NOW() 
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next run time for scheduled reports
CREATE OR REPLACE FUNCTION calculate_next_run_time(schedule_expr TEXT, last_run TIMESTAMPTZ DEFAULT NULL)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_run TIMESTAMPTZ;
BEGIN
    -- Simple schedule parsing (extend as needed)
    CASE 
        WHEN schedule_expr = 'daily' THEN
            next_run := COALESCE(last_run, NOW()) + INTERVAL '1 day';
        WHEN schedule_expr = 'weekly' THEN
            next_run := COALESCE(last_run, NOW()) + INTERVAL '1 week';
        WHEN schedule_expr = 'monthly' THEN
            next_run := COALESCE(last_run, NOW()) + INTERVAL '1 month';
        ELSE
            -- Default to daily if unknown
            next_run := COALESCE(last_run, NOW()) + INTERVAL '1 day';
    END CASE;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Create function to update next run time when scheduled report is executed
CREATE OR REPLACE FUNCTION update_scheduled_report_run_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_run_at IS DISTINCT FROM OLD.last_run_at AND NEW.last_run_at IS NOT NULL THEN
        NEW.next_run_at := calculate_next_run_time(NEW.schedule, NEW.last_run_at);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating next run time
CREATE TRIGGER update_operator_scheduled_report_next_run
    BEFORE UPDATE ON operator_scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_report_run_time();

-- Insert initial next_run_at for existing scheduled reports
UPDATE operator_scheduled_reports 
SET next_run_at = calculate_next_run_time(schedule, last_run_at)
WHERE next_run_at IS NULL AND is_active = true;

-- Create storage bucket for report exports if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-exports', 'report-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for report exports
CREATE POLICY "Users can upload their own report exports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'report-exports' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view their own report exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'report-exports' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own report exports" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'report-exports' 
        AND auth.role() = 'authenticated'
    );

-- Add comments for documentation
COMMENT ON TABLE operator_reports IS 'Stores generated operator reports with data and metadata';
COMMENT ON TABLE operator_scheduled_reports IS 'Stores scheduled report configurations for automatic generation';
COMMENT ON TABLE operator_report_exports IS 'Tracks report export files and their metadata';

COMMENT ON COLUMN operator_reports.type IS 'Type of report generated';
COMMENT ON COLUMN operator_reports.parameters IS 'Parameters used to generate the report';
COMMENT ON COLUMN operator_reports.data IS 'Generated report data and results';
COMMENT ON COLUMN operator_reports.metadata IS 'Report metadata including record counts and processing info';

COMMENT ON COLUMN operator_scheduled_reports.schedule IS 'Schedule expression (daily, weekly, monthly, or cron)';
COMMENT ON COLUMN operator_scheduled_reports.parameters IS 'Parameters to use when generating scheduled reports';

COMMENT ON COLUMN operator_report_exports.format IS 'Export format (pdf, excel, csv, json)';
COMMENT ON COLUMN operator_report_exports.options IS 'Export options like includeCharts, includeRawData';
COMMENT ON COLUMN operator_report_exports.expires_at IS 'When the export file expires and can be cleaned up';