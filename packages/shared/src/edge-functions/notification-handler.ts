// Supabase Edge Function for handling real-time notifications
// This function processes and sends notifications via multiple channels

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  channels?: ('push' | 'email' | 'sms')[];
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      (globalThis as any).Deno?.env?.get('SUPABASE_URL') ??
        process.env.SUPABASE_URL ??
        '',
      (globalThis as any).Deno?.env?.get('SUPABASE_ANON_KEY') ??
        process.env.SUPABASE_ANON_KEY ??
        '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      userId,
      title,
      message,
      type,
      data = {},
      channels = ['push'],
    }: NotificationRequest = await req.json();

    // Validate input
    if (!userId || !title || !message || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user preferences
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.warn('Could not fetch user profile:', profileError);
    }

    // Create notification record
    const { data: notification, error: notificationError } =
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data,
        })
        .select()
        .single();

    if (notificationError) {
      throw new Error(
        `Error creating notification: ${notificationError.message}`
      );
    }

    // Send notifications via requested channels
    const results = await Promise.allSettled([
      channels.includes('push')
        ? sendPushNotification(userId, title, message, data)
        : Promise.resolve(),
      channels.includes('email')
        ? sendEmailNotification(userProfile?.email, title, message)
        : Promise.resolve(),
      channels.includes('sms')
        ? sendSMSNotification(userProfile?.phone, message)
        : Promise.resolve(),
    ]);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Notification channel ${channels[index]} failed:`,
          result.reason
        );
      }
    });

    // Send real-time update via Supabase Realtime
    await supabaseClient.channel(`notifications-${userId}`).send({
      type: 'broadcast',
      event: 'new_notification',
      payload: notification,
    });

    return new Response(
      JSON.stringify({
        success: true,
        notification,
        channelResults: results.map((result, index) => ({
          channel: channels[index],
          success: result.status === 'fulfilled',
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Notification processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  data: Record<string, any>
): Promise<void> {
  // This would integrate with push notification services (FCM, APNs, etc.)
  // For now, we'll simulate push notification sending

  console.log(`Sending push notification to user ${userId}:`, {
    title,
    message,
    data,
  });

  // In a real implementation, you would:
  // 1. Get user's device tokens from database
  // 2. Send notifications via FCM/APNs
  // 3. Handle delivery receipts and failures

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function sendEmailNotification(
  email: string,
  title: string,
  message: string
): Promise<void> {
  if (!email) {
    throw new Error('No email address provided');
  }

  // This would integrate with email services (SendGrid, AWS SES, etc.)
  console.log(`Sending email notification to ${email}:`, { title, message });

  // Simulate email sending - in a real implementation, you would call your email service API
  // Example payload: { to: email, subject: title, html: generateEmailTemplate(title, message, data) }
  await new Promise(resolve => setTimeout(resolve, 200));
}

async function sendSMSNotification(
  phone: string,
  message: string
): Promise<void> {
  if (!phone) {
    throw new Error('No phone number provided');
  }

  // This would integrate with SMS services (Twilio, AWS SNS, etc.)
  console.log(`Sending SMS notification to ${phone}:`, message);

  // Simulate SMS sending - in a real implementation, you would call your SMS service API
  // Example payload: { to: phone, body: message }
  await new Promise(resolve => setTimeout(resolve, 150));
}

// Unused function - keeping for future reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
function generateEmailTemplate(
  title: string,
  message: string,
  data: Record<string, any>
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: white;
          padding: 30px 20px;
          border: 1px solid #e1e5e9;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding: 20px;
          color: #666;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Park Angel</h1>
        <h2>${title}</h2>
      </div>
      <div class="content">
        <p>${message}</p>
        ${
          data.booking_id
            ? `
          <p><strong>Booking ID:</strong> ${data.booking_id}</p>
        `
            : ''
        }
        ${
          data.action_url
            ? `
          <a href="${data.action_url}" class="button">View Details</a>
        `
            : ''
        }
      </div>
      <div class="footer">
        <p>This is an automated message from Park Angel. Please do not reply to this email.</p>
        <p>&copy; 2024 Park Angel. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
