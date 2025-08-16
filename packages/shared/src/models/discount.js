import { Money, Percentage, UserId } from './value-objects';
export class DiscountRule {
    constructor(id, name, type, percentage, isVATExempt, conditions, isActive = true, createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "percentage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: percentage
        });
        Object.defineProperty(this, "isVATExempt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isVATExempt
        });
        Object.defineProperty(this, "conditions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: conditions
        });
        Object.defineProperty(this, "isActive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isActive
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        return new DiscountRule(UserId.generate().value, data.name, data.type, new Percentage(data.percentage), data.isVATExempt, data.conditions?.map(c => DiscountCondition.create(c)) || [], data.isActive ?? true, new Date(), new Date());
    }
    static createSeniorCitizenDiscount() {
        return new DiscountRule(UserId.generate().value, 'Senior Citizen Discount', 'senior', new Percentage(20), // 20% discount
        true, // VAT exempt
        [
            DiscountCondition.create({
                field: 'age',
                operator: 'greater_than_or_equal',
                value: 60,
            }),
        ], true, new Date(), new Date());
    }
    static createPWDDiscount() {
        return new DiscountRule(UserId.generate().value, 'Person with Disability Discount', 'pwd', new Percentage(20), // 20% discount
        true, // VAT exempt
        [
            DiscountCondition.create({
                field: 'hasPWDId',
                operator: 'equals',
                value: true,
            }),
        ], true, new Date(), new Date());
    }
    canApplyToUser(userContext) {
        if (!this.isActive) {
            return false;
        }
        return this.conditions.every(condition => condition.evaluate(userContext));
    }
    calculateDiscount(amount) {
        const discountAmount = new Money(this.percentage.apply(amount.value));
        return new AppliedDiscount(UserId.generate().value, this.type, this.name, this.percentage, discountAmount, this.isVATExempt);
    }
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }
    updatePercentage(percentage) {
        this.percentage = percentage;
        this.updatedAt = new Date();
    }
    updateVATExemption(isVATExempt) {
        this.isVATExempt = isVATExempt;
        this.updatedAt = new Date();
    }
    addCondition(condition) {
        this.conditions.push(condition);
        this.updatedAt = new Date();
    }
    removeCondition(conditionId) {
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
    constructor(id, field, operator, value, createdAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "field", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: field
        });
        Object.defineProperty(this, "operator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: operator
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
    }
    static create(data) {
        return new DiscountCondition(UserId.generate().value, data.field, data.operator, data.value, new Date());
    }
    evaluate(context) {
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
                return (typeof contextValue === 'number' &&
                    typeof this.value === 'number' &&
                    contextValue > this.value);
            case 'greater_than_or_equal':
                return (typeof contextValue === 'number' &&
                    typeof this.value === 'number' &&
                    contextValue >= this.value);
            case 'less_than':
                return (typeof contextValue === 'number' &&
                    typeof this.value === 'number' &&
                    contextValue < this.value);
            case 'less_than_or_equal':
                return (typeof contextValue === 'number' &&
                    typeof this.value === 'number' &&
                    contextValue <= this.value);
            case 'contains':
                return (typeof contextValue === 'string' &&
                    typeof this.value === 'string' &&
                    contextValue.toLowerCase().includes(this.value.toLowerCase()));
            case 'not_contains':
                return (typeof contextValue === 'string' &&
                    typeof this.value === 'string' &&
                    !contextValue.toLowerCase().includes(this.value.toLowerCase()));
            default:
                return false;
        }
    }
    getContextValue(context, field) {
        const fieldParts = field.split('.');
        let value = context;
        for (const part of fieldParts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
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
    constructor(id, type, name, percentage, amount, isVATExempt, appliedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "percentage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: percentage
        });
        Object.defineProperty(this, "amount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: amount
        });
        Object.defineProperty(this, "isVATExempt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isVATExempt
        });
        Object.defineProperty(this, "appliedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: appliedAt
        });
    }
    static create(discountRule, originalAmount) {
        const discountAmount = new Money(discountRule.percentage.apply(originalAmount.value));
        return new AppliedDiscount(UserId.generate().value, discountRule.type, discountRule.name, discountRule.percentage, discountAmount, discountRule.isVATExempt, new Date());
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
    constructor(defaultRate = new Percentage(12) // 12% VAT in Philippines
    ) {
        Object.defineProperty(this, "defaultRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: defaultRate
        });
    }
    calculate(amount, appliedDiscounts = []) {
        // Check if any applied discount is VAT exempt
        const hasVATExemptDiscount = appliedDiscounts.some(discount => discount.isVATExempt);
        if (hasVATExemptDiscount) {
            return new VATCalculation(amount, new Money(0), amount, new Percentage(0), true, appliedDiscounts.filter(d => d.isVATExempt));
        }
        // Calculate VAT on the amount after discounts
        const totalDiscountAmount = appliedDiscounts.reduce((sum, discount) => sum + discount.amount.value, 0);
        const discountedAmount = new Money(Math.max(0, amount.value - totalDiscountAmount));
        const vatAmount = new Money(Math.round(this.defaultRate.apply(discountedAmount.value) * 100) / 100);
        const totalAmount = discountedAmount.add(vatAmount);
        return new VATCalculation(discountedAmount, vatAmount, totalAmount, this.defaultRate, false, []);
    }
    calculateWithCustomRate(amount, vatRate, appliedDiscounts = []) {
        // Check if any applied discount is VAT exempt
        const hasVATExemptDiscount = appliedDiscounts.some(discount => discount.isVATExempt);
        if (hasVATExemptDiscount) {
            return new VATCalculation(amount, new Money(0), amount, new Percentage(0), true, appliedDiscounts.filter(d => d.isVATExempt));
        }
        // Calculate VAT on the amount after discounts
        const totalDiscountAmount = appliedDiscounts.reduce((sum, discount) => sum + discount.amount.value, 0);
        const discountedAmount = new Money(Math.max(0, amount.value - totalDiscountAmount));
        const vatAmount = new Money(Math.round(vatRate.apply(discountedAmount.value) * 100) / 100);
        const totalAmount = discountedAmount.add(vatAmount);
        return new VATCalculation(discountedAmount, vatAmount, totalAmount, vatRate, false, []);
    }
}
export class VATCalculation {
    constructor(netAmount, vatAmount, totalAmount, vatRate, isExempt, exemptionReasons) {
        Object.defineProperty(this, "netAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: netAmount
        });
        Object.defineProperty(this, "vatAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vatAmount
        });
        Object.defineProperty(this, "totalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: totalAmount
        });
        Object.defineProperty(this, "vatRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vatRate
        });
        Object.defineProperty(this, "isExempt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isExempt
        });
        Object.defineProperty(this, "exemptionReasons", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: exemptionReasons
        });
    }
    getBreakdown() {
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
    constructor(discountRules = []) {
        Object.defineProperty(this, "discountRules", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: discountRules
        });
    }
    addRule(rule) {
        this.discountRules.push(rule);
    }
    removeRule(ruleId) {
        this.discountRules = this.discountRules.filter(rule => rule.id !== ruleId);
    }
    getApplicableDiscounts(userContext) {
        return this.discountRules.filter(rule => rule.canApplyToUser(userContext));
    }
    applyBestDiscount(amount, userContext) {
        const applicableRules = this.getApplicableDiscounts(userContext);
        if (applicableRules.length === 0) {
            return null;
        }
        // Find the rule that gives the highest discount amount
        let bestRule = null;
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
    applyAllApplicableDiscounts(amount, userContext) {
        const applicableRules = this.getApplicableDiscounts(userContext);
        return applicableRules.map(rule => rule.calculateDiscount(amount));
    }
    calculateTotalWithDiscountsAndVAT(originalAmount, userContext, vatCalculator = new VATCalculator()) {
        const appliedDiscounts = this.applyAllApplicableDiscounts(originalAmount, userContext);
        const vatCalculation = vatCalculator.calculate(originalAmount, appliedDiscounts);
        return new TransactionCalculation(originalAmount, appliedDiscounts, vatCalculation, vatCalculation.totalAmount);
    }
}
export class TransactionCalculation {
    constructor(originalAmount, appliedDiscounts, vatCalculation, finalAmount) {
        Object.defineProperty(this, "originalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: originalAmount
        });
        Object.defineProperty(this, "appliedDiscounts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: appliedDiscounts
        });
        Object.defineProperty(this, "vatCalculation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vatCalculation
        });
        Object.defineProperty(this, "finalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: finalAmount
        });
    }
    getTotalDiscountAmount() {
        const totalDiscount = this.appliedDiscounts.reduce((sum, discount) => sum + discount.amount.value, 0);
        return new Money(totalDiscount);
    }
    getSavingsAmount() {
        const totalSavings = this.originalAmount.value - this.finalAmount.value;
        return new Money(Math.max(0, totalSavings));
    }
    getBreakdown() {
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
