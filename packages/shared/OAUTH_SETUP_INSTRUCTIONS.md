
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
   - https://xvawouyzqoqucbokhbiw.supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback (for local development)
8. Copy the Client ID and Client Secret

### 2. Get Facebook OAuth Credentials (5 minutes)
1. Go to: https://developers.facebook.com/
2. Create new app → "Consumer" → "Next"
3. App name: "Park Angel"
4. Add "Facebook Login" product
5. Facebook Login → Settings
6. Valid OAuth Redirect URIs:
   - https://xvawouyzqoqucbokhbiw.supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback (for local development)
7. Copy the App ID and App Secret

### 3. Update Environment Variables
Replace the placeholder values in packages/shared/.env.local:

```
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
FACEBOOK_APP_ID=your_actual_facebook_app_id
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret
```

### 4. Configure Remote Supabase Project
For the remote project, you'll need to configure OAuth providers in the Supabase Dashboard:

🔗 Direct link: https://supabase.com/dashboard/project/xvawouyzqoqucbokhbiw/auth/providers

1. Enable Google provider and add credentials
2. Enable Facebook provider and add credentials
3. Configure redirect URLs: https://supabase.com/dashboard/project/xvawouyzqoqucbokhbiw/auth/url-configuration

### 5. Test OAuth Providers
After configuration, run:
```bash
npm run verify:auth-methods
```

## Local Development
Your local Supabase instance now supports OAuth providers. Once you add the credentials to .env.local and restart, you can test OAuth locally.

## Production
The remote Supabase project needs OAuth providers enabled via the Dashboard using the same credentials.
