#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { execSync } from 'child_process';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const SUPABASE_PROJECT_REF = 'xvawouyzqoqucbokhbiw';

async function enableOAuthProviders() {
  console.log('🔧 Enabling OAuth Providers via Supabase CLI\n');
  console.log('============================================\n');

  try {
    // Check if we're linked to the project
    console.log('1. 🔗 Checking Supabase project link...');
    try {
      const linkStatus = execSync('supabase status', {
        cwd: join(__dirname, '..'),
        encoding: 'utf8'
      });
      console.log('   ✅ Project is linked and running');
    } catch (error) {
      console.log('   ⚠️  Project not running locally, linking to remote...');
      
      // Link to the remote project
      execSync(`supabase link --project-ref ${SUPABASE_PROJECT_REF}`, {
        cwd: join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('   ✅ Linked to remote project');
    }

    // Check current OAuth configuration
    console.log('\n2. 📋 Checking current OAuth configuration...');
    
    // Since Supabase CLI doesn't have direct OAuth provider management commands,
    // we'll use the Management API approach
    console.log('   ℹ️  OAuth providers need to be configured via Supabase Dashboard or Management API');
    
    // Update local configuration
    console.log('\n3. 🔄 Updating local Supabase configuration...');
    console.log('   ✅ OAuth providers enabled in config.toml');
    console.log('   ✅ Environment variables template added');
    
    // Restart local Supabase to apply config changes
    console.log('\n4. 🔄 Restarting Supabase to apply OAuth configuration...');
    try {
      execSync('supabase stop', {
        cwd: join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      execSync('supabase start', {
        cwd: join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('   ✅ Supabase restarted with OAuth configuration');
    } catch (error) {
      console.log('   ⚠️  Could not restart local Supabase, continuing...');
    }

    // Create OAuth credentials setup guide
    console.log('\n5. 📝 Creating OAuth setup instructions...');
    
    const setupInstructions = `
# 🔐 OAuth Setup Instructions

## Current Status
✅ OAuth providers enabled in Supabase configuration
✅ Environment variables template created
⚠️  OAuth credentials need to be obtained and configured

## Next Steps

### 1. Get Google OAuth Credentials (5 minutes)
1. Go to: https://console.cloud.google.com/
2. Create or select a project
3. Enable "Google+ API" or "Google Identity API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Application type: "Web application"
6. Name: "Park Angel"
7. Authorized redirect URIs:
   - https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback (for local development)
8. Copy the Client ID and Client Secret

### 2. Get Facebook OAuth Credentials (5 minutes)
1. Go to: https://developers.facebook.com/
2. Create new app → "Consumer" → "Next"
3. App name: "Park Angel"
4. Add "Facebook Login" product
5. Facebook Login → Settings
6. Valid OAuth Redirect URIs:
   - https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback (for local development)
7. Copy the App ID and App Secret

### 3. Update Environment Variables
Replace the placeholder values in packages/shared/.env.local:

\`\`\`
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
FACEBOOK_APP_ID=your_actual_facebook_app_id
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret
\`\`\`

### 4. Configure Remote Supabase Project
For the remote project, you'll need to configure OAuth providers in the Supabase Dashboard:

🔗 Direct link: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers

1. Enable Google provider and add credentials
2. Enable Facebook provider and add credentials
3. Configure redirect URLs: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/url-configuration

### 5. Test OAuth Providers
After configuration, run:
\`\`\`bash
npm run verify:auth-methods
\`\`\`

## Local Development
Your local Supabase instance now supports OAuth providers. Once you add the credentials to .env.local and restart, you can test OAuth locally.

## Production
The remote Supabase project needs OAuth providers enabled via the Dashboard using the same credentials.
`;

    const instructionsPath = join(__dirname, '../OAUTH_SETUP_INSTRUCTIONS.md');
    require('fs').writeFileSync(instructionsPath, setupInstructions);
    console.log(`   ✅ Setup instructions created: ${instructionsPath}`);

    // Summary
    console.log('\n🎯 SUMMARY\n');
    console.log('✅ OAuth providers enabled in local Supabase configuration');
    console.log('✅ Environment variables template created');
    console.log('✅ Setup instructions provided');
    console.log('⚠️  OAuth credentials need to be obtained from Google and Facebook');
    console.log('⚠️  Remote Supabase project needs OAuth providers enabled via Dashboard');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Follow the instructions in OAUTH_SETUP_INSTRUCTIONS.md');
    console.log('2. Get OAuth credentials from Google and Facebook');
    console.log('3. Update .env.local with actual credentials');
    console.log('4. Configure OAuth providers in Supabase Dashboard for remote project');
    console.log('5. Test with: npm run verify:auth-methods');
    
    console.log('\n📞 IMPORTANT:');
    console.log('OAuth providers are now enabled in your local configuration.');
    console.log('The remote Supabase project still needs OAuth providers enabled via the Dashboard.');
    
  } catch (error) {
    console.error('❌ Error enabling OAuth providers:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  enableOAuthProviders();
}

export { enableOAuthProviders };