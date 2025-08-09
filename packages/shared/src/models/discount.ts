import { Money, Percentage, UserId } from './value-objects';
import { DiscountType } from '../types';

export class DiscountRule {
  constructor(
    public readonly id: string,
    public name: string,
    public type: DiscountType,
    public percentage: Percentage,
    public isVATExempt: boolean,
    public conditions: DiscountCondition[],
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateDiscountRuleData): DiscountRule {
    return new DiscountRule(
      UserId.generate().value,
      data.name,
      data.type,
      new Percentage(data.percentage),
      data.isVATExempt,
      data.conditions?.map(c => DiscountCondition.create(c)) || [],
      data.isActive ?? true,
      new Date(),
      new Date()
    );
  }

  static createSeniorCitizenDiscount(): DiscountRule {
    return new DiscountRule(
      UserId.generate().value,
      'Senior Citizen Discount',
      'senior',
      new Percentage(20), // 20% discount
      true, // VAT exempt
      [
        DiscountCondition.create({
          field: 'age',
          operator: 'greater_than_or_equal',
          value: 60,
        }),
      ],
      true,
      new Date(),
      new Date()
    );
  }

  static createPWDDiscount(): DiscountRule {
    return new DiscountRule(
      UserId.generate().value,
      'Person with Disability Discount',
      'pwd',
      new Percentage(20), // 20% discount
      true, // VAT exempt
      [
        DiscountCondition.create({
          field: 'hasPWDId',
          operator: 'equals',
          value: true,
        }),
      ],
      true,
      new Date(),
      new Date()
    );
  }

  canApplyToUser(userContext: DiscountUserContext): boolean {
    if (!this.isActive) {
      return false;
    }

    return this.conditions.every(condition => condition.evaluate(userContext));
  }

  calculateDiscount(amount: Money): AppliedDiscount {
    const discountAmount = new Money(this.percentage.apply(amount.value));

    return new AppliedDiscount(
      UserId.generate().value,
      this.type,
      this.name,
      this.percentage,
      discountAmount,
      this.isVATExempt
    );
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updatePercentage(percentage: Percentage): void {
    this.percentage = percentage;
    this.updatedAt = new Date();
  }

  updateVATExemption(isVATExempt: boolean): void {
    this.isVATExempt = isVATExempt;
    this.updatedAt = new Date();
  }

  addCondition(condition: DiscountCondition): void {
    this.conditions.push(condition);
    this.updatedAt = new Date();
  }

  removeCondition(conditionId: string): void {
    this.conditions = this.conditions.filter(c => c.id !== conditionId);
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      percentage: this.percentage.value,
      isVATExempt: this.isVATExempt,
      conditions: this.conditions.map(c => c.toJSON()),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class DiscountCondition {
  constructor(
    public readonly id: string,
    public field: string,
    public operator: DiscountOperator,
    public value: string | number | boolean,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateDiscountConditionData): DiscountCondition {
    return new DiscountCondition(
      UserId.generate().value,
      data.field,
      data.operator,
      data.value,
      new Date()
    );
  }

  evaluate(context: DiscountUserContext): boolean {
    const contextValue = this.getContextValue(context, this.field);

    if (contextValue === undefined || contextValue === null) {
      return false;
    }

    switch (this.operator) {
      case 'equals':
        return contextValue === this.value;
      case 'not_equals':
        return contextValue !== this.value;
      case 'greater_than':
        return (
          typeof contextValue === 'number' &&
          typeof this.value === 'number' &&
          contextValue > this.value
        );
      case 'greater_than_or_equal':
        return (
          typeof contextValue === 'number' &&
          typeof this.value === 'number' &&
          contextValue >= this.value
        );
      case 'less_than':
        return (
          typeof contextValue === 'number' &&
          typeof this.value === 'number' &&
          contextValue < this.value
        );
      case 'less_than_or_equal':
        return (
          typeof contextValue === 'number' &&
          typeof this.value === 'number' &&
          contextValue <= this.value
        );
      case 'contains':
        return (
          typeof contextValue === 'string' &&
          typeof this.value === 'string' &&
          contextValue.toLowerCase().includes(this.value.toLowerCase())
        );
      case 'not_contains':
        return (
          typeof contextValue === 'string' &&
          typeof this.value === 'string' &&
          !contextValue.toLowerCase().includes(this.value.toLowerCase())
        );
      default:
        return false;
    }
  }

  private getContextValue(context: DiscountUserContext, field: string): any {
    const fieldParts = field.split('.');
    let value: any = context;

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  toJSON() {
    return {
      id: this.id,
      field: this.field,
      operator: this.operator,
      value: this.value,
      createdAt: this.createdAt,
    };
  }
}

export class AppliedDiscount {
  constructor(
    public readonly id: string,
    public readonly type: DiscountType,
    public readonly name: string,
    public readonly percentage: Percentage,
    public readonly amount: Money,
    public readonly isVATExempt: boolean,
    public readonly appliedAt: Date = new Date()
  ) {}

  static create(
    discountRule: DiscountRule,
    originalAmount: Money
  ): AppliedDiscount {
    const discountAmount = new Money(
      discountRule.percentage.apply(originalAmount.value)
    );

    return new AppliedDiscount(
      UserId.generate().value,
      discountRule.type,
      discountRule.name,
      discountRule.percentage,
      discountAmount,
      discountRule.isVATExempt,
      new Date()
    );
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      percentage: this.percentage.value,
      amount: this.amount.toJSON(),
      isVATExempt: this.isVATExempt,
      appliedAt: this.appliedAt,
    };
  }
}

export class VATCalculator {
  constructor(
    public readonly defaultRate: Percentage = new Percentage(12) // 12% VAT in Philippines
  ) {}

  calculate(
    amount: Money,
    appliedDiscounts: AppliedDiscount[] = []
  ): VATCalculation {
    // Check if any applied discount is VAT exempt
    const hasVATExemptDiscount = appliedDiscounts.some(
      discount => discount.isVATExempt
    );

    if (hasVATExemptDiscount) {
      return new VATCalculation(
        amount,
        new Money(0),
        amount,
        new Percentage(0),
        true,
        appliedDiscounts.filter(d => d.isVATExempt)
      );
    }

    // Calculate VAT on the amount after discounts
    const totalDiscountAmount = appliedDiscounts.reduce(
      (sum, discount) => sum + discount.amount.value,
      0
    );

    const discountedAmount = new Money(
      Math.max(0, amount.value - totalDiscountAmount)
    );
    const vatAmount = new Money(
      Math.round(this.defaultRate.apply(discountedAmount.value) * 100) / 100
    );
    const totalAmount = discountedAmount.add(vatAmount);

    return new VATCalculation(
      discountedAmount,
      vatAmount,
      totalAmount,
      this.defaultRate,
      false,
      []
    );
  }

  calculateWithCustomRate(
    amount: Money,
    vatRate: Percentage,
    appliedDiscounts: AppliedDiscount[] = []
  ): VATCalculation {
    // Check if any applied discount is VAT exempt
    const hasVATExemptDiscount = appliedDiscounts.some(
      discount => discount.isVATExempt
    );

    if (hasVATExemptDiscount) {
      return new VATCalculation(
        amount,
        new Money(0),
        amount,
        new Percentage(0),
        true,
        appliedDiscounts.filter(d => d.isVATExempt)
      );
    }

    // Calculate VAT on the amount after discounts
    const totalDiscountAmount = appliedDiscounts.reduce(
      (sum, discount) => sum + discount.amount.value,
      0
    );

    const discountedAmount = new Money(
      Math.max(0, amount.value - totalDiscountAmount)
    );
    const vatAmount = new Money(
      Math.round(vatRate.apply(discountedAmount.value) * 100) / 100
    );
    const totalAmount = discountedAmount.add(vatAmount);

    return new VATCalculation(
      discountedAmount,
      vatAmount,
      totalAmount,
      vatRate,
      false,
      []
    );
  }
}

export class VATCalculation {
  constructor(
    public readonly netAmount: Money,
    public readonly vatAmount: Money,
    public readonly totalAmount: Money,
    public readonly vatRate: Percentage,
    public readonly isExempt: boolean,
    public readonly exemptionReasons: AppliedDiscount[]
  ) {}

  getBreakdown(): VATBreakdown {
    return {
      netAmount: this.netAmount,
      vatRate: this.vatRate.value,
      vatAmount: this.vatAmount,
      totalAmount: this.totalAmount,
      isExempt: this.isExempt,
      exemptionReasons: this.exemptionReasons.map(reason => ({
        type: reason.type,
        name: reason.name,
      })),
    };
  }

  toJSON() {
    return {
      netAmount: this.netAmount.toJSON(),
      vatAmount: this.vatAmount.toJSON(),
      totalAmount: this.totalAmount.toJSON(),
      vatRate: this.vatRate.value,
      isExempt: this.isExempt,
      exemptionReasons: this.exemptionReasons.map(r => r.toJSON()),
      breakdown: this.getBreakdown(),
    };
  }
}

export class DiscountEngine {
  constructor(private discountRules: DiscountRule[] = []) {}

  addRule(rule: DiscountRule): void {
    this.discountRules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.discountRules = this.discountRules.filter(rule => rule.id !== ruleId);
  }

  getApplicableDiscounts(userContext: DiscountUserContext): DiscountRule[] {
    return this.discountRules.filter(rule => rule.canApplyToUser(userContext));
  }

  applyBestDiscount(
    amount: Money,
    userContext: DiscountUserContext
  ): AppliedDiscount | null {
    const applicableRules = this.getApplicableDiscounts(userContext);

    if (applicableRules.length === 0) {
      return null;
    }

    // Find the rule that gives the highest discount amount
    let bestRule: DiscountRule | null = null;
    let bestDiscountAmount = 0;

    for (const rule of applicableRules) {
      const discountAmount = rule.percentage.apply(amount.value);
      if (discountAmount > bestDiscountAmount) {
        bestDiscountAmount = discountAmount;
        bestRule = rule;
      }
    }

    return bestRule ? bestRule.calculateDiscount(amount) : null;
  }

  applyAllApplicableDiscounts(
    amount: Money,
    userContext: DiscountUserContext
  ): AppliedDiscount[] {
    const applicableRules = this.getApplicableDiscounts(userContext);
    return applicableRules.map(rule => rule.calculateDiscount(amount));
  }

  calculateTotalWithDiscountsAndVAT(
    originalAmount: Money,
    userContext: DiscountUserContext,
    vatCalculator: VATCalculator = new VATCalculator()
  ): TransactionCalculation {
    const appliedDiscounts = this.applyAllApplicableDiscounts(
      originalAmount,
      userContext
    );
    const vatCalculation = vatCalculator.calculate(
      originalAmount,
      appliedDiscounts
    );

    return new TransactionCalculation(
      originalAmount,
      appliedDiscounts,
      vatCalculation,
      vatCalculation.totalAmount
    );
  }
}

export class TransactionCalculation {
  constructor(
    public readonly originalAmount: Money,
    public readonly appliedDiscounts: AppliedDiscount[],
    public readonly vatCalculation: VATCalculation,
    public readonly finalAmount: Money
  ) {}

  getTotalDiscountAmount(): Money {
    const totalDiscount = this.appliedDiscounts.reduce(
      (sum, discount) => sum + discount.amount.value,
      0
    );
    return new Money(totalDiscount);
  }

  getSavingsAmount(): Money {
    const totalSavings = this.originalAmount.value - this.finalAmount.value;
    return new Money(Math.max(0, totalSavings));
  }

  getBreakdown(): TransactionBreakdown {
    return {
      originalAmount: this.originalAmount,
      discounts: this.appliedDiscounts,
      totalDiscountAmount: this.getTotalDiscountAmount(),
      netAmount: this.vatCalculation.netAmount,
      vatAmount: this.vatCalculation.vatAmount,
      finalAmount: this.finalAmount,
      totalSavings: this.getSavingsAmount(),
    };
  }

  toJSON() {
    return {
      originalAmount: this.originalAmount.toJSON(),
      appliedDiscounts: this.appliedDiscounts.map(d => d.toJSON()),
      vatCalculation: this.vatCalculation.toJSON(),
      finalAmount: this.finalAmount.toJSON(),
      breakdown: this.getBreakdown(),
    };
  }
}

// Types and Interfaces
export type DiscountOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains';

export interface DiscountUserContext {
  userId: string;
  age?: number;
  hasPWDId?: boolean;
  userType?: string;
  membershipLevel?: string;
  totalBookings?: number;
  [key: string]: any; // Allow additional context fields
}

export interface CreateDiscountRuleData {
  name: string;
  type: DiscountType;
  percentage: number;
  isVATExempt: boolean;
  conditions?: CreateDiscountConditionData[];
  isActive?: boolean;
}

export interface CreateDiscountConditionData {
  field: string;
  operator: DiscountOperator;
  value: string | number | boolean;
}

export interface VATBreakdown {
  netAmount: Money;
  vatRate: number;
  vatAmount: Money;
  totalAmount: Money;
  isExempt: boolean;
  exemptionReasons: Array<{
    type: DiscountType;
    name: string;
  }>;
}

export interface TransactionBreakdown {
  originalAmount: Money;
  discounts: AppliedDiscount[];
  totalDiscountAmount: Money;
  netAmount: Money;
  vatAmount: Money;
  finalAmount: Money;
  totalSavings: Money;
}
