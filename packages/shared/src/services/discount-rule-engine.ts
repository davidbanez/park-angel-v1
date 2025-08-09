import { DiscountRule, DiscountUserContext, DiscountOperator } from '../models/discount';
import { DiscountType } from '../types';

export interface DiscountRuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DiscountEligibilityCheck {
  isEligible: boolean;
  reason?: string;
  requiredDocuments?: string[];
  missingConditions?: string[];
}

export class DiscountRuleEngine {
  /**
   * Validates a discount rule configuration
   */
  static validateDiscountRule(rule: Partial<DiscountRule>): DiscountRuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Discount rule name is required');
    }

    if (!rule.type) {
      errors.push('Discount type is required');
    }

    if (!rule.percentage || rule.percentage.value < 0 || rule.percentage.value > 100) {
      errors.push('Discount percentage must be between 0 and 100');
    }

    // Business logic validation
    if (rule.type === 'senior' || rule.type === 'pwd') {
      if (!rule.isVATExempt) {
        warnings.push(`${rule.type} discounts are typically VAT exempt in the Philippines`);
      }

      if (rule.percentage && rule.percentage.value !== 20) {
        warnings.push(`${rule.type} discounts are typically 20% in the Philippines`);
      }
    }

    // Condition validation
    if (rule.conditions && rule.conditions.length > 0) {
      for (const condition of rule.conditions) {
        const conditionValidation = this.validateDiscountCondition(condition);
        if (!conditionValidation.isValid) {
          errors.push(...conditionValidation.errors);
        }
      }
    }

    // Senior citizen specific validation
    if (rule.type === 'senior') {
      const hasAgeCondition = rule.conditions?.some(c => c.field === 'age');
      if (!hasAgeCondition) {
        warnings.push('Senior citizen discount should include age condition (typically >= 60)');
      }
    }

    // PWD specific validation
    if (rule.type === 'pwd') {
      const hasPWDCondition = rule.conditions?.some(c => c.field === 'hasPWDId');
      if (!hasPWDCondition) {
        warnings.push('PWD discount should include PWD ID verification condition');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a discount condition
   */
  static validateDiscountCondition(condition: any): DiscountRuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!condition.field || condition.field.trim().length === 0) {
      errors.push('Condition field is required');
    }

    if (!condition.operator) {
      errors.push('Condition operator is required');
    }

    if (condition.value === undefined || condition.value === null) {
      errors.push('Condition value is required');
    }

    // Validate operator-value compatibility
    if (condition.operator && condition.value !== undefined) {
      const numericOperators: DiscountOperator[] = [
        'greater_than',
        'greater_than_or_equal',
        'less_than',
        'less_than_or_equal'
      ];

      if (numericOperators.includes(condition.operator) && typeof condition.value !== 'number') {
        errors.push(`Operator ${condition.operator} requires a numeric value`);
      }

      const stringOperators: DiscountOperator[] = ['contains', 'not_contains'];
      if (stringOperators.includes(condition.operator) && typeof condition.value !== 'string') {
        errors.push(`Operator ${condition.operator} requires a string value`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Checks if a user is eligible for a specific discount type
   */
  static checkDiscountEligibility(
    discountType: DiscountType,
    userContext: DiscountUserContext
  ): DiscountEligibilityCheck {
    switch (discountType) {
      case 'senior':
        return this.checkSeniorCitizenEligibility(userContext);
      case 'pwd':
        return this.checkPWDEligibility(userContext);
      case 'custom':
        return { isEligible: true }; // Custom discounts are generally available
      default:
        return {
          isEligible: false,
          reason: 'Unknown discount type'
        };
    }
  }

  /**
   * Checks senior citizen discount eligibility
   */
  private static checkSeniorCitizenEligibility(
    userContext: DiscountUserContext
  ): DiscountEligibilityCheck {
    const missingConditions: string[] = [];
    const requiredDocuments: string[] = [];

    // Age requirement
    if (!userContext.age || userContext.age < 60) {
      missingConditions.push('Must be 60 years old or above');
    }

    // Document requirements
    if (!userContext.hasSeniorId) {
      requiredDocuments.push('Senior Citizen ID or Birth Certificate');
    }

    const isEligible = missingConditions.length === 0;

    return {
      isEligible,
      reason: isEligible ? undefined : 'Does not meet senior citizen requirements',
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : undefined,
      missingConditions: missingConditions.length > 0 ? missingConditions : undefined
    };
  }

  /**
   * Checks PWD discount eligibility
   */
  private static checkPWDEligibility(
    userContext: DiscountUserContext
  ): DiscountEligibilityCheck {
    const missingConditions: string[] = [];
    const requiredDocuments: string[] = [];

    // PWD ID requirement
    if (!userContext.hasPWDId) {
      missingConditions.push('Must have a valid PWD ID');
      requiredDocuments.push('PWD ID or Medical Certificate');
    }

    const isEligible = missingConditions.length === 0;

    return {
      isEligible,
      reason: isEligible ? undefined : 'Does not meet PWD requirements',
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : undefined,
      missingConditions: missingConditions.length > 0 ? missingConditions : undefined
    };
  }

  /**
   * Suggests optimal discount rules based on business context
   */
  static suggestDiscountRules(context: {
    operatorType: 'street' | 'facility' | 'hosted';
    location: string;
    targetCustomers: string[];
  }): Array<{
    name: string;
    type: DiscountType;
    percentage: number;
    isVATExempt: boolean;
    description: string;
    conditions: any[];
  }> {
    const suggestions = [];

    // Always suggest mandatory Philippine discounts
    suggestions.push({
      name: 'Senior Citizen Discount',
      type: 'senior' as DiscountType,
      percentage: 20,
      isVATExempt: true,
      description: 'Mandatory 20% discount for senior citizens (60+ years old) with VAT exemption',
      conditions: [
        {
          field: 'age',
          operator: 'greater_than_or_equal',
          value: 60
        }
      ]
    });

    suggestions.push({
      name: 'PWD Discount',
      type: 'pwd' as DiscountType,
      percentage: 20,
      isVATExempt: true,
      description: 'Mandatory 20% discount for persons with disabilities with VAT exemption',
      conditions: [
        {
          field: 'hasPWDId',
          operator: 'equals',
          value: true
        }
      ]
    });

    // Context-specific suggestions
    if (context.operatorType === 'hosted') {
      suggestions.push({
        name: 'First-Time Guest Discount',
        type: 'custom' as DiscountType,
        percentage: 10,
        isVATExempt: false,
        description: 'Welcome discount for first-time guests',
        conditions: [
          {
            field: 'totalBookings',
            operator: 'equals',
            value: 0
          }
        ]
      });
    }

    if (context.operatorType === 'facility') {
      suggestions.push({
        name: 'Early Bird Discount',
        type: 'custom' as DiscountType,
        percentage: 15,
        isVATExempt: false,
        description: 'Discount for bookings made before 6 AM',
        conditions: [
          {
            field: 'bookingHour',
            operator: 'less_than',
            value: 6
          }
        ]
      });
    }

    if (context.targetCustomers.includes('students')) {
      suggestions.push({
        name: 'Student Discount',
        type: 'custom' as DiscountType,
        percentage: 15,
        isVATExempt: false,
        description: 'Discount for verified students',
        conditions: [
          {
            field: 'isStudent',
            operator: 'equals',
            value: true
          }
        ]
      });
    }

    return suggestions;
  }

  /**
   * Calculates the potential impact of a discount rule
   */
  static calculateDiscountImpact(
    rule: DiscountRule,
    historicalData: {
      averageTransactionAmount: number;
      monthlyTransactions: number;
      eligibleCustomerPercentage: number;
    }
  ): {
    estimatedMonthlyUsage: number;
    estimatedMonthlyDiscountAmount: number;
    estimatedRevenueImpact: number;
    vatImpactAmount: number;
  } {
    const eligibleTransactions = historicalData.monthlyTransactions * 
      (historicalData.eligibleCustomerPercentage / 100);
    
    const estimatedUsage = Math.round(eligibleTransactions * 0.7); // Assume 70% adoption rate
    const discountPerTransaction = historicalData.averageTransactionAmount * 
      (rule.percentage.value / 100);
    
    const monthlyDiscountAmount = estimatedUsage * discountPerTransaction;
    const vatImpactAmount = rule.isVATExempt ? 
      monthlyDiscountAmount * 0.12 : 0; // 12% VAT in Philippines

    return {
      estimatedMonthlyUsage: estimatedUsage,
      estimatedMonthlyDiscountAmount: monthlyDiscountAmount,
      estimatedRevenueImpact: monthlyDiscountAmount + vatImpactAmount,
      vatImpactAmount
    };
  }

  /**
   * Validates discount rule conflicts
   */
  static validateDiscountRuleConflicts(
    newRule: DiscountRule,
    existingRules: DiscountRule[]
  ): {
    hasConflicts: boolean;
    conflicts: Array<{
      conflictType: 'duplicate' | 'overlap' | 'contradiction';
      conflictingRule: DiscountRule;
      description: string;
    }>;
  } {
    const conflicts = [];

    for (const existingRule of existingRules) {
      // Check for duplicate names
      if (existingRule.name.toLowerCase() === newRule.name.toLowerCase()) {
        conflicts.push({
          conflictType: 'duplicate' as const,
          conflictingRule: existingRule,
          description: 'A discount rule with this name already exists'
        });
      }

      // Check for same type conflicts
      if (existingRule.type === newRule.type && 
          (newRule.type === 'senior' || newRule.type === 'pwd')) {
        conflicts.push({
          conflictType: 'duplicate' as const,
          conflictingRule: existingRule,
          description: `Only one ${newRule.type} discount rule should exist`
        });
      }

      // Check for condition overlaps
      if (this.hasConditionOverlap(newRule, existingRule)) {
        conflicts.push({
          conflictType: 'overlap' as const,
          conflictingRule: existingRule,
          description: 'This rule has overlapping conditions with an existing rule'
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Checks if two discount rules have overlapping conditions
   */
  private static hasConditionOverlap(rule1: DiscountRule, rule2: DiscountRule): boolean {
    if (!rule1.conditions || !rule2.conditions) {
      return false;
    }

    // Simple overlap detection - can be made more sophisticated
    for (const condition1 of rule1.conditions) {
      for (const condition2 of rule2.conditions) {
        if (condition1.field === condition2.field && 
            condition1.operator === condition2.operator &&
            condition1.value === condition2.value) {
          return true;
        }
      }
    }

    return false;
  }
}