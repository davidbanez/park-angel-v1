-- Park Angel Database Schema
-- This file contains the complete database schema for the Park Angel system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_type AS ENUM ('client', 'host', 'operator', 'admin', 'pos');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE parking_type AS ENUM ('hosted', 'street', 'facility');
CREATE TYPE spot_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
CREATE TYPE conversation_type AS ENUM ('user_host', 'user_operator', 'user_support');
CREATE TYPE rated_type AS ENUM ('spot', 'host', 'operator', 'user');
CREATE TYPE ad_status AS ENUM ('pending', 'approved', 'active', 'paused', 'completed');
CREATE TYPE target_type AS ENUM ('section', 'zone');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  user_type user_type NOT NULL DEFAULT 'client',
  status user_status NOT NULL DEFAULT 'active',
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For POS users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  address TEXT,
  discount_eligibility TEXT[] DEFAULT '{}', -- ['senior', 'pwd', 'custom']
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User groups for role-based access control
CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for admin groups
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User group memberships
CREATE TABLE user_group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Locations table (top level of parking hierarchy)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type parking_type NOT NULL,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address JSONB NOT NULL, -- {street, city, state, country, postal_code}
  coordinates JSONB NOT NULL, -- {lat, lng}
  settings JSONB NOT NULL DEFAULT '{}', -- Location-specific settings
  pricing_config JSONB, -- Base pricing configuration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sections table (second level of parking hierarchy)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pricing_config JSONB, -- Inherits from location if NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zones table (third level of parking hierarchy)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pricing_config JSONB, -- Inherits from section if NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parking spots table (fourth level of parking hierarchy)
CREATE TABLE parking_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type TEXT NOT NULL, -- Vehicle type (car, motorcycle, truck, etc.)
  status spot_status NOT NULL DEFAULT 'available',
  coordinates JSONB NOT NULL, -- {lat, lng}
  pricing_config JSONB, -- Inherits from zone if NULL
  amenities TEXT[] DEFAULT '{}', -- ['covered', 'ev_charging', 'security', etc.]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Facility layouts for visual parking management
CREATE TABLE facility_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floors JSONB NOT NULL DEFAULT '[]', -- Array of floor configurations
  elements JSONB NOT NULL DEFAULT '[]', -- Layout elements (spots, lanes, etc.)
  metadata JSONB NOT NULL DEFAULT '{}', -- Additional layout metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- car, motorcycle, truck, etc.
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  discounts JSONB DEFAULT '[]', -- Applied discounts
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hosted parking listings
CREATE TABLE hosted_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  access_instructions TEXT,
  pricing JSONB NOT NULL, -- Hosted-specific pricing
  availability JSONB NOT NULL DEFAULT '{}', -- Availability schedule
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(spot_id)
);

-- Host payouts
CREATE TABLE host_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_ids UUID[] NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, failed
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table for messaging
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants UUID[] NOT NULL,
  type conversation_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type message_type NOT NULL DEFAULT 'text',
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ratings and reviews table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_type rated_type NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  review TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, rater_id, rated_id)
);

-- Advertisements table
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Ad content (images, videos, text)
  target_location UUID NOT NULL, -- References sections.id or zones.id
  target_type target_type NOT NULL,
  schedule JSONB NOT NULL, -- Start/end dates, duration
  budget DECIMAL(10,2) NOT NULL,
  status ad_status NOT NULL DEFAULT 'pending',
  metrics JSONB DEFAULT '{}', -- Performance metrics
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Violation reports table
CREATE TABLE violation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES parking_spots(id) ON DELETE SET NULL,
  violation_type TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  license_plate TEXT,
  status TEXT NOT NULL DEFAULT 'reported', -- reported, investigating, resolved
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- booking, payment, violation, system, etc.
  data JSONB DEFAULT '{}', -- Additional notification data
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discount rules table
CREATE TABLE discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- senior, pwd, custom
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_vat_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  conditions JSONB DEFAULT '{}', -- Discount conditions
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system-wide
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VAT configuration table
CREATE TABLE vat_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system-wide
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discount applications table (for tracking discount usage)
CREATE TABLE discount_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_rule_id UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  vat_exempted BOOLEAN NOT NULL DEFAULT FALSE,
  applied_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_document_url TEXT, -- For senior/PWD verification
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API keys for third-party integrations
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER, -- in milliseconds
  request_size INTEGER, -- in bytes
  response_size INTEGER, -- in bytes
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System configuration table
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE, -- Whether config is accessible to clients
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction logs for financial tracking
CREATE TABLE transaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- payment, refund, payout, commission
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  payment_method TEXT, -- stripe, paypal, gcash, paymaya, cash
  payment_reference TEXT, -- External payment system reference
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  metadata JSONB DEFAULT '{}', -- Additional transaction data
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revenue sharing calculations
CREATE TABLE revenue_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For hosted parking
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  operator_share DECIMAL(10,2) NOT NULL,
  host_share DECIMAL(10,2) DEFAULT 0, -- For hosted parking
  net_amount DECIMAL(10,2) NOT NULL,
  share_percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature TEXT NOT NULL,
  response_time INTEGER NOT NULL, -- in milliseconds
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

CREATE INDEX idx_locations_operator_id ON locations(operator_id);
CREATE INDEX idx_locations_type ON locations(type);

CREATE INDEX idx_sections_location_id ON sections(location_id);
CREATE INDEX idx_zones_section_id ON zones(section_id);
CREATE INDEX idx_parking_spots_zone_id ON parking_spots(zone_id);
CREATE INDEX idx_parking_spots_status ON parking_spots(status);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_spot_id ON bookings(spot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_rated_id ON ratings(rated_id);

CREATE INDEX idx_advertisements_target_location ON advertisements(target_location);
CREATE INDEX idx_advertisements_status ON advertisements(status);

CREATE INDEX idx_violation_reports_location_id ON violation_reports(location_id);
CREATE INDEX idx_violation_reports_status ON violation_reports(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

CREATE INDEX idx_performance_metrics_feature ON performance_metrics(feature);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Additional indexes for new tables
CREATE INDEX idx_discount_rules_type ON discount_rules(type);
CREATE INDEX idx_discount_rules_operator_id ON discount_rules(operator_id);
CREATE INDEX idx_discount_rules_is_active ON discount_rules(is_active);

CREATE INDEX idx_vat_config_is_default ON vat_config(is_default);
CREATE INDEX idx_vat_config_operator_id ON vat_config(operator_id);
CREATE INDEX idx_vat_config_is_active ON vat_config(is_active);

CREATE INDEX idx_discount_applications_booking_id ON discount_applications(booking_id);
CREATE INDEX idx_discount_applications_discount_rule_id ON discount_applications(discount_rule_id);
CREATE INDEX idx_discount_applications_applied_by ON discount_applications(applied_by);

CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_is_public ON system_config(is_public);

CREATE INDEX idx_transaction_logs_booking_id ON transaction_logs(booking_id);
CREATE INDEX idx_transaction_logs_transaction_type ON transaction_logs(transaction_type);
CREATE INDEX idx_transaction_logs_status ON transaction_logs(status);
CREATE INDEX idx_transaction_logs_created_at ON transaction_logs(created_at);

CREATE INDEX idx_revenue_shares_booking_id ON revenue_shares(booking_id);
CREATE INDEX idx_revenue_shares_operator_id ON revenue_shares(operator_id);
CREATE INDEX idx_revenue_shares_host_id ON revenue_shares(host_id);
CREATE INDEX idx_revenue_shares_created_at ON revenue_shares(created_at);

-- Composite indexes for better query performance
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_spot_time ON bookings(spot_id, start_time, end_time);
CREATE INDEX idx_parking_spots_zone_status ON parking_spots(zone_id, status);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_api_usage_key_date ON api_usage(api_key_id, created_at);
CREATE INDEX idx_performance_metrics_feature_date ON performance_metrics(feature, created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_groups_updated_at BEFORE UPDATE ON user_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parking_spots_updated_at BEFORE UPDATE ON parking_spots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facility_layouts_updated_at BEFORE UPDATE ON facility_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hosted_listings_updated_at BEFORE UPDATE ON hosted_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_violation_reports_updated_at BEFORE UPDATE ON violation_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_rules_updated_at BEFORE UPDATE ON discount_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vat_config_updated_at BEFORE UPDATE ON vat_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Additional constraints and functions for data integrity

-- Function to ensure only one default VAT config per operator
CREATE OR REPLACE FUNCTION ensure_single_default_vat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE vat_config 
    SET is_default = FALSE 
    WHERE operator_id = NEW.operator_id 
      AND id != NEW.id 
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_vat_trigger
  BEFORE INSERT OR UPDATE ON vat_config
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_vat();

-- Function to validate booking time constraints
CREATE OR REPLACE FUNCTION validate_booking_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure end_time is after start_time
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'Booking end time must be after start time';
  END IF;
  
  -- Ensure booking is not in the past (allow 5 minute grace period)
  IF NEW.start_time < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Cannot create booking in the past';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_booking_times_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_times();

-- Function to prevent overlapping bookings for the same spot
CREATE OR REPLACE FUNCTION prevent_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping bookings on the same spot
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE spot_id = NEW.spot_id 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND status NOT IN ('cancelled', 'completed')
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Booking overlaps with existing reservation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_booking_overlap_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION prevent_booking_overlap();

-- Function to automatically update spot status based on bookings
CREATE OR REPLACE FUNCTION update_spot_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update spot status when booking status changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        UPDATE parking_spots SET status = 'reserved' WHERE id = NEW.spot_id;
      WHEN 'active' THEN
        UPDATE parking_spots SET status = 'occupied' WHERE id = NEW.spot_id;
      WHEN 'completed', 'cancelled' THEN
        -- Check if there are other active bookings for this spot
        IF NOT EXISTS (
          SELECT 1 FROM bookings 
          WHERE spot_id = NEW.spot_id 
            AND status IN ('confirmed', 'active')
            AND id != NEW.id
        ) THEN
          UPDATE parking_spots SET status = 'available' WHERE id = NEW.spot_id;
        END IF;
    END CASE;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spot_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_spot_status();

-- Create views for common queries

-- View for parking hierarchy with full path
CREATE VIEW parking_hierarchy_view AS
SELECT 
  ps.id as spot_id,
  ps.number as spot_number,
  ps.type as spot_type,
  ps.status as spot_status,
  ps.coordinates as spot_coordinates,
  ps.amenities as spot_amenities,
  z.id as zone_id,
  z.name as zone_name,
  s.id as section_id,
  s.name as section_name,
  l.id as location_id,
  l.name as location_name,
  l.type as location_type,
  l.address as location_address,
  l.operator_id,
  COALESCE(ps.pricing_config, z.pricing_config, s.pricing_config, l.pricing_config) as effective_pricing
FROM parking_spots ps
JOIN zones z ON ps.zone_id = z.id
JOIN sections s ON z.section_id = s.id
JOIN locations l ON s.location_id = l.id;

-- View for active bookings with user and spot details
CREATE VIEW active_bookings_view AS
SELECT 
  b.*,
  up.first_name,
  up.last_name,
  up.phone,
  v.plate_number,
  v.type as vehicle_type,
  phv.location_name,
  phv.section_name,
  phv.zone_name,
  phv.spot_number
FROM bookings b
JOIN user_profiles up ON b.user_id = up.user_id
JOIN vehicles v ON b.vehicle_id = v.id
JOIN parking_hierarchy_view phv ON b.spot_id = phv.spot_id
WHERE b.status IN ('confirmed', 'active');

-- View for revenue analytics
CREATE VIEW revenue_analytics_view AS
SELECT 
  DATE_TRUNC('day', b.created_at) as booking_date,
  l.operator_id,
  l.type as parking_type,
  COUNT(b.id) as total_bookings,
  SUM(b.amount) as gross_revenue,
  SUM(b.vat_amount) as total_vat,
  SUM(b.total_amount) as net_revenue,
  AVG(b.total_amount) as avg_booking_value
FROM bookings b
JOIN parking_spots ps ON b.spot_id = ps.id
JOIN zones z ON ps.zone_id = z.id
JOIN sections s ON z.section_id = s.id
JOIN locations l ON s.location_id = l.id
WHERE b.payment_status = 'paid'
GROUP BY DATE_TRUNC('day', b.created_at), l.operator_id, l.type;