-- Drop existing hosted parking tables if they exist
DROP TABLE IF EXISTS host_payouts CASCADE;
DROP TABLE IF EXISTS host_reviews CASCADE;
DROP TABLE IF EXISTS hosted_listings CASCADE;
DROP TABLE IF EXISTS verification_documents CASCADE;
DROP TABLE IF EXISTS host_profiles CASCADE;

-- Host profiles table
CREATE TABLE host_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  contact_phone TEXT,
  address TEXT,
  profile_photo TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  bank_details JSONB,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Verification documents table for hosts
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('identity', 'property_ownership', 'business_permit')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hosted parking listings table
CREATE TABLE hosted_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  coordinates POINT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  access_instructions TEXT,
  pricing_per_hour DECIMAL(10,2) NOT NULL,
  pricing_per_day DECIMAL(10,2),
  vehicle_types TEXT[] DEFAULT ARRAY['car']::TEXT[],
  max_vehicle_size TEXT DEFAULT 'standard',
  availability_schedule JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Host reviews table
CREATE TABLE host_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Host payouts table
CREATE TABLE host_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  booking_ids UUID[] NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payout_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_host_profiles_user_id ON host_profiles(user_id);
CREATE INDEX idx_host_profiles_verification_status ON host_profiles(verification_status);
CREATE INDEX idx_verification_documents_host_id ON verification_documents(host_id);
CREATE INDEX idx_verification_documents_status ON verification_documents(status);
CREATE INDEX idx_hosted_listings_host_id ON hosted_listings(host_id);
CREATE INDEX idx_hosted_listings_is_active ON hosted_listings(is_active);
CREATE INDEX idx_host_reviews_host_id ON host_reviews(host_id);
CREATE INDEX idx_host_reviews_reviewer_id ON host_reviews(reviewer_id);
CREATE INDEX idx_host_payouts_host_id ON host_payouts(host_id);
CREATE INDEX idx_host_payouts_status ON host_payouts(status);

-- Enable RLS
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosted_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for host_profiles
CREATE POLICY "Users can view their own host profile" ON host_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own host profile" ON host_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own host profile" ON host_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all host profiles" ON host_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

CREATE POLICY "Admins can update all host profiles" ON host_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- RLS Policies for verification_documents
CREATE POLICY "Hosts can view their own verification documents" ON verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM host_profiles 
      WHERE id = host_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can insert their own verification documents" ON verification_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_profiles 
      WHERE id = host_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verification documents" ON verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

CREATE POLICY "Admins can update all verification documents" ON verification_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- RLS Policies for hosted_listings
CREATE POLICY "Hosts can manage their own listings" ON hosted_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM host_profiles 
      WHERE id = host_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active listings" ON hosted_listings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all listings" ON hosted_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- RLS Policies for host_reviews
CREATE POLICY "Anyone can view reviews" ON host_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews for their bookings" ON host_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can view reviews for their listings" ON host_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM host_profiles 
      WHERE id = host_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for host_payouts
CREATE POLICY "Hosts can view their own payouts" ON host_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM host_profiles 
      WHERE id = host_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage payouts" ON host_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_host_profiles_updated_at
  BEFORE UPDATE ON host_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_documents_updated_at
  BEFORE UPDATE ON verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosted_listings_updated_at
  BEFORE UPDATE ON hosted_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_reviews_updated_at
  BEFORE UPDATE ON host_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_payouts_updated_at
  BEFORE UPDATE ON host_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for host documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('host-documents', 'host-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for host documents
CREATE POLICY "Hosts can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'host-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Hosts can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'host-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all host documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'host-documents'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Create storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing photos
CREATE POLICY "Hosts can upload listing photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-photos'
    AND EXISTS (
      SELECT 1 FROM host_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view listing photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');