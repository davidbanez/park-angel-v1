-- Create discount verification documents table
CREATE TABLE discount_verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('senior', 'pwd', 'custom')),
  document_type TEXT NOT NULL CHECK (document_type IN ('senior_id', 'pwd_id', 'birth_certificate', 'medical_certificate')),
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_discount_verification_documents_user_id ON discount_verification_documents(user_id);
CREATE INDEX idx_discount_verification_documents_status ON discount_verification_documents(status);
CREATE INDEX idx_discount_verification_documents_discount_type ON discount_verification_documents(discount_type);
CREATE INDEX idx_discount_verification_documents_verified_by ON discount_verification_documents(verified_by);

-- Enable RLS
ALTER TABLE discount_verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own verification documents" ON discount_verification_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification documents" ON discount_verification_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and operators can view all verification documents" ON discount_verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

CREATE POLICY "Admins and operators can update verification documents" ON discount_verification_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'operator')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_discount_verification_documents_updated_at
  BEFORE UPDATE ON discount_verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();