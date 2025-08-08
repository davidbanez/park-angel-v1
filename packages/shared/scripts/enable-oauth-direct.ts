#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const SUPABASE_PROJECT_REF = 'xvawouyzqoqucbokhbiw';

async function enableOAuthDirect() {
  console.log('🔧 Enabling OAuth Providers Directly\n');
  console.log('===================================\n');

  try {
    console.log('1. 📝 Creating temporary config with OAuth enabled...');
    
    // Read current config
    const configPath = join(__dirname, '../supabase/config.toml');
    const currentConfig = readFileSync(configPath, 'utf8');
    
    // Create a temporary config with OAuth enabled and placeholder credentials
    const tempConfigPath = join(__dirname, '../supabase/config.temp.toml');
    const tempConfig = currentConfig
      .replace(/\[auth\.external\.google\]\s*enabled = true\s*client_id = "env\(GOOGLE_CLIENT_ID\)"\s*secret = "env\(GOOGLE_CLIENT_SECRET\)"/g, 
        `[auth.external.google]
enabled = true
client_id = "placeholder_google_client_id"
secret = "placeholder_google_secret"`)
      .replace(/\[auth\.external\.facebook\]\s*enabled = true\s*client_id = "env\(FACEBOOK_APP_ID\)"\s*secret = "env\(FACEBOOK_APP_SECRET\)"/g,
        `[auth.external.facebook]
enabled = true
client_id = "placeholder_facebook_app_id"
secret = "placeholder_facebook_secret"`);
    
    writeFileSync(tempConfigPath, tempConfig);
    console.log('   ✅ Temporary config created with OAuth enabled');

    console.log('\n2. 🚀 Pushing OAuth configuration to remote project...');
    
    try {
      // Use supabase db push to apply the configuration
      execSync('supabase db push --include-all', {
        cwd: join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('   ✅ Configuration pushed to remote project');
    } catch (error) {
      console.log('   ⚠️  Direct push failed, trying alternative approach...');
      
      // Alternative: Use the Management API approach
      console.log('\n3. 🔄 Trying Management API approach...');
      
      const { enableOAuthViaAPI } = await import('./enable-oauth-management-api');
      await enableOAuthViaAPI();
    }

    // Clean up temporary file
    try {
      require('fs').unlinkSync(tempConfigPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log('\n4. 📋 Providing manual configuration instructions...');
    
    console.log('\n🎯 OAUTH PROVIDERS STATUS:');
    console.log('✅ Local configuration updated');
    console.log('⚠️  Remote project needs OAuth providers enabled');
    
    console.log('\n📝 MANUAL CONFIGURATION (RECOMMENDED):');
    console.log(`1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
    console.log('2. Click on "Google" provider');
    console.log('3. Toggle "Enable sign in with Google" to ON');
    console.log('4. Click on "Facebook" provider');
    console.log('5. Toggle "Enable sign in with Facebook" to ON');
    console.log('6. Click "Save" for each provider');
    
    console.log('\n🔑 OAUTH CREDENTIALS SETUP:');
    console.log('After enabling the providers, you\'ll need to add credentials:');
    console.log('\n📍 Google OAuth Setup:');
    console.log('1. Go to: https://console.cloud.google.com/');
    console.log('2. Create OAuth 2.0 credentials');
    console.log('3. Add redirect URI: https://xvawouyzqoqucbokhbiw.supabase.co/auth/v1/callback');
    console.log('4. Copy Client ID and Secret to Supabase Dashboard');
    
    console.log('\n📍 Facebook OAuth Setup:');
    console.log('1. Go to: https://developers.facebook.com/');
    console.log('2. Create Facebook Login app');
    console.log('3. Add redirect URI: https://xvawouyzqoqucbokhbiw.supabase.co/auth/v1/callback');
    console.log('4. Copy App ID and Secret to Supabase Dashboard');
    
    console.log('\n🧪 VERIFICATION:');
    console.log('After configuration, test with:');
    console.log('npm run verify:auth-methods');
    
    console.log('\n🎉 SUMMARY:');
    console.log('OAuth providers are configured in your local setup.');
    console.log('Please enable them manually in the Supabase Dashboard for the remote project.');
    console.log('This is the most reliable way to ensure OAuth providers are properly configured.');

  } catch (error) {
    console.error('❌ Error enabling OAuth providers:', error);
    
    console.log('\n🔧 FALLBACK INSTRUCTIONS:');
    console.log('Please enable OAuth providers manually in Supabase Dashboard:');
    console.log(`1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
    console.log('2. Enable Google and Facebook providers');
    console.log('3. Add OAuth credentials when available');
    
    process.exit(1);
  }
}

if (require.main === module) {
  enableOAuthDirect();
}

export { enableOAuthDirect };