-- Financial Reporting and Remittance System Migration
-- This migration adds tables for financial reporting, automated remittance, and transaction reconciliation

-- Create financial reporting enums
DO $$ BEGIN
    CREATE TYPE financial_report_type AS ENUM ('operator_revenue', 'host_revenue', 'transaction_reconciliation', 'payout_summary', 'revenue_analysis');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE remittance_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE remittance_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reconciliation_rule_type AS ENUM ('amount_validation', 'status_check', 'duplicate_detection', 'completeness_check');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discrepancy_type AS ENUM ('amount_mismatch', 'missing_revenue_share', 'missing_transaction', 'status_mismatch', 'duplicate_entry');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Financial reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id TEXT PRIMARY KEY,
  type financial_report_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parameters JSONB NOT NULL DEFAULT '{}',
  data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Remittance schedules table
CREATE TABLE IF NOT EXISTS remittance_schedules (
  id TEXT PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('operator', 'host')),
  frequency remittance_frequency NOT NULL,
  minimum_amount DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_date TIMESTAMPTZ NOT NULL,
  last_run_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Remittance runs table
CREATE TABLE IF NOT EXISTS remittance_runs (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES remittance_schedules(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('operator', 'host')),
  amount DECIMAL(10,2) NOT NULL,
  transaction_ids TEXT[] NOT NULL DEFAULT '{}',
  payout_id TEXT REFERENCES payouts(id) ON DELETE SET NULL,
  status remittance_status NOT NULL DEFAULT 'pending',
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commission rules table
CREATE TABLE IF NOT EXISTS commission_rules (
  id TEXT PRIMARY KEY,
  parking_type parking_type NOT NULL,
  host_percentage DECIMAL(5,2) NOT NULL,
  park_angel_percentage DECIMAL(5,2) NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT commission_rules_percentage_check CHECK (
    host_percentage + park_angel_percentage = 100
  )
);

-- Commission calculations table
CREATE TABLE IF NOT EXISTS commission_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  host_share DECIMAL(10,2) NOT NULL,
  park_angel_share DECIMAL(10,2) NOT NULL,
  commission_rule_id TEXT NOT NULL REFERENCES commission_rules(id) ON DELETE RESTRICT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reconciliation rules table
CREATE TABLE IF NOT EXISTS reconciliation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type reconciliation_rule_type NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reconciliation results table
CREATE TABLE IF NOT EXISTS reconciliation_results (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES reconciliation_rules(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  discrepancy_count INTEGER NOT NULL DEFAULT 0,
  corrected_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discrepancies table
CREATE TABLE IF NOT EXISTS discrepancies (
  id TEXT PRIMARY KEY,
  type discrepancy_type NOT NULL,
  transaction_id TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2),
  expected_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),
  difference DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default commission rules
INSERT INTO commission_rules (id, parking_type, host_percentage, park_angel_percentage, effective_date, is_active) 
VALUES
('default_hosted', 'hosted', 60, 40, NOW(), TRUE),
('default_street', 'street', 70, 30, NOW(), TRUE),
('default_facility', 'facility', 70, 30, NOW(), TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert default reconciliation rules
INSERT INTO reconciliation_rules (id, name, description, rule_type, conditions, actions, is_active)
VALUES
('amount_validation_rule', 'Amount Validation', 'Validates that transaction amounts match revenue share calculations', 'amount_validation', '[]', '[]', TRUE),
('status_check_rule', 'Status Consistency Check', 'Checks for consistent statuses between payments and bookings', 'status_check', '[]', '[]', TRUE),
('duplicate_detection_rule', 'Duplicate Transaction Detection', 'Detects potential duplicate transactions', 'duplicate_detection', '[]', '[]', TRUE),
('completeness_check_rule', 'Data Completeness Check', 'Ensures all successful transactions have revenue shares', 'completeness_check', '[]', '[]', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_by ON financial_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_at ON financial_reports(generated_at);

CREATE INDEX IF NOT EXISTS idx_remittance_schedules_recipient_id ON remittance_schedules(recipient_id);
CREATE INDEX IF NOT EXISTS idx_remittance_schedules_next_run_date ON remittance_schedules(next_run_date);
CREATE INDEX IF NOT EXISTS idx_remittance_schedules_is_active ON remittance_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_remittance_runs_schedule_id ON remittance_runs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_remittance_runs_recipient_id ON remittance_runs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_remittance_runs_status ON remittance_runs(status);
CREATE INDEX IF NOT EXISTS idx_remittance_runs_run_date ON remittance_runs(run_date);

CREATE INDEX IF NOT EXISTS idx_commission_rules_parking_type ON commission_rules(parking_type);
CREATE INDEX IF NOT EXISTS idx_commission_rules_effective_date ON commission_rules(effective_date);
CREATE INDEX IF NOT EXISTS idx_commission_rules_is_active ON commission_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_commission_calculations_transaction_id ON commission_calculations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_calculations_calculated_at ON commission_calculations(calculated_at);

CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_rule_type ON reconciliation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_is_active ON reconciliation_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_reconciliation_results_rule_id ON reconciliation_results(rule_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_results_created_at ON reconciliation_results(created_at);

CREATE INDEX IF NOT EXISTS idx_discrepancies_type ON discrepancies(type);
CREATE INDEX IF NOT EXISTS idx_discrepancies_status ON discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_discrepancies_transaction_id ON discrepancies(transaction_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_created_at ON discrepancies(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_id ON audit_trail(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_remittance_schedules_updated_at ON remittance_schedules;
CREATE TRIGGER update_remittance_schedules_updated_at BEFORE UPDATE ON remittance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commission_rules_updated_at ON commission_rules;
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON commission_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reconciliation_rules_updated_at ON reconciliation_rules;
CREATE TRIGGER update_reconciliation_rules_updated_at BEFORE UPDATE ON reconciliation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE remittance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE remittance_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Financial reports policies
DROP POLICY IF EXISTS "Admins can manage financial reports" ON financial_reports;
CREATE POLICY "Admins can manage financial reports" ON financial_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

-- Remittance schedules policies
DROP POLICY IF EXISTS "Users can manage their own remittance schedules" ON remittance_schedules;
CREATE POLICY "Users can manage their own remittance schedules" ON remittance_schedules
  FOR ALL USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Admins can view all remittance schedules" ON remittance_schedules;
CREATE POLICY "Admins can view all remittance schedules" ON remittance_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Remittance runs policies
DROP POLICY IF EXISTS "Users can view their own remittance runs" ON remittance_runs;
CREATE POLICY "Users can view their own remittance runs" ON remittance_runs
  FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "System can manage remittance runs" ON remittance_runs;
CREATE POLICY "System can manage remittance runs" ON remittance_runs
  FOR ALL USING (true);

-- Commission rules policies
DROP POLICY IF EXISTS "Anyone can view commission rules" ON commission_rules;
CREATE POLICY "Anyone can view commission rules" ON commission_rules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify commission rules" ON commission_rules;
CREATE POLICY "Only admins can modify commission rules" ON commission_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Commission calculations policies
DROP POLICY IF EXISTS "System can manage commission calculations" ON commission_calculations;
CREATE POLICY "System can manage commission calculations" ON commission_calculations
  FOR ALL USING (true);

-- Reconciliation rules policies
DROP POLICY IF EXISTS "Admins can manage reconciliation rules" ON reconciliation_rules;
CREATE POLICY "Admins can manage reconciliation rules" ON reconciliation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Reconciliation results policies
DROP POLICY IF EXISTS "Admins can view reconciliation results" ON reconciliation_results;
CREATE POLICY "Admins can view reconciliation results" ON reconciliation_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can manage reconciliation results" ON reconciliation_results;
CREATE POLICY "System can manage reconciliation results" ON reconciliation_results
  FOR ALL USING (true);

-- Discrepancies policies
DROP POLICY IF EXISTS "Admins can manage discrepancies" ON discrepancies;
CREATE POLICY "Admins can manage discrepancies" ON discrepancies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Audit trail policies
DROP POLICY IF EXISTS "Admins can view audit trail" ON audit_trail;
CREATE POLICY "Admins can view audit trail" ON audit_trail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert audit trail" ON audit_trail;
CREATE POLICY "System can insert audit trail" ON audit_trail
  FOR INSERT WITH CHECK (true);

-- Function to automatically calculate next remittance run date
CREATE OR REPLACE FUNCTION calculate_next_remittance_date(
  frequency remittance_frequency,
  last_run_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  base_date TIMESTAMPTZ;
  next_date TIMESTAMPTZ;
BEGIN
  base_date := COALESCE(last_run_date, NOW());
  
  CASE frequency
    WHEN 'daily' THEN
      next_date := base_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      next_date := base_date + INTERVAL '1 week';
    WHEN 'biweekly' THEN
      next_date := base_date + INTERVAL '2 weeks';
    WHEN 'monthly' THEN
      next_date := base_date + INTERVAL '1 month';
    ELSE
      RAISE EXCEPTION 'Unsupported frequency: %', frequency;
  END CASE;
  
  RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get active commission rule for parking type
CREATE OR REPLACE FUNCTION get_active_commission_rule(parking_type_param parking_type)
RETURNS commission_rules AS $$
DECLARE
  rule commission_rules;
BEGIN
  SELECT * INTO rule
  FROM commission_rules
  WHERE parking_type = parking_type_param
    AND is_active = TRUE
    AND effective_date <= NOW()
    AND (expiry_date IS NULL OR expiry_date >= NOW())
  ORDER BY effective_date DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active commission rule found for parking type: %', parking_type_param;
  END IF;
  
  RETURN rule;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create audit trail entries
CREATE OR REPLACE FUNCTION create_audit_trail_entry(
  entity_id_param TEXT,
  entity_type_param TEXT,
  action_param TEXT,
  user_id_param UUID DEFAULT NULL,
  details_param JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_trail (
    id,
    entity_id,
    entity_type,
    action,
    user_id,
    details
  ) VALUES (
    'audit_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(md5(random()::text), 1, 9),
    entity_id_param,
    entity_type_param,
    action_param,
    COALESCE(user_id_param, auth.uid()),
    details_param
  );
END;
$$ LANGUAGE plpgsql;