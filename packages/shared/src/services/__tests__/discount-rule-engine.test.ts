import { describe, it, expect } from 'vitest';
import { DiscountRuleEngine } from '../discount-rule-engine';
import { DiscountRule } from '../../models/discount';
import { Percentage } from '../../models/value-objects';

describe('DiscountRuleEngine', () => {
  describe('validateDiscountRule', () => {
    it('should validate a valid discount rule', () => {
      const rule = DiscountRule.createSeniorCitizenDiscount();
      
      const result = DiscountRuleEngine.validateDiscountRule(rule);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidRule = {
        name: '',
        type: undefined,
        percentage: undefined,
        isVATExempt: false,
        conditions: []
      } as any;
      
      const result = DiscountRuleEngine.validateDiscountRule(invalidRule);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Discount rule name is required');
      expect(result.errors).toContain('Discount type is required');
      expect(result.errors).toContain('Discount percentage must be between 0 and 100');
    });

    it('should warn about non-standard senior citizen discount', () => {
      const rule = {
        name: 'Senior Discount',
        type: 'senior',
        percentage: new Percentage(15), // Non-standard 15%
        isVATExempt: false, // Should be VAT exempt
        conditions: []
      } as any;
      
      const result = DiscountRuleEngine.validateDiscountRule(rule);
      
      expect(result.warnings).toContain('senior discounts are typically VAT exempt in the Philippines');
      expect(result.warnings).toContain('senior discounts are typically 20% in the Philippines');
    });

    it('should warn about missing age condition for senior discount', () => {
      const rule = {
        name: 'Senior Discount',
        type: 'senior',
        percentage: new Percentage(20),
        isVATExempt: true,
        conditions: [] // Missing age condition
      } as any;
      
      const result = DiscountRuleEngine.validateDiscountRule(rule);
      
      expect(result.warnings).toContain('Senior citizen discount should include age condition (typically >= 60)');
    });
  });

  describe('checkDiscountEligibility', () => {
    it('should check senior citizen eligibility correctly', () => {
      const userContext = {
        userId: 'user-1',
        age: 65,
        hasSeniorId: true
      };
      
      const result = DiscountRuleEngine.checkDiscountEligibility('senior', userContext);
      
      expect(result.isEligible).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject senior citizen eligibility for young user', () => {
      const userContext = {
        userId: 'user-1',
        age: 45,
        hasSeniorId: false
      };
      
      const result = DiscountRuleEngine.checkDiscountEligibility('senior', userContext);
      
      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe('Does not meet senior citizen requirements');
      expect(result.missingConditions).toContain('Must be 60 years old or above');
      expect(result.requiredDocuments).toContain('Senior Citizen ID or Birth Certificate');
    });

    it('should check PWD eligibility correctly', () => {
      const userContext = {
        userId: 'user-1',
        hasPWDId: true
      };
      
      const result = DiscountRuleEngine.checkDiscountEligibility('pwd', userContext);
      
      expect(result.isEligible).toBe(true);
    });

    it('should reject PWD eligibility without PWD ID', () => {
      const userContext = {
        userId: 'user-1',
        hasPWDId: false
      };
      
      const result = DiscountRuleEngine.checkDiscountEligibility('pwd', userContext);
      
      expect(result.isEligible).toBe(false);
      expect(result.missingConditions).toContain('Must have a valid PWD ID');
      expect(result.requiredDocuments).toContain('PWD ID or Medical Certificate');
    });

    it('should allow custom discounts', () => {
      const userContext = {
        userId: 'user-1'
      };
      
      const result = DiscountRuleEngine.checkDiscountEligibility('custom', userContext);
      
      expect(result.isEligible).toBe(true);
    });
  });

  describe('suggestDiscountRules', () => {
    it('should suggest mandatory Philippine discounts', () => {
      const context = {
        operatorType: 'street' as const,
        location: 'Manila',
        targetCustomers: []
      };
      
      const suggestions = DiscountRuleEngine.suggestDiscountRules(context);
      
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].name).toBe('Senior Citizen Discount');
      expect(suggestions[0].type).toBe('senior');
      expect(suggestions[0].percentage).toBe(20);
      expect(suggestions[0].isVATExempt).toBe(true);
      
      expect(suggestions[1].name).toBe('PWD Discount');
      expect(suggestions[1].type).toBe('pwd');
      expect(suggestions[1].percentage).toBe(20);
      expect(suggestions[1].isVATExempt).toBe(true);
    });

    it('should suggest hosted parking specific discounts', () => {
      const context = {
        operatorType: 'hosted' as const,
        location: 'Manila',
        targetCustomers: []
      };
      
      const suggestions = DiscountRuleEngine.suggestDiscountRules(context);
      
      expect(suggestions.length).toBeGreaterThan(2);
      const firstTimeGuestDiscount = suggestions.find(s => s.name === 'First-Time Guest Discount');
      expect(firstTimeGuestDiscount).toBeDefined();
      expect(firstTimeGuestDiscount?.type).toBe('custom');
    });

    it('should suggest facility specific discounts', () => {
      const context = {
        operatorType: 'facility' as const,
        location: 'Manila',
        targetCustomers: []
      };
      
      const suggestions = DiscountRuleEngine.suggestDiscountRules(context);
      
      const earlyBirdDiscount = suggestions.find(s => s.name === 'Early Bird Discount');
      expect(earlyBirdDiscount).toBeDefined();
      expect(earlyBirdDiscount?.percentage).toBe(15);
    });

    it('should suggest student discount when targeting students', () => {
      const context = {
        operatorType: 'street' as const,
        location: 'Manila',
        targetCustomers: ['students']
      };
      
      const suggestions = DiscountRuleEngine.suggestDiscountRules(context);
      
      const studentDiscount = suggestions.find(s => s.name === 'Student Discount');
      expect(studentDiscount).toBeDefined();
      expect(studentDiscount?.type).toBe('custom');
    });
  });

  describe('calculateDiscountImpact', () => {
    it('should calculate discount impact correctly', () => {
      const rule = DiscountRule.createSeniorCitizenDiscount();
      const historicalData = {
        averageTransactionAmount: 100,
        monthlyTransactions: 1000,
        eligibleCustomerPercentage: 15 // 15% of customers are senior citizens
      };
      
      const impact = DiscountRuleEngine.calculateDiscountImpact(rule, historicalData);
      
      expect(impact.estimatedMonthlyUsage).toBe(105); // 1000 * 0.15 * 0.7
      expect(impact.estimatedMonthlyDiscountAmount).toBe(2100); // 105 * 100 * 0.2
      expect(impact.vatImpactAmount).toBe(252); // 2100 * 0.12 (VAT exempt)
      expect(impact.estimatedRevenueImpact).toBe(2352); // 2100 + 252
    });

    it('should calculate impact for non-VAT exempt discount', () => {
      const rule = new DiscountRule(
        'rule-1',
        'Student Discount',
        'custom',
        new Percentage(10),
        false, // Not VAT exempt
        [],
        true
      );
      
      const historicalData = {
        averageTransactionAmount: 100,
        monthlyTransactions: 1000,
        eligibleCustomerPercentage: 20
      };
      
      const impact = DiscountRuleEngine.calculateDiscountImpact(rule, historicalData);
      
      expect(impact.vatImpactAmount).toBe(0); // No VAT impact for non-exempt discount
      expect(impact.estimatedRevenueImpact).toBe(1400); // 140 * 100 * 0.1
    });
  });

  describe('validateDiscountRuleConflicts', () => {
    it('should detect duplicate rule names', () => {
      const existingRule = DiscountRule.createSeniorCitizenDiscount();
      const newRule = new DiscountRule(
        'rule-2',
        'Senior Citizen Discount', // Same name
        'custom',
        new Percentage(15),
        false,
        [],
        true
      );
      
      const result = DiscountRuleEngine.validateDiscountRuleConflicts(newRule, [existingRule]);
      
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].conflictType).toBe('duplicate');
      expect(result.conflicts[0].description).toBe('A discount rule with this name already exists');
    });

    it('should detect duplicate senior/PWD rules', () => {
      const existingRule = DiscountRule.createSeniorCitizenDiscount();
      const newRule = new DiscountRule(
        'rule-2',
        'Another Senior Discount',
        'senior', // Same type
        new Percentage(25),
        true,
        [],
        true
      );
      
      const result = DiscountRuleEngine.validateDiscountRuleConflicts(newRule, [existingRule]);
      
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].conflictType).toBe('duplicate');
      expect(result.conflicts[0].description).toBe('Only one senior discount rule should exist');
    });

    it('should allow multiple custom rules', () => {
      const existingRule = new DiscountRule(
        'rule-1',
        'Student Discount',
        'custom',
        new Percentage(10),
        false,
        [],
        true
      );
      
      const newRule = new DiscountRule(
        'rule-2',
        'Early Bird Discount',
        'custom',
        new Percentage(15),
        false,
        [],
        true
      );
      
      const result = DiscountRuleEngine.validateDiscountRuleConflicts(newRule, [existingRule]);
      
      expect(result.hasConflicts).toBe(false);
    });
  });
});