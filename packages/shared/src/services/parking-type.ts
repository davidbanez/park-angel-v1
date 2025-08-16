import { createClient } from '@supabase/supabase-js';
import { validateQueryResult, safeAccess, isValidDatabaseResult } from '../lib/supabase';
import { ParkingType, PARKING_TYPE } from '../types/common';
import { Booking } from '../models/booking';
import { ParkingTypeService, ParkingTypeLogic, HostedParkingLogicInterface, ValidationResult } from './parking-management';

export class ParkingTypeServiceImpl implements ParkingTypeService {
  private typeLogicMap: Map<ParkingType, ParkingTypeLogic>;

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.typeLogicMap = new Map<ParkingType, ParkingTypeLogic>();
    this.typeLogicMap.set(PARKING_TYPE.HOSTED, new HostedParkingLogic(supabase));
    this.typeLogicMap.set(PARKING_TYPE.STREET, new StreetParkingLogic(supabase));
    this.typeLogicMap.set(PARKING_TYPE.FACILITY, new FacilityParkingLogic(supabase));
  }

  getTypeSpecificLogic(type: ParkingType): ParkingTypeLogic {
    const logic = this.typeLogicMap.get(type);
    if (!logic) {
      throw new Error(`No logic implementation found for parking type: ${type}`);
    }
    return logic;
  }

  async validateTypeSpecificRules(type: ParkingType, data: any): Promise<ValidationResult> {
    const logic = this.getTypeSpecificLogic(type);
    return await logic.validateBooking(data);
  }

  async getTypeSpecificPricing(type: ParkingType, basePrice: number): Promise<number> {
    const logic = this.getTypeSpecificLogic(type);
    return await logic.calculatePrice(basePrice, {});
  }
}

// Hosted Parking Logic (AirBnb-style private parking spaces)
export class HostedParkingLogic implements HostedParkingLogicInterface {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async validateBooking(booking: any): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Check if the spot has an active hosted listing
      const { data: listing, error: listingError } = await this.supabase
        .from('hosted_listings')
        .select('*')
        .eq('spot_id', booking.spotId)
        .eq('is_active', true)
        .single();

      if (listingError || !listing) {
        errors.push('This spot is not available for hosted parking');
        return { isValid: false, errors };
      }

      // Validate against host availability schedule
      const isAvailableInSchedule = this.checkHostAvailability(
        listing.availability,
        booking.startTime,
        booking.endTime
      );

      if (!isAvailableInSchedule) {
        errors.push('Host has not made this time slot available');
      }

      // Check minimum booking duration (hosts can set their own minimums)
      const pricingData = listing.pricing && typeof listing.pricing === 'object' ? listing.pricing : {};
      const minDuration = (pricingData as any)?.minimumDuration || 60; // minutes
      const bookingDuration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60);
      
      if (bookingDuration < minDuration) {
        errors.push(`Minimum booking duration is ${minDuration} minutes`);
      }

      // Check maximum advance booking
      const maxAdvanceDays = (pricingData as any)?.maxAdvanceBooking || 30;
      const advanceDays = (booking.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      
      if (advanceDays > maxAdvanceDays) {
        errors.push(`Cannot book more than ${maxAdvanceDays} days in advance`);
      }

      // Validate guest requirements (if any)
      if (listing.guest_requirements) {
        const guestValidation = await this.validateGuestRequirements(
          booking.userId,
          listing.guest_requirements
        );
        if (!guestValidation.isValid) {
          errors.push(...guestValidation.errors);
        }
      }

    } catch (error) {
      errors.push('Failed to validate hosted parking booking');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async calculatePrice(basePrice: number, params: any): Promise<number> {
    // Hosted parking uses host-set pricing, not base pricing
    const { spotId, startTime, endTime } = params;

    const { data: listing } = await this.supabase
      .from('hosted_listings')
      .select('pricing')
      .eq('spot_id', spotId)
      .single();

    if (!listing || !listing.pricing) {
      return basePrice; // Fallback to base price
    }

    const pricing = listing.pricing && typeof listing.pricing === 'object' ? listing.pricing : {};
    const pricingData = pricing as any;
    let finalPrice = pricingData.hourlyRate || basePrice;

    // Apply time-based pricing
    if (pricingData.timeBasedRates) {
      const timeRate = this.getTimeBasedRate(pricingData.timeBasedRates, startTime);
      if (timeRate) {
        finalPrice = timeRate.rate;
      }
    }

    // Apply weekend/weekday pricing
    const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
    if (isWeekend && pricingData.weekendMultiplier) {
      finalPrice *= pricingData.weekendMultiplier;
    }

    // Apply seasonal pricing
    if (pricingData.seasonalRates) {
      const seasonalRate = this.getSeasonalRate(pricingData.seasonalRates, startTime);
      if (seasonalRate) {
        finalPrice *= seasonalRate.multiplier;
      }
    }

    return Math.round(finalPrice * 100) / 100;
  }

  async getAccessInstructions(spotId: string): Promise<string> {
    const { data: listing } = await this.supabase
      .from('hosted_listings')
      .select('access_instructions')
      .eq('spot_id', spotId)
      .single();

    const instructions = listing && typeof listing.access_instructions === 'string' 
      ? listing.access_instructions 
      : 'No specific access instructions provided.';
    return instructions;
  }

  checkHostAvailability(
    availability: any,
    startTime: Date,
    endTime: Date
  ): boolean {
    if (!availability || !availability.schedule) {
      return true; // If no schedule specified, assume always available
    }

    // Check if the requested time falls within available slots
    const dayOfWeek = startTime.getDay();
    const daySchedule = availability.schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.isAvailable) {
      return false;
    }

    // Check time slots
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    return startHour >= daySchedule.startHour && endHour <= daySchedule.endHour;
  }

  async validateGuestRequirements(
    userId: string,
    requirements: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check minimum rating requirement
    if (requirements.minimumRating) {
      const { data: userRating } = await this.supabase
        .from('user_ratings')
        .select('average_rating')
        .eq('user_id', userId)
        .single();

      if (!userRating || userRating.average_rating < requirements.minimumRating) {
        errors.push(`Minimum guest rating of ${requirements.minimumRating} required`);
      }
    }

    // Check verification requirements
    if (requirements.verificationRequired) {
      const { data: verification } = await this.supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_verified', true);

      if (!verification || verification.length === 0) {
        errors.push('Identity verification required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getTimeBasedRate(timeBasedRates: any[], dateTime: Date): any {
    const hour = dateTime.getHours();
    return timeBasedRates.find(rate => 
      hour >= rate.startHour && hour < rate.endHour
    );
  }

  getSeasonalRate(seasonalRates: any[], dateTime: Date): any {
    const month = dateTime.getMonth() + 1; // 1-12
    return seasonalRates.find(rate =>
      month >= rate.startMonth && month <= rate.endMonth
    );
  }
}

// Street Parking Logic (on-street public parking)
export class StreetParkingLogic implements ParkingTypeLogic {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async validateBooking(booking: any): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Get street parking regulations for the spot
      const { data: regulations } = await this.supabase
        .from('street_parking_regulations')
        .select('*')
        .eq('spot_id', booking.spotId)
        .single();

      if (regulations) {
        // Check enforcement hours
        if (!this.isWithinEnforcementHours(regulations, booking.startTime, booking.endTime)) {
          errors.push('Booking time is outside enforcement hours');
        }

        // Check maximum parking duration
        const maxDuration = typeof regulations.maxDuration === 'number' ? regulations.maxDuration : null;
        if (maxDuration) {
          const bookingDuration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60);
          if (bookingDuration > maxDuration) {
            errors.push(`Maximum parking duration is ${maxDuration} minutes`);
          }
        }

        // Check vehicle type restrictions
        const vehicleRestrictions = Array.isArray(regulations.vehicleRestrictions) ? regulations.vehicleRestrictions : [];
        if (vehicleRestrictions.length > 0) {
          const { data: vehicle } = await this.supabase
            .from('vehicles')
            .select('type')
            .eq('id', booking.vehicleId)
            .single();

          if (vehicle && !vehicleRestrictions.includes(vehicle.type)) {
            errors.push('Vehicle type not allowed in this parking area');
          }
        }

        // Check permit requirements
        if (regulations.permitRequired) {
          const permitType = typeof regulations.permitType === 'string' ? regulations.permitType : 'general';
          const hasPermit = await this.checkUserPermit(booking.userId, permitType);
          if (!hasPermit) {
            errors.push(`${permitType} permit required`);
          }
        }
      }

      // Check for temporary restrictions (construction, events, etc.)
      const hasTemporaryRestrictions = await this.checkTemporaryRestrictions(
        booking.spotId,
        booking.startTime,
        booking.endTime
      );

      if (hasTemporaryRestrictions) {
        errors.push('Temporary parking restrictions are in effect');
      }

    } catch (error) {
      errors.push('Failed to validate street parking booking');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async calculatePrice(basePrice: number, params: any): Promise<number> {
    const { spotId, startTime, endTime } = params;

    // Get street parking rates
    const { data: rates } = await this.supabase
      .from('street_parking_rates')
      .select('*')
      .eq('spot_id', spotId)
      .single();

    if (!rates) {
      return basePrice;
    }

    const ratesData = rates && typeof rates === 'object' ? rates : {};
    const hourlyRate = typeof (ratesData as any).hourlyRate === 'number' ? (ratesData as any).hourlyRate : basePrice;
    let finalPrice = hourlyRate;

    // Apply time-of-day pricing
    const hour = startTime.getHours();
    const rushHourMultiplier = typeof (ratesData as any).rushHourMultiplier === 'number' ? (ratesData as any).rushHourMultiplier : 1.5;
    const nightMultiplier = typeof (ratesData as any).nightMultiplier === 'number' ? (ratesData as any).nightMultiplier : 0.5;
    const weekendMultiplier = typeof (ratesData as any).weekendMultiplier === 'number' ? (ratesData as any).weekendMultiplier : 0.8;
    
    if (hour >= 7 && hour <= 9) {
      finalPrice *= rushHourMultiplier; // Morning rush
    } else if (hour >= 17 && hour <= 19) {
      finalPrice *= rushHourMultiplier; // Evening rush
    } else if (hour >= 22 || hour <= 6) {
      finalPrice *= nightMultiplier; // Night discount
    }

    // Apply day-of-week pricing
    const dayOfWeek = startTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      finalPrice *= weekendMultiplier; // Weekend discount
    }

    return Math.round(finalPrice * 100) / 100;
  }

  async getAccessInstructions(spotId: string): Promise<string> {
    // Get spot information with simplified query to avoid relationship issues
    const { data: spot } = await this.supabase
      .from('parking_spots')
      .select('id, number, zone_id')
      .eq('id', spotId)
      .single();

    if (!spot || !isValidDatabaseResult(spot)) {
      return 'Parking spot information not available.';
    }

    // Get location information separately
    const { data: zone } = await this.supabase
      .from('zones')
      .select('section_id')
      .eq('id', spot.zone_id)
      .single();

    if (!zone || !isValidDatabaseResult(zone)) {
      return `Street parking spot ${spot.number}. Follow local parking signs and regulations.`;
    }

    const { data: section } = await this.supabase
      .from('sections')
      .select('location_id')
      .eq('id', zone.section_id)
      .single();

    if (!section || !isValidDatabaseResult(section)) {
      return `Street parking spot ${spot.number}. Follow local parking signs and regulations.`;
    }

    const { data: location } = await this.supabase
      .from('locations')
      .select('address')
      .eq('id', section.location_id)
      .single();

    if (!location || !isValidDatabaseResult(location)) {
      return `Street parking spot ${spot.number}. Follow local parking signs and regulations.`;
    }

    const address = location.address && typeof location.address === 'object' ? location.address : {};
    const addressData = address as any;
    const street = addressData.street || 'Unknown Street';
    const city = addressData.city || 'Unknown City';
    
    return `Street parking at ${street}, ${city}. Look for spot number ${spot.number}. Follow local parking signs and regulations.`;
  }

  private isWithinEnforcementHours(
    regulations: any,
    startTime: Date,
    endTime: Date
  ): boolean {
    if (!regulations.enforcementHours) {
      return true; // No enforcement hours specified
    }

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const dayOfWeek = startTime.getDay();

    const daySchedule = regulations.enforcementHours[dayOfWeek];
    if (!daySchedule || !daySchedule.isEnforced) {
      return true; // Not enforced on this day
    }

    return startHour >= daySchedule.startHour && endHour <= daySchedule.endHour;
  }

  private async checkUserPermit(userId: string, permitType: string): Promise<boolean> {
    const { data: permit } = await this.supabase
      .from('user_permits')
      .select('*')
      .eq('user_id', userId)
      .eq('permit_type', permitType)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    return !!permit;
  }

  private async checkTemporaryRestrictions(
    spotId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const { data: restrictions } = await this.supabase
      .from('temporary_parking_restrictions')
      .select('*')
      .eq('spot_id', spotId)
      .lte('start_time', endTime.toISOString())
      .gte('end_time', startTime.toISOString())
      .eq('is_active', true);

    return restrictions && restrictions.length > 0;
  }
}

// Facility Parking Logic (off-street parking garages/facilities)
export class FacilityParkingLogic implements ParkingTypeLogic {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async validateBooking(booking: any): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Get facility information
      const { data: facility } = await this.supabase
        .from('parking_facilities')
        .select('*')
        .eq('spot_id', booking.spotId)
        .single();

      if (facility) {
        // Check facility operating hours
        if (!this.isWithinOperatingHours(facility, booking.startTime, booking.endTime)) {
          errors.push('Booking time is outside facility operating hours');
        }

        // Check vehicle height restrictions
        if (facility.maxVehicleHeight) {
          const { data: vehicle } = await this.supabase
            .from('vehicles')
            .select('height')
            .eq('id', booking.vehicleId)
            .single();

          if (vehicle && vehicle.height > facility.maxVehicleHeight) {
            errors.push(`Vehicle height exceeds facility limit of ${facility.maxVehicleHeight}cm`);
          }
        }

        // Check access requirements (key card, gate code, etc.)
        if (facility.accessRequirements) {
          const facilityId = typeof facility.id === 'string' ? facility.id : '';
          const hasAccess = await this.checkFacilityAccess(booking.userId, facilityId);
          if (!hasAccess) {
            errors.push('Facility access credentials required');
          }
        }

        // Check facility type specific rules
        if (facility.facilityType === 'reservation_only') {
          // Must be booked in advance, no walk-ins
          const advanceTime = booking.startTime.getTime() - new Date().getTime();
          if (advanceTime < 30 * 60 * 1000) { // 30 minutes minimum advance
            errors.push('This facility requires reservations at least 30 minutes in advance');
          }
        }
      }

      // Check for facility maintenance or closures
      const hasMaintenanceClosure = await this.checkFacilityMaintenance(
        booking.spotId,
        booking.startTime,
        booking.endTime
      );

      if (hasMaintenanceClosure) {
        errors.push('Facility is closed for maintenance during requested time');
      }

    } catch (error) {
      errors.push('Failed to validate facility parking booking');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async calculatePrice(basePrice: number, params: any): Promise<number> {
    const { spotId, startTime, endTime, facilityType } = params;

    // Get facility pricing
    const { data: facility } = await this.supabase
      .from('parking_facilities')
      .select('pricing_config, facility_type')
      .eq('spot_id', spotId)
      .single();

    if (!facility || !facility.pricing_config) {
      return basePrice;
    }

    const pricingConfig = facility.pricing_config && typeof facility.pricing_config === 'object' ? facility.pricing_config : {};
    const pricingData = pricingConfig as any;
    let finalPrice = typeof pricingData.hourlyRate === 'number' ? pricingData.hourlyRate : basePrice;

    // Different pricing models based on facility type
    if (facility.facility_type === 'pay_on_exit') {
      // Pay-on-exit facilities often have tiered pricing
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
      
      if (pricingData.tieredRates) {
        finalPrice = this.calculateTieredPrice(pricingData.tieredRates, duration);
      }
    } else if (facility.facility_type === 'reservation') {
      // Reservation facilities may have flat rates or premium pricing
      if (typeof pricingData.flatRate === 'number') {
        return pricingData.flatRate;
      }
    }

    // Apply facility-specific multipliers
    if (typeof pricingData.premiumMultiplier === 'number' && this.isPremiumTime(startTime)) {
      finalPrice *= pricingData.premiumMultiplier;
    }

    // Apply floor/level pricing (premium floors cost more)
    const floorMultiplier = await this.getFloorPricingMultiplier(spotId);
    finalPrice *= floorMultiplier;

    return Math.round(finalPrice * 100) / 100;
  }

  async getAccessInstructions(spotId: string): Promise<string> {
    const { data: facility } = await this.supabase
      .from('parking_facilities')
      .select(`
        *,
        parking_spots!inner (
          number,
          zones!inner (
            name,
            sections!inner (
              name,
              locations!inner (
                name,
                address
              )
            )
          )
        )
      `)
      .eq('spot_id', spotId)
      .single();

    if (!facility) {
      return 'Facility information not available.';
    }

    // Get spot information separately to avoid relationship issues
    const { data: spot } = await this.supabase
      .from('parking_spots')
      .select('number, zone_id')
      .eq('id', spotId)
      .single();

    if (!spot || !isValidDatabaseResult(spot)) {
      return 'Parking spot information not available.';
    }
    
    let instructions = `Welcome to the parking facility!\n`;
    instructions += `Your spot is ${spot.number}.\n`;

    if (facility.access_instructions && typeof facility.access_instructions === 'string') {
      instructions += `\nAccess Instructions: ${facility.access_instructions}`;
    }

    if (facility.gate_code && typeof facility.gate_code === 'string') {
      instructions += `\nGate Code: ${facility.gate_code}`;
    }

    if (facility.parking_instructions && typeof facility.parking_instructions === 'string') {
      instructions += `\nParking Instructions: ${facility.parking_instructions}`;
    }

    return instructions;
  }

  private isWithinOperatingHours(
    facility: any,
    startTime: Date,
    endTime: Date
  ): boolean {
    if (!facility.operating_hours) {
      return true; // 24/7 operation
    }

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const dayOfWeek = startTime.getDay();

    const daySchedule = facility.operating_hours[dayOfWeek];
    if (!daySchedule) {
      return false; // Closed on this day
    }

    if (daySchedule.is24Hours) {
      return true;
    }

    return startHour >= daySchedule.openHour && endHour <= daySchedule.closeHour;
  }

  private async checkFacilityAccess(userId: string, facilityId: string): Promise<boolean> {
    // Check if user has access credentials for this facility
    const { data: access } = await this.supabase
      .from('facility_access')
      .select('*')
      .eq('user_id', userId)
      .eq('facility_id', facilityId)
      .eq('is_active', true)
      .single();

    return !!access;
  }

  private async checkFacilityMaintenance(
    spotId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const { data: maintenance } = await this.supabase
      .from('facility_maintenance')
      .select('*')
      .eq('spot_id', spotId)
      .lte('start_time', endTime.toISOString())
      .gte('end_time', startTime.toISOString())
      .eq('is_active', true);

    return maintenance && maintenance.length > 0;
  }

  private calculateTieredPrice(tieredRates: any[], duration: number): number {
    let totalPrice = 0;
    let remainingDuration = duration;

    for (const tier of tieredRates.sort((a, b) => a.maxHours - b.maxHours)) {
      if (remainingDuration <= 0) break;

      const tierDuration = Math.min(remainingDuration, tier.maxHours);
      totalPrice += tierDuration * tier.rate;
      remainingDuration -= tierDuration;
    }

    return totalPrice;
  }

  private isPremiumTime(dateTime: Date): boolean {
    const hour = dateTime.getHours();
    const dayOfWeek = dateTime.getDay();

    // Premium times: weekday business hours
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 8 && hour <= 18;
  }

  private async getFloorPricingMultiplier(spotId: string): Promise<number> {
    const { data: spot } = await this.supabase
      .from('parking_spots')
      .select('floor_level')
      .eq('id', spotId)
      .single();

    if (!spot || !spot.floor_level) {
      return 1.0; // No floor-based pricing
    }

    // Ground floor and first floor are premium (closer to exit)
    const floorLevel = typeof spot.floor_level === 'number' ? spot.floor_level : 1;
    if (floorLevel <= 1) {
      return 1.2; // 20% premium
    } else if (floorLevel >= 5) {
      return 0.9; // 10% discount for higher floors
    }

    return 1.0; // Standard pricing for floors 2-4
  }
}