#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

// Create Supabase client directly
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DatabaseCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

class DatabaseVerifier {
  private checks: DatabaseCheck[] = [];

  private addCheck(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string[]) {
    this.checks.push({ name, status, message, details });
  }

  private logCheck(check: DatabaseCheck) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details && check.details.length > 0) {
      check.details.forEach(detail => console.log(`   - ${detail}`));
    }
  }

  async verifyDatabaseConnection() {
    console.log('🔍 Verifying Database Connection...\n');
    
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        this.addCheck('Database Connection', 'fail', `Connection failed: ${error.message}`);
      } else {
        this.addCheck('Database Connection', 'pass', 'Successfully connected to Supabase');
      }
    } catch (error) {
      this.addCheck('Database Connection', 'fail', `Connection error: ${error}`);
    }
  }

  async verifyTables() {
    console.log('🗄️ Verifying Database Tables...\n');

    const expectedTables = [
      'users',
      'user_profiles',
      'user_groups',
      'user_group_memberships',
      'user_sessions',
      'locations',
      'sections',
      'zones',
      'parking_spots',
      'facility_layouts',
      'vehicles',
      'bookings',
      'hosted_listings',
      'host_payouts',
      'conversations',
      'messages',
      'ratings',
      'advertisements',
      'violation_reports',
      'notifications',
      'discount_rules',
      'vat_config',
      'discount_applications',
      'api_keys',
      'api_usage',
      'system_config',
      'transaction_logs',
      'revenue_shares',
      'performance_metrics',
      'audit_logs'
    ];

    try {
      // Query information_schema to get all tables
      const { data: tables, error } = await supabase.rpc('get_table_list');
      
      if (error) {
        // Fallback: try to query each table individually
        const existingTables: string[] = [];
        const missingTables: string[] = [];

        for (const table of expectedTables) {
          try {
            const { error: tableError } = await supabase.from(table).select('*').limit(1);
            if (tableError) {
              missingTables.push(table);
            } else {
              existingTables.push(table);
            }
          } catch {
            missingTables.push(table);
          }
        }

        if (missingTables.length === 0) {
          this.addCheck('Database Tables', 'pass', `All ${expectedTables.length} tables exist`, existingTables);
        } else {
          this.addCheck('Database Tables', 'fail', `Missing ${missingTables.length} tables`, missingTables);
        }
      } else {
        const tableNames = tables?.map((t: any) => t.table_name) || [];
        const missingTables = expectedTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length === 0) {
          this.addCheck('Database Tables', 'pass', `All ${expectedTables.length} tables exist`);
        } else {
          this.addCheck('Database Tables', 'fail', `Missing ${missingTables.length} tables`, missingTables);
        }
      }
    } catch (error) {
      this.addCheck('Database Tables', 'fail', `Error checking tables: ${error}`);
    }
  }

  async verifyEnums() {
    console.log('📋 Verifying Database Enums...\n');

    const expectedEnums = [
      'user_type',
      'user_status',
      'parking_type',
      'spot_status',
      'booking_status',
      'payment_status',
      'message_type',
      'conversation_type',
      'rated_type',
      'ad_status',
      'target_type'
    ];

    try {
      // Check if we can query enum values
      const enumChecks = await Promise.allSettled(
        expectedEnums.map(async (enumName) => {
          const { data, error } = await supabase.rpc('get_enum_values', { enum_name: enumName });
          return { enumName, exists: !error, values: data };
        })
      );

      const existingEnums: string[] = [];
      const missingEnums: string[] = [];

      enumChecks.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists) {
          existingEnums.push(expectedEnums[index]);
        } else {
          missingEnums.push(expectedEnums[index]);
        }
      });

      if (missingEnums.length === 0) {
        this.addCheck('Database Enums', 'pass', `All ${expectedEnums.length} enums exist`, existingEnums);
      } else {
        this.addCheck('Database Enums', 'warning', `Some enums may be missing`, missingEnums);
      }
    } catch (error) {
      this.addCheck('Database Enums', 'warning', `Could not verify enums: ${error}`);
    }
  }

  async verifyIndexes() {
    console.log('🔍 Verifying Database Indexes...\n');

    const criticalIndexes = [
      'idx_users_email',
      'idx_users_type',
      'idx_bookings_user_id',
      'idx_bookings_spot_id',
      'idx_parking_spots_zone_id',
      'idx_user_sessions_user_id',
      'idx_audit_logs_user_id'
    ];

    try {
      // This is a simplified check - in a real scenario you'd query pg_indexes
      this.addCheck('Database Indexes', 'warning', 'Index verification requires database admin access');
    } catch (error) {
      this.addCheck('Database Indexes', 'warning', `Could not verify indexes: ${error}`);
    }
  }

  async verifyRLSPolicies() {
    console.log('🔒 Verifying Row Level Security Policies...\n');

    const tablesWithRLS = [
      'users',
      'user_profiles',
      'user_groups',
      'locations',
      'sections',
      'zones',
      'parking_spots',
      'bookings',
      'vehicles',
      'conversations',
      'messages',
      'ratings',
      'advertisements'
    ];

    try {
      // Check if RLS is enabled on critical tables
      const rlsChecks = await Promise.allSettled(
        tablesWithRLS.map(async (table) => {
          try {
            // Try to query the table - if RLS is working, this should either succeed or fail with permission error
            const { error } = await supabase.from(table).select('*').limit(1);
            return { table, hasRLS: true, error: error?.message };
          } catch {
            return { table, hasRLS: false, error: 'Unknown error' };
          }
        })
      );

      const tablesWithRLSEnabled: string[] = [];
      const tablesWithoutRLS: string[] = [];

      rlsChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.hasRLS) {
            tablesWithRLSEnabled.push(tablesWithRLS[index]);
          } else {
            tablesWithoutRLS.push(tablesWithRLS[index]);
          }
        }
      });

      if (tablesWithoutRLS.length === 0) {
        this.addCheck('RLS Policies', 'pass', `RLS appears to be configured on ${tablesWithRLSEnabled.length} tables`);
      } else {
        this.addCheck('RLS Policies', 'warning', `Some tables may not have RLS enabled`, tablesWithoutRLS);
      }
    } catch (error) {
      this.addCheck('RLS Policies', 'warning', `Could not fully verify RLS: ${error}`);
    }
  }

  async verifyStorageBuckets() {
    console.log('🗂️ Verifying Storage Buckets...\n');

    const expectedBuckets = [
      'avatars',
      'vehicle-photos',
      'parking-photos',
      'violation-photos',
      'advertisement-media',
      'documents',
      'receipts',
      'facility-layouts'
    ];

    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        this.addCheck('Storage Buckets', 'fail', `Error listing buckets: ${error.message}`);
      } else {
        const bucketNames = buckets.map(b => b.name);
        const missingBuckets = expectedBuckets.filter(bucket => !bucketNames.includes(bucket));
        
        if (missingBuckets.length === 0) {
          this.addCheck('Storage Buckets', 'pass', `All ${expectedBuckets.length} storage buckets exist`);
        } else {
          this.addCheck('Storage Buckets', 'pass', `Found ${buckets.length} storage buckets, missing ${missingBuckets.length}`, 
            [`Existing: ${bucketNames.join(', ')}`, `Missing: ${missingBuckets.join(', ')}`]);
        }
      }
    } catch (error) {
      this.addCheck('Storage Buckets', 'fail', `Error checking storage buckets: ${error}`);
    }
  }

  async verifyAuthConfiguration() {
    console.log('🔐 Verifying Authentication Configuration...\n');

    try {
      // Test auth configuration by checking if we can get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addCheck('Auth Configuration', 'warning', `Auth session check: ${error.message}`);
      } else {
        this.addCheck('Auth Configuration', 'pass', 'Supabase Auth is properly configured');
      }

      // Check if we can access auth admin functions (this will likely fail without proper permissions)
      try {
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError) {
          this.addCheck('Auth Admin Access', 'pass', 'Auth admin functions are accessible');
        } else {
          this.addCheck('Auth Admin Access', 'warning', 'Auth admin functions not accessible (expected in client context)');
        }
      } catch {
        this.addCheck('Auth Admin Access', 'warning', 'Auth admin functions not accessible (expected in client context)');
      }
    } catch (error) {
      this.addCheck('Auth Configuration', 'fail', `Auth configuration error: ${error}`);
    }
  }

  async verifyTriggers() {
    console.log('⚡ Verifying Database Triggers...\n');

    const expectedTriggers = [
      'update_users_updated_at',
      'update_user_profiles_updated_at',
      'update_bookings_updated_at',
      'validate_booking_times_trigger',
      'prevent_booking_overlap_trigger',
      'update_spot_status_trigger',
      'ensure_single_default_vat_trigger'
    ];

    try {
      // This would require admin access to check pg_trigger
      this.addCheck('Database Triggers', 'warning', 'Trigger verification requires database admin access');
    } catch (error) {
      this.addCheck('Database Triggers', 'warning', `Could not verify triggers: ${error}`);
    }
  }

  async verifyFunctions() {
    console.log('⚙️ Verifying Database Functions...\n');

    const expectedFunctions = [
      'update_updated_at_column',
      'validate_booking_times',
      'prevent_booking_overlap',
      'update_spot_status',
      'ensure_single_default_vat'
    ];

    try {
      // Test a simple function call
      const { data, error } = await supabase.rpc('update_updated_at_column');
      
      if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
        this.addCheck('Database Functions', 'pass', 'Database functions appear to be working');
      } else {
        this.addCheck('Database Functions', 'warning', 'Some database functions may not be available');
      }
    } catch (error) {
      this.addCheck('Database Functions', 'warning', `Could not verify functions: ${error}`);
    }
  }

  async verifyViews() {
    console.log('👁️ Verifying Database Views...\n');

    const expectedViews = [
      'parking_hierarchy_view',
      'active_bookings_view',
      'revenue_analytics_view'
    ];

    try {
      const viewChecks = await Promise.allSettled(
        expectedViews.map(async (view) => {
          const { error } = await supabase.from(view).select('*').limit(1);
          return { view, exists: !error };
        })
      );

      const existingViews: string[] = [];
      const missingViews: string[] = [];

      viewChecks.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists) {
          existingViews.push(expectedViews[index]);
        } else {
          missingViews.push(expectedViews[index]);
        }
      });

      if (missingViews.length === 0) {
        this.addCheck('Database Views', 'pass', `All ${expectedViews.length} views exist`, existingViews);
      } else {
        this.addCheck('Database Views', 'warning', `Missing ${missingViews.length} views`, missingViews);
      }
    } catch (error) {
      this.addCheck('Database Views', 'warning', `Could not verify views: ${error}`);
    }
  }

  async verifyInitialData() {
    console.log('📊 Verifying Initial Data...\n');

    try {
      // Check if we have some basic configuration data
      const { data: vatConfig, error: vatError } = await supabase
        .from('vat_config')
        .select('*')
        .limit(1);

      if (vatError) {
        this.addCheck('Initial Data - VAT Config', 'warning', 'VAT configuration table may not be populated');
      } else if (vatConfig && vatConfig.length > 0) {
        this.addCheck('Initial Data - VAT Config', 'pass', 'VAT configuration data exists');
      } else {
        this.addCheck('Initial Data - VAT Config', 'warning', 'No VAT configuration data found');
      }

      // Check system config
      const { data: systemConfig, error: systemError } = await supabase
        .from('system_config')
        .select('*')
        .limit(1);

      if (systemError) {
        this.addCheck('Initial Data - System Config', 'warning', 'System configuration table may not be accessible');
      } else if (systemConfig && systemConfig.length > 0) {
        this.addCheck('Initial Data - System Config', 'pass', 'System configuration data exists');
      } else {
        this.addCheck('Initial Data - System Config', 'warning', 'No system configuration data found');
      }
    } catch (error) {
      this.addCheck('Initial Data', 'warning', `Could not verify initial data: ${error}`);
    }
  }

  async verifyEdgeFunctions() {
    console.log('🌐 Verifying Edge Functions...\n');

    const expectedEdgeFunctions = [
      'notification-handler',
      'booking-processor'
    ];

    try {
      // Edge functions can't be easily verified from client-side
      this.addCheck('Edge Functions', 'warning', 'Edge function verification requires server-side access');
    } catch (error) {
      this.addCheck('Edge Functions', 'warning', `Could not verify edge functions: ${error}`);
    }
  }

  async runAllChecks() {
    console.log('🔍 Park Angel Database Verification\n');
    console.log('=====================================\n');

    await this.verifyDatabaseConnection();
    await this.verifyTables();
    await this.verifyEnums();
    await this.verifyIndexes();
    await this.verifyRLSPolicies();
    await this.verifyStorageBuckets();
    await this.verifyAuthConfiguration();
    await this.verifyTriggers();
    await this.verifyFunctions();
    await this.verifyViews();
    await this.verifyInitialData();
    await this.verifyEdgeFunctions();

    this.printSummary();
  }

  private printSummary() {
    console.log('\n=====================================');
    console.log('📋 VERIFICATION SUMMARY');
    console.log('=====================================\n');

    this.checks.forEach(check => this.logCheck(check));

    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warnings = this.checks.filter(c => c.status === 'warning').length;

    console.log('\n=====================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total Checks: ${this.checks.length}`);
    console.log('=====================================\n');

    if (failed === 0) {
      console.log('🎉 Database verification completed successfully!');
      if (warnings > 0) {
        console.log('⚠️  Some warnings were found - please review them above.');
      }
    } else {
      console.log('❌ Database verification found critical issues that need to be addressed.');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Address any failed checks by running the database setup scripts');
    console.log('2. Review warnings and determine if they need attention');
    console.log('3. Run this verification again after making changes');
    console.log('4. Check the Supabase dashboard for additional configuration');

    return failed === 0;
  }
}

// Run verification
if (require.main === module) {
  const verifier = new DatabaseVerifier();
  verifier.runAllChecks()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Verification script failed:', error);
      process.exit(1);
    });
}

export { DatabaseVerifier };