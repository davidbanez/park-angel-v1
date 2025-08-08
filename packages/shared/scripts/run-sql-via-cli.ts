#!/usr/bin/env tsx

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const SUPABASE_PROJECT_REF = 'xvawouyzqoqucbokhbiw'; // From the URL
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function runSQLViaSupabaseCLI() {
  console.log('🔧 Running SQL script via Supabase CLI...\n');

  try {
    // Read the SQL script
    const sqlScript = readFileSync(
      join(__dirname, '../src/database/fix-missing-elements.sql'),
      'utf8'
    );

    // Create a temporary SQL file
    const tempSqlFile = join(__dirname, 'temp-fix.sql');
    writeFileSync(tempSqlFile, sqlScript);

    console.log('📄 SQL script prepared');
    console.log('🔗 Connecting to Supabase project...');

    // Execute the SQL script using Supabase CLI
    const command = `supabase db reset --project-ref ${SUPABASE_PROJECT_REF} --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"`;
    
    console.log('⚠️  Note: Direct SQL execution via CLI requires database URL with password');
    console.log('🔧 Alternative approach: Using psql directly...\n');

    // Alternative: Create a psql command
    const psqlCommand = `psql "postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" -f "${tempSqlFile}"`;
    
    console.log('📋 To run the SQL script manually, use one of these methods:\n');
    
    console.log('Method 1 - Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/' + SUPABASE_PROJECT_REF);
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: packages/shared/src/database/fix-missing-elements.sql');
    console.log('4. Click "Run"\n');
    
    console.log('Method 2 - psql (if you have the database password):');
    console.log(psqlCommand.replace('[YOUR-PASSWORD]', '<YOUR-DB-PASSWORD>'));
    console.log('\n');
    
    console.log('Method 3 - Supabase CLI (requires project setup):');
    console.log('1. supabase login');
    console.log('2. supabase link --project-ref ' + SUPABASE_PROJECT_REF);
    console.log('3. supabase db push');
    console.log('\n');

    // Try to execute using environment variables if available
    if (process.env.DATABASE_URL) {
      console.log('🔄 Attempting to run SQL script...');
      try {
        execSync(`psql "${process.env.DATABASE_URL}" -f "${tempSqlFile}"`, {
          stdio: 'inherit'
        });
        console.log('✅ SQL script executed successfully!');
      } catch (error) {
        console.log('❌ Failed to execute via psql:', error);
      }
    }

    // Clean up temp file
    try {
      const fs = require('fs');
      fs.unlinkSync(tempSqlFile);
    } catch (error) {
      // Ignore cleanup errors
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSQLViaSupabaseCLI();
}