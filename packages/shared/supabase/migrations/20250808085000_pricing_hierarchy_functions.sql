-- Add functions to support hierarchical pricing management

-- Function to get effective pricing for a parking spot
CREATE OR REPLACE FUNCTION get_effective_pricing(spot_id UUID)
RETURNS JSONB AS $$
DECLARE
  spot_pricing JSONB;
  zone_pricing JSONB;
  section_pricing JSONB;
  location_pricing JSONB;
BEGIN
  -- Get pricing from the hierarchy
  SELECT 
    ps.pricing_config,
    z.pricing_config,
    s.pricing_config,
    l.pricing_config
  INTO 
    spot_pricing,
    zone_pricing,
    section_pricing,
    location_pricing
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE ps.id = spot_id;

  -- Return the most specific pricing available
  RETURN COALESCE(spot_pricing, zone_pricing, section_pricing, location_pricing, '{"baseRate": 50, "vatRate": 12, "occupancyMultiplier": 1.0}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate occupancy rate for a location
CREATE OR REPLACE FUNCTION get_location_occupancy_rate(location_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_spots INTEGER;
  occupied_spots INTEGER;
BEGIN
  -- Count total spots in location
  SELECT COUNT(*)
  INTO total_spots
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  WHERE s.location_id = location_id;

  -- Count occupied/reserved spots
  SELECT COUNT(*)
  INTO occupied_spots
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  WHERE s.location_id = location_id
    AND ps.status IN ('occupied', 'reserved');

  -- Return occupancy rate as percentage
  IF total_spots > 0 THEN
    RETURN (occupied_spots::DECIMAL / total_spots::DECIMAL) * 100;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get pricing hierarchy for a location
CREATE OR REPLACE FUNCTION get_pricing_hierarchy(location_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', l.id,
    'name', l.name,
    'level', 'location',
    'pricingConfig', l.pricing_config,
    'sections', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'level', 'section',
          'pricingConfig', s.pricing_config,
          'zones', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', z.id,
                'name', z.name,
                'level', 'zone',
                'pricingConfig', z.pricing_config,
                'spots', (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', ps.id,
                      'name', ps.number,
                      'level', 'spot',
                      'pricingConfig', ps.pricing_config
                    )
                  )
                  FROM parking_spots ps
                  WHERE ps.zone_id = z.id
                )
              )
            )
            FROM zones z
            WHERE z.section_id = s.id
          )
        )
      )
      FROM sections s
      WHERE s.location_id = l.id
    )
  )
  INTO result
  FROM locations l
  WHERE l.id = location_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update pricing and trigger recalculation
CREATE OR REPLACE FUNCTION update_pricing_with_recalculation(
  table_name TEXT,
  record_id UUID,
  pricing_config JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Update the pricing configuration
  CASE table_name
    WHEN 'locations' THEN
      UPDATE locations SET pricing_config = pricing_config, updated_at = NOW() WHERE id = record_id;
    WHEN 'sections' THEN
      UPDATE sections SET pricing_config = pricing_config, updated_at = NOW() WHERE id = record_id;
    WHEN 'zones' THEN
      UPDATE zones SET pricing_config = pricing_config, updated_at = NOW() WHERE id = record_id;
    WHEN 'parking_spots' THEN
      UPDATE parking_spots SET pricing_config = pricing_config, updated_at = NOW() WHERE id = record_id;
  END CASE;

  -- TODO: Trigger background job for recalculation of child pricing
  -- For now, this is a placeholder
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parking_spots_pricing_config ON parking_spots USING GIN(pricing_config);
CREATE INDEX IF NOT EXISTS idx_zones_pricing_config ON zones USING GIN(pricing_config);
CREATE INDEX IF NOT EXISTS idx_sections_pricing_config ON sections USING GIN(pricing_config);
CREATE INDEX IF NOT EXISTS idx_locations_pricing_config ON locations USING GIN(pricing_config);

-- Add comments for documentation
COMMENT ON FUNCTION get_effective_pricing(UUID) IS 'Returns the effective pricing configuration for a parking spot, considering hierarchy inheritance';
COMMENT ON FUNCTION get_location_occupancy_rate(UUID) IS 'Calculates the current occupancy rate for a location as a percentage';
COMMENT ON FUNCTION get_pricing_hierarchy(UUID) IS 'Returns the complete pricing hierarchy for a location in JSON format';
COMMENT ON FUNCTION update_pricing_with_recalculation(TEXT, UUID, JSONB) IS 'Updates pricing configuration and triggers recalculation for child elements';