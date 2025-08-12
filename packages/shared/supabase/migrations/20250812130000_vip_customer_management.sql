-- VIP and Customer Management System Migration
-- Adds VIP functionality and customer support for customer management

-- Create VIP types enum
DO $$ BEGIN
    CREATE TYPE vip_type AS ENUM ('vvip', 'flex_vvip', 'spot_vip', 'spot_flex_vip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- VIP assignments table
CREATE TABLE IF NOT EXISTS vip_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vip_type vip_type NOT NULL,
  assigned_spots UUID[] DEFAULT '{}', -- For spot-specific VIP types
  time_limit_hours INTEGER, -- For flex VIP types
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer support conversations table
CREATE TABLE IF NOT EXISTS customer_support_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer support messages table
CREATE TABLE IF NOT EXISTS customer_support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES customer_support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal notes between staff
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer analytics table for tracking customer behavior
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  average_session_duration INTEGER, -- in minutes
  favorite_locations UUID[],
  last_booking_date TIMESTAMPTZ,
  customer_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  loyalty_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, operator_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vip_assignments_user_id ON vip_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_assignments_operator_id ON vip_assignments(operator_id);
CREATE INDEX IF NOT EXISTS idx_vip_assignments_active ON vip_assignments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_customer ON customer_support_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_operator ON customer_support_conversations(operator_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_status ON customer_support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_customer_support_messages_conversation ON customer_support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer ON customer_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_operator ON customer_analytics(operator_id);

-- Add RLS policies
ALTER TABLE vip_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;

-- VIP assignments policies
CREATE POLICY "Operators can manage VIP assignments for their customers" ON vip_assignments
  FOR ALL USING (
    operator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Customer support policies
CREATE POLICY "Operators can manage customer support for their customers" ON customer_support_conversations
  FOR ALL USING (
    operator_id = auth.uid() OR
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

CREATE POLICY "Users can access support messages for their conversations" ON customer_support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customer_support_conversations 
      WHERE id = conversation_id 
      AND (customer_id = auth.uid() OR operator_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Customer analytics policies
CREATE POLICY "Operators can view analytics for their customers" ON customer_analytics
  FOR ALL USING (
    operator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin')
    )
  );

-- Functions for VIP management
CREATE OR REPLACE FUNCTION check_vip_parking_eligibility(
  p_user_id UUID,
  p_spot_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_vip_assignment vip_assignments%ROWTYPE;
  v_spot_operator_id UUID;
BEGIN
  -- Get the operator for the parking spot
  SELECT l.operator_id INTO v_spot_operator_id
  FROM parking_spots ps
  JOIN zones z ON ps.zone_id = z.id
  JOIN sections s ON z.section_id = s.id
  JOIN locations l ON s.location_id = l.id
  WHERE ps.id = p_spot_id;

  -- Check for active VIP assignment
  SELECT * INTO v_vip_assignment
  FROM vip_assignments
  WHERE user_id = p_user_id
    AND operator_id = v_spot_operator_id
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW());

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check VIP type specific rules
  CASE v_vip_assignment.vip_type
    WHEN 'vvip' THEN
      -- VVIP can park anywhere, anytime
      RETURN true;
    WHEN 'flex_vvip' THEN
      -- Flex VVIP can park anywhere with time limits (handled in booking logic)
      RETURN true;
    WHEN 'spot_vip' THEN
      -- Spot VIP can only park on assigned spots
      RETURN p_spot_id = ANY(v_vip_assignment.assigned_spots);
    WHEN 'spot_flex_vip' THEN
      -- Spot Flex VIP can only park on assigned spots with time limits
      RETURN p_spot_id = ANY(v_vip_assignment.assigned_spots);
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer analytics
CREATE OR REPLACE FUNCTION update_customer_analytics(
  p_customer_id UUID,
  p_operator_id UUID,
  p_booking_amount DECIMAL DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO customer_analytics (
    customer_id,
    operator_id,
    total_bookings,
    total_spent,
    last_booking_date
  ) VALUES (
    p_customer_id,
    p_operator_id,
    1,
    p_booking_amount,
    NOW()
  )
  ON CONFLICT (customer_id, operator_id) 
  DO UPDATE SET
    total_bookings = customer_analytics.total_bookings + 1,
    total_spent = customer_analytics.total_spent + p_booking_amount,
    last_booking_date = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;