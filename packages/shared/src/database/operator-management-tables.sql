-- Operator Management Tables
-- Additional tables for comprehensive operator management

-- Operator profiles table (extends user_profiles for operators)
CREATE TABLE operator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_registration_number TEXT,
  tax_identification_number TEXT,
  business_address JSONB NOT NULL, -- {street, city, state, country, postal_code}
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT,
  business_type TEXT, -- 'individual', 'corporation', 'partnership'
  license_number TEXT,
  license_expiry_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_documents TEXT[] DEFAULT '{}', -- URLs to uploaded documents
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id)
);

-- Operator bank details for remittance
CREATE TABLE operator_bank_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  branch_name TEXT,
  branch_address TEXT,
  account_type TEXT NOT NULL DEFAULT 'checking', -- 'checking', 'savings'
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_documents TEXT[] DEFAULT '{}', -- Bank statements, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id, is_primary) WHERE is_primary = TRUE
);

-- Revenue sharing configurations per operator
CREATE TABLE operator_revenue_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parking_type parking_type NOT NULL,
  operator_percentage DECIMAL(5,2) NOT NULL CHECK (operator_percentage >= 0 AND operator_percentage <= 100),
  park_angel_percentage DECIMAL(5,2) NOT NULL CHECK (park_angel_percentage >= 0 AND park_angel_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id, parking_type, effective_date)
);

-- Operator remittances table
CREATE TABLE operator_remittances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_detail_id UUID NOT NULL REFERENCES operator_bank_details(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL,
  operator_share DECIMAL(12,2) NOT NULL,
  park_angel_share DECIMAL(12,2) NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payment_reference TEXT, -- Bank transfer reference
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIP user assignments table
CREATE TABLE vip_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vip_type TEXT NOT NULL CHECK (vip_type IN ('VVIP', 'Flex VVIP', 'VIP', 'Spot VIP')),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE, -- For location-specific VIP
  spot_ids UUID[] DEFAULT '{}', -- For spot-specific VIP
  time_limit_minutes INTEGER, -- For Flex types
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operator performance metrics
CREATE TABLE operator_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_spots INTEGER NOT NULL DEFAULT 0,
  occupied_spots INTEGER NOT NULL DEFAULT 0,
  occupancy_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  average_session_duration INTEGER NOT NULL DEFAULT 0, -- in minutes
  customer_satisfaction_score DECIMAL(3,2), -- 1.00 to 5.00
  violation_reports INTEGER NOT NULL DEFAULT 0,
  response_time_avg INTEGER, -- average response time in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_operator_profiles_operator_id ON operator_profiles(operator_id);
CREATE INDEX idx_operator_profiles_is_verified ON operator_profiles(is_verified);
CREATE INDEX idx_operator_bank_details_operator_id ON operator_bank_details(operator_id);
CREATE INDEX idx_operator_bank_details_is_primary ON operator_bank_details(is_primary);
CREATE INDEX idx_operator_revenue_configs_operator_id ON operator_revenue_configs(operator_id);
CREATE INDEX idx_operator_revenue_configs_parking_type ON operator_revenue_configs(parking_type);
CREATE INDEX idx_operator_revenue_configs_effective_date ON operator_revenue_configs(effective_date);
CREATE INDEX idx_operator_remittances_operator_id ON operator_remittances(operator_id);
CREATE INDEX idx_operator_remittances_status ON operator_remittances(status);
CREATE INDEX idx_operator_remittances_period ON operator_remittances(period_start, period_end);
CREATE INDEX idx_vip_assignments_user_id ON vip_assignments(user_id);
CREATE INDEX idx_vip_assignments_operator_id ON vip_assignments(operator_id);
CREATE INDEX idx_vip_assignments_vip_type ON vip_assignments(vip_type);
CREATE INDEX idx_vip_assignments_is_active ON vip_assignments(is_active);
CREATE INDEX idx_operator_performance_metrics_operator_id ON operator_performance_metrics(operator_id);
CREATE INDEX idx_operator_performance_metrics_date ON operator_performance_metrics(metric_date);

-- Add triggers for updated_at columns
CREATE TRIGGER update_operator_profiles_updated_at 
  BEFORE UPDATE ON operator_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_bank_details_updated_at 
  BEFORE UPDATE ON operator_bank_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_revenue_configs_updated_at 
  BEFORE UPDATE ON operator_revenue_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_remittances_updated_at 
  BEFORE UPDATE ON operator_remittances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vip_assignments_updated_at 
  BEFORE UPDATE ON vip_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary bank account per operator
CREATE OR REPLACE FUNCTION ensure_single_primary_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE operator_bank_details 
    SET is_primary = FALSE 
    WHERE operator_id = NEW.operator_id 
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_bank_account_trigger
  BEFORE INSERT OR UPDATE ON operator_bank_details
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_bank_account();

-- Function to calculate operator performance metrics
CREATE OR REPLACE FUNCTION calculate_operator_performance(
  operator_uuid UUID,
  metric_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  total_spots_count INTEGER;
  occupied_spots_count INTEGER;
  occupancy_rate_calc DECIMAL(5,2);
  total_revenue_calc DECIMAL(12,2);
  transaction_count_calc INTEGER;
  avg_session_duration INTEGER;
  violation_reports_count INTEGER;
BEGIN
  -- Calculate total spots for operator
  SELECT COUNT(*) INTO total_spots_count
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE l.operator_id = operator_uuid;

  -- Calculate occupied spots
  SELECT COUNT(*) INTO occupied_spots_count
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE l.operator_id = operator_uuid
  AND ps.status = 'occupied';

  -- Calculate occupancy rate
  IF total_spots_count > 0 THEN
    occupancy_rate_calc := (occupied_spots_count::DECIMAL / total_spots_count::DECIMAL) * 100;
  ELSE
    occupancy_rate_calc := 0;
  END IF;

  -- Calculate revenue and transactions for the date
  SELECT 
    COALESCE(SUM(rs.operator_share), 0),
    COUNT(*)
  INTO total_revenue_calc, transaction_count_calc
  FROM revenue_shares rs
  WHERE rs.operator_id = operator_uuid
  AND DATE(rs.created_at) = metric_date;

  -- Calculate average session duration
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60), 0)
  INTO avg_session_duration
  FROM bookings b
  JOIN parking_spots ps ON b.spot_id = ps.id
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE l.operator_id = operator_uuid
  AND DATE(b.created_at) = metric_date
  AND b.status = 'completed';

  -- Calculate violation reports
  -- This would need to be implemented based on violation reporting system

  -- Insert or update performance metrics
  INSERT INTO operator_performance_metrics (
    operator_id,
    metric_date,
    total_spots,
    occupied_spots,
    occupancy_rate,
    total_revenue,
    transaction_count,
    average_session_duration,
    violation_reports
  ) VALUES (
    operator_uuid,
    metric_date,
    total_spots_count,
    occupied_spots_count,
    occupancy_rate_calc,
    total_revenue_calc,
    transaction_count_calc,
    avg_session_duration,
    0 -- violation_reports_count
  )
  ON CONFLICT (operator_id, metric_date) 
  DO UPDATE SET
    total_spots = EXCLUDED.total_spots,
    occupied_spots = EXCLUDED.occupied_spots,
    occupancy_rate = EXCLUDED.occupancy_rate,
    total_revenue = EXCLUDED.total_revenue,
    transaction_count = EXCLUDED.transaction_count,
    average_session_duration = EXCLUDED.average_session_duration,
    violation_reports = EXCLUDED.violation_reports,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for operator performance metrics
ALTER TABLE operator_performance_metrics 
ADD CONSTRAINT unique_operator_performance_date 
UNIQUE (operator_id, metric_date);