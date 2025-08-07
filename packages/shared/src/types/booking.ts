// Booking-related type definitions
export interface Booking {
  id: string;
  userId: string;
  spotId: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  amount: number;
  discounts: AppliedDiscount[];
  vatAmount: number;
  totalAmount: number;
}

export interface AppliedDiscount {
  id: string;
  type: 'senior' | 'pwd' | 'custom';
  name: string;
  percentage: number;
  amount: number;
  isVATExempt: boolean;
}
