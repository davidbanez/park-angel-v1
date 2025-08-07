-- Row Level Security (RLS) Policies for Park Angel System
-- This file contains all RLS policies to be applied to the Supabase database

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- User profiles table policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- User groups table policies
CREATE POLICY "Admins can manage user groups" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

CREATE POLICY "Operators can manage their own groups" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'operator'
    ) AND (
      operator_id = auth.uid() OR operator_id IS NULL
    )
  );

-- Locations table policies
CREATE POLICY "Public can view active locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Operators can manage their own locations" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'operator'
    ) AND operator_id = auth.uid()
  );

CREATE POLICY "Admins can manage all locations" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Sections table policies
CREATE POLICY "Public can view sections" ON sections
  FOR SELECT USING (true);

CREATE POLICY "Operators can manage their sections" ON sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN users u ON u.id = auth.uid()
      WHERE l.id = sections.location_id
      AND l.operator_id = auth.uid()
      AND u.user_type = 'operator'
    )
  );

CREATE POLICY "Admins can manage all sections" ON sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Zones table policies
CREATE POLICY "Public can view zones" ON zones
  FOR SELECT USING (true);

CREATE POLICY "Operators can manage their zones" ON zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections s
      JOIN locations l ON l.id = s.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE s.id = zones.section_id
      AND l.operator_id = auth.uid()
      AND u.user_type = 'operator'
    )
  );

CREATE POLICY "Admins can manage all zones" ON zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Parking spots table policies
CREATE POLICY "Public can view available spots" ON parking_spots
  FOR SELECT USING (true);

CREATE POLICY "Operators can manage their spots" ON parking_spots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM zones z
      JOIN sections s ON s.id = z.section_id
      JOIN locations l ON l.id = s.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE z.id = parking_spots.zone_id
      AND l.operator_id = auth.uid()
      AND u.user_type = 'operator'
    )
  );

CREATE POLICY "POS users can update spot status" ON parking_spots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM zones z
      JOIN sections s ON s.id = z.section_id
      JOIN locations l ON l.id = s.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE z.id = parking_spots.zone_id
      AND l.operator_id = (
        SELECT operator_id FROM users WHERE id = auth.uid()
      )
      AND u.user_type = 'pos'
    )
  );

CREATE POLICY "Admins can manage all spots" ON parking_spots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Bookings table policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Operators can view bookings for their locations" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parking_spots ps
      JOIN zones z ON z.id = ps.zone_id
      JOIN sections s ON s.id = z.section_id
      JOIN locations l ON l.id = s.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE ps.id = bookings.spot_id
      AND l.operator_id = auth.uid()
      AND u.user_type = 'operator'
    )
  );

CREATE POLICY "POS users can manage bookings for their locations" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parking_spots ps
      JOIN zones z ON z.id = ps.zone_id
      JOIN sections s ON s.id = z.section_id
      JOIN locations l ON l.id = s.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE ps.id = bookings.spot_id
      AND l.operator_id = (
        SELECT operator_id FROM users WHERE id = auth.uid()
      )
      AND u.user_type = 'pos'
    )
  );

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Vehicles table policies
CREATE POLICY "Users can manage their own vehicles" ON vehicles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Operators can view vehicles for their bookings" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN parking_spots ps ON ps.id = b.spot_id
      JOIN zones z ON z.id = ps.zone_id
      JOIN sections s ON s.id = z.section_id
      JOIN locations l ON l.id = s.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE b.vehicle_id = vehicles.id
      AND l.operator_id = auth.uid()
      AND u.user_type = 'operator'
    )
  );

-- Conversations table policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations they participate in" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = ANY(participants));

-- Messages table policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() = ANY(c.participants)
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() = ANY(c.participants)
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Ratings table policies
CREATE POLICY "Users can view ratings for their bookings" ON ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = ratings.booking_id
      AND (b.user_id = auth.uid() OR ratings.rater_id = auth.uid())
    )
  );

CREATE POLICY "Users can create ratings for their bookings" ON ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = ratings.booking_id
      AND (b.user_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM parking_spots ps
             JOIN zones z ON z.id = ps.zone_id
             JOIN sections s ON s.id = z.section_id
             JOIN locations l ON l.id = s.location_id
             WHERE ps.id = b.spot_id
             AND l.operator_id = auth.uid()
           ))
    )
  );

-- Advertisements table policies
CREATE POLICY "Public can view active advertisements" ON advertisements
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own advertisements" ON advertisements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND id = advertisements.created_by
    )
  );

CREATE POLICY "Users can create advertisements" ON advertisements
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own advertisements" ON advertisements
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all advertisements" ON advertisements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Storage policies for buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('vehicle-photos', 'vehicle-photos', false),
  ('parking-photos', 'parking-photos', true),
  ('violation-photos', 'violation-photos', false),
  ('advertisement-media', 'advertisement-media', true),
  ('documents', 'documents', false),
  ('receipts', 'receipts', false),
  ('facility-layouts', 'facility-layouts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Vehicle photos policies
CREATE POLICY "Users can manage their vehicle photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'vehicle-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Parking photos policies (public read, operator write)
CREATE POLICY "Public can view parking photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'parking-photos');

CREATE POLICY "Operators can upload parking photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'parking-photos' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type IN ('operator', 'admin')
    )
  );

-- Violation photos policies
CREATE POLICY "Users can manage violation photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'violation-photos' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND user_type IN ('operator', 'admin', 'pos')
      )
    )
  );

-- Advertisement media policies
CREATE POLICY "Public can view advertisement media" ON storage.objects
  FOR SELECT USING (bucket_id = 'advertisement-media');

CREATE POLICY "Users can upload advertisement media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'advertisement-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documents policies
CREATE POLICY "Users can manage their documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Receipts policies
CREATE POLICY "Users can view their receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "POS users can create receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type IN ('pos', 'operator', 'admin')
    )
  );

-- Facility layouts policies
CREATE POLICY "Operators can manage facility layouts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'facility-layouts' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type IN ('operator', 'admin')
    )
  );