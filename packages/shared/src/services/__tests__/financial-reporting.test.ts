import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  FinancialReportingServiceImpl,
  AutomatedRemittanceServiceImpl,
  CommissionSystemServiceImpl,
  TransactionReconciliationServiceImpl
} from '../index';
import { 
  FinancialReportType,
  RemittanceFrequency,
  RemittanceStatus,
  ExportFormat,
  DiscrepancyType,
  ReconciliationRuleType
} from '../../types/financial-reporting';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }))
} as any;

// Mock services
const mockRevenueShareService = {
  getOperatorEarnings: vi.fn(),
  getHostEarnings: vi.fn(),
  getParkAngelRevenue: vi.fn()
} as any;

const mockPayoutService = {
  createPayout: vi.fn(),
  processPayout: vi.fn(),
  getPayoutHistory: vi.fn()
} as any;

describe('Financial Reporting System', () => {
  let financialReportingService: FinancialReportingServiceImpl;
  let automatedRemittanceService: AutomatedRemittanceServiceImpl;
  let commissionSystemService: CommissionSystemServiceImpl;
  let transactionReconciliationService: TransactionReconciliationServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    
    financialReportingService = new FinancialReportingServiceImpl(
      mockSupabase,
      mockRevenueShareService,
      mockPayoutService
    );
    
    automatedRemittanceService = new AutomatedRemittanceServiceImpl(
      mockSupabase,
      mockRevenueShareService,
      mockPayoutService,
      financialReportingService
    );
    
    commissionSystemService = new CommissionSystemServiceImpl(
      mockSupabase,
      financialReportingService
    );
    
    transactionReconciliationService = new TransactionReconciliationServiceImpl(
      mockSupabase,
      financialReportingService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FinancialReportingService', () => {
    it('should generate operator revenue report', async () => {
      const operatorId = 'operator-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock revenue share service response
      mockRevenueShareService.getOperatorEarnings.mockResolvedValue({
        operatorId,
        totalRevenue: 10000,
        operatorShare: 7000,
        parkAngelShare: 3000,
        transactionCount: 50,
        period: { startDate, endDate },
        breakdown: {
          streetParking: 4000,
          facilityParking: 3000
        }
      });

      // Mock database responses
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [
                    {
                      id: 'rs-1',
                      transaction_id: 'tx-1',
                      total_amount: 100,
                      operator_share: 70,
                      park_angel_share: 30,
                      calculated_at: new Date(),
                      payment_transactions: {
                        id: 'tx-1',
                        amount: 100,
                        bookings: {
                          id: 'booking-1',
                          parking_spots: {
                            zones: {
                              sections: {
                                locations: {
                                  name: 'Test Location',
                                  type: 'street'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      const report = await financialReportingService.generateOperatorRevenueReport(
        operatorId,
        startDate,
        endDate
      );

      expect(report.operatorId).toBe(operatorId);
      expect(report.summary.totalRevenue).toBe(10000);
      expect(report.summary.operatorShare).toBe(7000);
      expect(report.summary.parkAngelShare).toBe(3000);
      expect(mockRevenueShareService.getOperatorEarnings).toHaveBeenCalledWith(
        operatorId,
        startDate,
        endDate
      );
    });

    it('should generate host revenue report', async () => {
      const hostId = 'host-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockRevenueShareService.getHostEarnings.mockResolvedValue({
        hostId,
        totalRevenue: 5000,
        hostShare: 3000,
        parkAngelShare: 2000,
        transactionCount: 25,
        period: { startDate, endDate },
        breakdown: {
          hostedParking: 3000
        }
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      const report = await financialReportingService.generateHostRevenueReport(
        hostId,
        startDate,
        endDate
      );

      expect(report.hostId).toBe(hostId);
      expect(report.summary.totalRevenue).toBe(5000);
      expect(report.summary.hostShare).toBe(3000);
      expect(report.summary.parkAngelShare).toBe(2000);
    });

    it('should export report to different formats', async () => {
      const reportId = 'report-123';
      
      // Mock report data
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: reportId,
                type: FinancialReportType.OPERATOR_REVENUE,
                title: 'Test Report',
                generated_by: 'user-123',
                data: { test: 'data' }
              },
              error: null
            }))
          }))
        }))
      });

      const exportResult = await financialReportingService.exportReport(
        reportId,
        ExportFormat.PDF
      );

      expect(exportResult.fileName).toContain('.pdf');
      expect(exportResult.mimeType).toBe('application/pdf');
    });
  });

  describe('AutomatedRemittanceService', () => {
    it('should create remittance schedule', async () => {
      const scheduleData = {
        recipientId: 'operator-123',
        recipientType: 'operator' as const,
        frequency: RemittanceFrequency.WEEKLY,
        minimumAmount: 1000,
        bankAccountId: 'bank-123',
        isActive: true,
        nextRunDate: new Date('2024-02-01'),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'schedule-123', ...scheduleData },
              error: null
            }))
          }))
        }))
      });

      const schedule = await automatedRemittanceService.createRemittanceSchedule(scheduleData);

      expect(schedule.recipientId).toBe(scheduleData.recipientId);
      expect(schedule.frequency).toBe(scheduleData.frequency);
      expect(schedule.minimumAmount).toBe(scheduleData.minimumAmount);
    });

    it('should calculate next run date correctly', () => {
      const baseDate = new Date('2024-01-01');
      
      const dailyNext = automatedRemittanceService.calculateNextRunDate(
        RemittanceFrequency.DAILY,
        baseDate
      );
      expect(dailyNext.getDate()).toBe(2);

      const weeklyNext = automatedRemittanceService.calculateNextRunDate(
        RemittanceFrequency.WEEKLY,
        baseDate
      );
      expect(weeklyNext.getDate()).toBe(8);

      const monthlyNext = automatedRemittanceService.calculateNextRunDate(
        RemittanceFrequency.MONTHLY,
        baseDate
      );
      expect(monthlyNext.getMonth()).toBe(1); // February
    });

    it('should process remittance schedule', async () => {
      const scheduleId = 'schedule-123';
      
      // Mock schedule data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: scheduleId,
                recipient_id: 'operator-123',
                recipient_type: 'operator',
                frequency: 'weekly',
                minimum_amount: 1000,
                bank_account_id: 'bank-123',
                is_active: true,
                next_run_date: new Date(),
                last_run_date: null
              },
              error: null
            }))
          }))
        }))
      });

      // Mock earnings data
      mockRevenueShareService.getOperatorEarnings.mockResolvedValue({
        operatorShare: 1500,
        transactionCount: 10
      });

      // Mock revenue shares data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: [{ transaction_id: 'tx-1' }, { transaction_id: 'tx-2' }],
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock payout creation
      mockPayoutService.createPayout.mockResolvedValue({
        id: 'payout-123',
        amount: 1500
      });

      mockPayoutService.processPayout.mockResolvedValue({
        id: 'payout-123',
        status: 'paid'
      });

      const run = await automatedRemittanceService.processRemittanceSchedule(scheduleId);

      expect(run.scheduleId).toBe(scheduleId);
      expect(run.amount).toBe(1500);
      expect(run.status).toBe(RemittanceStatus.COMPLETED);
    });
  });

  describe('CommissionSystemService', () => {
    it('should create commission rule', async () => {
      const ruleData = {
        parkingType: 'hosted' as const,
        hostPercentage: 60,
        parkAngelPercentage: 40,
        effectiveDate: new Date(),
        isActive: true
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn()
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'rule-123', ...ruleData },
              error: null
            }))
          }))
        }))
      });

      const rule = await commissionSystemService.createCommissionRule(ruleData);

      expect(rule.parkingType).toBe('hosted');
      expect(rule.hostPercentage).toBe(60);
      expect(rule.parkAngelPercentage).toBe(40);
    });

    it('should calculate commission correctly', async () => {
      const transactionId = 'tx-123';
      const totalAmount = 1000;
      const parkingType = 'hosted';

      // Mock active commission rule
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              lte: vi.fn(() => ({
                or: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      single: vi.fn(() => ({
                        data: {
                          id: 'rule-123',
                          parking_type: 'hosted',
                          host_percentage: 60,
                          park_angel_percentage: 40,
                          effective_date: new Date(),
                          is_active: true
                        },
                        error: null
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const calculation = await commissionSystemService.calculateCommission(
        transactionId,
        totalAmount,
        parkingType
      );

      expect(calculation.transactionId).toBe(transactionId);
      expect(calculation.totalAmount).toBe(totalAmount);
      expect(calculation.hostShare).toBe(600); // 60% of 1000
      expect(calculation.parkAngelShare).toBe(400); // 40% of 1000
    });

    it('should reject invalid commission percentages', async () => {
      const ruleData = {
        parkingType: 'hosted' as const,
        hostPercentage: 70,
        parkAngelPercentage: 40, // Total = 110%, should fail
        effectiveDate: new Date(),
        isActive: true
      };

      await expect(
        commissionSystemService.createCommissionRule(ruleData)
      ).rejects.toThrow('Host and Park Angel percentages must add up to 100%');
    });
  });

  describe('TransactionReconciliationService', () => {
    it('should create reconciliation rule', async () => {
      const ruleData = {
        name: 'Amount Validation',
        description: 'Validates transaction amounts',
        ruleType: ReconciliationRuleType.AMOUNT_VALIDATION,
        conditions: [],
        actions: [],
        isActive: true
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'rule-123', ...ruleData },
              error: null
            }))
          }))
        }))
      });

      const rule = await transactionReconciliationService.createReconciliationRule(ruleData);

      expect(rule.name).toBe('Amount Validation');
      expect(rule.ruleType).toBe('amount_validation');
    });

    it('should run reconciliation and detect discrepancies', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock active rules
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [
                {
                  id: 'rule-123',
                  name: 'Amount Validation',
                  rule_type: 'amount_validation',
                  conditions: [],
                  actions: [],
                  is_active: true
                }
              ],
              error: null
            }))
          }))
        }))
      });

      // Mock rule execution
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'rule-123',
                name: 'Amount Validation',
                rule_type: 'amount_validation'
              },
              error: null
            }))
          }))
        }))
      });

      // Mock transactions with discrepancies
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [
                {
                  id: 'tx-1',
                  amount: 100,
                  revenue_shares: [
                    {
                      total_amount: 95 // Mismatch!
                    }
                  ]
                },
                {
                  id: 'tx-2',
                  amount: 200,
                  revenue_shares: [] // Missing revenue share!
                }
              ],
              error: null
            }))
          }))
        }))
      });

      const results = await transactionReconciliationService.runReconciliation(
        startDate,
        endDate
      );

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].discrepancies).toHaveLength(2);
      expect(results[0].discrepancies[0].type).toBe(DiscrepancyType.AMOUNT_MISMATCH);
      expect(results[0].discrepancies[1].type).toBe(DiscrepancyType.MISSING_REVENUE_SHARE);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete financial workflow', async () => {
      // This would test the complete flow from transaction to reconciliation
      // 1. Transaction occurs
      // 2. Revenue share is calculated
      // 3. Commission is applied (for hosted parking)
      // 4. Remittance is scheduled
      // 5. Reconciliation validates everything
      
      // Mock the complete workflow
      const transactionId = 'tx-integration-test';
      const operatorId = 'operator-123';
      
      // Step 1: Calculate commission
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              lte: vi.fn(() => ({
                or: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      single: vi.fn(() => ({
                        data: {
                          id: 'rule-hosted',
                          parking_type: 'hosted',
                          host_percentage: 60,
                          park_angel_percentage: 40
                        },
                        error: null
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const commission = await commissionSystemService.calculateCommission(
        transactionId,
        1000,
        'hosted'
      );

      expect(commission.hostShare).toBe(600);
      expect(commission.parkAngelShare).toBe(400);

      // Step 2: Create remittance schedule
      const schedule = await automatedRemittanceService.createRemittanceSchedule({
        recipientId: operatorId,
        recipientType: 'operator',
        frequency: RemittanceFrequency.WEEKLY,
        minimumAmount: 500,
        bankAccountId: 'bank-123',
        isActive: true,
        nextRunDate: new Date(),
      });

      expect(schedule.recipientId).toBe(operatorId);

      // This demonstrates how all the services work together
      // in a real financial workflow
    });
  });
});