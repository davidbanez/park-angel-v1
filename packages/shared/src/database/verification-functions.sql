-- Helper functions for database verification
-- These functions help verify the database setup programmatically

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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION get_enum_values(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_policies(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_trigger_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_function_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_buckets() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_constraints() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;