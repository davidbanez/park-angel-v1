# Park Angel - Discount and VAT Management System

## Overview

The Discount and VAT Management System is a comprehensive solution for handling discount rules, VAT calculations, and document verification in the Park Angel parking management platform. It supports Philippine tax regulations including mandatory senior citizen and PWD discounts with VAT exemptions.

## Features

### ✅ Completed Features

1. **Discount Rule Engine with Configurable Types**
   - Senior Citizen discount (20%, VAT exempt)
   - PWD (Person with Disability) discount (20%, VAT exempt)
   - Custom discount rules with flexible conditions
   - Rule validation and conflict detection

2. **Senior Citizen and PWD Discount Logic**
   - Age-based eligibility checking (60+ for senior citizens)
   - PWD ID verification requirements
   - Automatic VAT exemption application
   - Philippine compliance standards

3. **VAT Calculation with Exemption Rules**
   - 12% Philippine VAT rate (configurable)
   - Automatic exemption for senior/PWD discounts
   - Custom VAT rates per operator
   - Precise decimal handling (2 decimal places)

4. **Discount Application Workflow**
   - Multi-discount support per transaction
   - Best discount selection algorithms
   - Transaction calculation with breakdown
   - Real-time eligibility checking

5. **Document Verification for Discount Eligibility**
   - Document upload and storage
   - Verification workflow (pending → approved/rejected)
   - Document type validation (Senior ID, PWD ID, Birth Certificate, Medical Certificate)
   - Expiry date tracking

6. **Discount Reporting and Analytics**
   - Usage statistics and trends
   - VAT exemption reports
   - Compliance monitoring
   - Performance analytics
   - CSV export functionality

## Architecture

### Core Components

```
├── models/
│   └── discount.ts              # Core discount domain models
├── services/
│   ├── discount-vat-management.ts    # Main service for CRUD operations
│   ├── discount-rule-engine.ts       # Business logic and validation
│   └── discount-reporting.ts         # Analytics and reporting
└── database/
    └── migrations/
        └── 20250808073000_discount_verification_documents.sql
```

### Database Schema

#### discount_rules
- Stores discount rule configurations
- Supports hierarchical conditions
- Operator-specific and system-wide rules

#### discount_applications
- Tracks discount usage per booking
- Links to verification documents
- Audit trail for compliance

#### discount_verification_documents
- Document storage for eligibility verification
- Status tracking (pending/approved/rejected)
- Expiry date management

#### vat_config
- Configurable VAT rates
- Operator-specific overrides
- Default system rates

## Usage Examples

### 1. Creating Discount Rules

```typescript
import { DiscountVATManagementService } from '@park-angel/shared';

const service = new DiscountVATManagementService(supabase);

// Create senior citizen discount
const seniorRule = await service.createDiscountRule({
  name: 'Senior Citizen Discount',
  type: 'senior',
  percentage: 20,
  isVATExempt: true,
  conditions: [
    {
      field: 'age',
      operator: 'greater_than_or_equal',
      value: 60
    }
  ],
  createdBy: 'admin-user-id'
});
```

### 2. Applying Discounts to Bookings

```typescript
const userContext = {
  userId: 'user-123',
  age: 65,
  hasPWDId: false
};

const calculation = await service.applyDiscountToBooking(
  'booking-123',
  100, // Original amount
  userContext,
  'pos-operator-id'
);

console.log(`Final amount: ₱${calculation.finalAmount.value}`);
console.log(`VAT exempt: ${calculation.vatCalculation.isExempt}`);
```

### 3. Document Verification

```typescript
// Submit verification document
const document = await service.submitDiscountVerificationDocument({
  userId: 'user-123',
  discountType: 'senior',
  documentType: 'senior_id',
  documentUrl: 'https://storage.example.com/senior-id.pdf'
});

// Verify document
const verified = await service.verifyDiscountDocument(
  document.id,
  'admin-user-id',
  'approved',
  'Document verified successfully'
);
```

### 4. Generating Reports

```typescript
import { DiscountReportingService } from '@park-angel/shared';

const reportingService = new DiscountReportingService(supabase);

// Generate summary report
const summary = await reportingService.generateSummaryReport({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  operatorId: 'operator-123'
});

console.log(`Total discounts applied: ${summary.totalApplications}`);
console.log(`Total discount amount: ₱${summary.totalDiscountAmount}`);
console.log(`VAT exempt transactions: ${summary.vatExemptApplications}`);
```

### 5. Rule Validation and Suggestions

```typescript
import { DiscountRuleEngine } from '@park-angel/shared';

// Validate discount rule
const validation = DiscountRuleEngine.validateDiscountRule(rule);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}

// Get rule suggestions
const suggestions = DiscountRuleEngine.suggestDiscountRules({
  operatorType: 'hosted',
  location: 'Manila',
  targetCustomers: ['students']
});

// Check eligibility
const eligibility = DiscountRuleEngine.checkDiscountEligibility('senior', {
  userId: 'user-123',
  age: 65
});
```

## API Reference

### DiscountVATManagementService

#### Discount Rule Management
- `createDiscountRule(data)` - Create new discount rule
- `updateDiscountRule(id, updates, updatedBy)` - Update existing rule
- `deleteDiscountRule(id)` - Delete discount rule
- `getDiscountRules(operatorId?)` - Get active discount rules
- `getDiscountRuleById(id)` - Get specific discount rule

#### VAT Configuration
- `createVATConfig(config)` - Create VAT configuration
- `updateVATConfig(id, updates)` - Update VAT configuration
- `getVATConfigs(operatorId?)` - Get VAT configurations
- `getDefaultVATConfig(operatorId?)` - Get default VAT rate

#### Document Verification
- `submitDiscountVerificationDocument(document)` - Submit verification document
- `verifyDiscountDocument(id, verifiedBy, status, notes?)` - Verify document
- `getUserVerificationDocuments(userId)` - Get user's documents
- `getPendingVerificationDocuments()` - Get pending verifications

#### Discount Application
- `applyDiscountToBooking(bookingId, amount, userContext, appliedBy, operatorId?)` - Apply discounts
- `recordDiscountApplication(application)` - Record discount usage

#### Analytics
- `getDiscountAnalytics(operatorId?, startDate?, endDate?)` - Get analytics
- `getDiscountUsageReport(operatorId?, startDate?, endDate?)` - Get usage report

### DiscountRuleEngine

#### Validation
- `validateDiscountRule(rule)` - Validate rule configuration
- `validateDiscountRuleConflicts(newRule, existingRules)` - Check conflicts

#### Eligibility
- `checkDiscountEligibility(discountType, userContext)` - Check user eligibility

#### Business Logic
- `suggestDiscountRules(context)` - Get rule suggestions
- `calculateDiscountImpact(rule, historicalData)` - Calculate business impact

### DiscountReportingService

#### Reports
- `generateSummaryReport(filters?)` - Generate summary analytics
- `generateDetailReport(filters?)` - Generate detailed transaction report
- `generateVATExemptionReport(filters?)` - Generate VAT exemption report
- `generateComplianceReport(filters?)` - Generate compliance report
- `generatePerformanceReport(filters?)` - Generate performance report

#### Export
- `exportToCSV(reportType, filters?)` - Export reports to CSV
- `getDiscountTrends(period, filters?)` - Get trend analysis

## Philippine Compliance

### Mandatory Discounts
- **Senior Citizens**: 20% discount + VAT exemption (RA 9994)
- **PWD**: 20% discount + VAT exemption (RA 10754)

### VAT Regulations
- Standard VAT rate: 12%
- Automatic exemption for senior/PWD transactions
- Proper documentation required for exemptions

### Document Requirements
- Senior Citizens: Senior Citizen ID or Birth Certificate
- PWD: PWD ID or Medical Certificate
- Document verification workflow for compliance

## Testing

The system includes comprehensive test suites:

```bash
# Run discount rule engine tests
npm test -- --run src/services/__tests__/discount-rule-engine.test.ts

# Run discount models integration tests
npm test -- --run src/services/__tests__/discount-models.test.ts

# Run demonstration script
npx tsx scripts/test-discount-system.ts
```

## Integration Points

### Admin Dashboard
- Discount rule management interface
- Document verification workflow
- Analytics and reporting dashboards
- VAT configuration management

### Operator Dashboard
- Custom discount rule creation
- Transaction discount application
- Performance analytics
- Compliance reporting

### Client Mobile App
- Discount eligibility checking
- Document submission interface
- Transaction history with discounts
- Savings tracking

### POS Mobile App
- Real-time discount application
- Document verification scanning
- Receipt generation with discounts
- Cash reconciliation with discounts

## Security Considerations

- Row Level Security (RLS) policies for all tables
- Document encryption for sensitive verification files
- Audit logging for all discount applications
- Role-based access control for rule management

## Performance Optimizations

- Database indexes on frequently queried fields
- Caching of discount rules and VAT configurations
- Efficient calculation algorithms
- Batch processing for analytics

## Future Enhancements

- Machine learning for fraud detection
- Automated document verification using OCR
- Real-time discount recommendations
- Advanced analytics with predictive modeling
- Integration with government databases for verification

## Support

For technical support or questions about the Discount and VAT Management System, please refer to the main Park Angel documentation or contact the development team.

---

**Last Updated**: January 8, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Production