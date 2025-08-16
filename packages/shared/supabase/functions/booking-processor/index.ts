// Supabase Edge Function for processing bookings
// This function handles booking creation, validation, and payment processing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  spotId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  paymentMethodId?: string;
}

interface PricingCalculation {
  baseAmount: number;
  discounts: Array<{
    type: string;
    name: string;
    percentage: number;
    amount: number;
  }>;
  vatAmount: number;
  totalAmount: number;
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

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      spotId,
      vehicleId,
      startTime,
      endTime,
      paymentMethodId,
    }: BookingRequest = await req.json();

    // Validate input
    if (!spotId || !vehicleId || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check spot availability
    const { data: existingBookings, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('spot_id', spotId)
      .in('status', ['confirmed', 'active'])
      .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

    if (bookingError) {
      throw new Error(`Error checking availability: ${bookingError.message}`);
    }

    if (existingBookings && existingBookings.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Spot is not available for the selected time',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get spot details and pricing
    const { data: spotData, error: spotError } = await supabaseClient
      .from('parking_spots')
      .select(
        `
        *,
        zones!inner(
          *,
          sections!inner(
            *,
            locations!inner(*)
          )
        )
      `
      )
      .eq('id', spotId)
      .single();

    if (spotError || !spotData) {
      return new Response(JSON.stringify({ error: 'Spot not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for discount eligibility
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('discount_eligibility')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.warn('Could not fetch user profile:', profileError);
    }

    // Calculate pricing
    const pricing = await calculatePricing(
      spotData,
      new Date(startTime),
      new Date(endTime),
      userProfile?.discount_eligibility || []
    );

    // Create booking record
    const { data: booking, error: createError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user.id,
        spot_id: spotId,
        vehicle_id: vehicleId,
        start_time: startTime,
        end_time: endTime,
        amount: pricing.baseAmount,
        discounts: pricing.discounts,
        vat_amount: pricing.vatAmount,
        total_amount: pricing.totalAmount,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creating booking: ${createError.message}`);
    }

    // Process payment if payment method provided
    if (paymentMethodId) {
      try {
        const paymentResult = await processPayment(
          booking.id,
          pricing.totalAmount
        );

        if (paymentResult.success) {
          // Update booking status
          await supabaseClient
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
            })
            .eq('id', booking.id);

          // Update spot status
          await supabaseClient
            .from('parking_spots')
            .update({ status: 'reserved' })
            .eq('id', spotId);
        }
      } catch (paymentError) {
        console.error('Payment processing failed:', paymentError);
        // Keep booking as pending for manual processing
      }
    }

    // Send confirmation notification
    await sendBookingNotification(
      supabaseClient,
      user.id,
      booking.id,
      'booking_created'
    );

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          ...booking,
          pricing,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Booking processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function calculatePricing(
  spotData: any,
  startTime: Date,
  endTime: Date,
  discountEligibility: string[]
): Promise<PricingCalculation> {
  const durationHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  // Get pricing config (spot > zone > section > location)
  const pricingConfig = spotData.pricing_config ||
    spotData.zones.pricing_config ||
    spotData.zones.sections.pricing_config ||
    spotData.zones.sections.locations.pricing_config || { baseRate: 50 }; // Default rate

  let baseAmount = pricingConfig.baseRate * durationHours;

  // Apply time-based pricing
  if (pricingConfig.timeBasedRates) {
    const hour = startTime.getHours();
    const timeRate = pricingConfig.timeBasedRates.find(
      (rate: any) => hour >= rate.startHour && hour < rate.endHour
    );
    if (timeRate) {
      baseAmount *= timeRate.multiplier;
    }
  }

  // Apply occupancy-based pricing
  if (pricingConfig.occupancyMultiplier) {
    baseAmount *= pricingConfig.occupancyMultiplier;
  }

  // Calculate discounts
  const discounts: Array<{
    type: string;
    name: string;
    percentage: number;
    amount: number;
  }> = [];

  let totalDiscountAmount = 0;
  let isVATExempt = false;

  // Apply eligible discounts
  if (discountEligibility.includes('senior')) {
    const discount = {
      type: 'senior',
      name: 'Senior Citizen Discount',
      percentage: 20,
      amount: baseAmount * 0.2,
    };
    discounts.push(discount);
    totalDiscountAmount += discount.amount;
    isVATExempt = true;
  }

  if (discountEligibility.includes('pwd')) {
    const discount = {
      type: 'pwd',
      name: 'PWD Discount',
      percentage: 20,
      amount: baseAmount * 0.2,
    };
    discounts.push(discount);
    totalDiscountAmount += discount.amount;
    isVATExempt = true;
  }

  const discountedAmount = baseAmount - totalDiscountAmount;
  const vatRate = isVATExempt ? 0 : pricingConfig.vatRate || 0.12;
  const vatAmount = discountedAmount * vatRate;
  const totalAmount = discountedAmount + vatAmount;

  return {
    baseAmount,
    discounts,
    vatAmount,
    totalAmount,
  };
}

async function processPayment(
  bookingId: string,
  amount: number
): Promise<{ success: boolean }> {
  // This would integrate with actual payment processors (Stripe, PayPal, etc.)
  // For now, we'll simulate payment processing

  console.log(`Processing payment for booking ${bookingId}: $${amount}`);

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate successful payment (in real implementation, this would call payment APIs)
  return { success: true };
}

async function sendBookingNotification(
  supabaseClient: any,
  userId: string,
  bookingId: string,
  type: string
): Promise<void> {
  try {
    await supabaseClient.from('notifications').insert({
      user_id: userId,
      title: 'Booking Confirmation',
      message: `Your parking booking has been ${type === 'booking_created' ? 'created' : 'updated'}.`,
      type: 'booking',
      data: { booking_id: bookingId },
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
