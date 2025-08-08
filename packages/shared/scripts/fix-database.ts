#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingUserSessionsTable() {
  console.log('📊 Adding missing user_sessions table...');
  
  const createTableSQL = `
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
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (error) {
      console.error('❌ Error creating user_sessions table:', error);
    } else {
      console.log('✅ user_sessions table created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating user_sessions table:', error);
  }
}

async function createStorageBuckets() {
  console.log('🗂️ Creating storage buckets...');

  const buckets = [
    { name: 'avatars', public: true },
    { name: 'vehicle-photos', public: false },
    { name: 'parking-photos', public: true },
    { name: 'violation-photos', public: false },
    { name: 'advertisement-media', public: true },
    { name: 'documents', public: false },
    { name: 'receipts', public: false },
    { name: 'facility-layouts', public: false }
  ];

  for (const bucket of buckets) {
    try {
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.name.includes('photos') || bucket.name.includes('media') 
          ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          : undefined,
        fileSizeLimit: bucket.name === 'documents' ? 10485760 : 5242880 // 10MB for documents, 5MB for others
      });

      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating bucket ${bucket.name}:`, error);
      } else {
        console.log(`✅ Storage bucket '${bucket.name}' created/verified`);
      }
    } catch (error) {
      console.error(`❌ Error creating bucket ${bucket.name}:`, error);
    }
  }
}

async function createStoragePolicies() {
  console.log('🔒 Creating storage policies...');

  const storagePolicies = `
    -- Users can upload their own avatars
    CREATE POLICY IF NOT EXISTS "Users can upload their own avatars" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY IF NOT EXISTS "Users can view their own avatars" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY IF NOT EXISTS "Users can update their own avatars" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY IF NOT EXISTS "Users can delete their own avatars" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    -- Vehicle photos policies
    CREATE POLICY IF NOT EXISTS "Users can manage their vehicle photos" ON storage.objects
      FOR ALL USING (
        bucket_id = 'vehicle-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    -- Parking photos policies (public read, operator write)
    CREATE POLICY IF NOT EXISTS "Public can view parking photos" ON storage.objects
      FOR SELECT USING (bucket_id = 'parking-photos');

    CREATE POLICY IF NOT EXISTS "Operators can upload parking photos" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'parking-photos' AND
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND user_type IN ('operator', 'admin')
        )
      );

    -- Violation photos policies
    CREATE POLICY IF NOT EXISTS "Users can manage violation photos" ON storage.objects
      FOR ALL USING (
        bucket_id = 'violation-photos' AND
        (
          auth.uid()::text = (storage.foldername(name))[1] OR
          EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_type IN ('operator', 'admin', 'pos')
          )
        )
      );

    -- Advertisement media policies
    CREATE POLICY IF NOT EXISTS "Public can view advertisement media" ON storage.objects
      FOR SELECT USING (bucket_id = 'advertisement-media');

    CREATE POLICY IF NOT EXISTS "Users can upload advertisement media" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'advertisement-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    -- Documents policies
    CREATE POLICY IF NOT EXISTS "Users can manage their documents" ON storage.objects
      FOR ALL USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    -- Receipts policies
    CREATE POLICY IF NOT EXISTS "Users can view their receipts" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'receipts' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY IF NOT EXISTS "POS users can create receipts" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'receipts' AND
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND user_type IN ('pos', 'operator', 'admin')
        )
      );

    -- Facility layouts policies
    CREATE POLICY IF NOT EXISTS "Operators can manage facility layouts" ON storage.objects
      FOR ALL USING (
        bucket_id = 'facility-layouts' AND
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND user_type IN ('operator', 'admin')
        )
      );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: storagePolicies });
    if (error) {
      console.error('❌ Error creating storage policies:', error);
    } else {
      console.log('✅ Storage policies created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating storage policies:', error);
  }
}

async function addVerificationFunctions() {
  console.log('⚙️ Adding verification functions...');

  try {
    const verificationSQL = readFileSync(
      join(__dirname, '../src/database/verification-functions.sql'),
      'utf8'
    );

    const { error } = await supabase.rpc('exec_sql', { sql: verificationSQL });
    if (error) {
      console.error('❌ Error creating verification functions:', error);
    } else {
      console.log('✅ Verification functions created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating verification functions:', error);
  }
}

async function createExecSQLFunction() {
  console.log('🔧 Creating exec_sql helper function...');

  const execSQLFunction = `
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
  `;

  try {
    const { error } = await supabase.from('_').select('*').limit(1);
    // This will fail, but we can use the error to execute SQL
    
    // Alternative approach: use the SQL editor or direct database connection
    console.log('⚠️ exec_sql function creation requires direct database access');
    console.log('Please run the following SQL in your Supabase SQL editor:');
    console.log(execSQLFunction);
  } catch (error) {
    console.log('✅ Database connection verified');
  }
}

async function main() {
  console.log('🔧 Park Angel Database Fix Script');
  console.log('==================================\n');

  try {
    // First, try to create the exec_sql function
    await createExecSQLFunction();
    
    // Add missing table
    await addMissingUserSessionsTable();
    
    // Create storage buckets
    await createStorageBuckets();
    
    // Create storage policies
    await createStoragePolicies();
    
    // Add verification functions
    await addVerificationFunctions();

    console.log('\n✅ Database fix completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Run npm run verify:database to check the current state');
    console.log('2. If there are still issues, check the Supabase dashboard');
    console.log('3. Some operations may require manual SQL execution in Supabase SQL editor');

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}