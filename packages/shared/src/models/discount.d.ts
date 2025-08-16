import { Money, Percentage } from './value-objects';
import { DiscountType } from '../types/common';
export declare class DiscountRule {
    readonly id: string;
    name: string;
    type: DiscountType;
    percentage: Percentage;
    isVATExempt: boolean;
    conditions: DiscountCondition[];
    isActive: boolean;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, name: string, type: DiscountType, percentage: Percentage, isVATExempt: boolean, conditions: DiscountCondition[], isActive?: boolean, createdAt?: Date, updatedAt?: Date);
    static create(data: CreateDiscountRuleData): DiscountRule;
    static createSeniorCitizenDiscount(): DiscountRule;
    static createPWDDiscount(): DiscountRule;
    canApplyToUser(userContext: DiscountUserContext): boolean;
    calculateDiscount(amount: Money): AppliedDiscount;
    activate(): void;
    deactivate(): void;
    updatePercentage(percentage: Percentage): void;
    updateVATExemption(isVATExempt: boolean): void;
    addCondition(condition: DiscountCondition): void;
    removeCondition(conditionId: string): void;
    toJSON(): {
        id: string;
        name: string;
        type: DiscountType;
        percentage: number;
        isVATExempt: boolean;
        conditions: {
            id: string;
            field: string;
            operator: DiscountOperator;
            value: string | number | boolean;
            createdAt: Date;
        }[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class DiscountCondition {
    readonly id: string;
    field: string;
    operator: DiscountOperator;
    value: string | number | boolean;
    readonly createdAt: Date;
    constructor(id: string, field: string, operator: DiscountOperator, value: string | number | boolean, createdAt?: Date);
    static create(data: CreateDiscountConditionData): DiscountCondition;
    evaluate(context: DiscountUserContext): boolean;
    private getContextValue;
    toJSON(): {
        id: string;
        field: string;
        operator: DiscountOperator;
        value: string | number | boolean;
        createdAt: Date;
    };
}
export declare class AppliedDiscount {
    readonly id: string;
    readonly type: DiscountType;
    readonly name: string;
    readonly percentage: Percentage;
    readonly amount: Money;
    readonly isVATExempt: boolean;
    readonly appliedAt: Date;
    constructor(id: string, type: DiscountType, name: string, percentage: Percentage, amount: Money, isVATExempt: boolean, appliedAt?: Date);
    static create(discountRule: DiscountRule, originalAmount: Money): AppliedDiscount;
    toJSON(): {
        id: string;
        type: DiscountType;
        name: string;
        percentage: number;
        amount: {
            value: number;
            currency: string;
        };
        isVATExempt: boolean;
        appliedAt: Date;
    };
}
export declare class VATCalculator {
    readonly defaultRate: Percentage;
    constructor(defaultRate?: Percentage);
    calculate(amount: Money, appliedDiscounts?: AppliedDiscount[]): VATCalculation;
    calculateWithCustomRate(amount: Money, vatRate: Percentage, appliedDiscounts?: AppliedDiscount[]): VATCalculation;
}
export declare class VATCalculation {
    readonly netAmount: Money;
    readonly vatAmount: Money;
    readonly totalAmount: Money;
    readonly vatRate: Percentage;
    readonly isExempt: boolean;
    readonly exemptionReasons: AppliedDiscount[];
    constructor(netAmount: Money, vatAmount: Money, totalAmount: Money, vatRate: Percentage, isExempt: boolean, exemptionReasons: AppliedDiscount[]);
    getBreakdown(): VATBreakdown;
    toJSON(): {
        netAmount: {
            value: number;
            currency: string;
        };
        vatAmount: {
            value: number;
            currency: string;
        };
        totalAmount: {
            value: number;
            currency: string;
        };
        vatRate: number;
        isExempt: boolean;
        exemptionReasons: {
            id: string;
            type: DiscountType;
            name: string;
            percentage: number;
            amount: {
                value: number;
                currency: string;
            };
            isVATExempt: boolean;
            appliedAt: Date;
        }[];
        breakdown: VATBreakdown;
    };
}
export declare class DiscountEngine {
    private discountRules;
    constructor(discountRules?: DiscountRule[]);
    addRule(rule: DiscountRule): void;
    removeRule(ruleId: string): void;
    getApplicableDiscounts(userContext: DiscountUserContext): DiscountRule[];
    applyBestDiscount(amount: Money, userContext: DiscountUserContext): AppliedDiscount | null;
    applyAllApplicableDiscounts(amount: Money, userContext: DiscountUserContext): AppliedDiscount[];
    calculateTotalWithDiscountsAndVAT(originalAmount: Money, userContext: DiscountUserContext, vatCalculator?: VATCalculator): TransactionCalculation;
}
export declare class TransactionCalculation {
    readonly originalAmount: Money;
    readonly appliedDiscounts: AppliedDiscount[];
    readonly vatCalculation: VATCalculation;
    readonly finalAmount: Money;
    constructor(originalAmount: Money, appliedDiscounts: AppliedDiscount[], vatCalculation: VATCalculation, finalAmount: Money);
    getTotalDiscountAmount(): Money;
    getSavingsAmount(): Money;
    getBreakdown(): TransactionBreakdown;
    toJSON(): {
        originalAmount: {
            value: number;
            currency: string;
        };
        appliedDiscounts: {
            id: string;
            type: DiscountType;
            name: string;
            percentage: number;
            amount: {
                value: number;
                currency: string;
            };
            isVATExempt: boolean;
            appliedAt: Date;
        }[];
        vatCalculation: {
            netAmount: {
                value: number;
                currency: string;
            };
            vatAmount: {
                value: number;
                currency: string;
            };
            totalAmount: {
                value: number;
                currency: string;
            };
            vatRate: number;
            isExempt: boolean;
            exemptionReasons: {
                id: string;
                type: DiscountType;
                name: string;
                percentage: number;
                amount: {
                    value: number;
                    currency: string;
                };
                isVATExempt: boolean;
                appliedAt: Date;
            }[];
            breakdown: VATBreakdown;
        };
        finalAmount: {
            value: number;
            currency: string;
        };
        breakdown: TransactionBreakdown;
    };
}
export type DiscountOperator = 'equals' | 'not_equals' | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'contains' | 'not_contains';
export interface DiscountUserContext {
    userId: string;
    age?: number;
    hasPWDId?: boolean;
    userType?: string;
    membershipLevel?: string;
    totalBookings?: number;
    [key: string]: any;
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
