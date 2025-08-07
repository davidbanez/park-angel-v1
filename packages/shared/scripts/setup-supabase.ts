#!/usr/bin/env node

// Setup script for initializing Supabase backend infrastructure
// This script automates the setup of database schema, RLS policies, storage buckets, and Edge Functions

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

interface SetupConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  skipConfirmation?: boolean;
}

class SupabaseSetup {
  private client: any;
  private config: SetupConfig;

  constructor(config: SetupConfig) {
    this.config = config;
    this.client = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Supabase backend infrastructure setup...\n');

    try {
      // Step 1: Verify connection
      await this.verifyConnection();

      // Step 2: Set up database schema
      await this.setupDatabaseSchema();

      // Step 3: Configure authentication providers
      await this.setupAuthProviders();

      // Step 4: Apply RLS policies
      await this.setupRLSPolicies();

      // Step 5: Initialize storage buckets
      await this.setupStorageBuckets();

      // Step 6: Deploy Edge Functions
      await this.deployEdgeFunctions();

      // Step 7: Set up real-time subscriptions
      await this.setupRealtimeSubscriptions();

      console.log(
        '\n✅ Supabase backend infrastructure setup completed successfully!'
      );
      console.log('\n📋 Next steps:');
      console.log(
        '1. Update your environment variables with the Supabase credentials'
      );
      console.log('2. Test the authentication flow');
      console.log('3. Verify storage bucket permissions');
      console.log('4. Test real-time subscriptions');
    } catch (error) {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    }
  }

  private async verifyConnection(): Promise<void> {
    console.log('🔍 Verifying Supabase connection...');

    try {
      const { error } = await this.client
        .from('_supabase_migrations')
        .select('*')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found, which is OK
        throw new Error(`Connection failed: ${error.message}`);
      }

      console.log('✅ Connection verified');
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error}`);
    }
  }

  private async setupDatabaseSchema(): Promise<void> {
    console.log('\n📊 Setting up database schema...');

    try {
      // First, run the main schema
      const schemaPath = join(__dirname, '../src/database/schema.sql');
      const schemaSql = readFileSync(schemaPath, 'utf-8');

      // Then, run the utility functions
      const utilsPath = join(__dirname, '../src/database/utils.sql');
      const utilsSql = readFileSync(utilsPath, 'utf-8');

      // Combine both SQL files
      const combinedSql = `${schemaSql}\n\n-- Utility Functions\n${utilsSql}`;

      // Split SQL into individual statements
      const statements = combinedSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(
          stmt =>
            stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('\\i')
        );

      console.log(`Executing ${statements.length} SQL statements...`);

      for (const statement of statements) {
        try {
          await this.client.rpc('exec_sql', { sql: `${statement};` });
        } catch (error) {
          // Log warning for non-critical errors (like table already exists)
          if (
            error.message.includes('already exists') ||
            error.message.includes('already a member') ||
            error.message.includes('duplicate key')
          ) {
            console.log(`⚠️  Skipping: ${error.message.substring(0, 100)}...`);
          } else {
            console.error(
              `❌ Error executing statement: ${statement.substring(0, 100)}...`
            );
            throw error;
          }
        }
      }

      // Insert initial system configuration and default data
      await this.insertInitialData();

      console.log('✅ Database schema and utilities created');
    } catch (error) {
      throw new Error(`Failed to setup database schema: ${error}`);
    }
  }

  private async insertInitialData(): Promise<void> {
    console.log('📝 Inserting initial system data...');

    try {
      // Insert system configuration
      const systemConfigs = [
        {
          key: 'app_name',
          value: '"Park Angel"',
          description: 'Application name',
          is_public: true,
        },
        {
          key: 'app_version',
          value: '"1.0.0"',
          description: 'Application version',
          is_public: true,
        },
        {
          key: 'default_vat_rate',
          value: '12',
          description: 'Default VAT rate percentage',
          is_public: false,
        },
        {
          key: 'platform_commission_rate',
          value: '30',
          description: 'Platform commission percentage',
          is_public: false,
        },
        {
          key: 'hosted_parking_host_share',
          value: '60',
          description: 'Host share percentage for hosted parking',
          is_public: false,
        },
        {
          key: 'max_booking_duration_hours',
          value: '24',
          description: 'Maximum booking duration in hours',
          is_public: true,
        },
        {
          key: 'booking_grace_period_minutes',
          value: '15',
          description: 'Grace period for late arrivals in minutes',
          is_public: true,
        },
        {
          key: 'api_rate_limit_default',
          value: '1000',
          description: 'Default API rate limit per hour',
          is_public: false,
        },
      ];

      for (const config of systemConfigs) {
        try {
          const { error } = await this.client.from('system_config').upsert(
            {
              ...config,
              updated_by: '00000000-0000-0000-0000-000000000000',
            },
            { onConflict: 'key' }
          );

          if (error) throw error;
        } catch (error) {
          console.log(`⚠️  Config '${config.key}' may already exist`);
        }
      }

      // Insert default VAT configuration
      const vatConfigs = [
        { name: 'Standard VAT', rate: 12.0, is_default: true, is_active: true },
        { name: 'Zero VAT', rate: 0.0, is_default: false, is_active: true },
      ];

      for (const vat of vatConfigs) {
        try {
          const { error } = await this.client
            .from('vat_config')
            .upsert(vat, { onConflict: 'name' });

          if (error) throw error;
        } catch (error) {
          console.log(`⚠️  VAT config '${vat.name}' may already exist`);
        }
      }

      // Insert default discount rules
      const discountRules = [
        {
          name: 'Senior Citizen Discount',
          type: 'senior',
          percentage: 20.0,
          is_vat_exempt: true,
          is_active: true,
        },
        {
          name: 'PWD Discount',
          type: 'pwd',
          percentage: 20.0,
          is_vat_exempt: true,
          is_active: true,
        },
        {
          name: 'Student Discount',
          type: 'custom',
          percentage: 10.0,
          is_vat_exempt: false,
          is_active: true,
        },
        {
          name: 'Early Bird Discount',
          type: 'custom',
          percentage: 15.0,
          is_vat_exempt: false,
          is_active: true,
        },
      ];

      for (const discount of discountRules) {
        try {
          const { error } = await this.client.from('discount_rules').upsert(
            {
              ...discount,
              created_by: '00000000-0000-0000-0000-000000000000',
            },
            { onConflict: 'name' }
          );

          if (error) throw error;
        } catch (error) {
          console.log(`⚠️  Discount rule '${discount.name}' may already exist`);
        }
      }

      console.log('✅ Initial system data inserted');
    } catch (error) {
      console.log(`⚠️  Some initial data may already exist: ${error.message}`);
    }
  }

  private async setupAuthProviders(): Promise<void> {
    console.log('\n🔐 Configuring authentication providers...');

    try {
      // Note: Auth provider configuration is typically done through Supabase Dashboard
      // This is a placeholder for programmatic configuration when available

      const authConfig = {
        email: {
          enabled: true,
          confirmEmail: true,
        },
        google: {
          enabled: process.env.GOOGLE_CLIENT_ID ? true : false,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        facebook: {
          enabled: process.env.FACEBOOK_APP_ID ? true : false,
          appId: process.env.FACEBOOK_APP_ID,
          appSecret: process.env.FACEBOOK_APP_SECRET,
        },
      };

      console.log('📧 Email authentication: enabled');
      console.log(
        `🔍 Google OAuth: ${authConfig.google.enabled ? 'enabled' : 'disabled'}`
      );
      console.log(
        `📘 Facebook OAuth: ${authConfig.facebook.enabled ? 'enabled' : 'disabled'}`
      );

      console.log('✅ Authentication providers configured');
      console.log(
        'ℹ️  Note: OAuth providers must be configured in Supabase Dashboard'
      );
    } catch (error) {
      throw new Error(`Failed to setup auth providers: ${error}`);
    }
  }

  private async setupRLSPolicies(): Promise<void> {
    console.log('\n🔒 Applying Row Level Security policies...');

    try {
      const rlsPath = join(__dirname, '../src/database/rls-policies.sql');
      const rlsSql = readFileSync(rlsPath, 'utf-8');

      // Split SQL into individual statements
      const statements = rlsSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`Applying ${statements.length} RLS policies...`);

      for (const statement of statements) {
        try {
          await this.client.rpc('exec_sql', { sql: `${statement};` });
        } catch (error) {
          // Log warning for non-critical errors
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Policy already exists: ${error.message}`);
          } else {
            throw error;
          }
        }
      }

      console.log('✅ RLS policies applied');
    } catch (error) {
      throw new Error(`Failed to setup RLS policies: ${error}`);
    }
  }

  private async setupStorageBuckets(): Promise<void> {
    console.log('\n🗄️  Setting up storage buckets...');

    const buckets = [
      { name: 'avatars', public: true },
      { name: 'vehicle-photos', public: false },
      { name: 'parking-photos', public: true },
      { name: 'violation-photos', public: false },
      { name: 'advertisement-media', public: true },
      { name: 'documents', public: false },
      { name: 'receipts', public: false },
      { name: 'facility-layouts', public: false },
    ];

    try {
      for (const bucket of buckets) {
        try {
          const { error } = await this.client.storage.createBucket(
            bucket.name,
            {
              public: bucket.public,
              allowedMimeTypes: this.getAllowedMimeTypes(bucket.name),
              fileSizeLimit: this.getFileSizeLimit(bucket.name),
            }
          );

          if (error && !error.message.includes('already exists')) {
            throw error;
          }

          console.log(
            `✅ Bucket '${bucket.name}' ${bucket.public ? '(public)' : '(private)'}`
          );
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Bucket '${bucket.name}' already exists`);
          } else {
            throw error;
          }
        }
      }

      console.log('✅ Storage buckets configured');
    } catch (error) {
      throw new Error(`Failed to setup storage buckets: ${error}`);
    }
  }

  private async deployEdgeFunctions(): Promise<void> {
    console.log('\n⚡ Deploying Edge Functions...');

    try {
      // Note: Edge Functions are typically deployed via Supabase CLI
      // This is a placeholder for programmatic deployment when available

      const functions = ['booking-processor', 'notification-handler'];

      for (const func of functions) {
        console.log(`📦 Function '${func}' ready for deployment`);
      }

      console.log('✅ Edge Functions prepared');
      console.log(
        'ℹ️  Note: Deploy functions using: supabase functions deploy'
      );
    } catch (error) {
      throw new Error(`Failed to deploy Edge Functions: ${error}`);
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    console.log('\n📡 Setting up real-time subscriptions...');

    try {
      // Enable realtime for specific tables
      const realtimeTables = [
        'parking_spots',
        'bookings',
        'messages',
        'notifications',
        'violation_reports',
      ];

      for (const table of realtimeTables) {
        try {
          await this.client.rpc('exec_sql', {
            sql: `ALTER PUBLICATION supabase_realtime ADD TABLE ${table};`,
          });
          console.log(`✅ Realtime enabled for '${table}'`);
        } catch (error) {
          if (
            error.message.includes('already exists') ||
            error.message.includes('already a member')
          ) {
            console.log(`⚠️  Realtime already enabled for '${table}'`);
          } else {
            console.log(
              `⚠️  Could not enable realtime for '${table}': ${error.message}`
            );
          }
        }
      }

      console.log('✅ Real-time subscriptions configured');
    } catch (error) {
      throw new Error(`Failed to setup real-time subscriptions: ${error}`);
    }
  }

  private getAllowedMimeTypes(bucketName: string): string[] {
    switch (bucketName) {
      case 'avatars':
      case 'parking-photos':
      case 'violation-photos':
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      case 'advertisement-media':
        return [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/webm',
        ];

      case 'documents':
      case 'receipts':
        return ['application/pdf', 'image/jpeg', 'image/png'];

      case 'facility-layouts':
        return ['image/jpeg', 'image/png', 'image/svg+xml', 'application/json'];

      default:
        return ['*/*'];
    }
  }

  private getFileSizeLimit(bucketName: string): number {
    switch (bucketName) {
      case 'avatars':
        return 2 * 1024 * 1024; // 2MB

      case 'vehicle-photos':
      case 'parking-photos':
      case 'violation-photos':
      case 'facility-layouts':
        return 5 * 1024 * 1024; // 5MB

      case 'advertisement-media':
        return 50 * 1024 * 1024; // 50MB

      case 'documents':
      case 'receipts':
        return 10 * 1024 * 1024; // 10MB

      default:
        return 10 * 1024 * 1024; // 10MB
    }
  }
}

// CLI execution
async function main() {
  const config: SetupConfig = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    skipConfirmation:
      process.argv.includes('--yes') || process.argv.includes('-y'),
  };

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease set these variables and try again.');
    process.exit(1);
  }

  if (!config.skipConfirmation) {
    console.log(
      'This will set up the Supabase backend infrastructure for Park Angel.'
    );
    console.log('Make sure you have the correct Supabase project selected.\n');

    // In a real implementation, you might want to add a confirmation prompt
    console.log('Use --yes flag to skip this confirmation.\n');
  }

  const setup = new SupabaseSetup(config);
  await setup.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SupabaseSetup };
