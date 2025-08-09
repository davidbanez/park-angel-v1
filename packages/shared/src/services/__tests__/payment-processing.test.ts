import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { PaymentProcessingServiceImpl } from '../payment-processing';
import { RevenueShareServiceImpl } from '../revenue-sharing';
import { PayoutServiceImpl } from '../payout-processing';
import {
  PaymentProvider,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  PayoutStatus,
} from '../../types/payment';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: mockPaymentIntent, error: null }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: mockPaymentIntent, error: null })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [mockPaymentTransaction], error: null }))
        }))
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({ data: [mockRevenueShare], error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockPaymentIntent, error: null }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
  }))
} as any;

// Mock data
const mockPaymentIntent = {
  id: 'pi_test_123',
  booking_id: 'booking_123',
  user_id: 'user_123',
  amount: 100.00,
  currency: 'PHP',
  provider: PaymentProvider.PARK_ANGEL,
  client_secret: 'pi_test_123_secret',
  status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
  metadata: {},
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockPaymentTransaction = {
  id: 'txn_test_123',
  booking_id: 'booking_123',
  user_id: 'user_123',
  amount: 100.00,
  currency: 'PHP',
  status: PaymentTransactionStatus.SUCCEEDED,
  provider: PaymentProvider.PARK_ANGEL,
  provider_transaction_id: 'pa_123',
  payment_method_id: null,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  processed_at: new Date().toISOString(),
  failed_at: null,
  refunded_at: null,
};

const mockRevenueShare = {
  id: 'rs_test_123',
  transaction_id: 'txn_test_123',
  operator_id: 'operator_123',
  host_id: null,
  total_amount: 100.00,
  park_angel_share: 30.00,
  operator_share: 70.00,
  host_share: null,
  share_percentage: 30,
  calculated_at: new Date().toISOString(),
};

const mockPayout = {
  id: 'payout_test_123',
  recipient_id: 'operator_123',
  recipient_type: 'operator',
  amount: 70.00,
  currency: 'PHP',
  status: PayoutStatus.PENDING,
  bank_account_id: 'bank_123',
  transaction_ids: ['txn_test_123'],
  metadata: {},
  created_at: new Date().toISOString(),
  processed_at: null,
  failed_at: null,
};

describe('PaymentProcessingService', () => {
  let paymentService: PaymentProcessingServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    paymentService = new PaymentProcessingServiceImpl(mockSupabase);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const params = {
        bookingId: 'booking_123',
        userId: 'user_123',
        amount: 100.00,
        currency: 'PHP',
        metadata: { test: 'data' },
      };

      const result = await paymentService.createPaymentIntent(params);

      expect(result).toBeDefined();
      expect(result.bookingId).toBe(params.bookingId);
      expect(result.userId).toBe(params.userId);
      expect(result.amount).toBe(params.amount);
      expect(result.currency).toBe(params.currency);
      expect(result.provider).toBe(PaymentProvider.PARK_ANGEL);
      expect(result.status).toBe(PaymentIntentStatus.REQUIRES_CONFIRMATION);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_intents');
    });

    it('should handle errors when creating payment intent', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'Database error' } }))
          }))
        }))
      });

      const params = {
        bookingId: 'booking_123',
        userId: 'user_123',
        amount: 100.00,
        currency: 'PHP',
      };

      await expect(paymentService.createPaymentIntent(params)).rejects.toThrow('Failed to store payment intent');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      // Mock payment intent retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockPaymentIntent, error: null }))
          }))
        }))
      });

      // Mock transaction insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockPaymentTransaction, error: null }))
          }))
        }))
      });

      // Mock payment intent update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      const result = await paymentService.confirmPayment('pi_test_123');

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentTransactionStatus.SUCCEEDED);
      expect(result.provider).toBe(PaymentProvider.PARK_ANGEL);
    });
  });

  describe('getPaymentHistory', () => {
    it('should retrieve payment history successfully', async () => {
      const result = await paymentService.getPaymentHistory('user_123', 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_transactions');
    });
  });
});

describe('RevenueShareService', () => {
  let revenueService: RevenueShareServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    revenueService = new RevenueShareServiceImpl(mockSupabase);
  });

  describe('calculateRevenueShare', () => {
    it('should calculate revenue share for street parking', async () => {
      // Mock transaction with location data
      const mockTransactionWithLocation = {
        ...mockPaymentTransaction,
        bookings: {
          parking_spots: {
            zones: {
              sections: {
                locations: {
                  type: 'street',
                  operator_id: 'operator_123'
                }
              }
            }
          }
        }
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockTransactionWithLocation, error: null }))
          }))
        }))
      });

      // Mock revenue share config
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { 
                parking_type: 'street',
                park_angel_percentage: 30,
                operator_percentage: 70,
                host_percentage: null
              }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock revenue share insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockRevenueShare, error: null }))
          }))
        }))
      });

      const result = await revenueService.calculateRevenueShare('txn_test_123');

      expect(result).toBeDefined();
      expect(result.totalAmount).toBe(100.00);
      expect(result.parkAngelShare).toBe(30.00);
      expect(result.operatorShare).toBe(70.00);
      expect(result.hostShare).toBeUndefined();
    });
  });

  describe('getOperatorEarnings', () => {
    it('should retrieve operator earnings successfully', async () => {
      const result = await revenueService.getOperatorEarnings('operator_123');

      expect(result).toBeDefined();
      expect(result.operatorId).toBe('operator_123');
      expect(typeof result.totalRevenue).toBe('number');
      expect(typeof result.operatorShare).toBe('number');
      expect(typeof result.parkAngelShare).toBe('number');
    });
  });
});

describe('PayoutService', () => {
  let payoutService: PayoutServiceImpl;
  let revenueService: RevenueShareServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    revenueService = new RevenueShareServiceImpl(mockSupabase);
    payoutService = new PayoutServiceImpl(mockSupabase, revenueService);
  });

  describe('createPayout', () => {
    it('should create payout successfully', async () => {
      // Mock bank account verification
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { 
                id: 'bank_123',
                owner_id: 'operator_123',
                is_verified: true 
              }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock payout insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockPayout, error: null }))
          }))
        }))
      });

      const params = {
        recipientId: 'operator_123',
        recipientType: 'operator' as const,
        amount: 70.00,
        currency: 'PHP',
        bankAccountId: 'bank_123',
        transactionIds: ['txn_test_123'],
      };

      const result = await payoutService.createPayout(params);

      expect(result).toBeDefined();
      expect(result.recipientId).toBe(params.recipientId);
      expect(result.amount).toBe(params.amount);
      expect(result.status).toBe(PayoutStatus.PENDING);
    });

    it('should reject payout for unverified bank account', async () => {
      // Mock unverified bank account
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { 
                id: 'bank_123',
                owner_id: 'operator_123',
                is_verified: false 
              }, 
              error: null 
            }))
          }))
        }))
      });

      const params = {
        recipientId: 'operator_123',
        recipientType: 'operator' as const,
        amount: 70.00,
        currency: 'PHP',
        bankAccountId: 'bank_123',
        transactionIds: ['txn_test_123'],
      };

      await expect(payoutService.createPayout(params)).rejects.toThrow('Bank account is not verified');
    });
  });

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      // Mock payout retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: {
                ...mockPayout,
                bank_accounts: {
                  id: 'bank_123',
                  bank_name: 'Test Bank'
                }
              }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock status update to processing
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      // Mock final status update to paid
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({ 
                data: { ...mockPayout, status: PayoutStatus.PAID }, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await payoutService.processPayout('payout_test_123');

      expect(result).toBeDefined();
      expect(result.status).toBe(PayoutStatus.PAID);
    });
  });

  describe('getPendingPayouts', () => {
    it('should retrieve pending payouts successfully', async () => {
      const result = await payoutService.getPendingPayouts();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('payouts');
    });
  });
});

describe('Integration Tests', () => {
  let paymentService: PaymentProcessingServiceImpl;
  let revenueService: RevenueShareServiceImpl;
  let payoutService: PayoutServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    paymentService = new PaymentProcessingServiceImpl(mockSupabase);
    revenueService = new RevenueShareServiceImpl(mockSupabase);
    payoutService = new PayoutServiceImpl(mockSupabase, revenueService);
  });

  it('should handle complete payment to payout flow', async () => {
    // 1. Create payment intent
    const paymentIntentParams = {
      bookingId: 'booking_123',
      userId: 'user_123',
      amount: 100.00,
      currency: 'PHP',
    };

    const paymentIntent = await paymentService.createPaymentIntent(paymentIntentParams);
    expect(paymentIntent).toBeDefined();

    // 2. Confirm payment (this would trigger revenue share calculation in real scenario)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockPaymentIntent, error: null }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockPaymentTransaction, error: null }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    });

    const transaction = await paymentService.confirmPayment(paymentIntent.id);
    expect(transaction.status).toBe(PaymentTransactionStatus.SUCCEEDED);

    // 3. Calculate revenue share
    const mockTransactionWithLocation = {
      ...mockPaymentTransaction,
      bookings: {
        parking_spots: {
          zones: {
            sections: {
              locations: {
                type: 'street',
                operator_id: 'operator_123'
              }
            }
          }
        }
      }
    };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockTransactionWithLocation, error: null }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ 
            data: { 
              parking_type: 'street',
              park_angel_percentage: 30,
              operator_percentage: 70,
              host_percentage: null
            }, 
            error: null 
          }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockRevenueShare, error: null }))
        }))
      }))
    });

    const revenueShare = await revenueService.calculateRevenueShare(transaction.id);
    expect(revenueShare.operatorShare).toBe(70.00);

    // 4. Create payout
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ 
            data: { 
              id: 'bank_123',
              owner_id: 'operator_123',
              is_verified: true 
            }, 
            error: null 
          }))
        }))
      }))
    });

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockPayout, error: null }))
        }))
      }))
    });

    const payout = await payoutService.createPayout({
      recipientId: 'operator_123',
      recipientType: 'operator',
      amount: 70.00,
      currency: 'PHP',
      bankAccountId: 'bank_123',
      transactionIds: [transaction.id],
    });

    expect(payout.amount).toBe(70.00);
    expect(payout.status).toBe(PayoutStatus.PENDING);
  });
});