#!/usr/bin/env tsx

/**
 * Test script for the Discount and VAT Management System
 * This script demonstrates the core functionality of the discount system
 */

import { 
  DiscountRule, 
  DiscountEngine, 
  VATCalculator, 
  TransactionCalculation 
} from '../src/models/discount';
import { Money, Percentage } from '../src/models/value-objects';
import { DiscountRuleEngine } from '../src/services/discount-rule-engine';

console.log('🎯 Park Angel - Discount and VAT Management System Test\n');

// Test 1: Create and validate discount rules
console.log('1. Creating and validating discount rules...');

const seniorRule = DiscountRule.createSeniorCitizenDiscount();
const pwdRule = DiscountRule.createPWDDiscount();

console.log(`✅ Senior Citizen Discount: ${seniorRule.name} (${seniorRule.percentage.value}%, VAT Exempt: ${seniorRule.isVATExempt})`);
console.log(`✅ PWD Discount: ${pwdRule.name} (${pwdRule.percentage.value}%, VAT Exempt: ${pwdRule.isVATExempt})`);

// Validate rules
const seniorValidation = DiscountRuleEngine.validateDiscountRule(seniorRule);
const pwdValidation = DiscountRuleEngine.validateDiscountRule(pwdRule);

console.log(`   Senior rule validation: ${seniorValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
console.log(`   PWD rule validation: ${pwdValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);

// Test 2: Create custom discount rules
console.log('\n2. Creating custom discount rules...');

const studentDiscount = DiscountRule.create({
  name: 'Student Discount',
  type: 'custom',
  percentage: 15,
  isVATExempt: false,
  conditions: [
    {
      field: 'isStudent',
      operator: 'equals',
      value: true
    }
  ]
});

const earlyBirdDiscount = DiscountRule.create({
  name: 'Early Bird Discount',
  type: 'custom',
  percentage: 10,
  isVATExempt: false,
  conditions: [
    {
      field: 'bookingHour',
      operator: 'less_than',
      value: 6
    }
  ]
});

console.log(`✅ ${studentDiscount.name}: ${studentDiscount.percentage.value}% (VAT Exempt: ${studentDiscount.isVATExempt})`);
console.log(`✅ ${earlyBirdDiscount.name}: ${earlyBirdDiscount.percentage.value}% (VAT Exempt: ${earlyBirdDiscount.isVATExempt})`);

// Test 3: Check discount eligibility
console.log('\n3. Checking discount eligibility...');

const seniorUser = {
  userId: 'user-1',
  age: 65,
  hasPWDId: false,
  isStudent: false
};

const youngUser = {
  userId: 'user-2',
  age: 25,
  hasPWDId: false,
  isStudent: true
};

const pwdUser = {
  userId: 'user-3',
  age: 45,
  hasPWDId: true,
  isStudent: false
};

console.log('Senior User (65 years old):');
console.log(`   Senior discount eligible: ${seniorRule.canApplyToUser(seniorUser) ? '✅ Yes' : '❌ No'}`);
console.log(`   PWD discount eligible: ${pwdRule.canApplyToUser(seniorUser) ? '✅ Yes' : '❌ No'}`);
console.log(`   Student discount eligible: ${studentDiscount.canApplyToUser(seniorUser) ? '✅ Yes' : '❌ No'}`);

console.log('\nYoung Student User (25 years old):');
console.log(`   Senior discount eligible: ${seniorRule.canApplyToUser(youngUser) ? '✅ Yes' : '❌ No'}`);
console.log(`   PWD discount eligible: ${pwdRule.canApplyToUser(youngUser) ? '✅ Yes' : '❌ No'}`);
console.log(`   Student discount eligible: ${studentDiscount.canApplyToUser(youngUser) ? '✅ Yes' : '❌ No'}`);

console.log('\nPWD User (45 years old):');
console.log(`   Senior discount eligible: ${seniorRule.canApplyToUser(pwdUser) ? '✅ Yes' : '❌ No'}`);
console.log(`   PWD discount eligible: ${pwdRule.canApplyToUser(pwdUser) ? '✅ Yes' : '❌ No'}`);
console.log(`   Student discount eligible: ${studentDiscount.canApplyToUser(pwdUser) ? '✅ Yes' : '❌ No'}`);

// Test 4: Calculate transactions with discounts and VAT
console.log('\n4. Calculating transactions with discounts and VAT...');

const discountEngine = new DiscountEngine();
discountEngine.addRule(seniorRule);
discountEngine.addRule(pwdRule);
discountEngine.addRule(studentDiscount);
discountEngine.addRule(earlyBirdDiscount);

const vatCalculator = new VATCalculator(); // 12% Philippine VAT

// Scenario 1: Senior citizen parking for ₱100
console.log('\nScenario 1: Senior citizen parking (₱100)');
const seniorTransaction = discountEngine.calculateTotalWithDiscountsAndVAT(
  new Money(100),
  seniorUser,
  vatCalculator
);

console.log(`   Original amount: ₱${seniorTransaction.originalAmount.value}`);
console.log(`   Applied discounts: ${seniorTransaction.appliedDiscounts.length}`);
seniorTransaction.appliedDiscounts.forEach(discount => {
  console.log(`     - ${discount.name}: ₱${discount.amount.value} (${discount.percentage.value}%)`);
});
console.log(`   VAT exempt: ${seniorTransaction.vatCalculation.isExempt ? '✅ Yes' : '❌ No'}`);
console.log(`   VAT amount: ₱${seniorTransaction.vatCalculation.vatAmount.value}`);
console.log(`   Final amount: ₱${seniorTransaction.finalAmount.value}`);

// Scenario 2: Student parking for ₱100
console.log('\nScenario 2: Student parking (₱100)');
const studentTransaction = discountEngine.calculateTotalWithDiscountsAndVAT(
  new Money(100),
  youngUser,
  vatCalculator
);

console.log(`   Original amount: ₱${studentTransaction.originalAmount.value}`);
console.log(`   Applied discounts: ${studentTransaction.appliedDiscounts.length}`);
studentTransaction.appliedDiscounts.forEach(discount => {
  console.log(`     - ${discount.name}: ₱${discount.amount.value} (${discount.percentage.value}%)`);
});
console.log(`   VAT exempt: ${studentTransaction.vatCalculation.isExempt ? '✅ Yes' : '❌ No'}`);
console.log(`   VAT amount: ₱${studentTransaction.vatCalculation.vatAmount.value}`);
console.log(`   Final amount: ₱${studentTransaction.finalAmount.value}`);

// Scenario 3: PWD parking for ₱100
console.log('\nScenario 3: PWD parking (₱100)');
const pwdTransaction = discountEngine.calculateTotalWithDiscountsAndVAT(
  new Money(100),
  pwdUser,
  vatCalculator
);

console.log(`   Original amount: ₱${pwdTransaction.originalAmount.value}`);
console.log(`   Applied discounts: ${pwdTransaction.appliedDiscounts.length}`);
pwdTransaction.appliedDiscounts.forEach(discount => {
  console.log(`     - ${discount.name}: ₱${discount.amount.value} (${discount.percentage.value}%)`);
});
console.log(`   VAT exempt: ${pwdTransaction.vatCalculation.isExempt ? '✅ Yes' : '❌ No'}`);
console.log(`   VAT amount: ₱${pwdTransaction.vatCalculation.vatAmount.value}`);
console.log(`   Final amount: ₱${pwdTransaction.finalAmount.value}`);

// Test 5: Discount rule suggestions
console.log('\n5. Discount rule suggestions...');

const hostedParkingSuggestions = DiscountRuleEngine.suggestDiscountRules({
  operatorType: 'hosted',
  location: 'Manila',
  targetCustomers: ['students', 'professionals']
});

console.log('Suggested discount rules for hosted parking:');
hostedParkingSuggestions.forEach((suggestion, index) => {
  console.log(`   ${index + 1}. ${suggestion.name} (${suggestion.percentage}%, VAT Exempt: ${suggestion.isVATExempt})`);
  console.log(`      ${suggestion.description}`);
});

// Test 6: Discount impact calculation
console.log('\n6. Discount impact calculation...');

const historicalData = {
  averageTransactionAmount: 150,
  monthlyTransactions: 2000,
  eligibleCustomerPercentage: 12 // 12% of customers are senior citizens
};

const seniorImpact = DiscountRuleEngine.calculateDiscountImpact(seniorRule, historicalData);

console.log('Senior Citizen Discount Impact Analysis:');
console.log(`   Estimated monthly usage: ${seniorImpact.estimatedMonthlyUsage} transactions`);
console.log(`   Estimated monthly discount amount: ₱${seniorImpact.estimatedMonthlyDiscountAmount}`);
console.log(`   VAT impact amount: ₱${seniorImpact.vatImpactAmount}`);
console.log(`   Total estimated revenue impact: ₱${seniorImpact.estimatedRevenueImpact}`);

// Test 7: Conflict detection
console.log('\n7. Discount rule conflict detection...');

const duplicateSeniorRule = new DiscountRule(
  'duplicate-rule',
  'Senior Citizen Discount', // Same name
  'senior',
  new Percentage(25),
  true,
  [],
  true
);

const conflicts = DiscountRuleEngine.validateDiscountRuleConflicts(
  duplicateSeniorRule,
  [seniorRule, pwdRule]
);

console.log(`Conflict detection for duplicate senior rule:`);
console.log(`   Has conflicts: ${conflicts.hasConflicts ? '⚠️ Yes' : '✅ No'}`);
if (conflicts.hasConflicts) {
  conflicts.conflicts.forEach(conflict => {
    console.log(`     - ${conflict.conflictType}: ${conflict.description}`);
  });
}

console.log('\n🎉 Discount and VAT Management System test completed successfully!');
console.log('\nKey Features Demonstrated:');
console.log('✅ Discount rule creation and validation');
console.log('✅ User eligibility checking');
console.log('✅ VAT calculation with exemptions');
console.log('✅ Transaction calculation with multiple discounts');
console.log('✅ Rule suggestions based on context');
console.log('✅ Impact analysis for business planning');
console.log('✅ Conflict detection for rule management');
console.log('\nThe system is ready for integration with the Park Angel applications! 🚗💜');