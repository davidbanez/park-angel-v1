#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const SUPABASE_PROJECT_REF = 'xvawouyzqoqucbokhbiw';

async function enableOAuthViaAPI() {
  console.log('🔧 Enabling OAuth Providers via Supabase Management API\n');
  console.log('====================================================\n');

  // Check if we have access token
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('❌ SUPABASE_ACCESS_TOKEN not found in environment variables');
    console.log('\n📝 To get your access token:');
    console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
    console.log('2. Create a new access token');
    console.log('3. Add it to your .env.local file as SUPABASE_ACCESS_TOKEN=your_token_here');
    console.log('4. Run this script again');
    return;
  }

  try {
    console.log('1. 🔍 Checking current OAuth provider status...');
    
    // Get current auth config
    const getConfigResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!getConfigResponse.ok) {
      throw new Error(`Failed to get auth config: ${getConfigResponse.status} ${getConfigResponse.statusText}`);
    }

    const currentConfig = await getConfigResponse.json();
    console.log('   ✅ Current auth configuration retrieved');
    
    // Check current OAuth provider status
    const googleEnabled = currentConfig.EXTERNAL_GOOGLE_ENABLED || false;
    const facebookEnabled = currentConfig.EXTERNAL_FACEBOOK_ENABLED || false;
    
    console.log(`   📊 Google OAuth: ${googleEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   📊 Facebook OAuth: ${facebookEnabled ? '✅ Enabled' : '❌ Disabled'}`);

    if (googleEnabled && facebookEnabled) {
      console.log('\n🎉 Both OAuth providers are already enabled!');
      return;
    }

    console.log('\n2. 🔧 Enabling OAuth providers...');

    // Prepare the configuration update
    const authConfig = {
      ...currentConfig,
      EXTERNAL_GOOGLE_ENABLED: true,
      EXTERNAL_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      EXTERNAL_GOOGLE_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
      EXTERNAL_FACEBOOK_ENABLED: true,
      EXTERNAL_FACEBOOK_CLIENT_ID: process.env.FACEBOOK_APP_ID || '',
      EXTERNAL_FACEBOOK_SECRET: process.env.FACEBOOK_APP_SECRET || '',
    };

    // Update auth configuration
    const updateResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authConfig),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update auth config: ${updateResponse.status} ${updateResponse.statusText}\n${errorText}`);
    }

    console.log('   ✅ OAuth providers enabled successfully!');

    console.log('\n3. 🔍 Verifying OAuth provider status...');
    
    // Verify the changes
    const verifyResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (verifyResponse.ok) {
      const verifiedConfig = await verifyResponse.json();
      const googleNowEnabled = verifiedConfig.EXTERNAL_GOOGLE_ENABLED || false;
      const facebookNowEnabled = verifiedConfig.EXTERNAL_FACEBOOK_ENABLED || false;
      
      console.log(`   📊 Google OAuth: ${googleNowEnabled ? '✅ Enabled' : '❌ Still Disabled'}`);
      console.log(`   📊 Facebook OAuth: ${facebookNowEnabled ? '✅ Enabled' : '❌ Still Disabled'}`);
    }

    console.log('\n🎉 SUCCESS!\n');
    console.log('✅ Google OAuth provider enabled');
    console.log('✅ Facebook OAuth provider enabled');
    
    console.log('\n📝 IMPORTANT NOTES:');
    console.log('1. OAuth providers are now enabled in your Supabase project');
    console.log('2. You still need to add valid OAuth credentials:');
    console.log('   - Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
    console.log('   - Update FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env.local');
    console.log('3. Configure redirect URLs in Supabase Dashboard if needed');
    
    console.log('\n🔗 Quick Links:');
    console.log(`- Supabase Auth Providers: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
    console.log(`- Google Cloud Console: https://console.cloud.google.com/`);
    console.log(`- Facebook Developers: https://developers.facebook.com/`);
    
    console.log('\n🧪 Test your setup:');
    console.log('npm run verify:auth-methods');

  } catch (error) {
    console.error('❌ Error enabling OAuth providers:', error);
    
    console.log('\n🔧 ALTERNATIVE APPROACH:');
    console.log('If the Management API approach fails, you can enable OAuth providers manually:');
    console.log(`1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
    console.log('2. Toggle ON the Google provider');
    console.log('3. Toggle ON the Facebook provider');
    console.log('4. Add your OAuth credentials when you have them');
    
    process.exit(1);
  }
}

if (require.main === module) {
  enableOAuthViaAPI();
}

export { enableOAuthViaAPI };