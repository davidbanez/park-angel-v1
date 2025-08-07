-- Fix for RLS Policy Infinite Recursion
-- This script fixes the problematic users table policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create fixed policies that don't cause recursion
-- Use a simpler approach that checks user_type directly from auth metadata or JWT claims

-- Allow users to view their own profile
-- (This policy already exists and is fine)

-- Allow users to update their own profile  
-- (This policy already exists and is fine)

-- For admin access, we'll use a different approach
-- Admins can view all users (using service role or specific admin checks)
CREATE POLICY "Service role can view all users" ON users
  FOR SELECT USING (
    current_setting('role') = 'service_role' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Admins can manage all users (using service role)
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Alternative: Create a simpler policy for authenticated users to read basic user info
CREATE POLICY "Authenticated users can view basic user info" ON users
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (auth.uid() = id OR true) -- Allow reading other users' basic info
  );

-- For now, let's use a permissive policy for development
-- In production, you'd want more restrictive policies
DROP POLICY IF EXISTS "Service role can view all users" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view basic user info" ON users;

-- Simple development-friendly policies
CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role full access" ON users
  FOR ALL USING (auth.role() = 'service_role');