-- Comprehensive database schema synchronization fix
-- This migration handles table name and column mismatches between original schema and new migrations

-- 1. Fix violation_reports table column name mismatch
-- The original schema uses 'reporter_id' but newer migrations expect 'reported_by'
DO $$
BEGIN
    -- Check if reporter_id exists and reported_by doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violation_reports' 
        AND column_name = 'reporter_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violation_reports' 
        AND column_name = 'reported_by'
    ) THEN
        -- Rename the column
        ALTER TABLE violation_reports RENAME COLUMN reporter_id TO reported_by;
        
        -- Update any existing indexes that reference the old column name
        DROP INDEX IF EXISTS idx_violation_reports_reporter_id;
        CREATE INDEX IF NOT EXISTS idx_violation_reports_reported_by ON violation_reports(reported_by);
    END IF;
END $$;

-- 2. Handle audit_logs vs audit_trail table name mismatch
-- The original schema has 'audit_logs' but newer migrations expect 'audit_trail'
DO $$
BEGIN
    -- If audit_logs exists but audit_trail doesn't, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_trail'
    ) THEN
        -- Rename the table
        ALTER TABLE audit_logs RENAME TO audit_trail;
        
        -- Update column names to match expected schema
        ALTER TABLE audit_trail RENAME COLUMN resource_type TO entity_type;
        ALTER TABLE audit_trail RENAME COLUMN resource_id TO entity_id;
        ALTER TABLE audit_trail ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
        
        -- Drop old columns that don't match new schema
        ALTER TABLE audit_trail DROP COLUMN IF EXISTS old_values;
        ALTER TABLE audit_trail DROP COLUMN IF EXISTS new_values;
        ALTER TABLE audit_trail DROP COLUMN IF EXISTS ip_address;
        ALTER TABLE audit_trail DROP COLUMN IF EXISTS user_agent;
        
        -- Update indexes
        DROP INDEX IF EXISTS idx_audit_logs_user_id;
        DROP INDEX IF EXISTS idx_audit_logs_action;
        DROP INDEX IF EXISTS idx_audit_logs_resource_type;
        DROP INDEX IF EXISTS idx_audit_logs_created_at;
        
        CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_id ON audit_trail(entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
    END IF;
END $$;

-- 3. Ensure violation_reports has all expected columns with correct structure
ALTER TABLE violation_reports 
    ALTER COLUMN reported_by SET NOT NULL,
    ALTER COLUMN location_id SET NOT NULL,
    ALTER COLUMN violation_type SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update status check constraint to match expected values
ALTER TABLE violation_reports DROP CONSTRAINT IF EXISTS violation_reports_status_check;
ALTER TABLE violation_reports ADD CONSTRAINT violation_reports_status_check 
    CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed'));

-- Ensure photos column is properly typed
ALTER TABLE violation_reports ALTER COLUMN photos TYPE TEXT[] USING photos::TEXT[];

-- Add missing indexes for violation_reports
CREATE INDEX IF NOT EXISTS idx_violation_reports_location_id ON violation_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_violation_reports_status ON violation_reports(status);
CREATE INDEX IF NOT EXISTS idx_violation_reports_created_at ON violation_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_violation_reports_reported_by ON violation_reports(reported_by);

-- Add updated_at trigger for violation_reports
DROP TRIGGER IF EXISTS update_violation_reports_updated_at ON violation_reports;
CREATE TRIGGER update_violation_reports_updated_at 
    BEFORE UPDATE ON violation_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE violation_reports IS 'Parking violation reports and enforcement tracking';
COMMENT ON TABLE audit_trail IS 'Comprehensive audit log of all system actions';