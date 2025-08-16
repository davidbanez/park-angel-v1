import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIPreferences {
  preferred_parking_types: string[];
  max_walking_distance: number;
  price_sensitivity: 'low' | 'medium' | 'high';
  preferred_amenities: string[];
  preferred_booking_lead_time: number;
  flexible_timing: boolean;
  accessibility_required: boolean;
  covered_parking_preferred: boolean;
  security_level_preference: 'basic' | 'standard' | 'high';
}

interface ParkingSpot {
  id: string;
  number: string;
  type: string;
  coordinates: { latitude: number; longitude: number };
  zone: {
    name: string;
    section: {
      name: string;
      location: {
        id: string;
        name: string;
        type: 'hosted' | 'street' | 'facility';
        coordinates: { latitude: number; longitude: number };
      };
    };
  };
  pricing: any;
  amenities: string[];
}

interface RecommendationRequest {
  user_id: string;
  destination: string;
  date: string;
  duration_hours: number;
  preferences: AIPreferences;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { user_id, destination, date, duration_hours, preferences }: RecommendationRequest = await req.json()

    // Get user's location history and preferences
    const { data: userHistory } = await supabase
      .from('bookings')
      .select(`
        spot:parking_spots(
          zone:zones(
            section:sections(
              location:locations(*)
            )
          )
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Geocode destination (in a real implementation, you'd use a geocoding service)
    const destinationCoords = await geocodeDestination(destination)
    if (!destinationCoords) {
      throw new Error('Could not geocode destination')
    }

    // Get available parking spots
    const { data: availableSpots } = await supabase
      .from('parking_spots')
      .select(`
        *,
        zone:zones(
          name,
          section:sections(
            name,
            location:locations(
              id,
              name,
              type,
              coordinates,
              amenities
            )
          )
        )
      `)
      .eq('status', 'available')
      .in('zone.section.location.type', preferences.preferred_parking_types)

    if (!availableSpots || availableSpots.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate recommendations
    const recommendations = await calculateRecommendations(
      availableSpots,
      destinationCoords,
      preferences,
      duration_hours,
      userHistory || []
    )

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in AI recommendations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function geocodeDestination(destination: string): Promise<{ latitude: number; longitude: number } | null> {
  // In a real implementation, you would use a geocoding service like Google Maps Geocoding API
  // For now, return a mock coordinate for Manila
  return {
    latitude: 14.5995,
    longitude: 120.9842
  }
}

async function calculateRecommendations(
  spots: any[],
  destinationCoords: { latitude: number; longitude: number },
  preferences: AIPreferences,
  durationHours: number,
  userHistory: any[]
): Promise<any[]> {
  const recommendations = []

  for (const spot of spots) {
    const location = spot.zone.section.location
    const spotCoords = location.coordinates

    // Calculate distance
    const distance = calculateDistance(
      destinationCoords.latitude,
      destinationCoords.longitude,
      spotCoords.latitude,
      spotCoords.longitude
    )

    // Skip if too far
    if (distance > preferences.max_walking_distance) {
      continue
    }

    // Calculate walking time (assuming 5 km/h walking speed)
    const walkingTime = Math.round((distance / 1000) * 12) // minutes

    // Calculate price
    const basePrice = getSpotPrice(spot, durationHours)
    const totalCost = basePrice * durationHours

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(
      spot,
      distance,
      totalCost,
      preferences,
      userHistory
    )

    // Generate reasons
    const reasons = generateReasons(spot, distance, totalCost, preferences)

    recommendations.push({
      id: spot.id,
      spot_id: spot.id,
      location_name: location.name,
      spot_number: spot.number,
      parking_type: location.type,
      distance: Math.round(distance),
      walking_time: walkingTime,
      price_per_hour: basePrice,
      total_estimated_cost: totalCost,
      confidence_score: confidenceScore,
      reasons,
      amenities: location.amenities || [],
      availability_start: new Date().toISOString(),
      availability_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      coordinates: spotCoords
    })
  }

  // Sort by confidence score
  recommendations.sort((a, b) => b.confidence_score - a.confidence_score)

  // Return top 10 recommendations
  return recommendations.slice(0, 10)
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

function getSpotPrice(spot: any, durationHours: number): number {
  // In a real implementation, you would calculate the actual price based on pricing rules
  // For now, return a base price based on parking type
  const location = spot.zone.section.location
  
  switch (location.type) {
    case 'hosted':
      return 50 // ₱50/hour for hosted parking
    case 'street':
      return 30 // ₱30/hour for street parking
    case 'facility':
      return 40 // ₱40/hour for facility parking
    default:
      return 35
  }
}

function calculateConfidenceScore(
  spot: any,
  distance: number,
  totalCost: number,
  preferences: AIPreferences,
  userHistory: any[]
): number {
  let score = 0.5 // Base score

  // Distance factor (closer is better)
  const distanceFactor = Math.max(0, 1 - (distance / preferences.max_walking_distance))
  score += distanceFactor * 0.3

  // Price factor based on sensitivity
  let priceFactor = 0.5
  if (preferences.price_sensitivity === 'high') {
    priceFactor = Math.max(0, 1 - (totalCost / 200)) // Prefer cheaper options
  } else if (preferences.price_sensitivity === 'low') {
    priceFactor = 0.8 // Price doesn't matter much
  }
  score += priceFactor * 0.2

  // Amenities factor
  const location = spot.zone.section.location
  const amenities = location.amenities || []
  const matchingAmenities = amenities.filter(a => preferences.preferred_amenities.includes(a))
  const amenityFactor = matchingAmenities.length / Math.max(1, preferences.preferred_amenities.length)
  score += amenityFactor * 0.1

  // Historical preference factor
  const hasUsedSimilar = userHistory.some(h => 
    h.spot?.zone?.section?.location?.type === location.type
  )
  if (hasUsedSimilar) {
    score += 0.1
  }

  // Accessibility factor
  if (preferences.accessibility_required && amenities.includes('Wheelchair Accessible')) {
    score += 0.1
  }

  // Security factor
  if (preferences.security_level_preference === 'high' && amenities.includes('Security Camera')) {
    score += 0.05
  }

  // Covered parking factor
  if (preferences.covered_parking_preferred && amenities.includes('Covered')) {
    score += 0.05
  }

  return Math.min(1, Math.max(0, score))
}

function generateReasons(
  spot: any,
  distance: number,
  totalCost: number,
  preferences: AIPreferences
): string[] {
  const reasons = []
  const location = spot.zone.section.location
  const amenities = location.amenities || []

  // Distance reason
  if (distance <= preferences.max_walking_distance * 0.5) {
    reasons.push('Very close to your destination')
  } else if (distance <= preferences.max_walking_distance * 0.8) {
    reasons.push('Short walk to your destination')
  }

  // Price reason
  if (preferences.price_sensitivity === 'high' && totalCost <= 100) {
    reasons.push('Great value for money')
  }

  // Amenities reasons
  const matchingAmenities = amenities.filter(a => preferences.preferred_amenities.includes(a))
  if (matchingAmenities.length > 0) {
    reasons.push(`Has your preferred amenities: ${matchingAmenities.join(', ')}`)
  }

  // Accessibility reason
  if (preferences.accessibility_required && amenities.includes('Wheelchair Accessible')) {
    reasons.push('Wheelchair accessible')
  }

  // Security reason
  if (amenities.includes('Security Camera')) {
    reasons.push('Secure location with surveillance')
  }

  // Covered parking reason
  if (preferences.covered_parking_preferred && amenities.includes('Covered')) {
    reasons.push('Protected from weather')
  }

  // Default reason if no specific reasons
  if (reasons.length === 0) {
    reasons.push('Available and matches your preferences')
  }

  return reasons
}