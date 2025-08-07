-- Database Utility Functions for Park Angel System

-- Function to get parking hierarchy for a spot
CREATE OR REPLACE FUNCTION get_parking_hierarchy(spot_uuid UUID)
RETURNS TABLE (
  spot_id UUID,
  spot_number TEXT,
  zone_id UUID,
  zone_name TEXT,
  section_id UUID,
  section_name TEXT,
  location_id UUID,
  location_name TEXT,
  location_type parking_type,
  operator_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.number,
    z.id,
    z.name,
    s.id,
    s.name,
    l.id,
    l.name,
    l.type,
    l.operator_id
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE ps.id = spot_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate effective pricing for a spot
CREATE OR REPLACE FUNCTION get_effective_pricing(spot_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  pricing_config JSONB;
BEGIN
  SELECT COALESCE(
    ps.pricing_config,
    z.pricing_config,
    s.pricing_config,
    l.pricing_config,
    '{}'::JSONB
  ) INTO pricing_config
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE ps.id = spot_uuid;
  
  RETURN pricing_config;
END;
$$ LANGUAGE plpgsql;

-- Function to check spot availability
CREATE OR REPLACE FUNCTION check_spot_availability(
  spot_uuid UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  is_available BOOLEAN := TRUE;
BEGIN
  -- Check if spot exists and is not in maintenance
  IF NOT EXISTS (
    SELECT 1 FROM parking_spots 
    WHERE id = spot_uuid AND status != 'maintenance'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for overlapping bookings
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE spot_id = spot_uuid 
      AND status NOT IN ('cancelled', 'completed')
      AND (
        (start_time >= bookings.start_time AND start_time < bookings.end_time) OR
        (end_time > bookings.start_time AND end_time <= bookings.end_time) OR
        (start_time <= bookings.start_time AND end_time >= bookings.end_time)
      )
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate booking amount with discounts
CREATE OR REPLACE FUNCTION calculate_booking_amount(
  spot_uuid UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  user_uuid UUID,
  discount_codes TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
  base_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  vat_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  applied_discounts JSONB
) AS $$
DECLARE
  pricing_config JSONB;
  duration_hours DECIMAL;
  base_rate DECIMAL := 0;
  calculated_base DECIMAL := 0;
  calculated_discount DECIMAL := 0;
  calculated_vat DECIMAL := 0;
  calculated_total DECIMAL := 0;
  discount_info JSONB := '[]'::JSONB;
  user_eligibility TEXT[];
  vat_rate DECIMAL := 12; -- Default VAT rate
  discount_rule RECORD;
  discount_amount DECIMAL;
  is_vat_exempt BOOLEAN := FALSE;
  i INTEGER;
BEGIN
  -- Get effective pricing
  SELECT get_effective_pricing(spot_uuid) INTO pricing_config;
  
  -- Calculate duration in hours
  SELECT EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 INTO duration_hours;
  
  -- Get base rate from pricing config
  SELECT COALESCE((pricing_config->>'baseRate')::DECIMAL, 50) INTO base_rate;
  
  -- Calculate base amount
  calculated_base := base_rate * duration_hours;
  
  -- Get user discount eligibility
  SELECT discount_eligibility INTO user_eligibility
  FROM user_profiles WHERE user_id = user_uuid;
  
  -- Apply discounts
  IF discount_codes IS NOT NULL AND array_length(discount_codes, 1) > 0 THEN
    FOR i IN 1..array_length(discount_codes, 1) LOOP
      -- Get discount rule from database
      SELECT * INTO discount_rule 
      FROM discount_rules 
      WHERE type = discount_codes[i] 
        AND is_active = TRUE 
      LIMIT 1;
      
      -- Check if user is eligible for this discount
      IF discount_rule.id IS NOT NULL AND 
         (discount_rule.type = ANY(user_eligibility) OR discount_rule.type = 'custom') THEN
        
        discount_amount := calculated_base * (discount_rule.percentage / 100);
        calculated_discount := calculated_discount + discount_amount;
        
        -- Check if this discount is VAT exempt
        IF discount_rule.is_vat_exempt THEN
          is_vat_exempt := TRUE;
        END IF;
        
        discount_info := discount_info || jsonb_build_object(
          'type', discount_rule.type,
          'name', discount_rule.name,
          'percentage', discount_rule.percentage,
          'amount', discount_amount,
          'vat_exempt', discount_rule.is_vat_exempt
        );
      END IF;
    END LOOP;
  END IF;
  
  -- Calculate VAT (if not exempt)
  IF NOT is_vat_exempt THEN
    calculated_vat := (calculated_base - calculated_discount) * (vat_rate / 100);
  ELSE
    calculated_vat := 0; -- VAT exempt
  END IF;
  
  calculated_total := calculated_base - calculated_discount + calculated_vat;
  
  RETURN QUERY SELECT 
    calculated_base,
    calculated_discount,
    calculated_vat,
    calculated_total,
    discount_info;
END;
$$ LANGUAGE plpgsql;

-- Function to get operator revenue share
CREATE OR REPLACE FUNCTION calculate_operator_revenue_share(
  operator_uuid UUID,
  booking_amount DECIMAL
)
RETURNS TABLE (
  operator_share DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  share_percentage DECIMAL(5,2)
) AS $$
DECLARE
  default_share_percentage DECIMAL := 70; -- Default 70% to operator, 30% to platform
  calculated_operator_share DECIMAL;
  calculated_platform_fee DECIMAL;
BEGIN
  -- Calculate shares
  calculated_operator_share := booking_amount * (default_share_percentage / 100);
  calculated_platform_fee := booking_amount - calculated_operator_share;
  
  RETURN QUERY SELECT 
    calculated_operator_share,
    calculated_platform_fee,
    default_share_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get parking statistics
CREATE OR REPLACE FUNCTION get_parking_statistics(
  location_uuid UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_spots INTEGER,
  occupied_spots INTEGER,
  available_spots INTEGER,
  total_bookings INTEGER,
  total_revenue DECIMAL(10,2),
  occupancy_rate DECIMAL(5,2)
) AS $$
DECLARE
  location_filter TEXT := '';
BEGIN
  -- Build location filter if provided
  IF location_uuid IS NOT NULL THEN
    location_filter := ' AND l.id = ''' || location_uuid || '''';
  END IF;
  
  RETURN QUERY EXECUTE format('
    WITH spot_stats AS (
      SELECT 
        COUNT(*) as total_spots,
        COUNT(CASE WHEN ps.status = ''occupied'' THEN 1 END) as occupied_spots,
        COUNT(CASE WHEN ps.status = ''available'' THEN 1 END) as available_spots
      FROM parking_spots ps
      JOIN zones z ON ps.zone_id = z.id
      JOIN sections s ON z.section_id = s.id
      JOIN locations l ON s.location_id = l.id
      WHERE 1=1 %s
    ),
    booking_stats AS (
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM bookings b
      JOIN parking_spots ps ON b.spot_id = ps.id
      JOIN zones z ON ps.zone_id = z.id
      JOIN sections s ON z.section_id = s.id
      JOIN locations l ON s.location_id = l.id
      WHERE b.created_at::DATE BETWEEN ''%s'' AND ''%s''
        AND b.payment_status = ''paid'' %s
    )
    SELECT 
      ss.total_spots::INTEGER,
      ss.occupied_spots::INTEGER,
      ss.available_spots::INTEGER,
      bs.total_bookings::INTEGER,
      bs.total_revenue::DECIMAL(10,2),
      CASE 
        WHEN ss.total_spots > 0 THEN (ss.occupied_spots::DECIMAL / ss.total_spots * 100)::DECIMAL(5,2)
        ELSE 0::DECIMAL(5,2)
      END as occupancy_rate
    FROM spot_stats ss, booking_stats bs
  ', location_filter, start_date, end_date, location_filter);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired bookings
CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update expired bookings to completed status
  UPDATE bookings 
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'active' 
    AND end_time < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO audit_logs (action, resource_type, new_values, created_at)
  VALUES (
    'cleanup_expired_bookings',
    'bookings',
    jsonb_build_object('updated_count', updated_count),
    NOW()
  );
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-bookings', '0 * * * *', 'SELECT cleanup_expired_bookings();');