-- Complete Park Angel Database Setup Script
-- This script sets up the entire database schema, utilities, and initial data

-- First, run the main schema
\i schema.sql

-- Then, add utility functions
\i utils.sql

-- Insert initial system configuration
INSERT INTO system_config (key, value, description, is_public, updated_by) VALUES
('app_name', '"Park Angel"', 'Application name', true, '00000000-0000-0000-0000-000000000000'),
('app_version', '"1.0.0"', 'Application version', true, '00000000-0000-0000-0000-000000000000'),
('default_vat_rate', '12', 'Default VAT rate percentage', false, '00000000-0000-0000-0000-000000000000'),
('platform_commission_rate', '30', 'Platform commission percentage', false, '00000000-0000-0000-0000-000000000000'),
('hosted_parking_host_share', '60', 'Host share percentage for hosted parking', false, '00000000-0000-0000-0000-000000000000'),
('max_booking_duration_hours', '24', 'Maximum booking duration in hours', true, '00000000-0000-0000-0000-000000000000'),
('booking_grace_period_minutes', '15', 'Grace period for late arrivals in minutes', true, '00000000-0000-0000-0000-000000000000'),
('api_rate_limit_default', '1000', 'Default API rate limit per hour', false, '00000000-0000-0000-0000-000000000000');

-- Insert default VAT configuration
INSERT INTO vat_config (name, rate, is_default, is_active) VALUES
('Standard VAT', 12.00, true, true),
('Zero VAT', 0.00, false, true);

-- Insert default discount rules
INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, is_active, created_by) VALUES
('Senior Citizen Discount', 'senior', 20.00, true, true, '00000000-0000-0000-0000-000000000000'),
('PWD Discount', 'pwd', 20.00, true, true, '00000000-0000-0000-0000-000000000000'),
('Student Discount', 'custom', 10.00, false, true, '00000000-0000-0000-0000-000000000000'),
('Early Bird Discount', 'custom', 15.00, false, true, '00000000-0000-0000-0000-000000000000');

-- Create sample data for development/testing (optional)
-- This section can be commented out for production

-- Sample admin user (this would typically be created through Supabase Auth)
-- INSERT INTO users (id, email, user_type, status) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'admin@parkangel.com', 'admin', 'active');

-- Sample user profile for admin
-- INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'System', 'Administrator', '+63123456789');

-- Sample operator
-- INSERT INTO users (id, email, user_type, status) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'operator@parkangel.com', 'operator', 'active');

-- INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'Sample', 'Operator', '+63987654321');

-- Sample location
-- INSERT INTO locations (id, name, type, operator_id, address, coordinates, settings) VALUES
-- ('00000000-0000-0000-0000-000000000003', 'Downtown Parking Facility', 'facility', '00000000-0000-0000-0000-000000000002', 
--  '{"street": "123 Main St", "city": "Manila", "state": "NCR", "country": "Philippines", "postal_code": "1000"}',
--  '{"lat": 14.5995, "lng": 120.9842}',
--  '{"operating_hours": {"monday": "06:00-22:00", "tuesday": "06:00-22:00", "wednesday": "06:00-22:00", "thursday": "06:00-22:00", "friday": "06:00-22:00", "saturday": "08:00-20:00", "sunday": "08:00-20:00"}}');

-- Create database maintenance procedures
CREATE OR REPLACE FUNCTION maintain_database()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
BEGIN
  -- Clean up expired bookings
  result := result || 'Cleaned up ' || cleanup_expired_bookings() || ' expired bookings. ';
  
  -- Update statistics
  ANALYZE;
  result := result || 'Updated table statistics. ';
  
  -- Clean up old audit logs (older than 1 year)
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
  result := result || 'Cleaned up old audit logs. ';
  
  -- Clean up old API usage logs (older than 3 months)
  DELETE FROM api_usage WHERE created_at < NOW() - INTERVAL '3 months';
  result := result || 'Cleaned up old API usage logs. ';
  
  -- Clean up old performance metrics (older than 6 months)
  DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '6 months';
  result := result || 'Cleaned up old performance metrics. ';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate database integrity
CREATE OR REPLACE FUNCTION validate_database_integrity()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check for orphaned records
  RETURN QUERY
  SELECT 
    'Orphaned Sections'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' sections without valid locations'::TEXT
  FROM sections s
  LEFT JOIN locations l ON s.location_id = l.id
  WHERE l.id IS NULL;
  
  RETURN QUERY
  SELECT 
    'Orphaned Zones'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' zones without valid sections'::TEXT
  FROM zones z
  LEFT JOIN sections s ON z.section_id = s.id
  WHERE s.id IS NULL;
  
  RETURN QUERY
  SELECT 
    'Orphaned Parking Spots'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' spots without valid zones'::TEXT
  FROM parking_spots ps
  LEFT JOIN zones z ON ps.zone_id = z.id
  WHERE z.id IS NULL;
  
  -- Check for invalid bookings
  RETURN QUERY
  SELECT 
    'Invalid Booking Times'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' bookings with end_time <= start_time'::TEXT
  FROM bookings
  WHERE end_time <= start_time;
  
  -- Check for overlapping active bookings
  RETURN QUERY
  SELECT 
    'Overlapping Bookings'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' overlapping active bookings'::TEXT
  FROM (
    SELECT b1.id
    FROM bookings b1
    JOIN bookings b2 ON b1.spot_id = b2.spot_id AND b1.id != b2.id
    WHERE b1.status IN ('confirmed', 'active') 
      AND b2.status IN ('confirmed', 'active')
      AND (
        (b1.start_time >= b2.start_time AND b1.start_time < b2.end_time) OR
        (b1.end_time > b2.start_time AND b1.end_time <= b2.end_time) OR
        (b1.start_time <= b2.start_time AND b1.end_time >= b2.end_time)
      )
  ) overlapping;
  
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions (adjust based on your Supabase setup)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create RLS policies (this would be in a separate file in a real setup)
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosted_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these would be expanded in rls-policies.sql)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- User profiles
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for locations (for discovery)
CREATE POLICY "Public can read locations" ON locations FOR SELECT TO authenticated USING (true);

-- Operators can manage their locations
CREATE POLICY "Operators can manage own locations" ON locations FOR ALL USING (auth.uid() = operator_id);

-- Similar policies would be created for other tables...

COMMENT ON DATABASE postgres IS 'Park Angel - Comprehensive Parking Management System Database';