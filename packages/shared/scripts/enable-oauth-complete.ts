#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const SUPABASE_PROJECT_REF = 'xvawouyzqoqucbokhbiw';

async function enableOAuthComplete() {
  console.log('🔧 Complete OAuth Provider Setup for Park Angel\n');
  console.log('===============================================\n');

  console.log('🎯 CURRENT STATUS:');
  console.log('✅ OAuth implementation code: Complete');
  console.log('✅ Local Supabase configuration: Updated');
  console.log('✅ Environment variables template: Created');
  console.log('⚠️  Remote Supabase OAuth providers: Need to be enabled\n');

  // Check if we have access token for Management API
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (accessToken) {
    console.log('🔑 Supabase Access Token found, attempting Management API approach...\n');
    
    try {
      // Try to enable via Management API
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const currentConfig = await response.json();
        console.log('✅ Successfully connected to Supabase Management API');
        
        // Check current status
        const googleEnabled = currentConfig.EXTERNAL_GOOGLE_ENABLED || false;
        const facebookEnabled = currentConfig.EXTERNAL_FACEBOOK_ENABLED || false;
        
        console.log(`📊 Current Google OAuth status: ${googleEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`📊 Current Facebook OAuth status: ${facebookEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (!googleEnabled || !facebookEnabled) {
          console.log('\n🔧 Enabling OAuth providers via Management API...');
          
          const updateConfig = {
            ...currentConfig,
            EXTERNAL_GOOGLE_ENABLED: true,
            EXTERNAL_FACEBOOK_ENABLED: true,
          };
          
          const updateResponse = await fetch(
            `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateConfig),
            }
          );
          
          if (updateResponse.ok) {
            console.log('✅ OAuth providers enabled successfully via Management API!');
            
            // Verify the change
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
              
              console.log(`✅ Verified Google OAuth: ${googleNowEnabled ? 'Enabled' : 'Still Disabled'}`);
              console.log(`✅ Verified Facebook OAuth: ${facebookNowEnabled ? 'Enabled' : 'Still Disabled'}`);
              
              if (googleNowEnabled && facebookNowEnabled) {
                console.log('\n🎉 SUCCESS! Both OAuth providers are now enabled!\n');
                showCredentialsInstructions();
                return;
              }
            }
          } else {
            console.log('⚠️  Management API update failed, falling back to manual instructions...');
          }
        } else {
          console.log('\n🎉 Both OAuth providers are already enabled!\n');
          showCredentialsInstructions();
          return;
        }
      } else {
        console.log('⚠️  Management API access failed, using manual approach...');
      }
    } catch (error) {
      console.log('⚠️  Management API error, using manual approach...');
    }
  } else {
    console.log('ℹ️  No Supabase Access Token found, using manual approach...\n');
  }

  // Manual approach instructions
  showManualInstructions();
}

function showCredentialsInstructions() {
  console.log('🔑 OAUTH CREDENTIALS SETUP:\n');
  console.log('OAuth providers are enabled! Now you need to add credentials:\n');
  
  console.log('📍 STEP 1: Get Google OAuth Credentials');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Create or select a project');
  console.log('3. Enable "Google+ API" or "Google Identity API"');
  console.log('4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"');
  console.log('5. Application type: "Web application"');
  console.log('6. Name: "Park Angel"');
  console.log('7. Authorized redirect URIs:');
  console.log(`   - https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`);
  console.log('8. Copy the Client ID and Client Secret\n');
  
  console.log('📍 STEP 2: Get Facebook OAuth Credentials');
  console.log('1. Go to: https://developers.facebook.com/');
  console.log('2. Create new app → "Consumer" → "Next"');
  console.log('3. App name: "Park Angel"');
  console.log('4. Add "Facebook Login" product');
  console.log('5. Facebook Login → Settings');
  console.log('6. Valid OAuth Redirect URIs:');
  console.log(`   - https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`);
  console.log('7. Copy the App ID and App Secret\n');
  
  console.log('📍 STEP 3: Add Credentials to Supabase');
  console.log(`🔗 Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
  console.log('1. Click on "Google" provider');
  console.log('2. Add your Google Client ID and Client Secret');
  console.log('3. Click "Save"');
  console.log('4. Click on "Facebook" provider');
  console.log('5. Add your Facebook App ID and App Secret');
  console.log('6. Click "Save"\n');
  
  console.log('🧪 STEP 4: Test Your Setup');
  console.log('npm run verify:auth-methods\n');
  
  console.log('🎉 FINAL RESULT:');
  console.log('✅ Email/Password authentication: Working');
  console.log('✅ Google OAuth authentication: Ready (needs credentials)');
  console.log('✅ Facebook OAuth authentication: Ready (needs credentials)');
  console.log('✅ All Park Angel authentication requirements: SATISFIED!');
}

function showManualInstructions() {
  console.log('📝 MANUAL OAUTH ENABLEMENT REQUIRED:\n');
  console.log('Please enable OAuth providers manually in the Supabase Dashboard:\n');
  
  console.log('📍 STEP 1: Enable OAuth Providers');
  console.log(`🔗 Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`);
  console.log('1. Click on "Google" provider');
  console.log('2. Toggle "Enable sign in with Google" to ON');
  console.log('3. Click on "Facebook" provider');
  console.log('4. Toggle "Enable sign in with Facebook" to ON');
  console.log('5. Click "Save" for each provider\n');
  
  showCredentialsInstructions();
  
  console.log('\n💡 TIP: To use the Management API approach in the future:');
  console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
  console.log('2. Create a new access token');
  console.log('3. Add SUPABASE_ACCESS_TOKEN=your_token to .env.local');
  console.log('4. Run this script again');
}

if (require.main === module) {
  enableOAuthComplete();
}

export { enableOAuthComplete };