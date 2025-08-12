-- Create discount applications table
CREATE TABLE discount_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('senior', 'pwd')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB NOT NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_discount_applications_user_id ON discount_applications(user_id);
CREATE INDEX idx_discount_applications_status ON discount_applications(status);
CREATE INDEX idx_discount_applications_discount_type ON discount_applications(discount_type);
CREATE INDEX idx_discount_applications_reviewed_by ON discount_applications(reviewed_by);
CREATE INDEX idx_discount_applications_applied_at ON discount_applications(applied_at);

-- Enable RLS
ALTER TABLE discount_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own discount applications" ON discount_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discount applications" ON discount_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and operators can view all discount applications" ON discount_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

CREATE POLICY "Admins and operators can update discount applications" ON discount_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_discount_applications_updated_at
  BEFORE UPDATE ON discount_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for discount documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('discount-documents', 'discount-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for discount documents
CREATE POLICY "Users can upload their own discount documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'discount-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own discount documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'discount-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all discount documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'discount-documents' 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );