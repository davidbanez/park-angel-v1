#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyOperatorTables() {
  console.log('🔍 Verifying Operator Management Tables...\n')

  const operatorTables = [
    'operator_profiles',
    'operator_bank_details', 
    'operator_revenue_configs',
    'operator_remittances',
    'vip_assignments',
    'operator_performance_metrics'
  ]

  const financialTables = [
    'financial_reports',
    'remittance_schedules',
    'remittance_runs',
    'commission_rules',
    'commission_calculations',
    'reconciliation_rules',
    'reconciliation_results',
    'discrepancies',
    'audit_trail'
  ]

  let allTablesExist = true

  // Check operator management tables
  console.log('📊 Operator Management Tables:')
  for (const table of operatorTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        allTablesExist = false
      } else {
        console.log(`✅ ${table}: Table exists and accessible`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`)
      allTablesExist = false
    }
  }

  console.log('\n💰 Financial Reporting Tables:')
  for (const table of financialTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        allTablesExist = false
      } else {
        console.log(`✅ ${table}: Table exists and accessible`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`)
      allTablesExist = false
    }
  }

  // Check custom types
  console.log('\n🏷️  Custom Types:')
  const customTypes = [
    'financial_report_type',
    'remittance_frequency', 
    'remittance_status',
    'reconciliation_rule_type',
    'discrepancy_type'
  ]

  for (const type of customTypes) {
    try {
      const { data, error } = await supabase.rpc('exec', {
        sql: `SELECT typname FROM pg_type WHERE typname = '${type}'`
      })

      if (error) {
        console.log(`❌ ${type}: ${error.message}`)
        allTablesExist = false
      } else if (data && data.length > 0) {
        console.log(`✅ ${type}: Type exists`)
      } else {
        console.log(`❌ ${type}: Type not found`)
        allTablesExist = false
      }
    } catch (err) {
      console.log(`❌ ${type}: ${err}`)
      allTablesExist = false
    }
  }

  // Check functions
  console.log('\n⚙️  Database Functions:')
  const functions = [
    'calculate_operator_performance',
    'calculate_next_remittance_date',
    'get_active_commission_rule',
    'create_audit_trail_entry',
    'ensure_single_primary_bank_account',
    'create_default_operator_configs'
  ]

  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc('exec', {
        sql: `SELECT proname FROM pg_proc WHERE proname = '${func}'`
      })

      if (error) {
        console.log(`❌ ${func}: ${error.message}`)
        allTablesExist = false
      } else if (data && data.length > 0) {
        console.log(`✅ ${func}: Function exists`)
      } else {
        console.log(`❌ ${func}: Function not found`)
        allTablesExist = false
      }
    } catch (err) {
      console.log(`❌ ${func}: ${err}`)
      allTablesExist = false
    }
  }

  console.log('\n' + '='.repeat(50))
  if (allTablesExist) {
    console.log('🎉 All operator management tables and functions are properly set up!')
    console.log('✅ Database is synchronized with the operator management design')
  } else {
    console.log('⚠️  Some tables or functions are missing. Please check the migration status.')
    process.exit(1)
  }
}

verifyOperatorTables().catch(console.error)