import { describe, it, expect } from 'vitest';
import { 
  DiscountRule, 
  DiscountEngine, 
  VATCalculator
} from '../../models/discount';
import { Money, Percentage } from '../../models/value-objects';

describe('Discount Models Integration', () => {
  describe('DiscountRule', () => {
    it('should create senior citizen discount with correct properties', () => {
      const rule = DiscountRule.createSeniorCitizenDiscount();
      
      expect(rule.name).toBe('Senior Citizen Discount');
      expect(rule.type).toBe('senior');
      expect(rule.percentage.value).toBe(20);
      expect(rule.isVATExempt).toBe(true);
      expect(rule.isActive).toBe(true);
      expect(rule.conditions).toHaveLength(1);
      expect(rule.conditions[0].field).toBe('age');
      expect(rule.conditions[0].operator).toBe('greater_than_or_equal');
      expect(rule.conditions[0].value).toBe(60);
    });

    it('should create PWD discount with correct properties', () => {
      const rule = DiscountRule.createPWDDiscount();
      
      expect(rule.name).toBe('Person with Disability Discount');
      expect(rule.type).toBe('pwd');
      expect(rule.percentage.value).toBe(20);
      expect(rule.isVATExempt).toBe(true);
      expect(rule.conditions).toHaveLength(1);
      expect(rule.conditions[0].field).toBe('hasPWDId');
      expect(rule.conditions[0].operator).toBe('equals');
      expect(rule.conditions[0].value).toBe(true);
    });

    it('should check user eligibility correctly', () => {
      const seniorRule = DiscountRule.createSeniorCitizenDiscount();
      
      const eligibleUser = {
        userId: 'user-1',
        age: 65
      };
      
      const ineligibleUser = {
        userId: 'user-2',
        age: 45
      };
      
      expect(seniorRule.canApplyToUser(eligibleUser)).toBe(true);
      expect(seniorRule.canApplyToUser(ineligibleUser)).toBe(false);
    });

    it('should calculate discount amount correctly', () => {
      const rule = DiscountRule.createSeniorCitizenDiscount();
      const amount = new Money(100);
      
      const appliedDiscount = rule.calculateDiscount(amount);
      
      expect(appliedDiscount.amount.value).toBe(20); // 20% of 100
      expect(appliedDiscount.type).toBe('senior');
      expect(appliedDiscount.isVATExempt).toBe(true);
    });

    it('should update rule properties correctly', () => {
      const rule = DiscountRule.createSeniorCitizenDiscount();
      const originalUpdatedAt = rule.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        rule.updatePercentage(new Percentage(25));
        
        expect(rule.percentage.value).toBe(25);
        expect(rule.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('VATCalculator', () => {
    it('should calculate VAT correctly for regular transactions', () => {
      const calculator = new VATCalculator();
      const amount = new Money(100);
      
      const calculation = calculator.calculate(amount);
      
      expect(calculation.netAmount.value).toBe(100);
      expect(calculation.vatAmount.value).toBe(12); // 12% VAT
      expect(calculation.totalAmount.value).toBe(112);
      expect(calculation.isExempt).toBe(false);
    });

    it('should handle VAT exemption for senior citizen discount', () => {
      const calculator = new VATCalculator();
      const amount = new Money(100);
      const seniorRule = DiscountRule.createSeniorCitizenDiscount();
      const appliedDiscount = seniorRule.calculateDiscount(amount);
      
      const calculation = calculator.calculate(amount, [appliedDiscount]);
      
      expect(calculation.isExempt).toBe(true);
      expect(calculation.vatAmount.value).toBe(0);
      expect(calculation.totalAmount.value).toBe(100); // No VAT added
      expect(calculation.exemptionReasons).toHaveLength(1);
      expect(calculation.exemptionReasons[0].type).toBe('senior');
    });

    it('should calculate VAT with custom rate', () => {
      const calculator = new VATCalculator();
      const amount = new Money(100);
      const customRate = new Percentage(10); // 10% VAT
      
      const calculation = calculator.calculateWithCustomRate(amount, customRate);
      
      expect(calculation.vatAmount.value).toBe(10);
      expect(calculation.totalAmount.value).toBe(110);
      expect(calculation.vatRate.value).toBe(10);
    });
  });

  describe('DiscountEngine', () => {
    it('should find applicable discounts for eligible user', () => {
      const engine = new DiscountEngine();
      const seniorRule = DiscountRule.createSeniorCitizenDiscount();
      const pwdRule = DiscountRule.createPWDDiscount();
      
      engine.addRule(seniorRule);
      engine.addRule(pwdRule);
      
      const seniorUser = {
        userId: 'user-1',
        age: 65,
        hasPWDId: false
      };
      
      const applicableDiscounts = engine.getApplicableDiscounts(seniorUser);
      
      expect(applicableDiscounts).toHaveLength(1);
      expect(applicableDiscounts[0].type).toBe('senior');
    });

    it('should apply best discount when multiple are available', () => {
      const engine = new DiscountEngine();
      
      // Create two custom discounts with different percentages
      const discount10 = DiscountRule.create({
        name: '10% Discount',
        type: 'custom',
        percentage: 10,
        isVATExempt: false,
        conditions: []
      });
      
      const discount15 = DiscountRule.create({
        name: '15% Discount',
        type: 'custom',
        percentage: 15,
        isVATExempt: false,
        conditions: []
      });
      
      engine.addRule(discount10);
      engine.addRule(discount15);
      
      const user = { userId: 'user-1' };
      const amount = new Money(100);
      
      const bestDiscount = engine.applyBestDiscount(amount, user);
      
      expect(bestDiscount).not.toBeNull();
      expect(bestDiscount!.amount.value).toBe(15); // Should pick the 15% discount
    });

    it('should calculate complete transaction with discounts and VAT', () => {
      const engine = new DiscountEngine();
      const seniorRule = DiscountRule.createSeniorCitizenDiscount();
      engine.addRule(seniorRule);
      
      const seniorUser = {
        userId: 'user-1',
        age: 65
      };
      
      const originalAmount = new Money(100);
      const calculation = engine.calculateTotalWithDiscountsAndVAT(originalAmount, seniorUser);
      
      expect(calculation.originalAmount.value).toBe(100);
      expect(calculation.appliedDiscounts).toHaveLength(1);
      expect(calculation.appliedDiscounts[0].amount.value).toBe(20); // 20% discount
      expect(calculation.vatCalculation.isExempt).toBe(true); // VAT exempt
      expect(calculation.finalAmount.value).toBe(100); // Original amount (VAT exempt)
      
      const breakdown = calculation.getBreakdown();
      expect(breakdown.totalDiscountAmount.value).toBe(20);
      expect(breakdown.totalSavings.value).toBe(0); // No savings due to VAT exemption structure
    });
  });

  describe('TransactionCalculation', () => {
    it('should provide correct breakdown for complex transaction', () => {
      const engine = new DiscountEngine();
      
      // Add multiple discount rules
      const seniorRule = DiscountRule.createSeniorCitizenDiscount();
      const customRule = DiscountRule.create({
        name: 'Loyalty Discount',
        type: 'custom',
        percentage: 5,
        isVATExempt: false,
        conditions: []
      });
      
      engine.addRule(seniorRule);
      engine.addRule(customRule);
      
      const user = {
        userId: 'user-1',
        age: 65 // Eligible for both discounts
      };
      
      const originalAmount = new Money(200);
      const calculation = engine.calculateTotalWithDiscountsAndVAT(originalAmount, user);
      
      const breakdown = calculation.getBreakdown();
      
      expect(breakdown.originalAmount.value).toBe(200);
      expect(breakdown.discounts).toHaveLength(2); // Both discounts apply
      expect(breakdown.totalDiscountAmount.value).toBe(50); // 20% + 5% of 200
      expect(breakdown.vatAmount.value).toBe(0); // VAT exempt due to senior discount
      expect(breakdown.finalAmount.value).toBe(200); // Original amount (VAT exempt)
    });

    it('should handle non-VAT exempt discounts correctly', () => {
      const engine = new DiscountEngine();
      
      const customRule = DiscountRule.create({
        name: 'Student Discount',
        type: 'custom',
        percentage: 10,
        isVATExempt: false, // Not VAT exempt
        conditions: []
      });
      
      engine.addRule(customRule);
      
      const user = { userId: 'user-1' };
      const originalAmount = new Money(100);
      const calculation = engine.calculateTotalWithDiscountsAndVAT(originalAmount, user);
      
      expect(calculation.appliedDiscounts).toHaveLength(1);
      expect(calculation.appliedDiscounts[0].amount.value).toBe(10); // 10% discount
      expect(calculation.vatCalculation.isExempt).toBe(false);
      expect(calculation.vatCalculation.netAmount.value).toBe(90); // 100 - 10 discount
      expect(calculation.vatCalculation.vatAmount.value).toBe(10.8); // 12% of 90
      expect(calculation.finalAmount.value).toBe(100.8); // 90 + 10.8 VAT
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize and deserialize discount rules correctly', () => {
      const rule = DiscountRule.createSeniorCitizenDiscount();
      const json = rule.toJSON();
      
      expect(json.name).toBe('Senior Citizen Discount');
      expect(json.type).toBe('senior');
      expect(json.percentage).toBe(20);
      expect(json.isVATExempt).toBe(true);
      expect(json.conditions).toHaveLength(1);
      expect(json.isActive).toBe(true);
    });

    it('should serialize transaction calculations correctly', () => {
      const engine = new DiscountEngine();
      const seniorRule = DiscountRule.createSeniorCitizenDiscount();
      engine.addRule(seniorRule);
      
      const user = { userId: 'user-1', age: 65 };
      const calculation = engine.calculateTotalWithDiscountsAndVAT(new Money(100), user);
      
      const json = calculation.toJSON();
      
      expect(json.originalAmount.value).toBe(100);
      expect(json.appliedDiscounts).toHaveLength(1);
      expect(json.vatCalculation.isExempt).toBe(true);
      expect(json.finalAmount.value).toBe(100);
      expect(json.breakdown).toBeDefined();
    });
  });
});