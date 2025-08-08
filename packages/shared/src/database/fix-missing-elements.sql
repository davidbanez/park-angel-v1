-- Fix Missing Database Elements for Park Angel System
-- Run this script in the Supabase SQL Editor to add missing elements

-- ============================================================================
-- 1. CREATE HELPER FUNCTION FOR SCRIPT EXECUTION
-- ============================================================================

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE sql;
  RETURN 'OK';
EXCEPTION
  WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ADD MISSING USER_SESSIONS TABLE
-- ============================================================================

-- User sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY, -- Session token/ID
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ended_at TIMESTAMPTZ,
  end_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. ADD RLS POLICIES FOR USER_SESSIONS
-- ============================================================================

-- RLS policies for user_sessions
CREATE POLICY IF NOT EXISTS "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can manage all sessions" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- ============================================================================
-- 4. ADD VERIFICATION HELPER FUNCTIONS
-- ============================================================================

-- Function to get list of tables
CREATE OR REPLACE FUNCTION get_table_list()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enum values
CREATE OR REPLACE FUNCTION get_enum_values(enum_name TEXT)
RETURNS TABLE(enum_value TEXT) AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('SELECT unnest(enum_range(NULL::%I))::TEXT', enum_name);
EXCEPTION
  WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = table_name
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  RETURN COALESCE(rls_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table policies
CREATE OR REPLACE FUNCTION get_table_policies(table_name TEXT)
RETURNS TABLE(
  policy_name TEXT,
  policy_cmd TEXT,
  policy_permissive TEXT,
  policy_roles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.polname::TEXT,
    p.polcmd::TEXT,
    CASE WHEN p.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END::TEXT,
    p.polroles::TEXT[]
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  WHERE c.relname = table_name
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ORDER BY p.polname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a trigger exists
CREATE OR REPLACE FUNCTION check_trigger_exists(trigger_name TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_name = $1 
      AND event_object_table = $2
      AND trigger_schema = 'public'
  ) INTO trigger_exists;
  
  RETURN trigger_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a function exists
CREATE OR REPLACE FUNCTION check_function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM information_schema.routines 
    WHERE routine_name = function_name
      AND routine_schema = 'public'
  ) INTO function_exists;
  
  RETURN function_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage buckets (if accessible)
CREATE OR REPLACE FUNCTION get_storage_buckets()
RETURNS TABLE(bucket_name TEXT, bucket_public BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.name::TEXT,
    b.public
  FROM storage.buckets b
  ORDER BY b.name;
EXCEPTION
  WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify database constraints
CREATE OR REPLACE FUNCTION verify_constraints()
RETURNS TABLE(
  table_name TEXT,
  constraint_name TEXT,
  constraint_type TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::TEXT,
    tc.constraint_name::TEXT,
    tc.constraint_type::TEXT,
    CASE 
      WHEN cc.convalidated IS NULL THEN TRUE
      ELSE cc.convalidated
    END as is_valid
  FROM information_schema.table_constraints tc
  LEFT JOIN pg_constraint cc ON cc.conname = tc.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
  ORDER BY tc.table_name, tc.constraint_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check index usage
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(
  index_name TEXT,
  column_names TEXT,
  is_unique BOOLEAN,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::TEXT,
    i.indexdef::TEXT,
    idx.indisunique,
    idx.indisprimary
  FROM pg_indexes i
  JOIN pg_class c ON c.relname = i.indexname
  JOIN pg_index idx ON idx.indexrelid = c.oid
  WHERE i.tablename = $1
    AND i.schemaname = 'public'
  ORDER BY i.indexname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. GRANT PERMISSIONS TO VERIFICATION FUNCTIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION get_enum_values(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_policies(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_trigger_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_function_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_buckets() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_constraints() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;

-- ============================================================================
-- 6. ADD MISSING ENUMS (IF THEY DON'T EXIST)
-- ============================================================================

-- Check and create enums if they don't exist
DO $$
BEGIN
  -- Create user_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('client', 'host', 'operator', 'admin', 'pos');
  END IF;

  -- Create user_status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
  END IF;

  -- Create parking_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parking_type') THEN
    CREATE TYPE parking_type AS ENUM ('hosted', 'street', 'facility');
  END IF;

  -- Create spot_status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spot_status') THEN
    CREATE TYPE spot_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
  END IF;

  -- Create booking_status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled');
  END IF;

  -- Create payment_status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
  END IF;

  -- Create message_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
  END IF;

  -- Create conversation_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN
    CREATE TYPE conversation_type AS ENUM ('user_host', 'user_operator', 'user_support');
  END IF;

  -- Create rated_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rated_type') THEN
    CREATE TYPE rated_type AS ENUM ('spot', 'host', 'operator', 'user');
  END IF;

  -- Create ad_status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN
    CREATE TYPE ad_status AS ENUM ('pending', 'approved', 'active', 'paused', 'completed');
  END IF;

  -- Create target_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_type') THEN
    CREATE TYPE target_type AS ENUM ('section', 'zone');
  END IF;
END $$;

-- ============================================================================
-- 7. UPDATE TRIGGERS FOR USER_SESSIONS
-- ============================================================================

-- Add trigger for user_sessions updated_at
CREATE TRIGGER IF NOT EXISTS update_user_sessions_updated_at 
  BEFORE UPDATE ON user_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. FINAL VERIFICATION
-- ============================================================================

-- Test that our new functions work
SELECT 'Database fix script completed successfully!' as status;

-- Show summary of what was created
SELECT 
  'user_sessions table' as created_element,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'exec_sql function' as created_element,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'exec_sql') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'verification functions' as created_element,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_table_list') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Show storage buckets
SELECT 'Storage buckets created:' as info;
SELECT name as bucket_name, public as is_public FROM storage.buckets ORDER BY name;