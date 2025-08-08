-- Initial Data for Park Angel System
-- Run this after schema.sql and utils.sql to populate default system data

-- Initial data setup - no system user needed since we use NULL for system records

-- First, modify the system_config table to allow NULL updated_by for system records
ALTER TABLE system_config ALTER COLUMN updated_by DROP NOT NULL;

-- Insert initial system configuration (using NULL for system-created records)
INSERT INTO system_config (key, value, description, is_public, updated_by) VALUES
('app_name', '"Park Angel"', 'Application name', true, NULL),
('app_version', '"1.0.0"', 'Application version', true, NULL),
('default_vat_rate', '12', 'Default VAT rate percentage', false, NULL),
('platform_commission_rate', '30', 'Platform commission percentage', false, NULL),
('hosted_parking_host_share', '60', 'Host share percentage for hosted parking', false, NULL),
('max_booking_duration_hours', '24', 'Maximum booking duration in hours', true, NULL),
('booking_grace_period_minutes', '15', 'Grace period for late arrivals in minutes', true, NULL),
('api_rate_limit_default', '1000', 'Default API rate limit per hour', false, NULL)
ON CONFLICT (key) DO NOTHING;

-- Insert default VAT configuration
INSERT INTO vat_config (name, rate, is_default, is_active) 
SELECT 'Standard VAT', 12.00, true, true
WHERE NOT EXISTS (SELECT 1 FROM vat_config WHERE name = 'Standard VAT');

INSERT INTO vat_config (name, rate, is_default, is_active) 
SELECT 'Zero VAT', 0.00, false, true
WHERE NOT EXISTS (SELECT 1 FROM vat_config WHERE name = 'Zero VAT');

-- Modify discount_rules table to allow NULL created_by for system records
ALTER TABLE discount_rules ALTER COLUMN created_by DROP NOT NULL;

-- Insert default discount rules (using NULL for system-created records)
INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, is_active, created_by) 
SELECT 'Senior Citizen Discount', 'senior', 20.00, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM discount_rules WHERE name = 'Senior Citizen Discount');

INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, is_active, created_by) 
SELECT 'PWD Discount', 'pwd', 20.00, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM discount_rules WHERE name = 'PWD Discount');

INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, is_active, created_by) 
SELECT 'Student Discount', 'custom', 10.00, false, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM discount_rules WHERE name = 'Student Discount');

INSERT INTO discount_rules (name, type, percentage, is_vat_exempt, is_active, created_by) 
SELECT 'Early Bird Discount', 'custom', 15.00, false, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM discount_rules WHERE name = 'Early Bird Discount');

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