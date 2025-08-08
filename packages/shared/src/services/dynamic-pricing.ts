import { createClient } from '@supabase/supabase-js';
import { PricingConfig, HierarchicalPricingResolver, PricingCalculation } from '../models/pricing';
import { VehicleType } from '../types';
import { Money } from '../models/value-objects';
import { 
  DynamicPricingService, 
  PriceCalculationRequest, 
  PriceCalculationResult, 
  HierarchyLevel 
} from './parking-management';

export class DynamicPricingServiceImpl implements DynamicPricingService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    // Get effective pricing configuration for the spot
    const effectivePricing = await this.getEffectivePricing(request.spotId);
    
    // Get current occupancy rate for dynamic pricing
    const occupancyRate = await this.getLocationOccupancyRate(request.spotId);
    
    // Calculate duration in minutes
    const durationInMinutes = (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60);
    
    // Calculate base pricing
    const pricingCalculation = effectivePricing.calculateRate({
      vehicleType: request.vehicleType,
      startTime: request.startTime,
      durationInMinutes,
      occupancyRate
    });

    // Apply user-specific discounts if userId provided
    let discounts: any[] = [];
    let discountAmount = 0;
    
    if (request.userId) {
      discounts = await this.getUserApplicableDiscounts(request.userId);
      discountAmount = this.calculateDiscountAmount(pricingCalculation.subtotal.value, discounts);
    }

    // Calculate final amounts
    const basePrice = pricingCalculation.subtotal.value;
    const discountedPrice = Math.max(0, basePrice - discountAmount);
    
    // Calculate VAT (12% in Philippines, but exempt for certain discounts)
    const isVATExempt = discounts.some(d => d.isVATExempt);
    const vatRate = isVATExempt ? 0 : 0.12;
    const vatAmount = discountedPrice * vatRate;
    
    const totalAmount = discountedPrice + vatAmount;

    return {
      basePrice,
      finalPrice: discountedPrice,
      discounts,
      vatAmount,
      totalAmount,
      breakdown: {
        hourlyRate: pricingCalculation.hourlyRate.value,
        duration: pricingCalculation.durationInHours,
        subtotal: basePrice,
        occupancyMultiplier: occupancyRate ? this.getOccupancyMultiplier(occupancyRate) : 1,
        vehicleTypeAdjustment: pricingCalculation.appliedVehicleTypeRate,
        timeBasedAdjustment: pricingCalculation.appliedTimeBasedRate,
        holidayAdjustment: pricingCalculation.appliedHolidayRate,
        discounts,
        vatAmount,
        totalAmount
      }
    };
  }

  async updatePricing(hierarchyLevel: HierarchyLevel, id: string, pricing: PricingConfig): Promise<void> {
    const tableName = this.getTableNameForHierarchy(hierarchyLevel);
    
    const { error } = await this.supabase
      .from(tableName)
      .update({
        pricing_config: pricing.toJSON(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to update pricing: ${error.message}`);
  }

  async getPricing(hierarchyLevel: HierarchyLevel, id: string): Promise<PricingConfig | null> {
    const tableName = this.getTableNameForHierarchy(hierarchyLevel);
    
    const { data, error } = await this.supabase
      .from(tableName)
      .select('pricing_config')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get pricing: ${error.message}`);
    }

    return data.pricing_config ? PricingConfig.create(data.pricing_config) : null;
  }

  async getEffectivePricing(spotId: string): Promise<PricingConfig> {
    // Get the full hierarchy for the spot to resolve pricing
    const { data, error } = await this.supabase
      .from('parking_spots')
      .select(`
        pricing_config,
        zones!inner (
          pricing_config,
          sections!inner (
            pricing_config,
            locations!inner (
              pricing_config
            )
          )
        )
      `)
      .eq('id', spotId)
      .single();

    if (error) throw new Error(`Failed to get spot hierarchy: ${error.message}`);

    // Resolve hierarchical pricing (spot > zone > section > location)
    const locationPricing = data.zones.sections.locations.pricing_config 
      ? PricingConfig.create(data.zones.sections.locations.pricing_config) 
      : undefined;
    
    const sectionPricing = data.zones.sections.pricing_config 
      ? PricingConfig.create(data.zones.sections.pricing_config) 
      : undefined;
    
    const zonePricing = data.zones.pricing_config 
      ? PricingConfig.create(data.zones.pricing_config) 
      : undefined;
    
    const spotPricing = data.pricing_config 
      ? PricingConfig.create(data.pricing_config) 
      : undefined;

    return HierarchicalPricingResolver.resolvePricing(
      locationPricing,
      sectionPricing,
      zonePricing,
      spotPricing
    );
  }

  private async getLocationOccupancyRate(spotId: string): Promise<number> {
    // Get location ID for the spot
    const { data: spotData, error: spotError } = await this.supabase
      .from('parking_spots')
      .select(`
        zones!inner (
          sections!inner (
            locations!inner (
              id
            )
          )
        )
      `)
      .eq('id', spotId)
      .single();

    if (spotError) return 0;

    const locationId = spotData.zones.sections.locations.id;

    // Get occupancy statistics for the location
    const { data: occupancyData, error: occupancyError } = await this.supabase
      .from('parking_spots')
      .select(`
        status,
        zones!inner (
          sections!inner (
            locations!inner (
              id
            )
          )
        )
      `)
      .eq('zones.sections.locations.id', locationId);

    if (occupancyError) return 0;

    const totalSpots = occupancyData.length;
    const occupiedSpots = occupancyData.filter(s => 
      s.status === 'occupied' || s.status === 'reserved'
    ).length;

    return totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;
  }

  private async getUserApplicableDiscounts(userId: string): Promise<any[]> {
    // Get user's discount eligibility
    const { data: userProfile, error } = await this.supabase
      .from('user_profiles')
      .select('discount_eligibility')
      .eq('user_id', userId)
      .single();

    if (error || !userProfile) return [];

    const discounts: any[] = [];
    const eligibility = userProfile.discount_eligibility || [];

    // Senior Citizen discount (20% with VAT exemption)
    if (eligibility.includes('senior')) {
      discounts.push({
        type: 'senior',
        name: 'Senior Citizen Discount',
        percentage: 20,
        isVATExempt: true
      });
    }

    // PWD discount (20% with VAT exemption)
    if (eligibility.includes('pwd')) {
      discounts.push({
        type: 'pwd',
        name: 'Person with Disability Discount',
        percentage: 20,
        isVATExempt: true
      });
    }

    // Get custom discounts (could be from promotions, loyalty programs, etc.)
    const customDiscounts = await this.getCustomDiscounts(userId);
    discounts.push(...customDiscounts);

    return discounts;
  }

  private async getCustomDiscounts(userId: string): Promise<any[]> {
    // This would query a custom discounts table or promotional codes
    // For now, return empty array
    return [];
  }

  private calculateDiscountAmount(baseAmount: number, discounts: any[]): number {
    let totalDiscount = 0;
    
    for (const discount of discounts) {
      const discountAmount = (baseAmount * discount.percentage) / 100;
      totalDiscount += discountAmount;
    }

    return Math.min(totalDiscount, baseAmount); // Can't discount more than the base amount
  }

  private getOccupancyMultiplier(occupancyRate: number): number {
    if (occupancyRate >= 90) return 1.5; // 50% increase when 90%+ occupied
    if (occupancyRate >= 75) return 1.25; // 25% increase when 75%+ occupied
    if (occupancyRate >= 50) return 1.1; // 10% increase when 50%+ occupied
    if (occupancyRate <= 25) return 0.9; // 10% discount when 25% or less occupied
    return 1.0; // No adjustment for 26-49% occupancy
  }

  private getTableNameForHierarchy(level: HierarchyLevel): string {
    switch (level) {
      case 'location': return 'locations';
      case 'section': return 'sections';
      case 'zone': return 'zones';
      case 'spot': return 'parking_spots';
      default: throw new Error(`Invalid hierarchy level: ${level}`);
    }
  }
}

// Advanced pricing strategies
export class PricingStrategies {
  static calculateDemandBasedPricing(
    basePrice: number,
    currentDemand: number,
    historicalDemand: number,
    timeOfDay: number,
    dayOfWeek: number
  ): number {
    let multiplier = 1.0;

    // Demand-based adjustment
    const demandRatio = currentDemand / historicalDemand;
    if (demandRatio > 1.5) multiplier *= 1.3; // High demand
    else if (demandRatio > 1.2) multiplier *= 1.15; // Medium-high demand
    else if (demandRatio < 0.7) multiplier *= 0.9; // Low demand

    // Time-of-day adjustment
    if (timeOfDay >= 7 && timeOfDay <= 9) multiplier *= 1.2; // Morning rush
    else if (timeOfDay >= 17 && timeOfDay <= 19) multiplier *= 1.2; // Evening rush
    else if (timeOfDay >= 22 || timeOfDay <= 6) multiplier *= 0.8; // Night discount

    // Day-of-week adjustment
    if (dayOfWeek === 0 || dayOfWeek === 6) multiplier *= 0.9; // Weekend discount
    else if (dayOfWeek >= 1 && dayOfWeek <= 5) multiplier *= 1.05; // Weekday premium

    return Math.round(basePrice * multiplier * 100) / 100;
  }

  static calculateEventBasedPricing(
    basePrice: number,
    nearbyEvents: Array<{
      distance: number; // in meters
      capacity: number;
      startTime: Date;
      endTime: Date;
    }>,
    currentTime: Date
  ): number {
    let multiplier = 1.0;

    for (const event of nearbyEvents) {
      // Check if event is happening now or soon
      const timeUntilEvent = event.startTime.getTime() - currentTime.getTime();
      const timeAfterEvent = currentTime.getTime() - event.endTime.getTime();

      // Event is happening or starting within 2 hours
      if (timeUntilEvent <= 2 * 60 * 60 * 1000 && timeAfterEvent <= 0) {
        // Distance-based impact (closer events have more impact)
        const distanceMultiplier = Math.max(0.1, 1 - (event.distance / 1000)); // 1km max impact
        
        // Capacity-based impact (larger events have more impact)
        const capacityMultiplier = Math.min(2.0, 1 + (event.capacity / 10000)); // Max 2x for 10k+ capacity
        
        multiplier *= (1 + (distanceMultiplier * capacityMultiplier * 0.5));
      }
    }

    return Math.round(basePrice * multiplier * 100) / 100;
  }

  static calculateWeatherBasedPricing(
    basePrice: number,
    weatherConditions: {
      temperature: number; // Celsius
      precipitation: number; // mm/hour
      windSpeed: number; // km/h
      condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    }
  ): number {
    let multiplier = 1.0;

    // Rain increases demand for covered parking
    if (weatherConditions.precipitation > 0) {
      multiplier *= 1.1 + (weatherConditions.precipitation * 0.02);
    }

    // Extreme temperatures increase demand
    if (weatherConditions.temperature > 35 || weatherConditions.temperature < 15) {
      multiplier *= 1.1;
    }

    // Strong winds increase demand for covered parking
    if (weatherConditions.windSpeed > 30) {
      multiplier *= 1.05;
    }

    // Storm conditions significantly increase demand
    if (weatherConditions.condition === 'stormy') {
      multiplier *= 1.3;
    }

    return Math.round(basePrice * multiplier * 100) / 100;
  }

  static calculateLoyaltyDiscount(
    basePrice: number,
    userLoyaltyLevel: 'bronze' | 'silver' | 'gold' | 'platinum',
    totalBookings: number,
    totalSpent: number
  ): number {
    let discount = 0;

    // Base loyalty discount
    switch (userLoyaltyLevel) {
      case 'bronze': discount = 0.02; break; // 2%
      case 'silver': discount = 0.05; break; // 5%
      case 'gold': discount = 0.08; break; // 8%
      case 'platinum': discount = 0.12; break; // 12%
    }

    // Additional discount for high-value customers
    if (totalSpent > 10000) discount += 0.03; // Additional 3%
    if (totalBookings > 100) discount += 0.02; // Additional 2%

    const discountAmount = basePrice * discount;
    return Math.round((basePrice - discountAmount) * 100) / 100;
  }
}

// Pricing analytics and optimization
export class PricingAnalytics {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async analyzePricingPerformance(locationId: string, dateRange: { start: Date; end: Date }) {
    // Get booking data for the period
    const { data: bookings, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        parking_spots!inner (
          zones!inner (
            sections!inner (
              locations!inner (
                id
              )
            )
          )
        )
      `)
      .eq('parking_spots.zones.sections.locations.id', locationId)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (error) throw new Error(`Failed to get booking data: ${error.message}`);

    // Calculate metrics
    const totalRevenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.total_amount), 0);
    const averageBookingValue = totalRevenue / bookings.length;
    const occupancyRate = await this.calculateAverageOccupancy(locationId, dateRange);
    
    // Price elasticity analysis
    const pricePoints = this.groupBookingsByPriceRange(bookings);
    const demandByPrice = this.calculateDemandByPrice(pricePoints);
    
    return {
      totalRevenue,
      totalBookings: bookings.length,
      averageBookingValue,
      occupancyRate,
      priceElasticity: this.calculatePriceElasticity(demandByPrice),
      optimalPriceRange: this.findOptimalPriceRange(demandByPrice),
      recommendations: this.generatePricingRecommendations(demandByPrice, occupancyRate)
    };
  }

  private async calculateAverageOccupancy(locationId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    // This would require more complex time-series analysis
    // For now, return a simplified calculation
    return 65; // 65% average occupancy
  }

  private groupBookingsByPriceRange(bookings: any[]): Map<string, any[]> {
    const priceRanges = new Map();
    
    for (const booking of bookings) {
      const price = parseFloat(booking.total_amount);
      const range = this.getPriceRange(price);
      
      if (!priceRanges.has(range)) {
        priceRanges.set(range, []);
      }
      priceRanges.get(range).push(booking);
    }
    
    return priceRanges;
  }

  private getPriceRange(price: number): string {
    if (price < 50) return '0-50';
    if (price < 100) return '50-100';
    if (price < 150) return '100-150';
    if (price < 200) return '150-200';
    return '200+';
  }

  private calculateDemandByPrice(pricePoints: Map<string, any[]>): Array<{ range: string; demand: number; revenue: number }> {
    const result = [];
    
    for (const [range, bookings] of pricePoints) {
      const demand = bookings.length;
      const revenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.total_amount), 0);
      result.push({ range, demand, revenue });
    }
    
    return result.sort((a, b) => a.range.localeCompare(b.range));
  }

  private calculatePriceElasticity(demandByPrice: Array<{ range: string; demand: number; revenue: number }>): number {
    // Simplified price elasticity calculation
    // In practice, this would use more sophisticated econometric methods
    if (demandByPrice.length < 2) return 0;
    
    const highPrice = demandByPrice[demandByPrice.length - 1];
    const lowPrice = demandByPrice[0];
    
    const priceChange = (200 - 25) / 25; // Approximate price change
    const demandChange = (highPrice.demand - lowPrice.demand) / lowPrice.demand;
    
    return demandChange / priceChange;
  }

  private findOptimalPriceRange(demandByPrice: Array<{ range: string; demand: number; revenue: number }>): string {
    // Find the price range with the highest revenue
    return demandByPrice.reduce((optimal, current) => 
      current.revenue > optimal.revenue ? current : optimal
    ).range;
  }

  private generatePricingRecommendations(
    demandByPrice: Array<{ range: string; demand: number; revenue: number }>,
    occupancyRate: number
  ): string[] {
    const recommendations = [];
    
    if (occupancyRate > 80) {
      recommendations.push('Consider increasing prices during peak hours due to high occupancy');
    } else if (occupancyRate < 50) {
      recommendations.push('Consider promotional pricing to increase occupancy');
    }
    
    const elasticity = this.calculatePriceElasticity(demandByPrice);
    if (elasticity < -1) {
      recommendations.push('Demand is elastic - small price decreases could significantly increase bookings');
    } else if (elasticity > -0.5) {
      recommendations.push('Demand is inelastic - price increases may not significantly reduce bookings');
    }
    
    return recommendations;
  }
}