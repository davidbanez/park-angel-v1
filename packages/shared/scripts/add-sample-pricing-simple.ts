#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSamplePricingData() {
  console.log('🚀 Adding sample pricing data (simplified approach)...\n');

  // Sample pricing configuration
  const samplePricing = {
    baseRate: 50,
    vatRate: 12,
    occupancyMultiplier: 1.0,
    vehicleTypeRates: [
      {
        vehicleType: "car",
        rate: 50
      },
      {
        vehicleType: "motorcycle", 
        rate: 25
      },
      {
        vehicleType: "truck",
        rate: 75
      }
    ],
    timeBasedRates: [
      {
        dayOfWeek: 1,
        startTime: "07:00",
        endTime: "09:00",
        multiplier: 1.5,
        name: "Morning Rush"
      },
      {
        dayOfWeek: 1,
        startTime: "17:00", 
        endTime: "19:00",
        multiplier: 1.5,
        name: "Evening Rush"
      }
    ],
    holidayRates: [
      {
        name: "Christmas",
        date: "2024-12-25",
        multiplier: 1.2,
        isRecurring: true
      }
    ]
  };

  try {
    // First, let's try to create a user directly in auth.users (this might work with service role)
    console.log('📝 Attempting to create auth user...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'sample.operator@parkangel.com',
      password: 'temp-password-123',
      email_confirm: true,
      user_metadata: {
        role: 'operator'
      }
    });

    if (authError) {
      console.log('⚠️  Auth user creation failed:', authError.message);
      console.log('💡 Let\'s try a different approach...\n');
      
      // Alternative: Just show the SQL commands to run manually
      console.log('📋 Manual SQL commands to run in Supabase SQL Editor:');
      console.log('');
      console.log('-- 1. First create a user (replace with actual auth user ID):');
      console.log(`INSERT INTO users (id, email, user_type, status) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'sample.operator@parkangel.com', 'operator', 'active');`);
      console.log('');
      console.log('-- 2. Then create location with pricing:');
      console.log(`INSERT INTO locations (name, type, operator_id, address, coordinates, settings, pricing_config) VALUES 
  ('Sample Mall Parking', 'facility', '00000000-0000-0000-0000-000000000001', 
   '{"street": "123 Sample Street", "city": "Manila", "state": "Metro Manila", "country": "Philippines", "postal_code": "1000"}',
   '{"lat": 14.5995, "lng": 120.9842}',
   '{"operatingHours": {"monday": {"open": "06:00", "close": "22:00", "is24Hours": false}}, "maxBookingDuration": 480, "advanceBookingLimit": 30}',
   '${JSON.stringify(samplePricing)}');`);
      
      return;
    }

    console.log('✅ Auth user created successfully!');
    const userId = authUser.user?.id;

    if (!userId) {
      console.log('❌ No user ID returned');
      return;
    }

    // Create the user record in our users table
    const { error: userRecordError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'sample.operator@parkangel.com',
        user_type: 'operator',
        status: 'active'
      });

    if (userRecordError) {
      console.log('⚠️  User record creation failed:', userRecordError.message);
    } else {
      console.log('✅ User record created in users table');
    }

    // Now create the location with pricing
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        name: 'Sample Mall Parking',
        type: 'facility',
        operator_id: userId,
        address: {
          street: '123 Sample Street',
          city: 'Manila',
          state: 'Metro Manila',
          country: 'Philippines',
          postal_code: '1000'
        },
        coordinates: {
          lat: 14.5995,
          lng: 120.9842
        },
        settings: {
          operatingHours: {
            monday: { open: "06:00", close: "22:00", is24Hours: false },
            tuesday: { open: "06:00", close: "22:00", is24Hours: false },
            wednesday: { open: "06:00", close: "22:00", is24Hours: false },
            thursday: { open: "06:00", close: "22:00", is24Hours: false },
            friday: { open: "06:00", close: "22:00", is24Hours: false },
            saturday: { open: "06:00", close: "22:00", is24Hours: false },
            sunday: { open: "06:00", close: "22:00", is24Hours: false }
          },
          maxBookingDuration: 480,
          advanceBookingLimit: 30
        },
        pricing_config: samplePricing
      })
      .select()
      .single();

    if (locationError) {
      console.log('❌ Error creating sample location:', locationError.message);
      return;
    }

    console.log('✅ Sample location created with pricing config!');
    console.log(`   Location ID: ${location.id}`);
    console.log(`   Name: ${location.name}`);
    console.log('   Pricing config added successfully');

    // Add a sample section with different pricing
    const sectionPricing = {
      ...samplePricing,
      baseRate: 60, // Premium section
      vehicleTypeRates: [
        {
          vehicleType: "car",
          rate: 60
        },
        {
          vehicleType: "motorcycle",
          rate: 30
        }
      ]
    };

    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        location_id: location.id,
        name: 'Premium Section A',
        pricing_config: sectionPricing
      })
      .select()
      .single();

    if (sectionError) {
      console.log('❌ Error creating sample section:', sectionError.message);
    } else {
      console.log('✅ Sample section created with premium pricing!');
      console.log(`   Section ID: ${section.id}`);
      console.log(`   Name: ${section.name}`);
    }

    console.log('\n🎯 Success! Now you can view the pricing_config in Supabase Dashboard:');
    console.log('   1. Go to Table Editor → locations');
    console.log('   2. Look for the pricing_config column');
    console.log('   3. Click on the JSON cell to see the formatted data');
    console.log('   4. Also check the sections table for the premium pricing example');

  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }
}

async function main() {
  await addSamplePricingData();
}

main().catch(console.error);