-- Create storage buckets for Park Angel system

-- Insert storage buckets
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
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view parking photos" ON storage.objects;
DROP POLICY IF EXISTS "Operators can upload parking photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage violation photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view advertisement media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload advertisement media" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their receipts" ON storage.objects;
DROP POLICY IF EXISTS "Service can create receipts" ON storage.objects;
DROP POLICY IF EXISTS "Operators can manage facility layouts" ON storage.objects;

-- Create new policies
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
    is_admin()
  );

-- Violation photos policies
CREATE POLICY "Users can manage violation photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'violation-photos' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      is_admin()
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

CREATE POLICY "Service can create receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND
    is_admin()
  );

-- Facility layouts policies
CREATE POLICY "Operators can manage facility layouts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'facility-layouts' AND
    is_admin()
  );