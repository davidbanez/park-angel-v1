-- Violation Reporting System Migration
-- This migration adds tables for violation reporting, enforcement tracking, and monitoring

-- Violation Reports table for tracking all violation reports
CREATE TABLE violation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_plate_number TEXT NOT NULL,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('illegal_parking', 'expired_session', 'no_payment', 'blocking_access', 'disabled_spot_violation', 'other')),
  description TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  spot_id UUID REFERENCES parking_spots(id) ON DELETE SET NULL,
  coordinates JSONB, -- {latitude, longitude, address}
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'dismissed', 'escalated')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  enforcement_action TEXT CHECK (enforcement_action IN ('warning', 'towing', 'clamping', 'fine', 'none')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- Additional data like AI confidence, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforcement Actions table for tracking towing and clamping requests
CREATE TABLE enforcement_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violation_report_id UUID NOT NULL REFERENCES violation_reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('towing', 'clamping', 'warning', 'fine')),
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'assigned', 'in_progress', 'completed', 'cancelled', 'failed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  service_provider TEXT, -- Towing company, enforcement agency, etc.
  service_provider_contact TEXT,
  scheduled_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_photos TEXT[] DEFAULT '{}',
  completion_notes TEXT,
  customer_notified BOOLEAN DEFAULT FALSE,
  customer_notification_method TEXT, -- 'sms', 'email', 'call', 'app'
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed', 'waived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- License Plate Recognition table for AI scanning results
CREATE TABLE license_plate_recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violation_report_id UUID REFERENCES violation_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  detected_plate_number TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  bounding_box JSONB NOT NULL, -- {x, y, width, height}
  processing_method TEXT NOT NULL DEFAULT 'manual' CHECK (processing_method IN ('manual', 'ai_google', 'ai_aws', 'ai_azure', 'ai_custom')),
  processing_time_ms INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Violation Monitoring Summary table for reporting and analytics
CREATE TABLE violation_monitoring_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_violations_reported INTEGER NOT NULL DEFAULT 0,
  violations_by_type JSONB NOT NULL DEFAULT '{}', -- {"illegal_parking": 5, "expired_session": 3}
  total_enforcement_actions INTEGER NOT NULL DEFAULT 0,
  enforcement_by_type JSONB NOT NULL DEFAULT '{}', -- {"towing": 2, "clamping": 1}
  avg_response_time_minutes INTEGER,
  resolution_rate DECIMAL(5,2), -- Percentage of violations resolved
  total_fines_issued DECIMAL(10,2) DEFAULT 0,
  total_enforcement_costs DECIMAL(10,2) DEFAULT 0,
  ai_accuracy_rate DECIMAL(5,2), -- Percentage of AI recognitions that were correct
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, operator_id, report_date)
);

-- Enforcement Service Providers table for managing towing companies, etc.
CREATE TABLE enforcement_service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('towing', 'clamping', 'security', 'parking_enforcement')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  service_areas TEXT[], -- Array of location IDs or area names they serve
  hourly_rate DECIMAL(10,2),
  base_fee DECIMAL(10,2),
  availability_hours JSONB, -- {"monday": {"start": "08:00", "end": "18:00"}}
  rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  contract_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for violation reporting tables
CREATE INDEX idx_violation_reports_reported_by ON violation_reports(reported_by);
CREATE INDEX idx_violation_reports_vehicle_plate ON violation_reports(vehicle_plate_number);
CREATE INDEX idx_violation_reports_violation_type ON violation_reports(violation_type);
CREATE INDEX idx_violation_reports_status ON violation_reports(status);
CREATE INDEX idx_violation_reports_location_id ON violation_reports(location_id);
CREATE INDEX idx_violation_reports_spot_id ON violation_reports(spot_id);
CREATE INDEX idx_violation_reports_created_at ON violation_reports(created_at);
CREATE INDEX idx_violation_reports_priority ON violation_reports(priority);

CREATE INDEX idx_enforcement_actions_violation_report_id ON enforcement_actions(violation_report_id);
CREATE INDEX idx_enforcement_actions_action_type ON enforcement_actions(action_type);
CREATE INDEX idx_enforcement_actions_status ON enforcement_actions(status);
CREATE INDEX idx_enforcement_actions_assigned_to ON enforcement_actions(assigned_to);
CREATE INDEX idx_enforcement_actions_requested_by ON enforcement_actions(requested_by);
CREATE INDEX idx_enforcement_actions_priority ON enforcement_actions(priority);
CREATE INDEX idx_enforcement_actions_created_at ON enforcement_actions(created_at);

CREATE INDEX idx_license_plate_recognitions_violation_report_id ON license_plate_recognitions(violation_report_id);
CREATE INDEX idx_license_plate_recognitions_detected_plate ON license_plate_recognitions(detected_plate_number);
CREATE INDEX idx_license_plate_recognitions_confidence ON license_plate_recognitions(confidence_score);
CREATE INDEX idx_license_plate_recognitions_verified ON license_plate_recognitions(verified);

CREATE INDEX idx_violation_monitoring_summaries_location_id ON violation_monitoring_summaries(location_id);
CREATE INDEX idx_violation_monitoring_summaries_operator_id ON violation_monitoring_summaries(operator_id);
CREATE INDEX idx_violation_monitoring_summaries_report_date ON violation_monitoring_summaries(report_date);

CREATE INDEX idx_enforcement_service_providers_service_type ON enforcement_service_providers(service_type);
CREATE INDEX idx_enforcement_service_providers_is_active ON enforcement_service_providers(is_active);

-- Add updated_at triggers
CREATE TRIGGER update_violation_reports_updated_at 
  BEFORE UPDATE ON violation_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enforcement_actions_updated_at 
  BEFORE UPDATE ON enforcement_actions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_violation_monitoring_summaries_updated_at 
  BEFORE UPDATE ON violation_monitoring_summaries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enforcement_service_providers_updated_at 
  BEFORE UPDATE ON enforcement_service_providers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update violation monitoring summaries
CREATE OR REPLACE FUNCTION update_violation_monitoring_summary()
RETURNS TRIGGER AS $
DECLARE
  summary_date DATE;
  loc_id UUID;
  op_id UUID;
BEGIN
  -- Determine the date and location for the summary
  summary_date := DATE(COALESCE(NEW.created_at, OLD.created_at));
  loc_id := COALESCE(NEW.location_id, OLD.location_id);
  
  -- Get operator ID from the user who reported
  SELECT operator_id INTO op_id 
  FROM users 
  WHERE id = COALESCE(NEW.reported_by, OLD.reported_by);
  
  IF loc_id IS NOT NULL AND op_id IS NOT NULL THEN
    -- Update or insert summary record
    INSERT INTO violation_monitoring_summaries (
      location_id, 
      operator_id, 
      report_date,
      total_violations_reported,
      violations_by_type
    )
    SELECT 
      loc_id,
      op_id,
      summary_date,
      COUNT(*),
      jsonb_object_agg(violation_type, type_count)
    FROM (
      SELECT 
        violation_type,
        COUNT(*) as type_count
      FROM violation_reports 
      WHERE location_id = loc_id 
        AND DATE(created_at) = summary_date
        AND EXISTS (
          SELECT 1 FROM users 
          WHERE id = reported_by 
          AND operator_id = op_id
        )
      GROUP BY violation_type
    ) type_counts
    ON CONFLICT (location_id, operator_id, report_date) 
    DO UPDATE SET
      total_violations_reported = EXCLUDED.total_violations_reported,
      violations_by_type = EXCLUDED.violations_by_type,
      updated_at = NOW();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_violation_monitoring_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON violation_reports
  FOR EACH ROW EXECUTE FUNCTION update_violation_monitoring_summary();

-- Function to automatically create enforcement action when violation is escalated
CREATE OR REPLACE FUNCTION auto_create_enforcement_action()
RETURNS TRIGGER AS $
BEGIN
  -- If violation status changes to 'escalated' and enforcement_action is set
  IF NEW.status = 'escalated' AND OLD.status != 'escalated' AND NEW.enforcement_action IS NOT NULL THEN
    INSERT INTO enforcement_actions (
      violation_report_id,
      action_type,
      requested_by,
      priority,
      status
    ) VALUES (
      NEW.id,
      NEW.enforcement_action,
      NEW.reported_by,
      NEW.priority,
      'requested'
    );
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_enforcement_action_trigger
  AFTER UPDATE ON violation_reports
  FOR EACH ROW EXECUTE FUNCTION auto_create_enforcement_action();

-- Views for violation reporting analytics
CREATE VIEW violation_reports_with_details AS
SELECT 
  vr.*,
  up.first_name as reporter_first_name,
  up.last_name as reporter_last_name,
  up.phone as reporter_phone,
  l.name as location_name,
  l.address as location_address,
  ps.spot_number,
  ps.spot_type,
  COUNT(ea.id) as enforcement_actions_count,
  COUNT(lpr.id) as ai_recognitions_count,
  AVG(lpr.confidence_score) as avg_ai_confidence
FROM violation_reports vr
LEFT JOIN user_profiles up ON vr.reported_by = up.user_id
LEFT JOIN locations l ON vr.location_id = l.id
LEFT JOIN parking_spots ps ON vr.spot_id = ps.id
LEFT JOIN enforcement_actions ea ON vr.id = ea.violation_report_id
LEFT JOIN license_plate_recognitions lpr ON vr.id = lpr.violation_report_id
GROUP BY vr.id, up.first_name, up.last_name, up.phone, l.name, l.address, ps.spot_number, ps.spot_type;

CREATE VIEW enforcement_actions_with_details AS
SELECT 
  ea.*,
  vr.vehicle_plate_number,
  vr.violation_type,
  vr.description as violation_description,
  up_req.first_name as requester_first_name,
  up_req.last_name as requester_last_name,
  up_ass.first_name as assignee_first_name,
  up_ass.last_name as assignee_last_name,
  esp.name as service_provider_name,
  esp.phone as service_provider_phone
FROM enforcement_actions ea
JOIN violation_reports vr ON ea.violation_report_id = vr.id
LEFT JOIN user_profiles up_req ON ea.requested_by = up_req.user_id
LEFT JOIN user_profiles up_ass ON ea.assigned_to = up_ass.user_id
LEFT JOIN enforcement_service_providers esp ON ea.service_provider = esp.name;

-- RLS Policies for violation tables
ALTER TABLE violation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_plate_recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_monitoring_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_service_providers ENABLE ROW LEVEL SECURITY;

-- Users can view violation reports they created or are assigned to handle
CREATE POLICY "Users can view relevant violation reports" ON violation_reports
  FOR SELECT USING (
    reported_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

CREATE POLICY "POS operators can create violation reports" ON violation_reports
  FOR INSERT WITH CHECK (
    reported_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('pos', 'operator', 'admin')
    )
  );

CREATE POLICY "Authorized users can update violation reports" ON violation_reports
  FOR UPDATE USING (
    reported_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

-- Similar policies for enforcement actions
CREATE POLICY "Users can view relevant enforcement actions" ON enforcement_actions
  FOR SELECT USING (
    requested_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

CREATE POLICY "Authorized users can create enforcement actions" ON enforcement_actions
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('pos', 'operator', 'admin')
    )
  );

CREATE POLICY "Authorized users can update enforcement actions" ON enforcement_actions
  FOR UPDATE USING (
    requested_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON violation_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON enforcement_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON license_plate_recognitions TO authenticated;
GRANT SELECT ON violation_monitoring_summaries TO authenticated;
GRANT SELECT ON enforcement_service_providers TO authenticated;

-- Grant access to views
GRANT SELECT ON violation_reports_with_details TO authenticated;
GRANT SELECT ON enforcement_actions_with_details TO authenticated;

-- Insert some sample enforcement service providers
INSERT INTO enforcement_service_providers (name, service_type, contact_person, phone, email, service_areas, hourly_rate, base_fee) VALUES
('Metro Manila Towing Services', 'towing', 'Juan Dela Cruz', '+63917-123-4567', 'operations@mmts.ph', ARRAY['metro_manila'], 500.00, 1000.00),
('Quick Response Clamping', 'clamping', 'Maria Santos', '+63918-234-5678', 'dispatch@qrc.ph', ARRAY['metro_manila', 'quezon_city'], 200.00, 300.00),
('24/7 Parking Enforcement', 'parking_enforcement', 'Roberto Garcia', '+63919-345-6789', 'enforcement@247pe.ph', ARRAY['makati', 'bgc'], 300.00, 500.00);