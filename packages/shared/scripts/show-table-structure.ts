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

async function showTableStructure() {
  console.log('🔍 Showing table structure using INSERT attempt...\n');

  const tables = ['locations', 'sections', 'zones', 'parking_spots'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Table: ${table}`);
      
      // Try to insert an empty object to see what columns are required/available
      const { data, error } = await supabase
        .from(table)
        .insert({})
        .select();

      if (error) {
        console.log(`   📝 Error reveals column structure:`);
        
        // Parse the error message to find column information
        const errorMsg = error.message;
        
        if (errorMsg.includes('null value in column')) {
          // Extract required columns from error
          const matches = errorMsg.match(/null value in column "([^"]+)"/g);
          if (matches) {
            console.log(`   🔴 Required columns:`);
            matches.forEach(match => {
              const column = match.match(/"([^"]+)"/)?.[1];
              if (column) {
                console.log(`      - ${column}`);
              }
            });
          }
        }
        
        if (errorMsg.includes('violates not-null constraint')) {
          console.log(`   ⚠️  Not-null constraint error: ${errorMsg}`);
        }
        
        // Try to get more info by attempting a select with specific columns
        await trySelectColumns(table);
      }
      
      console.log('');
    } catch (err) {
      console.log(`   ❌ Unexpected error: ${err}`);
      console.log('');
    }
  }
}

async function trySelectColumns(tableName: string) {
  // Try common columns that should exist
  const commonColumns = [
    'id', 'name', 'created_at', 'updated_at', 
    'pricing_config', 'settings', 'address', 'coordinates'
  ];
  
  const existingColumns: string[] = [];
  
  for (const column of commonColumns) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select(column)
        .limit(1);
        
      if (!error) {
        existingColumns.push(column);
      }
    } catch (err) {
      // Column doesn't exist
    }
  }
  
  if (existingColumns.length > 0) {
    console.log(`   ✅ Confirmed columns: ${existingColumns.join(', ')}`);
    
    // Check specifically for pricing_config
    if (existingColumns.includes('pricing_config')) {
      console.log(`   💰 pricing_config column: ✅ EXISTS`);
    } else {
      console.log(`   💰 pricing_config column: ❌ MISSING`);
    }
  }
}

async function testPricingConfigDirectly() {
  console.log('🎯 Testing pricing_config column directly...\n');
  
  const tables = ['locations', 'sections', 'zones', 'parking_spots'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Testing ${table}.pricing_config:`);
      
      const { data, error } = await supabase
        .from(table)
        .select('pricing_config')
        .limit(1);
        
      if (error) {
        if (error.message.includes('column "pricing_config" does not exist')) {
          console.log(`   ❌ pricing_config column does NOT exist`);
        } else {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ pricing_config column exists`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
    }
    console.log('');
  }
}

async function main() {
  console.log('🚀 Table Structure Inspector\n');
  
  await testPricingConfigDirectly();
  await showTableStructure();
  
  console.log('📋 Next Steps:');
  console.log('If pricing_config columns are missing:');
  console.log('  1. Check if migrations have been applied');
  console.log('  2. The schema.sql file shows pricing_config should exist');
  console.log('  3. You may need to add the columns manually or re-run migrations');
}

main().catch(console.error);