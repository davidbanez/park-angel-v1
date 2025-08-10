-- Vehicle Management Tables Migration
-- This migration creates tables for managing vehicle types, brands, models, and colors

-- Vehicle types table (car, motorcycle, truck, etc.)
CREATE TABLE IF NOT EXISTS vehicle_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle brands table (Toyota, Honda, Ford, etc.)
CREATE TABLE IF NOT EXISTS vehicle_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle models table (Camry, Civic, F-150, etc.)
CREATE TABLE IF NOT EXISTS vehicle_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, name, year)
);

-- Vehicle colors table (Red, Blue, White, etc.)
CREATE TABLE IF NOT EXISTS vehicle_colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT, -- Optional hex color code for UI display
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_vehicle_types_name ON vehicle_types(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_types_is_active ON vehicle_types(is_active);

CREATE INDEX IF NOT EXISTS idx_vehicle_brands_name ON vehicle_brands(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_brands_is_active ON vehicle_brands(is_active);

CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand_id ON vehicle_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_name ON vehicle_models(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_is_active ON vehicle_models(is_active);

CREATE INDEX IF NOT EXISTS idx_vehicle_colors_name ON vehicle_colors(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_colors_is_active ON vehicle_colors(is_active);

-- Create triggers for updated_at timestamps (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicle_types_updated_at') THEN
    CREATE TRIGGER update_vehicle_types_updated_at 
      BEFORE UPDATE ON vehicle_types 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicle_brands_updated_at') THEN
    CREATE TRIGGER update_vehicle_brands_updated_at 
      BEFORE UPDATE ON vehicle_brands 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicle_models_updated_at') THEN
    CREATE TRIGGER update_vehicle_models_updated_at 
      BEFORE UPDATE ON vehicle_models 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicle_colors_updated_at') THEN
    CREATE TRIGGER update_vehicle_colors_updated_at 
      BEFORE UPDATE ON vehicle_colors 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default vehicle types (only if table is empty)
INSERT INTO vehicle_types (name, description) 
SELECT * FROM (VALUES
  ('car', 'Standard passenger car'),
  ('motorcycle', 'Motorcycle or scooter'),
  ('truck', 'Pickup truck or delivery truck'),
  ('van', 'Van or minivan'),
  ('suv', 'Sport utility vehicle'),
  ('bus', 'Bus or large passenger vehicle')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM vehicle_types WHERE vehicle_types.name = v.name);

-- Insert common vehicle brands (only if table is empty)
INSERT INTO vehicle_brands (name) 
SELECT * FROM (VALUES
  ('Toyota'),
  ('Honda'),
  ('Ford'),
  ('Chevrolet'),
  ('Nissan'),
  ('Hyundai'),
  ('Kia'),
  ('Mazda'),
  ('Mitsubishi'),
  ('Isuzu'),
  ('Suzuki'),
  ('Yamaha'),
  ('Kawasaki'),
  ('BMW'),
  ('Mercedes-Benz'),
  ('Audi'),
  ('Volkswagen'),
  ('Subaru'),
  ('Lexus'),
  ('Infiniti')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM vehicle_brands WHERE vehicle_brands.name = v.name);

-- Insert common vehicle colors (only if table is empty)
INSERT INTO vehicle_colors (name, hex_code) 
SELECT * FROM (VALUES
  ('White', '#FFFFFF'),
  ('Black', '#000000'),
  ('Silver', '#C0C0C0'),
  ('Gray', '#808080'),
  ('Red', '#FF0000'),
  ('Blue', '#0000FF'),
  ('Green', '#008000'),
  ('Yellow', '#FFFF00'),
  ('Orange', '#FFA500'),
  ('Brown', '#A52A2A'),
  ('Purple', '#800080'),
  ('Pink', '#FFC0CB'),
  ('Gold', '#FFD700'),
  ('Maroon', '#800000'),
  ('Navy', '#000080'),
  ('Beige', '#F5F5DC'),
  ('Cream', '#FFFDD0')
) AS v(name, hex_code)
WHERE NOT EXISTS (SELECT 1 FROM vehicle_colors WHERE vehicle_colors.name = v.name);

-- Insert some common vehicle models for popular brands (only if models don't exist)
DO $$
DECLARE
  toyota_id UUID;
  honda_id UUID;
  ford_id UUID;
BEGIN
  -- Get brand IDs
  SELECT id INTO toyota_id FROM vehicle_brands WHERE name = 'Toyota';
  SELECT id INTO honda_id FROM vehicle_brands WHERE name = 'Honda';
  SELECT id INTO ford_id FROM vehicle_brands WHERE name = 'Ford';

  -- Insert Toyota models (only if they don't exist)
  IF toyota_id IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name) 
    SELECT toyota_id, v.name FROM (VALUES
      ('Camry'),
      ('Corolla'),
      ('RAV4'),
      ('Highlander'),
      ('Prius'),
      ('Tacoma'),
      ('Tundra'),
      ('Sienna'),
      ('Vios'),
      ('Innova'),
      ('Fortuner'),
      ('Hilux')
    ) AS v(name)
    WHERE NOT EXISTS (
      SELECT 1 FROM vehicle_models 
      WHERE brand_id = toyota_id AND name = v.name
    );
  END IF;

  -- Insert Honda models (only if they don't exist)
  IF honda_id IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name) 
    SELECT honda_id, v.name FROM (VALUES
      ('Civic'),
      ('Accord'),
      ('CR-V'),
      ('Pilot'),
      ('Fit'),
      ('Odyssey'),
      ('Ridgeline'),
      ('City'),
      ('BR-V'),
      ('HR-V')
    ) AS v(name)
    WHERE NOT EXISTS (
      SELECT 1 FROM vehicle_models 
      WHERE brand_id = honda_id AND name = v.name
    );
  END IF;

  -- Insert Ford models (only if they don't exist)
  IF ford_id IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name) 
    SELECT ford_id, v.name FROM (VALUES
      ('F-150'),
      ('Mustang'),
      ('Explorer'),
      ('Escape'),
      ('Focus'),
      ('Fusion'),
      ('Edge'),
      ('Expedition'),
      ('Ranger'),
      ('EcoSport'),
      ('Everest')
    ) AS v(name)
    WHERE NOT EXISTS (
      SELECT 1 FROM vehicle_models 
      WHERE brand_id = ford_id AND name = v.name
    );
  END IF;
END $$;