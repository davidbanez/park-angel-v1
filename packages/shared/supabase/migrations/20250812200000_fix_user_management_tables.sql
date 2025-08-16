-- Drop and recreate discount_applications table with correct structure
DROP TABLE IF EXISTS discount_applications CASCADE;

CREATE TABLE discount_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('senior', 'pwd')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Vehicles Table
CREATE TABLE IF NOT EXISTS user_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Parking notifications
    parking_expiration_alerts BOOLEAN DEFAULT TRUE,
    parking_expiration_minutes INTEGER DEFAULT 15,
    parking_reminders BOOLEAN DEFAULT TRUE,
    parking_reminder_minutes INTEGER DEFAULT 30,
    -- Payment notifications
    payment_confirmations BOOLEAN DEFAULT TRUE,
    payment_failures BOOLEAN DEFAULT TRUE,
    refund_notifications BOOLEAN DEFAULT TRUE,
    -- Booking notifications
    booking_confirmations BOOLEAN DEFAULT TRUE,
    booking_cancellations BOOLEAN DEFAULT TRUE,
    booking_modifications BOOLEAN DEFAULT TRUE,
    -- Host notifications
    host_booking_requests BOOLEAN DEFAULT TRUE,
    host_guest_messages BOOLEAN DEFAULT TRUE,
    host_payment_notifications BOOLEAN DEFAULT TRUE,
    -- Support notifications
    support_ticket_updates BOOLEAN DEFAULT TRUE,
    support_messages BOOLEAN DEFAULT TRUE,
    -- Marketing notifications
    promotional_offers BOOLEAN DEFAULT FALSE,
    feature_updates BOOLEAN DEFAULT TRUE,
    newsletter BOOLEAN DEFAULT FALSE,
    -- System notifications
    system_maintenance BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    -- Delivery preferences
    push_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User AI Preferences Table
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Parking preferences
    preferred_parking_types TEXT[] DEFAULT ARRAY['hosted', 'street', 'facility'],
    max_walking_distance INTEGER DEFAULT 500,
    price_sensitivity VARCHAR(20) DEFAULT 'medium' CHECK (price_sensitivity IN ('low', 'medium', 'high')),
    preferred_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    -- Time preferences
    preferred_booking_lead_time INTEGER DEFAULT 15,
    flexible_timing BOOLEAN DEFAULT TRUE,
    -- Location preferences
    frequently_visited_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    avoid_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    -- Vehicle preferences
    preferred_vehicle_id UUID REFERENCES user_vehicles(id) ON DELETE SET NULL,
    -- Accessibility needs
    accessibility_required BOOLEAN DEFAULT FALSE,
    covered_parking_preferred BOOLEAN DEFAULT FALSE,
    security_level_preference VARCHAR(20) DEFAULT 'standard' CHECK (security_level_preference IN ('basic', 'standard', 'high')),
    -- AI settings
    enable_ai_suggestions BOOLEAN DEFAULT TRUE,
    learning_enabled BOOLEAN DEFAULT TRUE,
    notification_for_suggestions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('parking', 'payment', 'account', 'technical', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'support')),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table (if not exists)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_type VARCHAR(50) DEFAULT 'parking' CHECK (transaction_type IN ('parking', 'hosted_parking', 'advertisement', 'refund')),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discount_applications_user_id ON discount_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_applications_status ON discount_applications(status);
CREATE INDEX IF NOT EXISTS idx_discount_applications_discount_type ON discount_applications(discount_type);
CREATE INDEX IF NOT EXISTS idx_discount_applications_reviewed_by ON discount_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_discount_applications_applied_at ON discount_applications(applied_at);

CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_is_default ON user_vehicles(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_type ON support_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discount_applications_updated_at BEFORE UPDATE ON discount_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_vehicles_updated_at BEFORE UPDATE ON user_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ai_preferences_updated_at BEFORE UPDATE ON user_ai_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update last_message_at on support_tickets when new message is added
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_tickets 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_ticket_last_message AFTER INSERT ON support_messages FOR EACH ROW EXECUTE FUNCTION update_ticket_last_message();

-- RLS Policies
ALTER TABLE discount_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Discount Applications Policies
CREATE POLICY "Users can view their own discount applications" ON discount_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own discount applications" ON discount_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins and operators can view all discount applications" ON discount_applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'operator')
    )
);
CREATE POLICY "Admins and operators can update discount applications" ON discount_applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'operator')
    )
);

-- User Vehicles Policies
CREATE POLICY "Users can view their own vehicles" ON user_vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicles" ON user_vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicles" ON user_vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicles" ON user_vehicles FOR DELETE USING (auth.uid() = user_id);

-- User Notification Preferences Policies
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- User AI Preferences Policies
CREATE POLICY "Users can view their own AI preferences" ON user_ai_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI preferences" ON user_ai_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI preferences" ON user_ai_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Support Tickets Policies
CREATE POLICY "Users can view their own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own support tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- Support staff can view and update all tickets
CREATE POLICY "Support staff can view all tickets" ON support_tickets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    )
);
CREATE POLICY "Support staff can update all tickets" ON support_tickets FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- Support Messages Policies
CREATE POLICY "Users can view messages from their tickets" ON support_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE id = ticket_id 
        AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert messages to their tickets" ON support_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE id = ticket_id 
        AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND sender_type = 'user'
);

-- Support staff can view and insert messages to all tickets
CREATE POLICY "Support staff can view all messages" ON support_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    )
);
CREATE POLICY "Support staff can insert messages to all tickets" ON support_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    )
    AND sender_id = auth.uid()
    AND sender_type = 'support'
);

-- Transactions Policies
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin and operators can view all transactions
CREATE POLICY "Admin and operators can view all transactions" ON transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'operator')
    )
);

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