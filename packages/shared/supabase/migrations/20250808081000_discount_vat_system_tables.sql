-- Discount and VAT Management System Tables Migration
-- This migration creates tables for discount rules, VAT configuration, and discount applications

-- Discount rules table
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('senior', 'pwd', 'custom')),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_vat_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  conditions JSONB DEFAULT '[]'::jsonb,
  operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VAT configuration table
CREATE TABLE IF NOT EXISTS vat_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operator_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Discount applications table (records when discounts are applied to bookings)
CREATE TABLE IF NOT EXISTS discount_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_rule_id UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  vat_exempted BOOLEAN NOT NULL DEFAULT FALSE,
  applied_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discount_rules_type ON discount_rules(type);
CREATE INDEX IF NOT EXISTS idx_discount_rules_operator_id ON discount_rules(operator_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_is_active ON discount_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_rules_created_by ON discount_rules(created_by);

CREATE INDEX IF NOT EXISTS idx_vat_config_operator_id ON vat_config(operator_id);
CREATE INDEX IF NOT EXISTS idx_vat_config_is_default ON vat_config(is_default);
CREATE INDEX IF NOT EXISTS idx_vat_config_is_active ON vat_config(is_active);

CREATE INDEX IF NOT EXISTS idx_discount_applications_booking_id ON discount_applications(booking_id);
CREATE INDEX IF NOT EXISTS idx_discount_applications_discount_rule_id ON discount_applications(discount_rule_id);
CREATE INDEX IF NOT EXISTS idx_discount_applications_applied_by ON discount_applications(applied_by);
CREATE INDEX IF NOT EXISTS idx_discount_applications_created_at ON discount_applications(created_at);

-- Create triggers for updated_at timestamps
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_discount_rules_updated_at') THEN
    CREATE TRIGGER update_discount_rules_updated_at 
      BEFORE UPDATE ON discount_rules 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vat_config_updated_at') THEN
    CREATE TRIGGER update_vat_config_updated_at 
      BEFORE UPDATE ON vat_config 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_rules
CREATE POLICY "Admins can manage all discount rules" ON discount_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Operators can manage their own discount rules" ON discount_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN operator_profiles op ON u.id = op.operator_id
      WHERE u.id = auth.uid() 
      AND u.user_type = 'operator'
      AND op.operator_id = discount_rules.operator_id
    )
  );

CREATE POLICY "Users can view active discount rules" ON discount_rules
  FOR SELECT USING (is_active = true);

-- RLS Policies for vat_config
CREATE POLICY "Admins can manage all VAT configs" ON vat_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Operators can manage their own VAT configs" ON vat_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN operator_profiles op ON u.id = op.operator_id
      WHERE u.id = auth.uid() 
      AND u.user_type = 'operator'
      AND op.operator_id = vat_config.operator_id
    )
  );

CREATE POLICY "Users can view active VAT configs" ON vat_config
  FOR SELECT USING (is_active = true);

-- RLS Policies for discount_applications
CREATE POLICY "Admins can view all discount applications" ON discount_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Operators can view discount applications for their bookings" ON discount_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN operator_profiles op ON u.id = op.operator_id
      JOIN bookings b ON b.id = discount_applications.booking_id
      JOIN parking_spots ps ON b.spot_id = ps.id
      JOIN zones z ON ps.zone_id = z.id
      JOIN sections s ON z.section_id = s.id
      JOIN locations l ON s.location_id = l.id
      WHERE u.id = auth.uid() 
      AND u.user_type = 'operator'
      AND l.operator_id = op.operator_id
    )
  );

CREATE POLICY "POS operators can insert discount applications" ON discount_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator', 'pos')
    )
  );

-- Insert default discount rules (only if they don't exist)
INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, conditions, created_by) 
SELECT 
  'Senior Citizen Discount',
  'senior',
  20.00,
  true,
  '[{"field": "age", "operator": "greater_than_or_equal", "value": 60}]'::jsonb,
  (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM discount_rules 
  WHERE name = 'Senior Citizen Discount' AND type = 'senior'
);

INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, conditions, created_by) 
SELECT 
  'Person with Disability (PWD) Discount',
  'pwd',
  20.00,
  true,
  '[{"field": "hasPWDId", "operator": "equals", "value": true}]'::jsonb,
  (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM discount_rules 
  WHERE name = 'Person with Disability (PWD) Discount' AND type = 'pwd'
);

-- Insert default VAT configuration (only if it doesn't exist)
INSERT INTO vat_config (name, rate, is_default) 
SELECT 'Standard VAT (Philippines)', 12.00, true
WHERE NOT EXISTS (
  SELECT 1 FROM vat_config 
  WHERE name = 'Standard VAT (Philippines)' AND is_default = true
);

INSERT INTO vat_config (name, rate, is_default) 
SELECT 'Zero VAT', 0.00, false
WHERE NOT EXISTS (
  SELECT 1 FROM vat_config 
  WHERE name = 'Zero VAT'
);