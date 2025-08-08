#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBasicTables() {
  console.log('🔍 Checking basic database tables...\n');

  const tables = ['locations', 'sections', 'zones', 'parking_spots', 'bookings'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Checking table: ${table}`);
      
      // Try to select from the table
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`   ❌ Table ${table} error: ${error.message}`);
        if (error.code === '42P01') {
          console.log(`   💡 Table ${table} does NOT exist`);
        }
      } else {
        console.log(`   ✅ Table ${table} exists (${count} rows)`);
        
        // Show column names if we have data
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   📝 Columns: ${columns.join(', ')}`);
          
          // Check specifically for pricing_config
          if (columns.includes('pricing_config')) {
            console.log(`   💰 Has pricing_config column: ✅`);
          } else {
            console.log(`   💰 Has pricing_config column: ❌`);
          }
        } else {
          console.log(`   📝 Table is empty, cannot show columns`);
        }
      }
      console.log('');
    } catch (err) {
      console.log(`   ❌ Unexpected error checking ${table}:`, err);
      console.log('');
    }
  }
}

async function runRawSQL() {
  console.log('🔍 Running raw SQL to check schema...\n');
  
  try {
    // Check if locations table exists and has pricing_config
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'locations' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.log('❌ SQL query error:', error.message);
      
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      
      const { data: altData, error: altError } = await supabase
        .from('locations')
        .select('*')
        .limit(0); // Just get structure, no data

      if (altError) {
        console.log('❌ Alternative approach failed:', altError.message);
      } else {
        console.log('✅ Alternative approach worked - locations table exists');
      }
    } else {
      console.log('✅ SQL query successful');
      console.log('📋 Locations table columns:');
      
      if (data && data.length > 0) {
        data.forEach((col: any) => {
          const indicator = col.column_name === 'pricing_config' ? '💰' : '📝';
          console.log(`   ${indicator} ${col.column_name} (${col.data_type})`);
        });
      } else {
        console.log('   ⚠️  No columns found');
      }
    }
  } catch (err) {
    console.log('❌ Raw SQL error:', err);
  }
}

async function main() {
  console.log('🚀 Simple Database Check\n');
  
  await checkBasicTables();
  await runRawSQL();
  
  console.log('\n📋 Summary:');
  console.log('If tables exist but pricing_config columns are missing:');
  console.log('  → Run: npm run setup:supabase (to apply migrations)');
  console.log('');
  console.log('If tables don\'t exist at all:');
  console.log('  → Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.log('  → Make sure you\'re connected to the right project');
}

main().catch(console.error);