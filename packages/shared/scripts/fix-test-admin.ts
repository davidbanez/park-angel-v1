#!/usr/bin/env tsx

/**
 * Script to fix the existing test admin user by creating missing database records
 * Usage: npm run fix-test-admin
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
  firstName: 'Admin',
  lastName: 'User',
  userType: 'admin',
};

async function fixTestAdmin() {
  console.log('🔧 Fixing test admin user...');

  try {
    // Find the existing auth user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const authUser = existingUsers.users.find(
      user => user.email === TEST_ADMIN.email
    );

    if (!authUser) {
      console.error('❌ Test admin user not found in auth!');
      process.exit(1);
    }

    console.log('✅ Found existing auth user');

    // Check if user record exists in users table
    const { data: userRecord, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking user record:', userCheckError.message);
      process.exit(1);
    }

    if (!userRecord) {
      // Create user record in users table
      const { error: userError } = await supabase.from('users').insert({
        id: authUser.id,
        email: TEST_ADMIN.email,
        user_type: TEST_ADMIN.userType,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (userError) {
        console.error('❌ Failed to create user record:', userError.message);
        process.exit(1);
      } else {
        console.log('✅ User record created successfully!');
      }
    } else {
      console.log('✅ User record already exists');
    }

    // Check if user profile exists
    const { data: profileRecord, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error(
        '❌ Error checking user profile:',
        profileCheckError.message
      );
      process.exit(1);
    }

    if (!profileRecord) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authUser.id,
          first_name: TEST_ADMIN.firstName,
          last_name: TEST_ADMIN.lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error(
          '❌ Failed to create user profile:',
          profileError.message
        );
        process.exit(1);
      } else {
        console.log('✅ User profile created successfully!');
      }
    } else {
      console.log('✅ User profile already exists');
    }

    // Check if admin group exists
    let adminGroup;
    const { data: existingGroup, error: groupCheckError } = await supabase
      .from('user_groups')
      .select('*')
      .eq('name', 'Super Admins')
      .single();

    if (groupCheckError && groupCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking admin group:', groupCheckError.message);
      process.exit(1);
    }

    if (!existingGroup) {
      // Create admin user group with permissions
      const { data: newGroup, error: groupError } = await supabase
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
        console.error('❌ Failed to create admin group:', groupError.message);
        process.exit(1);
      } else {
        console.log('✅ Admin group created successfully!');
        adminGroup = newGroup;
      }
    } else {
      console.log('✅ Admin group already exists');
      adminGroup = existingGroup;
    }

    // Check if user is in admin group
    const { data: membership, error: membershipCheckError } = await supabase
      .from('user_group_memberships')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('group_id', adminGroup.id)
      .single();

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      console.error(
        '❌ Error checking group membership:',
        membershipCheckError.message
      );
      process.exit(1);
    }

    if (!membership) {
      // Add user to admin group
      const { error: membershipError } = await supabase
        .from('user_group_memberships')
        .insert({
          user_id: authUser.id,
          group_id: adminGroup.id,
          created_at: new Date().toISOString(),
        });

      if (membershipError) {
        console.error(
          '❌ Failed to add user to admin group:',
          membershipError.message
        );
        process.exit(1);
      } else {
        console.log('✅ User added to admin group successfully!');
      }
    } else {
      console.log('✅ User is already in admin group');
    }

    console.log('');
    console.log('🎉 Test admin user fixed successfully!');
    console.log('📧 Email:', TEST_ADMIN.email);
    console.log('🔑 Password: admin123456');
    console.log('');
    console.log(
      'You can now log in to the admin dashboard with these credentials.'
    );
  } catch (error) {
    console.error('❌ Error fixing test admin user:', error);
    process.exit(1);
  }
}

// Run the script
fixTestAdmin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
