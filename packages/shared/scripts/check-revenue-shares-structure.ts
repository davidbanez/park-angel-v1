#!/usr/bin/env tsx

/**
 * Check the structure of the existing revenue_shares table
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRevenueSharesStructure() {
  console.log('🔍 Checking revenue_shares table structure...\n');

  try {
    // Try to get the table structure by querying information_schema
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'revenue_shares' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.log('❌ Error querying table structure:', error.message);
      
      // Try alternative approach - just select from the table to see what columns exist
      console.log('\n🔄 Trying alternative approach...');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('revenue_shares')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Error selecting from revenue_shares:', sampleError.message);
      } else {
        console.log('✅ Sample data from revenue_shares:');
        console.log(sampleData);
        
        if (sampleData && sampleData.length > 0) {
          console.log('\n📋 Available columns:');
          Object.keys(sampleData[0]).forEach(column => {
            console.log(`  - ${column}`);
          });
        } else {
          console.log('📋 Table is empty, but exists');
        }
      }
    } else {
      console.log('✅ Table structure:');
      console.table(data);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRevenueSharesStructure().catch(console.error);