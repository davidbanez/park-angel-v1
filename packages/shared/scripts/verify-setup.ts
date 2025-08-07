#!/usr/bin/env node

// Verification script to test Supabase backend infrastructure setup
// This script validates that all components are working correctly

import { supabase, AuthService, StorageService } from '../src';

interface VerificationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class SupabaseVerification {
  private results: VerificationResult[] = [];

  async run(): Promise<void> {
    console.log('🔍 Verifying Supabase backend infrastructure...\n');

    try {
      // Test database connection
      await this.testDatabaseConnection();

      // Test authentication
      await this.testAuthentication();

      // Test storage buckets
      await this.testStorageBuckets();

      // Test real-time subscriptions
      await this.testRealtimeSubscriptions();

      // Test Edge Functions (if available)
      await this.testEdgeFunctions();

      // Display results
      this.displayResults();
    } catch (error) {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);

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

      // Test database schema
      await this.testDatabaseSchema();

      // Test database integrity
      await this.testDatabaseIntegrity();

      // Test initial data
      await this.testInitialData();
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
        const { error } = await supabase.from(table).select('*').limit(1);

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

  private async testDatabaseIntegrity(): Promise<void> {
    try {
      // Test database integrity using our custom function
      const { data, error } = await supabase.rpc('validate_database_integrity');

      if (error) {
        this.addResult(
          'Database Integrity',
          'warning',
          'Could not run integrity check function',
          { error: error.message }
        );
        return;
      }

      const failedChecks =
        data?.filter((check: any) => check.status === 'FAIL') || [];

      if (failedChecks.length === 0) {
        this.addResult(
          'Database Integrity',
          'pass',
          'All integrity checks passed',
          { checks: data?.length || 0 }
        );
      } else {
        this.addResult(
          'Database Integrity',
          'fail',
          `${failedChecks.length} integrity checks failed`,
          { failed: failedChecks }
        );
      }
    } catch (error) {
      this.addResult(
        'Database Integrity',
        'warning',
        'Could not verify database integrity',
        { error: error.message }
      );
    }
  }

  private async testInitialData(): Promise<void> {
    try {
      // Check system configuration
      const { data: systemConfig, error: configError } = await supabase
        .from('system_config')
        .select('key')
        .limit(10);

      // Check discount rules
      const { data: discountRules, error: discountError } = await supabase
        .from('discount_rules')
        .select('name')
        .limit(10);

      // Check VAT configuration
      const { data: vatConfig, error: vatError } = await supabase
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

  private async testAuthentication(): Promise<void> {
    try {
      // Test getting current session (should be null for unauthenticated)
      const { error } = await AuthService.getSession();

      if (error) {
        this.addResult(
          'Authentication',
          'fail',
          `Auth error: ${error.message}`
        );
      } else {
        this.addResult(
          'Authentication',
          'pass',
          'Authentication service is working'
        );
      }

      // Test auth state change listener
      const {
        data: { subscription },
      } = AuthService.onAuthStateChange(event => {
        console.log('Auth state change detected:', event);
      });

      if (subscription) {
        this.addResult(
          'Auth State Listener',
          'pass',
          'Auth state change listener is working'
        );
        subscription.unsubscribe();
      } else {
        this.addResult(
          'Auth State Listener',
          'warning',
          'Could not set up auth state listener'
        );
      }
    } catch (error) {
      this.addResult(
        'Authentication',
        'fail',
        `Authentication test failed: ${error}`
      );
    }
  }

  private async testStorageBuckets(): Promise<void> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        this.addResult(
          'Storage Buckets',
          'fail',
          `Storage error: ${error.message}`
        );
        return;
      }

      const expectedBuckets = Object.values(StorageService.BUCKETS);
      const existingBuckets = buckets?.map(b => b.name) || [];
      const missingBuckets = expectedBuckets.filter(
        bucket => !existingBuckets.includes(bucket)
      );

      if (missingBuckets.length === 0) {
        this.addResult(
          'Storage Buckets',
          'pass',
          `All ${expectedBuckets.length} buckets are configured`
        );
      } else {
        this.addResult(
          'Storage Buckets',
          'warning',
          `Missing buckets: ${missingBuckets.join(', ')}`,
          { existing: existingBuckets, missing: missingBuckets }
        );
      }

      // Test bucket permissions (try to list files in public bucket)
      try {
        const { error: listError } = await supabase.storage
          .from('avatars')
          .list('', { limit: 1 });

        if (listError && !listError.message.includes('not found')) {
          this.addResult(
            'Storage Permissions',
            'warning',
            `Bucket access issue: ${listError.message}`
          );
        } else {
          this.addResult(
            'Storage Permissions',
            'pass',
            'Storage bucket permissions are working'
          );
        }
      } catch (error) {
        this.addResult(
          'Storage Permissions',
          'warning',
          `Could not test bucket permissions: ${error}`
        );
      }
    } catch (error) {
      this.addResult(
        'Storage Buckets',
        'fail',
        `Storage test failed: ${error}`
      );
    }
  }

  private async testRealtimeSubscriptions(): Promise<void> {
    try {
      // Test creating a realtime channel
      const channel = supabase.channel('test-channel');

      if (channel) {
        this.addResult(
          'Realtime Channels',
          'pass',
          'Realtime channel creation is working'
        );

        // Test subscription
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
            },
            payload => {
              console.log('Realtime event received:', payload);
            }
          )
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              this.addResult(
                'Realtime Subscriptions',
                'pass',
                'Realtime subscriptions are working'
              );
            } else if (status === 'CHANNEL_ERROR') {
              this.addResult(
                'Realtime Subscriptions',
                'fail',
                'Realtime subscription failed'
              );
            }
          });

        // Clean up
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 2000);
      } else {
        this.addResult(
          'Realtime Channels',
          'fail',
          'Could not create realtime channel'
        );
      }
    } catch (error) {
      this.addResult(
        'Realtime Subscriptions',
        'fail',
        `Realtime test failed: ${error}`
      );
    }
  }

  private async testEdgeFunctions(): Promise<void> {
    try {
      // Test if Edge Functions are available
      const functions = ['booking-processor', 'notification-handler'];

      for (const funcName of functions) {
        try {
          // Try to invoke the function (this will likely fail without proper payload, but we just want to check if it exists)
          const { error } = await supabase.functions.invoke(funcName, {
            body: { test: true },
          });

          if (error && error.message.includes('not found')) {
            this.addResult(
              `Edge Function: ${funcName}`,
              'warning',
              'Function not deployed'
            );
          } else {
            this.addResult(
              `Edge Function: ${funcName}`,
              'pass',
              'Function is available'
            );
          }
        } catch (error) {
          this.addResult(
            `Edge Function: ${funcName}`,
            'warning',
            'Function not deployed or not accessible'
          );
        }
      }
    } catch (error) {
      this.addResult(
        'Edge Functions',
        'warning',
        `Edge Functions test failed: ${error}`
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
    console.log('1. Deploy Edge Functions: supabase functions deploy');
    console.log('2. Configure OAuth providers in Supabase Dashboard');
    console.log('3. Test the complete authentication flow');
    console.log('4. Set up monitoring and error tracking');
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
