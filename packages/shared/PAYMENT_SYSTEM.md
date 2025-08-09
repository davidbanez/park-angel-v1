# Park Angel Payment Processing System

## Overview

The Park Angel Payment Processing System is a comprehensive solution that handles all payment-related operations for the parking management platform. It supports multiple payment providers, revenue sharing, and automated payouts.

## Features

### 1. Multi-Provider Payment Processing
- **Stripe**: Credit card processing with international support
- **PayPal**: Alternative payment method for users
- **GCash**: Popular Philippine digital wallet
- **PayMaya**: Another Philippine digital wallet option
- **Park Angel Direct**: Direct payment to Park Angel account

### 2. Revenue Sharing System
- Configurable revenue sharing percentages by parking type
- Automatic calculation of Park Angel, operator, and host shares
- Real-time revenue tracking and reporting

### 3. Automated Payout System
- Scheduled payouts to operators and hosts
- Bank account verification and management
- Multiple payout processors (bank transfer, Stripe, PayPal)

### 4. Payment Method Management
- User payment method storage and management
- Default payment method selection
- Secure tokenization of payment data

## Architecture

### Core Services

#### PaymentProcessingService
Handles all payment-related operations including:
- Creating payment intents
- Confirming payments
- Processing refunds
- Managing payment methods

#### RevenueShareService
Manages revenue distribution:
- Calculates revenue shares based on parking type
- Tracks earnings for operators and hosts
- Provides revenue analytics

#### PayoutService
Handles automated payouts:
- Creates and processes payouts
- Manages bank accounts
- Schedules automatic payments

### Database Schema

The payment system uses the following main tables:

- `payment_methods`: User payment method storage
- `payment_intents`: Payment intent tracking
- `payment_transactions`: Transaction records
- `revenue_shares`: Revenue distribution records
- `payouts`: Payout tracking
- `bank_accounts`: Bank account information
- `revenue_share_configs`: Revenue sharing configuration

## Configuration

### Revenue Sharing Defaults

```typescript
const DEFAULT_REVENUE_SHARE_CONFIG = {
  hosted: {
    parkingType: 'hosted',
    parkAngelPercentage: 40,
    hostPercentage: 60,
  },
  street: {
    parkingType: 'street',
    parkAngelPercentage: 30,
    operatorPercentage: 70,
  },
  facility: {
    parkingType: 'facility',
    parkAngelPercentage: 30,
    operatorPercentage: 70,
  },
};
```

### Environment Variables

Required environment variables for payment processing:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment Provider Keys (when implementing actual integrations)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
GCASH_API_KEY=your_gcash_api_key
PAYMAYA_API_KEY=your_paymaya_api_key
```

## Usage Examples

### Creating a Payment Intent

```typescript
import { PaymentProcessingServiceImpl } from '@park-angel/shared';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey);
const paymentService = new PaymentProcessingServiceImpl(supabase);

const paymentIntent = await paymentService.createPaymentIntent({
  bookingId: 'booking_123',
  userId: 'user_123',
  amount: 100.00,
  currency: 'PHP',
  metadata: { parkingType: 'street' },
});
```

### Confirming a Payment

```typescript
const transaction = await paymentService.confirmPayment(
  paymentIntent.id,
  'payment_method_123'
);

console.log('Payment status:', transaction.status);
```

### Calculating Revenue Share

```typescript
import { RevenueShareServiceImpl } from '@park-angel/shared';

const revenueService = new RevenueShareServiceImpl(supabase);

const revenueShare = await revenueService.calculateRevenueShare(
  transaction.id
);

console.log('Park Angel share:', revenueShare.parkAngelShare);
console.log('Operator share:', revenueShare.operatorShare);
```

### Creating a Payout

```typescript
import { PayoutServiceImpl } from '@park-angel/shared';

const payoutService = new PayoutServiceImpl(supabase, revenueService);

const payout = await payoutService.createPayout({
  recipientId: 'operator_123',
  recipientType: 'operator',
  amount: 70.00,
  currency: 'PHP',
  bankAccountId: 'bank_account_123',
  transactionIds: ['transaction_123'],
});
```

### Processing Automatic Payouts

```typescript
// Schedule automatic payouts (typically run as a cron job)
await payoutService.scheduleAutomaticPayouts();
```

## Testing

### Running Tests

```bash
# Run payment system tests
npm run test:payment

# Run unit tests
npm run test:run -- payment-processing
```

### Test Coverage

The payment system includes comprehensive tests for:
- Payment intent creation and confirmation
- Revenue share calculations
- Payout processing
- Error handling scenarios
- Integration workflows

## Security Considerations

### Data Protection
- All payment data is encrypted at rest
- PII is handled according to GDPR requirements
- Payment tokens are used instead of raw card data

### Access Control
- Row Level Security (RLS) policies protect user data
- Service-level authentication for sensitive operations
- Audit logging for all payment operations

### Compliance
- PCI DSS compliance for card data handling
- Philippine banking regulations compliance
- International payment processing standards

## Error Handling

The payment system implements comprehensive error handling:

### Payment Errors
- Invalid payment methods
- Insufficient funds
- Network timeouts
- Provider-specific errors

### Revenue Share Errors
- Missing configuration
- Invalid transaction data
- Calculation errors

### Payout Errors
- Unverified bank accounts
- Insufficient balance
- Bank transfer failures

## Monitoring and Analytics

### Key Metrics
- Payment success rates
- Revenue distribution
- Payout processing times
- Error rates by provider

### Reporting
- Real-time payment dashboards
- Revenue analytics
- Payout history
- Performance monitoring

## Future Enhancements

### Planned Features
1. **Cryptocurrency Support**: Bitcoin and other crypto payments
2. **Installment Payments**: Split payments over time
3. **Loyalty Points**: Reward system integration
4. **Advanced Fraud Detection**: ML-based fraud prevention
5. **Multi-Currency Support**: Support for multiple currencies

### Integration Roadmap
1. **Phase 1**: Complete Stripe and PayPal integration
2. **Phase 2**: Add GCash and PayMaya support
3. **Phase 3**: Implement advanced analytics
4. **Phase 4**: Add cryptocurrency support

## Support and Maintenance

### Monitoring
- Real-time payment processing monitoring
- Automated alerts for failed transactions
- Performance metrics tracking

### Maintenance
- Regular security updates
- Provider API updates
- Database optimization
- Performance tuning

## API Reference

### PaymentProcessingService

#### Methods
- `createPaymentIntent(params)`: Create a new payment intent
- `confirmPayment(intentId, methodId?)`: Confirm a payment
- `refundPayment(transactionId, amount?, reason?)`: Process a refund
- `getPaymentMethods(userId)`: Get user's payment methods
- `addPaymentMethod(userId, methodData)`: Add a payment method
- `removePaymentMethod(methodId)`: Remove a payment method

### RevenueShareService

#### Methods
- `calculateRevenueShare(transactionId)`: Calculate revenue distribution
- `getRevenueShareConfig(parkingType)`: Get revenue share configuration
- `updateRevenueShareConfig(parkingType, config)`: Update configuration
- `getOperatorEarnings(operatorId, startDate?, endDate?)`: Get operator earnings
- `getHostEarnings(hostId, startDate?, endDate?)`: Get host earnings

### PayoutService

#### Methods
- `createPayout(params)`: Create a new payout
- `processPayout(payoutId)`: Process a pending payout
- `cancelPayout(payoutId)`: Cancel a pending payout
- `scheduleAutomaticPayouts()`: Process automatic payouts
- `addBankAccount(accountData)`: Add a bank account
- `getBankAccounts(ownerId)`: Get user's bank accounts

## Troubleshooting

### Common Issues

#### Payment Intent Creation Fails
- Check booking exists in database
- Verify user permissions
- Ensure amount is valid

#### Revenue Share Calculation Errors
- Verify parking type configuration exists
- Check transaction has valid booking data
- Ensure location hierarchy is complete

#### Payout Processing Fails
- Verify bank account is verified
- Check sufficient balance
- Ensure payout is in pending status

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=payment:*
```

This will provide detailed logging for all payment operations.