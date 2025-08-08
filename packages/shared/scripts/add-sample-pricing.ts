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
    console.log('🚀 Adding sample pricing data...\n');

    // First, let's check if we have any users or create a sample one
    let operatorId: string;

    try {
        // Check for existing users
        const { data: existingUsers, error: userError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (userError) {
            console.log('⚠️  Error checking users:', userError.message);
        }

        if (existingUsers && existingUsers.length > 0) {
            operatorId = existingUsers[0].id;
            console.log(`✅ Using existing user as operator: ${operatorId}`);
        } else {
            // Create a sample user
            console.log('📝 No users found, creating sample operator user...');

            const { data: newUser, error: createUserError } = await supabase
                .from('users')
                .insert({
                    email: 'sample.operator@parkangel.com',
                    user_type: 'operator',
                    status: 'active'
                })
                .select()
                .single();

            if (createUserError) {
                console.log('❌ Error creating sample user:', createUserError.message);
                console.log('💡 You may need to create a user first through Supabase Auth');
                return;
            }

            operatorId = newUser.id;
            console.log(`✅ Created sample operator user: ${operatorId}`);
        }
    } catch (error) {
        console.log('❌ Error with user setup:', error);
        return;
    }

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
        // Add a sample location with pricing
        const { data: location, error: locationError } = await supabase
            .from('locations')
            .insert({
                name: 'Sample Mall Parking',
                type: 'facility',
                operator_id: operatorId,
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

        console.log('\n🎯 Now you can view the pricing_config in Supabase Dashboard:');
        console.log('   1. Go to Table Editor → locations');
        console.log('   2. Look for the pricing_config column');
        console.log('   3. Click on the JSON cell to see the formatted data');

    } catch (error) {
        console.log('❌ Error adding sample data:', error);
    }
}

async function main() {
    await addSamplePricingData();
}

main().catch(console.error);