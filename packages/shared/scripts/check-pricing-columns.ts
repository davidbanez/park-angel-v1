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

async function checkPricingColumns() {
  console.log('🔍 Checking for pricing_config columns in database...\n');

  const tables = ['locations', 'sections', 'zones', 'parking_spots'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Checking table: ${table}`);
      
      // Check if table exists and get column information
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: table })
        .single();

      if (error) {
        // Fallback: try to query the table structure using information_schema
        const { data: columns, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', table)
          .eq('table_schema', 'public');

        if (columnError) {
          console.log(`   ❌ Error checking ${table}: ${columnError.message}`);
          continue;
        }

        const pricingColumn = columns?.find(col => col.column_name === 'pricing_config');
        
        if (pricingColumn) {
          console.log(`   ✅ pricing_config column exists`);
          console.log(`      Type: ${pricingColumn.data_type}`);
          console.log(`      Nullable: ${pricingColumn.is_nullable}`);
        } else {
          console.log(`   ❌ pricing_config column NOT found`);
          console.log(`   📝 Available columns:`, columns?.map(c => c.column_name).join(', '));
        }
      }

      // Try to query the table directly to see what columns exist
      const { data: sampleData, error: queryError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (!queryError && sampleData) {
        const columnNames = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
        const hasPricingConfig = columnNames.includes('pricing_config');
        
        console.log(`   📊 Direct query result:`);
        console.log(`      Has pricing_config: ${hasPricingConfig ? '✅' : '❌'}`);
        console.log(`      All columns: ${columnNames.join(', ')}`);
      } else if (queryError) {
        console.log(`   ⚠️  Query error: ${queryError.message}`);
      }

      console.log('');
    } catch (err) {
      console.log(`   ❌ Error checking ${table}:`, err);
      console.log('');
    }
  }

  // Also check if the additional tables from parking-management-tables.sql exist
  console.log('🔍 Checking for additional parking management tables...\n');
  
  const additionalTables = [
    'spot_reservations',
    'booking_extensions', 
    'street_parking_regulations',
    'street_parking_rates',
    'parking_facilities'
  ];

  for (const table of additionalTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          console.log(`   ❌ Table ${table} does NOT exist`);
        } else {
          console.log(`   ⚠️  Error querying ${table}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table ${table} exists`);
      }
    } catch (err) {
      console.log(`   ❌ Error checking ${table}:`, err);
    }
  }
}

async function showCurrentSchema() {
  console.log('\n📋 Current database tables:\n');
  
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.log('❌ Error getting table list:', error.message);
      return;
    }

    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`   📋 ${table.table_name}`);
      });
    } else {
      console.log('   ⚠️  No tables found');
    }
  } catch (err) {
    console.log('❌ Error getting schema:', err);
  }
}

async function main() {
  console.log('🚀 Park Angel Database Schema Checker\n');
  
  await showCurrentSchema();
  await checkPricingColumns();
  
  console.log('\n💡 If pricing_config columns are missing, you may need to run the database migrations.');
  console.log('💡 If additional tables are missing, you may need to run the parking-management-tables.sql script.');
}

main().catch(console.error);