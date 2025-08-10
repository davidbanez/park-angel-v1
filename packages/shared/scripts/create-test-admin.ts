#!/usr/bin/env tsx

/**
 * Script to create a test admin user for development and testing
 * Usage: npm run create-test-admin
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_ADMIN = {
  email: 'admin@parkangel.com',
  password: 'admin123456',
  firstName: 'Admin',
  lastName: 'User',
  userType: 'admin',
};

async function createTestAdmin() {
  console.log('🚀 Creating test admin user...');

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.some(
      user => user.email === TEST_ADMIN.email
    );

    if (userExists) {
      console.log('✅ Test admin user already exists!');
      console.log(`📧 Email: ${TEST_ADMIN.email}`);
      console.log(`🔑 Password: ${TEST_ADMIN.password}`);
      return;
    }

    // Create the user with admin privileges
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
        email_confirm: true,
        user_metadata: {
          first_name: TEST_ADMIN.firstName,
          last_name: TEST_ADMIN.lastName,
          name: `${TEST_ADMIN.firstName} ${TEST_ADMIN.lastName}`,
          user_type: TEST_ADMIN.userType,
        },
      });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('User creation returned no user data');
    }

    console.log('✅ Auth user created successfully!');

    // Create user record in users table
    const { error: userError } = await supabase.from('users').insert({
      id: authUser.user.id,
      email: TEST_ADMIN.email,
      user_type: TEST_ADMIN.userType,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userError) {
      console.warn('⚠️  Failed to create user record:', userError.message);
    } else {
      console.log('✅ User record created successfully!');
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authUser.user.id,
        first_name: TEST_ADMIN.firstName,
        last_name: TEST_ADMIN.lastName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn('⚠️  Failed to create user profile:', profileError.message);
    } else {
      console.log('✅ User profile created successfully!');
    }

    // Create admin user group with permissions
    const { data: adminGroup, error: groupError } = await supabase
      .from('user_groups')
      .insert({
        name: 'Super Admins',
        description: 'Full system access for super administrators',
        permissions: {
          users: ['create', 'read', 'update', 'delete'],
          operators: ['create', 'read', 'update', 'delete'],
          locations: ['create', 'read', 'update', 'delete'],
          bookings: ['create', 'read', 'update', 'delete'],
          payments: ['create', 'read', 'update', 'delete'],
          reports: ['read'],
          system: ['read', 'update'],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (groupError) {
      console.warn('⚠️  Failed to create admin group:', groupError.message);
    } else {
      console.log('✅ Admin group created successfully!');

      // Add user to admin group
      const { error: membershipError } = await supabase
        .from('user_group_memberships')
        .insert({
          user_id: authUser.user.id,
          group_id: adminGroup.id,
          created_at: new Date().toISOString(),
        });

      if (membershipError) {
        console.warn(
          '⚠️  Failed to add user to admin group:',
          membershipError.message
        );
      } else {
        console.log('✅ User added to admin group successfully!');
      }
    }
    console.log('');
    console.log('🎉 Test admin user created successfully!');
    console.log('📧 Email:', TEST_ADMIN.email);
    console.log('🔑 Password:', TEST_ADMIN.password);
    console.log('');
    console.log(
      'You can now log in to the admin dashboard with these credentials.'
    );
  } catch (error) {
    console.error('❌ Error creating test admin user:', error);
    process.exit(1);
  }
}

// Run the script
createTestAdmin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
