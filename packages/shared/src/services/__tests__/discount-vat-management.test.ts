import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { DiscountVATManagementService } from '../discount-vat-management';
import { DiscountRule, VATCalculator } from '../../models/discount';
import { Money, Percentage } from '../../models/value-objects';

// Mock Supabase client
const createMockSupabase = () => {
  const mockChain = {
    select: vi.fn(() => mockChain),
    insert: vi.fn(() => mockChain),
    update: vi.fn(() => mockChain),
    delete: vi.fn(() => mockChain),
    eq: vi.fn(() => mockChain),
    or: vi.fn(() => mockChain),
    is: vi.fn(() => mockChain),
    gte: vi.fn(() => mockChain),
    lte: vi.fn(() => mockChain),
    order: vi.fn(() => mockChain),
    limit: vi.fn(() => mockChain),
    neq: vi.fn(() => mockChain),
    single: vi.fn(),
    mockResolvedValue: vi.fn()
  };

  return {
    from: vi.fn(() => mockChain)
  };
};

const mockSupabase = createMockSupabase();

describe('DiscountVATManagementService', () => {
  let service: DiscountVATManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DiscountVATManagementService(mockSupabase as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Discount Rule Management', () => {
    it('should create a discount rule successfully', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Senior Citizen Discount',
        type: 'senior',
        percentage: 20,
        is_vat_exempt: true,
        conditions: '[]',
        operator_id: null,
        is_active: true,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValue({
        data: mockRule,
        error: null
      });

      const result = await service.createDiscountRule({
        name: 'Senior Citizen Discount',
        type: 'senior',
        percentage: 20,
        isVATExempt: true,
        conditions: [],
        createdBy: 'user-1'
      });

      expect(result).toBeInstanceOf(DiscountRule);
      expect(result.name).toBe('Senior Citizen Discount');
      expect(result.type).toBe('senior');
      expect(result.percentage.value).toBe(20);
      expect(result.isVATExempt).toBe(true);
    });

    it('should handle discount rule creation errors', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(service.createDiscountRule({
        name: 'Test Discount',
        type: 'custom',
        percentage: 10,
        isVATExempt: false,
        createdBy: 'user-1'
      })).rejects.toThrow('Failed to create discount rule: Database error');
    });

    it('should update a discount rule successfully', async () => {
      const existingRule = {
        id: 'rule-1',
        name: 'Old Name',
        type: 'custom',
        percentage: 10,
        is_vat_exempt: false,
        conditions: '[]',
        operator_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedRule = {
        ...existingRule,
        name: 'New Name',
        percentage: 15,
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: existingRule,
        error: null
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedRule,
        error: null
      });

      const result = await service.updateDiscountRule('rule-1', {
        name: 'New Name',
        percentage: 15
      }, 'user-1');

      expect(result.name).toBe('New Name');
      expect(result.percentage.value).toBe(15);
    });

    it('should delete a discount rule successfully', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        error: null
      });

      await expect(service.deleteDiscountRule('rule-1')).resolves.not.toThrow();
    });

    it('should fetch discount rules with operator filter', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: 'Senior Discount',
          type: 'senior',
          percentage: 20,
          is_vat_exempt: true,
          conditions: '[]',
          operator_id: 'op-1',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockSupabase.from().select().eq().or.mockResolvedValue({
        data: mockRules,
        error: null
      });

      const result = await service.getDiscountRules('op-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(DiscountRule);
      expect(result[0].name).toBe('Senior Discount');
    });
  });

  describe('VAT Configuration Management', () => {
    it('should create VAT configuration successfully', async () => {
      const mockVATConfig = {
        id: 'vat-1',
        name: 'Standard VAT',
        rate: 12,
        is_default: true,
        operator_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock the unset default operation
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockVATConfig,
        error: null
      });

      const result = await service.createVATConfig({
        name: 'Standard VAT',
        rate: 12,
        isDefault: true
      });

      expect(result.name).toBe('Standard VAT');
      expect(result.rate).toBe(12);
      expect(result.isDefault).toBe(true);
    });

    it('should get default VAT configuration', async () => {
      const mockVATConfig = {
        id: 'vat-1',
        name: 'Default VAT',
        rate: 12,
        is_default: true,
        operator_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().select().eq().eq().or().order().limit().single.mockResolvedValue({
        data: mockVATConfig,
        error: null
      });

      const result = await service.getDefaultVATConfig();

      expect(result).not.toBeNull();
      expect(result!.rate).toBe(12);
      expect(result!.isDefault).toBe(true);
    });

    it('should return default Philippine VAT when no config found', async () => {
      mockSupabase.from().select().eq().eq().or().order().limit().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      });

      const result = await service.getDefaultVATConfig();

      expect(result).not.toBeNull();
      expect(result!.rate).toBe(12);
      expect(result!.name).toBe('Default VAT');
    });
  });

  describe('Document Verification Management', () => {
    it('should submit verification document successfully', async () => {
      const mockDocument = {
        id: 'doc-1',
        user_id: 'user-1',
        discount_type: 'senior',
        document_type: 'senior_id',
        document_url: 'https://example.com/doc.pdf',
        status: 'pending',
        expiry_date: null,
        verified_by: null,
        verified_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockDocument,
        error: null
      });

      const result = await service.submitDiscountVerificationDocument({
        userId: 'user-1',
        discountType: 'senior',
        documentType: 'senior_id',
        documentUrl: 'https://example.com/doc.pdf'
      });

      expect(result.userId).toBe('user-1');
      expect(result.discountType).toBe('senior');
      expect(result.status).toBe('pending');
    });

    it('should verify discount document successfully', async () => {
      const mockVerifiedDocument = {
        id: 'doc-1',
        user_id: 'user-1',
        discount_type: 'senior',
        document_type: 'senior_id',
        document_url: 'https://example.com/doc.pdf',
        status: 'approved',
        verified_by: 'admin-1',
        verified_at: new Date().toISOString(),
        notes: 'Document verified successfully',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock the user profile update
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { discount_eligibility: [] },
        error: null
      });

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockVerifiedDocument,
        error: null
      });

      const result = await service.verifyDiscountDocument(
        'doc-1',
        'admin-1',
        'approved',
        'Document verified successfully'
      );

      expect(result.status).toBe('approved');
      expect(result.verifiedBy).toBe('admin-1');
      expect(result.notes).toBe('Document verified successfully');
    });

    it('should get pending verification documents', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          user_id: 'user-1',
          discount_type: 'senior',
          document_type: 'senior_id',
          document_url: 'https://example.com/doc1.pdf',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'doc-2',
          user_id: 'user-2',
          discount_type: 'pwd',
          document_type: 'pwd_id',
          document_url: 'https://example.com/doc2.pdf',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockDocuments,
        error: null
      });

      const result = await service.getPendingVerificationDocuments();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('pending');
    });
  });

  describe('Discount Application Workflow', () => {
    it('should apply discount to booking successfully', async () => {
      // Mock discount rules
      const mockRules = [
        {
          id: 'rule-1',
          name: 'Senior Discount',
          type: 'senior',
          percentage: 20,
          is_vat_exempt: true,
          conditions: '[]',
          operator_id: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock VAT config
      const mockVATConfig = {
        id: 'vat-1',
        name: 'Default VAT',
        rate: 12,
        is_default: true,
        operator_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock discount application record
      const mockDiscountApp = {
        id: 'app-1',
        booking_id: 'booking-1',
        discount_rule_id: 'rule-1',
        original_amount: 100,
        discount_amount: 20,
        final_amount: 80,
        vat_exempted: true,
        applied_by: 'user-1',
        created_at: new Date().toISOString()
      };

      // Setup mocks
      mockSupabase.from().select().eq().or.mockResolvedValue({
        data: mockRules,
        error: null
      });

      mockSupabase.from().select().eq().eq().or().order().limit().single.mockResolvedValue({
        data: mockVATConfig,
        error: null
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockDiscountApp,
        error: null
      });

      const userContext = {
        userId: 'user-1',
        age: 65,
        hasPWDId: false
      };

      const result = await service.applyDiscountToBooking(
        'booking-1',
        100,
        userContext,
        'user-1'
      );

      expect(result.originalAmount.value).toBe(100);
      expect(result.appliedDiscounts).toHaveLength(1);
      expect(result.appliedDiscounts[0].amount.value).toBe(20);
    });

    it('should record discount application', async () => {
      const mockDiscountApp = {
        id: 'app-1',
        booking_id: 'booking-1',
        discount_rule_id: 'rule-1',
        original_amount: 100,
        discount_amount: 20,
        final_amount: 80,
        vat_exempted: true,
        applied_by: 'user-1',
        verification_document_url: null,
        created_at: new Date().toISOString()
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockDiscountApp,
        error: null
      });

      const result = await service.recordDiscountApplication({
        bookingId: 'booking-1',
        discountRuleId: 'rule-1',
        originalAmount: 100,
        discountAmount: 20,
        finalAmount: 80,
        vatExempted: true,
        appliedBy: 'user-1'
      });

      expect(result.bookingId).toBe('booking-1');
      expect(result.discountAmount).toBe(20);
      expect(result.vatExempted).toBe(true);
    });
  });

  describe('Analytics and Reporting', () => {
    it('should generate discount analytics', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          discount_amount: '20.00',
          original_amount: '100.00',
          vat_exempted: true,
          created_at: '2024-01-01T00:00:00Z',
          discount_rules: {
            name: 'Senior Discount',
            type: 'senior'
          },
          discount_rule_id: 'rule-1'
        },
        {
          id: 'app-2',
          discount_amount: '15.00',
          original_amount: '150.00',
          vat_exempted: false,
          created_at: '2024-01-02T00:00:00Z',
          discount_rules: {
            name: 'PWD Discount',
            type: 'pwd'
          },
          discount_rule_id: 'rule-2'
        }
      ];

      mockSupabase.from().select().mockResolvedValue({
        data: mockApplications,
        error: null
      });

      const result = await service.getDiscountAnalytics();

      expect(result.totalDiscountsApplied).toBe(2);
      expect(result.totalDiscountAmount).toBe(35);
      expect(result.vatExemptTransactions).toBe(1);
      expect(result.vatExemptAmount).toBe(20);
      expect(result.discountsByType.senior).toBeDefined();
      expect(result.discountsByType.pwd).toBeDefined();
    });

    it('should generate discount usage report', async () => {
      const mockApplications = [
        {
          created_at: '2024-01-01T00:00:00Z',
          discount_amount: '20.00',
          original_amount: '100.00',
          discount_rules: {
            name: 'Senior Discount',
            type: 'senior'
          }
        },
        {
          created_at: '2024-01-01T00:00:00Z',
          discount_amount: '15.00',
          original_amount: '150.00',
          discount_rules: {
            name: 'Senior Discount',
            type: 'senior'
          }
        }
      ];

      mockSupabase.from().select().mockResolvedValue({
        data: mockApplications,
        error: null
      });

      const result = await service.getDiscountUsageReport();

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].discountType).toBe('senior');
      expect(result[0].usageCount).toBe(2);
      expect(result[0].totalDiscountAmount).toBe(35);
      expect(result[0].totalOriginalAmount).toBe(250);
      expect(result[0].savingsPercentage).toBe(14);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(service.getDiscountRuleById('rule-1')).resolves.toBeNull();
    });

    it('should handle missing discount rule in update', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      });

      await expect(service.updateDiscountRule('rule-1', { name: 'New Name' }, 'user-1'))
        .rejects.toThrow('Discount rule not found');
    });
  });
});