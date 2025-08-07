// Payment-related type definitions
export interface PricingConfig {
  id: string;
  baseRate: number;
  vehicleTypeRates: VehicleTypeRate[];
  timeBasedRates: TimeBasedRate[];
  holidayRates: HolidayRate[];
  occupancyMultiplier: number;
  vatRate: number;
  discounts: DiscountRule[];
}

export interface VehicleTypeRate {
  vehicleType: string;
  rate: number;
}

export interface TimeBasedRate {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  rate: number;
}

export interface HolidayRate {
  name: string;
  date: Date;
  rate: number;
  isRecurring: boolean;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'senior' | 'pwd' | 'custom';
  percentage: number;
  isVATExempt: boolean;
  conditions: DiscountCondition[];
}

export interface DiscountCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
}