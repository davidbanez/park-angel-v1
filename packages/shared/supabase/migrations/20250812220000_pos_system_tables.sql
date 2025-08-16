-- POS System Tables Migration
-- This migration adds tables for POS authentication, cash management, and operations

-- POS Sessions table for shift management
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  previous_cash_amount DECIMAL(10,2) NOT NULL,
  current_cash_amount DECIMAL(10,2) NOT NULL,
  end_cash_amount DECIMAL(10,2),
  cash_difference DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Transactions table for tracking all POS operations
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parking_fee', 'discount', 'cash_adjustment', 'refund', 'violation_fee')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  parking_session_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_plate_number TEXT,
  discount_type TEXT,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  receipt_number TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'digital_wallet')),
  change_amount DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cash Drawer Operations table for audit trail
CREATE TABLE cash_drawer_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('open', 'close', 'count', 'adjustment', 'deposit', 'withdrawal')),
  amount DECIMAL(10,2),
  reason TEXT,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hardware_status JSONB DEFAULT '{}', -- Cash drawer hardware status
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Hardware Status table for tracking connected devices
CREATE TABLE pos_hardware_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  cash_drawer JSONB NOT NULL DEFAULT '{"connected": false, "status": "unknown"}',
  printer JSONB NOT NULL DEFAULT '{"connected": false, "status": "unknown", "paper_status": "unknown"}',
  scanner JSONB NOT NULL DEFAULT '{"available": false, "type": "camera", "status": "unknown"}',
  biometric JSONB NOT NULL DEFAULT '{"available": false, "type": "none", "enrolled": false}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Receipts table for receipt management and reprinting
CREATE TABLE pos_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_data JSONB NOT NULL, -- Complete receipt data for reprinting
  print_status TEXT NOT NULL DEFAULT 'pending' CHECK (print_status IN ('pending', 'printed', 'failed', 'reprinted')),
  print_attempts INTEGER DEFAULT 0,
  last_print_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Shift Reports table for end-of-shift summaries
CREATE TABLE pos_shift_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_cash_collected DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_discounts_given DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_vat_collected DECIMAL(10,2) NOT NULL DEFAULT 0,
  cash_over_short DECIMAL(10,2) NOT NULL DEFAULT 0,
  violations_reported INTEGER NOT NULL DEFAULT 0,
  parking_sessions_created INTEGER NOT NULL DEFAULT 0,
  report_data JSONB NOT NULL DEFAULT '{}', -- Detailed report breakdown
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Cash Remittance table for tracking cash deposits
CREATE TABLE pos_cash_remittances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  deposit_method TEXT NOT NULL CHECK (deposit_method IN ('bank_deposit', 'cash_pickup', 'digital_transfer')),
  reference_number TEXT,
  deposit_date TIMESTAMPTZ NOT NULL,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'discrepancy', 'resolved')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for POS tables
CREATE INDEX idx_pos_sessions_operator_id ON pos_sessions(operator_id);
CREATE INDEX idx_pos_sessions_location_id ON pos_sessions(location_id);
CREATE INDEX idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX idx_pos_sessions_start_time ON pos_sessions(start_time);

CREATE INDEX idx_pos_transactions_session_id ON pos_transactions(session_id);
CREATE INDEX idx_pos_transactions_type ON pos_transactions(type);
CREATE INDEX idx_pos_transactions_receipt_number ON pos_transactions(receipt_number);
CREATE INDEX idx_pos_transactions_created_at ON pos_transactions(created_at);

CREATE INDEX idx_cash_drawer_operations_session_id ON cash_drawer_operations(session_id);
CREATE INDEX idx_cash_drawer_operations_type ON cash_drawer_operations(type);
CREATE INDEX idx_cash_drawer_operations_operator_id ON cash_drawer_operations(operator_id);

CREATE INDEX idx_pos_hardware_status_session_id ON pos_hardware_status(session_id);

CREATE INDEX idx_pos_receipts_transaction_id ON pos_receipts(transaction_id);
CREATE INDEX idx_pos_receipts_receipt_number ON pos_receipts(receipt_number);
CREATE INDEX idx_pos_receipts_print_status ON pos_receipts(print_status);

CREATE INDEX idx_pos_shift_reports_session_id ON pos_shift_reports(session_id);
CREATE INDEX idx_pos_shift_reports_generated_at ON pos_shift_reports(generated_at);

CREATE INDEX idx_pos_cash_remittances_session_id ON pos_cash_remittances(session_id);
CREATE INDEX idx_pos_cash_remittances_operator_id ON pos_cash_remittances(operator_id);
CREATE INDEX idx_pos_cash_remittances_status ON pos_cash_remittances(status);

-- Add updated_at triggers for tables that need them
CREATE TRIGGER update_pos_sessions_updated_at 
  BEFORE UPDATE ON pos_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_cash_remittances_updated_at 
  BEFORE UPDATE ON pos_cash_remittances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('receipt_sequence')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for receipt numbers
CREATE SEQUENCE receipt_sequence START 1;

-- Function to automatically calculate cash difference when ending a shift
CREATE OR REPLACE FUNCTION calculate_cash_difference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_cash_amount IS NOT NULL AND OLD.end_cash_amount IS NULL THEN
    -- Calculate expected cash amount based on transactions
    WITH transaction_totals AS (
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('parking_fee', 'violation_fee') THEN amount ELSE 0 END), 0) as cash_in,
        COALESCE(SUM(CASE WHEN type IN ('refund') THEN amount ELSE 0 END), 0) as cash_out,
        COALESCE(SUM(CASE WHEN type = 'cash_adjustment' AND amount > 0 THEN amount ELSE 0 END), 0) as adjustments_in,
        COALESCE(SUM(CASE WHEN type = 'cash_adjustment' AND amount < 0 THEN ABS(amount) ELSE 0 END), 0) as adjustments_out
      FROM pos_transactions 
      WHERE session_id = NEW.id AND payment_method = 'cash'
    )
    SELECT 
      NEW.current_cash_amount + cash_in - cash_out + adjustments_in - adjustments_out
    INTO NEW.cash_difference
    FROM transaction_totals;
    
    -- Calculate actual difference
    NEW.cash_difference := NEW.end_cash_amount - NEW.cash_difference;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_cash_difference_trigger
  BEFORE UPDATE ON pos_sessions
  FOR EACH ROW EXECUTE FUNCTION calculate_cash_difference();

-- Function to automatically generate shift reports when session ends
CREATE OR REPLACE FUNCTION generate_shift_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN
    INSERT INTO pos_shift_reports (
      session_id,
      total_transactions,
      total_cash_collected,
      total_discounts_given,
      total_vat_collected,
      cash_over_short,
      violations_reported,
      parking_sessions_created,
      report_data
    )
    SELECT 
      NEW.id,
      COUNT(*) as total_transactions,
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as total_cash_collected,
      COALESCE(SUM(CASE WHEN discount_type IS NOT NULL THEN amount * 0.2 ELSE 0 END), 0) as total_discounts_given, -- Assuming 20% discount
      COALESCE(SUM(vat_amount), 0) as total_vat_collected,
      COALESCE(NEW.cash_difference, 0) as cash_over_short,
      (SELECT COUNT(*) FROM violation_reports WHERE created_at >= NEW.start_time AND created_at <= NEW.end_time) as violations_reported,
      COALESCE(SUM(CASE WHEN type = 'parking_fee' THEN 1 ELSE 0 END), 0) as parking_sessions_created,
      jsonb_build_object(
        'session_duration', EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))/3600,
        'avg_transaction_amount', AVG(amount),
        'payment_methods', jsonb_object_agg(payment_method, COUNT(*))
      ) as report_data
    FROM pos_transactions 
    WHERE session_id = NEW.id
    GROUP BY NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_shift_report_trigger
  AFTER UPDATE ON pos_sessions
  FOR EACH ROW EXECUTE FUNCTION generate_shift_report();

-- View for active POS sessions with operator details
CREATE VIEW active_pos_sessions_view AS
SELECT 
  ps.*,
  up.first_name,
  up.last_name,
  up.phone,
  l.name as location_name,
  l.address as location_address,
  COUNT(pt.id) as transaction_count,
  COALESCE(SUM(pt.amount), 0) as total_amount
FROM pos_sessions ps
JOIN user_profiles up ON ps.operator_id = up.user_id
JOIN locations l ON ps.location_id = l.id
LEFT JOIN pos_transactions pt ON ps.id = pt.session_id
WHERE ps.status = 'active'
GROUP BY ps.id, up.first_name, up.last_name, up.phone, l.name, l.address;

-- View for POS transaction summary
CREATE VIEW pos_transaction_summary_view AS
SELECT 
  pt.*,
  ps.operator_id,
  up.first_name,
  up.last_name,
  l.name as location_name,
  pr.print_status
FROM pos_transactions pt
JOIN pos_sessions ps ON pt.session_id = ps.id
JOIN user_profiles up ON ps.operator_id = up.user_id
JOIN locations l ON ps.location_id = l.id
LEFT JOIN pos_receipts pr ON pt.id = pr.transaction_id;

-- RLS Policies for POS tables
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_hardware_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_cash_remittances ENABLE ROW LEVEL SECURITY;

-- POS operators can only access their own sessions and transactions
CREATE POLICY "POS operators can view own sessions" ON pos_sessions
  FOR SELECT USING (
    auth.uid() = operator_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
      AND (operator_id IS NULL OR operator_id = users.operator_id)
    )
  );

CREATE POLICY "POS operators can create sessions" ON pos_sessions
  FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "POS operators can update own sessions" ON pos_sessions
  FOR UPDATE USING (auth.uid() = operator_id);

-- Similar policies for other POS tables
CREATE POLICY "POS operators can view own transactions" ON pos_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pos_sessions 
      WHERE id = session_id 
      AND (operator_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM users 
             WHERE id = auth.uid() 
             AND user_type IN ('admin', 'operator')
           ))
    )
  );

CREATE POLICY "POS operators can create transactions" ON pos_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pos_sessions 
      WHERE id = session_id 
      AND operator_id = auth.uid()
      AND status = 'active'
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON pos_sessions TO authenticated;
GRANT SELECT, INSERT ON pos_transactions TO authenticated;
GRANT SELECT, INSERT ON cash_drawer_operations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pos_hardware_status TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pos_receipts TO authenticated;
GRANT SELECT ON pos_shift_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pos_cash_remittances TO authenticated;

-- Grant access to views
GRANT SELECT ON active_pos_sessions_view TO authenticated;
GRANT SELECT ON pos_transaction_summary_view TO authenticated;

-- Grant sequence usage
GRANT USAGE ON SEQUENCE receipt_sequence TO authenticated;