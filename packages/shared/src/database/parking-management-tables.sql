-- Additional tables needed for parking management services
-- These tables support the core parking management functionality

-- Temporary spot reservations (for holding spots during booking process)
CREATE TABLE spot_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- When this reservation expires (typically 15 minutes)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Booking extensions
CREATE TABLE booking_extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  original_end_time TIMESTAMPTZ NOT NULL,
  new_end_time TIMESTAMPTZ NOT NULL,
  additional_amount DECIMAL(10,2) NOT NULL,
  additional_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_additional_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extension payments
CREATE TABLE extension_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refund transactions
CREATE TABLE refund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, failed
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Street parking regulations
CREATE TABLE street_parking_regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  max_duration INTEGER, -- Maximum parking duration in minutes
  enforcement_hours JSONB, -- When parking is enforced (by day of week)
  vehicle_restrictions TEXT[], -- Allowed vehicle types
  permit_required BOOLEAN DEFAULT FALSE,
  permit_type TEXT, -- Type of permit required
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Street parking rates
CREATE TABLE street_parking_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  rush_hour_multiplier DECIMAL(3,2) DEFAULT 1.0,
  night_multiplier DECIMAL(3,2) DEFAULT 1.0,
  weekend_multiplier DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User permits (for street parking)
CREATE TABLE user_permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permit_type TEXT NOT NULL,
  permit_number TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporary parking restrictions (construction, events, etc.)
CREATE TABLE temporary_parking_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parking facilities (for facility-type parking)
CREATE TABLE parking_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  facility_type TEXT NOT NULL DEFAULT 'reservation', -- reservation, pay_on_exit
  max_vehicle_height INTEGER, -- Maximum vehicle height in cm
  operating_hours JSONB, -- Operating hours by day of week
  access_requirements JSONB, -- Access requirements (key card, gate code, etc.)
  access_instructions TEXT,
  gate_code TEXT,
  parking_instructions TEXT,
  pricing_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Facility access (user access to specific facilities)
CREATE TABLE facility_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES parking_facilities(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL, -- key_card, gate_code, mobile_app
  access_credentials JSONB, -- Encrypted access credentials
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Facility maintenance schedules
CREATE TABLE facility_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES parking_facilities(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES parking_spots(id) ON DELETE CASCADE, -- NULL for facility-wide maintenance
  maintenance_type TEXT NOT NULL, -- cleaning, repair, inspection, etc.
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User ratings (for hosted parking and general ratings)
CREATE TABLE user_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User verifications (for hosted parking requirements)
CREATE TABLE user_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL, -- identity, phone, email, etc.
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  verification_data JSONB, -- Encrypted verification data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Occupancy history (for analytics and trends)
CREATE TABLE occupancy_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  total_spots INTEGER NOT NULL,
  available_spots INTEGER NOT NULL,
  occupied_spots INTEGER NOT NULL,
  reserved_spots INTEGER NOT NULL,
  maintenance_spots INTEGER NOT NULL,
  occupancy_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance metrics (for SLA monitoring)
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature TEXT NOT NULL,
  operation TEXT NOT NULL,
  response_time INTEGER NOT NULL, -- in milliseconds
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_spot_reservations_spot_id ON spot_reservations(spot_id);
CREATE INDEX idx_spot_reservations_expires_at ON spot_reservations(expires_at);
CREATE INDEX idx_booking_extensions_booking_id ON booking_extensions(booking_id);
CREATE INDEX idx_street_parking_regulations_spot_id ON street_parking_regulations(spot_id);
CREATE INDEX idx_user_permits_user_id ON user_permits(user_id);
CREATE INDEX idx_user_permits_expires_at ON user_permits(expires_at);
CREATE INDEX idx_temporary_restrictions_spot_id ON temporary_parking_restrictions(spot_id);
CREATE INDEX idx_temporary_restrictions_time ON temporary_parking_restrictions(start_time, end_time);
CREATE INDEX idx_facility_access_user_id ON facility_access(user_id);
CREATE INDEX idx_facility_maintenance_facility_id ON facility_maintenance(facility_id);
CREATE INDEX idx_facility_maintenance_spot_id ON facility_maintenance(spot_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_occupancy_history_location_id ON occupancy_history(location_id);
CREATE INDEX idx_occupancy_history_timestamp ON occupancy_history(timestamp);
CREATE INDEX idx_performance_metrics_feature ON performance_metrics(feature);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Add RLS policies for the new tables
ALTER TABLE spot_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_parking_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_parking_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_parking_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined based on specific requirements)

-- Spot reservations: users can only see their own reservations
CREATE POLICY "Users can view own reservations" ON spot_reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" ON spot_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Booking extensions: users can only see their own booking extensions
CREATE POLICY "Users can view own booking extensions" ON booking_extensions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_extensions.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- User permits: users can only see their own permits
CREATE POLICY "Users can view own permits" ON user_permits
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for parking regulations and rates
CREATE POLICY "Public can view street parking regulations" ON street_parking_regulations
  FOR SELECT USING (true);

CREATE POLICY "Public can view street parking rates" ON street_parking_rates
  FOR SELECT USING (true);

CREATE POLICY "Public can view parking facilities" ON parking_facilities
  FOR SELECT USING (true);

-- Facility access: users can only see their own access
CREATE POLICY "Users can view own facility access" ON facility_access
  FOR SELECT USING (auth.uid() = user_id);

-- User ratings and verifications: users can only see their own
CREATE POLICY "Users can view own ratings" ON user_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own verifications" ON user_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Admin/operator access policies would be added based on the user roles system