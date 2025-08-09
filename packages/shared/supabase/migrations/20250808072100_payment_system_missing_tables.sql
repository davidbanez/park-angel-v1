-- Payment System Missing Tables Migration
-- This migration adds the missing payment-related tables

-- Create payment-related enums (if they don't exist)
DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'digital_wallet', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal', 'gcash', 'paymaya', 'park_angel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_transaction_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_intent_status AS ENUM ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type payment_method_type NOT NULL,
  provider payment_provider NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment intents table
CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  booking_id UUID NOT NULL, -- We'll add the foreign key constraint later when bookings table exists
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  provider payment_provider NOT NULL,
  client_secret TEXT,
  status payment_intent_status NOT NULL DEFAULT 'requires_payment_method',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  booking_id UUID NOT NULL, -- We'll add the foreign key constraint later when bookings table exists
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  status payment_transaction_status NOT NULL DEFAULT 'pending',
  provider payment_provider NOT NULL,
  provider_transaction_id TEXT,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('operator', 'host')),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('operator', 'host')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  status payout_status NOT NULL DEFAULT 'pending',
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  transaction_ids TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- Revenue share configurations table
CREATE TABLE IF NOT EXISTS revenue_share_configs (
  parking_type parking_type PRIMARY KEY,
  park_angel_percentage DECIMAL(5,2) NOT NULL,
  operator_percentage DECIMAL(5,2),
  host_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT revenue_share_configs_percentage_check CHECK (
    park_angel_percentage + COALESCE(operator_percentage, 0) + COALESCE(host_percentage, 0) = 100
  )
);

-- Add missing columns to existing revenue_shares table if they don't exist
DO $$ 
BEGIN
    -- Add transaction_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'transaction_id') THEN
        ALTER TABLE revenue_shares ADD COLUMN transaction_id TEXT;
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'operator_id') THEN
        ALTER TABLE revenue_shares ADD COLUMN operator_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'host_id') THEN
        ALTER TABLE revenue_shares ADD COLUMN host_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'total_amount') THEN
        ALTER TABLE revenue_shares ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'park_angel_share') THEN
        ALTER TABLE revenue_shares ADD COLUMN park_angel_share DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'operator_share') THEN
        ALTER TABLE revenue_shares ADD COLUMN operator_share DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'host_share') THEN
        ALTER TABLE revenue_shares ADD COLUMN host_share DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'share_percentage') THEN
        ALTER TABLE revenue_shares ADD COLUMN share_percentage DECIMAL(5,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'calculated_at') THEN
        ALTER TABLE revenue_shares ADD COLUMN calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking_id ON payment_intents(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_owner_id ON bank_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_owner_type ON bank_accounts(owner_type);
CREATE INDEX IF NOT EXISTS idx_payouts_recipient_id ON payouts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);

-- Only create revenue_shares indexes if the columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'transaction_id') THEN
        CREATE INDEX IF NOT EXISTS idx_revenue_shares_transaction_id ON revenue_shares(transaction_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'operator_id') THEN
        CREATE INDEX IF NOT EXISTS idx_revenue_shares_operator_id ON revenue_shares(operator_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'host_id') THEN
        CREATE INDEX IF NOT EXISTS idx_revenue_shares_host_id ON revenue_shares(host_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue_shares' AND column_name = 'calculated_at') THEN
        CREATE INDEX IF NOT EXISTS idx_revenue_shares_calculated_at ON revenue_shares(calculated_at);
    END IF;
END $$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop first if they exist)
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenue_share_configs_updated_at ON revenue_share_configs;
CREATE TRIGGER update_revenue_share_configs_updated_at BEFORE UPDATE ON revenue_share_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default revenue share configurations (only if they don't exist)
INSERT INTO revenue_share_configs (parking_type, park_angel_percentage, operator_percentage, host_percentage) 
VALUES
('hosted', 40, NULL, 60),
('street', 30, 70, NULL),
('facility', 30, 70, NULL)
ON CONFLICT (parking_type) DO NOTHING;

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share_configs ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
CREATE POLICY "Users can view their own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
CREATE POLICY "Users can insert their own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
CREATE POLICY "Users can update their own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Payment intents policies
DROP POLICY IF EXISTS "Users can view their own payment intents" ON payment_intents;
CREATE POLICY "Users can view their own payment intents" ON payment_intents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment intents" ON payment_intents;
CREATE POLICY "Users can insert their own payment intents" ON payment_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment intents" ON payment_intents;
CREATE POLICY "Users can update their own payment intents" ON payment_intents
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment transactions policies
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON payment_transactions;
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert payment transactions" ON payment_transactions;
CREATE POLICY "System can insert payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update payment transactions" ON payment_transactions;
CREATE POLICY "System can update payment transactions" ON payment_transactions
  FOR UPDATE USING (true);

-- Bank accounts policies
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can insert their own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
  FOR DELETE USING (auth.uid() = owner_id);

-- Payouts policies
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "System can manage payouts" ON payouts;
CREATE POLICY "System can manage payouts" ON payouts
  FOR ALL USING (true);

-- Revenue shares policies
DROP POLICY IF EXISTS "Operators can view their revenue shares" ON revenue_shares;
CREATE POLICY "Operators can view their revenue shares" ON revenue_shares
  FOR SELECT USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "Hosts can view their revenue shares" ON revenue_shares;
CREATE POLICY "Hosts can view their revenue shares" ON revenue_shares
  FOR SELECT USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "System can manage revenue shares" ON revenue_shares;
CREATE POLICY "System can manage revenue shares" ON revenue_shares
  FOR ALL USING (true);

-- Revenue share configs policies
DROP POLICY IF EXISTS "Anyone can view revenue share configs" ON revenue_share_configs;
CREATE POLICY "Anyone can view revenue share configs" ON revenue_share_configs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify revenue share configs" ON revenue_share_configs;
CREATE POLICY "Only admins can modify revenue share configs" ON revenue_share_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Set all other payment methods for this user to non-default
    UPDATE payment_methods 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment_method ON payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to ensure only one default bank account per owner
CREATE OR REPLACE FUNCTION ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Set all other bank accounts for this owner to non-default
    UPDATE bank_accounts 
    SET is_default = FALSE 
    WHERE owner_id = NEW.owner_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_bank_account ON bank_accounts;
CREATE TRIGGER trigger_ensure_single_default_bank_account
  BEFORE INSERT OR UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_bank_account();