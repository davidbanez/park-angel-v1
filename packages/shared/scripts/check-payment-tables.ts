#!/usr/bin/env tsx

/**
 * Check if payment tables exist in the database
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

async function checkPaymentTables() {
  console.log('🔍 Checking payment system tables...\n');

  const tables = [
    'payment_methods',
    'payment_intents',
    'payment_transactions',
    'bank_accounts',
    'payouts',
    'revenue_shares',
    'revenue_share_configs'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}' does not exist or has issues:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message);
    }
  }

  // Check revenue share configs
  console.log('\n📊 Checking revenue share configurations...');
  try {
    const { data, error } = await supabase
      .from('revenue_share_configs')
      .select('*');

    if (error) {
      console.log('❌ Could not fetch revenue share configs:', error.message);
    } else {
      console.log('✅ Revenue share configs:', data);
    }
  } catch (error) {
    console.log('❌ Error fetching revenue share configs:', error.message);
  }
}

checkPaymentTables().catch(console.error);