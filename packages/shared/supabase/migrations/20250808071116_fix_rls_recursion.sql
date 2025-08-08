-- Fix RLS recursion issues by dropping problematic policies
-- This migration fixes infinite recursion in RLS policies

-- Drop policies that cause recursion on users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Drop policies that cause recursion on user_profiles table  
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Drop other admin policies that might cause recursion
DROP POLICY IF EXISTS "Admins can manage user groups" ON user_groups;
DROP POLICY IF EXISTS "Admins can manage all locations" ON locations;
DROP POLICY IF EXISTS "Admins can manage all sections" ON sections;
DROP POLICY IF EXISTS "Admins can manage all zones" ON zones;
DROP POLICY IF EXISTS "Admins can manage all spots" ON parking_spots;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all advertisements" ON advertisements;

-- Create a simple admin check function that doesn't cause recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use service role or check JWT metadata without querying users table
  RETURN (auth.role() = 'service_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create safe admin policies using the function
CREATE POLICY "Safe admin access for users" ON users
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for profiles" ON user_profiles  
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for groups" ON user_groups
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for locations" ON locations
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for sections" ON sections
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for zones" ON zones
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for spots" ON parking_spots
  FOR ALL USING (is_admin());

CREATE POLICY "Safe admin access for bookings" ON bookings
  FOR SELECT USING (is_admin());

CREATE POLICY "Safe admin access for advertisements" ON advertisements
  FOR ALL USING (is_admin());