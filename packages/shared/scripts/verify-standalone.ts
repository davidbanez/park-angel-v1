#!/usr/bin/env node

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

// Standalone verification script for Park Angel Supabase setup
import { createClient } from '@supabase/supabase-js';

interface VerificationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class SupabaseVerification {
  private client: any;
  private results: VerificationResult[] = [];

  constructor() {
    // Get environment variables
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    console.log('🔍 Environment Check:');
    console.log(`URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
    console.log(`Key: ${supabaseKey ? '✅ Found' : '❌ Missing'}`);
    console.log('');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables!');
      console.error(
        'Expected: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
      console.error('Or: SUPABASE_URL and SUPABASE_ANON_KEY');
      process.exit(1);
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async run(): Promise<void> {
    console.log('🔍 Verifying Supabase backend infrastructure...\n');

    try {
      // Test database connection
      await this.testDatabaseConnection();

      // Test database schema
      await this.testDatabaseSchema();

      // Test initial data
      await this.testInitialData();

      // Display results
      this.displayResults();
    } catch (error) {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      const { error } = await this.client
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.addResult(
          'Database Connection',
          'fail',
          `Connection failed: ${error.message}`
        );
      } else {
        this.addResult(
          'Database Connection',
          'pass',
          'Successfully connected to database'
        );
      }
    } catch (error) {
      this.addResult(
        'Database Connection',
        'fail',
        `Connection error: ${error}`
      );
    }
  }

  private async testDatabaseSchema(): Promise<void> {
    const requiredTables = [
      'users',
      'user_profiles',
      'user_groups',
      'user_group_memberships',
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
      'system_config',
      'transaction_logs',
      'revenue_shares',
      'api_keys',
      'api_usage',
      'performance_metrics',
      'audit_logs',
    ];

    const missingTables: string[] = [];
    const existingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await this.client.from(table).select('*').limit(1);

        if (error && error.code === 'PGRST116') {
          missingTables.push(table);
        } else {
          existingTables.push(table);
        }
      } catch (error) {
        missingTables.push(table);
      }
    }

    if (missingTables.length === 0) {
      this.addResult(
        'Database Schema',
        'pass',
        `All ${requiredTables.length} required tables exist`,
        { tables: existingTables.length }
      );
    } else {
      this.addResult(
        'Database Schema',
        'fail',
        `Missing ${missingTables.length} required tables`,
        { missing: missingTables }
      );
    }
  }

  private async testInitialData(): Promise<void> {
    try {
      // Check system configuration
      const { data: systemConfig, error: configError } = await this.client
        .from('system_config')
        .select('key')
        .limit(10);

      // Check discount rules
      const { data: discountRules, error: discountError } = await this.client
        .from('discount_rules')
        .select('name')
        .limit(10);

      // Check VAT configuration
      const { data: vatConfig, error: vatError } = await this.client
        .from('vat_config')
        .select('name')
        .limit(10);

      const configCount = systemConfig?.length || 0;
      const discountCount = discountRules?.length || 0;
      const vatCount = vatConfig?.length || 0;

      if (configError || discountError || vatError) {
        this.addResult(
          'Initial Data',
          'fail',
          'Could not access initial data tables'
        );
        return;
      }

      if (configCount > 0 && discountCount > 0 && vatCount > 0) {
        this.addResult(
          'Initial Data',
          'pass',
          'Initial system data properly loaded',
          {
            systemConfigs: configCount,
            discountRules: discountCount,
            vatConfigs: vatCount,
          }
        );
      } else {
        this.addResult(
          'Initial Data',
          'warning',
          'Some initial data may be missing',
          {
            systemConfigs: configCount,
            discountRules: discountCount,
            vatConfigs: vatCount,
          }
        );
      }
    } catch (error) {
      this.addResult(
        'Initial Data',
        'warning',
        'Could not verify initial data',
        { error: error.message }
      );
    }
  }

  private addResult(
    component: string,
    status: 'pass' | 'fail' | 'warning',
    message: string,
    details?: any
  ): void {
    this.results.push({ component, status, message, details });
  }

  private displayResults(): void {
    console.log('\n📊 Verification Results:\n');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    this.results.forEach(result => {
      const icon =
        result.status === 'pass'
          ? '✅'
          : result.status === 'fail'
            ? '❌'
            : '⚠️';
      console.log(`${icon} ${result.component}: ${result.message}`);

      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });

    console.log(
      `\n📈 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`
    );

    if (failed > 0) {
      console.log(
        '❌ Some critical components failed verification. Please check your setup.'
      );
      process.exit(1);
    } else if (warnings > 0) {
      console.log(
        '⚠️  Some components have warnings. Your setup is functional but may need attention.'
      );
    } else {
      console.log(
        '✅ All components passed verification! Your Supabase setup is ready.'
      );
    }

    console.log('\n📋 Next steps:');
    console.log(
      '1. Your database is ready for Task 4: Implement core domain entities'
    );
    console.log('2. Start building the TypeScript models and services');
    console.log('3. Test the complete authentication flow');
  }
}

// CLI execution
async function main() {
  const verification = new SupabaseVerification();
  await verification.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SupabaseVerification };
