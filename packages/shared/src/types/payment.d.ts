export interface PaymentMethod {
    id: string;
    userId: string;
    type: PaymentMethodType;
    provider: PaymentProvider;
    isDefault: boolean;
    metadata: PaymentMethodMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum PaymentMethodType {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    DIGITAL_WALLET = "digital_wallet",
    BANK_TRANSFER = "bank_transfer"
}
export declare enum PaymentProvider {
    STRIPE = "stripe",
    PAYPAL = "paypal",
    GCASH = "gcash",
    PAYMAYA = "paymaya",
    PARK_ANGEL = "park_angel"
}
export interface PaymentMethodMetadata {
    stripeCustomerId?: string;
    stripePaymentMethodId?: string;
    paypalCustomerId?: string;
    paypalPaymentMethodId?: string;
    phoneNumber?: string;
    accountName?: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
}
export interface PaymentTransaction {
    id: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentTransactionStatus;
    provider: PaymentProvider;
    providerTransactionId?: string;
    paymentMethodId?: string;
    metadata: PaymentTransactionMetadata;
    createdAt: Date;
    updatedAt: Date;
    processedAt?: Date;
    failedAt?: Date;
    refundedAt?: Date;
}
export declare enum PaymentTransactionStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export interface PaymentTransactionMetadata {
    stripePaymentIntentId?: string;
    paypalOrderId?: string;
    gcashReferenceNumber?: string;
    payMayaTransactionId?: string;
    errorCode?: string;
    errorMessage?: string;
    refundAmount?: number;
    refundReason?: string;
    refundedBy?: string;
}
export interface PaymentIntent {
    id: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    provider: PaymentProvider;
    clientSecret?: string;
    status: PaymentIntentStatus;
    metadata: Record<string, any>;
    createdAt: Date;
    expiresAt: Date;
}
export declare enum PaymentIntentStatus {
    REQUIRES_PAYMENT_METHOD = "requires_payment_method",
    REQUIRES_CONFIRMATION = "requires_confirmation",
    REQUIRES_ACTION = "requires_action",
    PROCESSING = "processing",
    SUCCEEDED = "succeeded",
    CANCELLED = "cancelled"
}
export interface Payout {
    id: string;
    recipientId: string;
    recipientType: 'operator' | 'host';
    amount: number;
    currency: string;
    status: PayoutStatus;
    bankAccountId: string;
    transactionIds: string[];
    metadata: PayoutMetadata;
    createdAt: Date;
    processedAt?: Date;
    failedAt?: Date;
}
export declare enum PayoutStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PAID = "paid",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface PayoutMetadata {
    transferReference?: string;
    bankTransactionId?: string;
    errorCode?: string;
    errorMessage?: string;
    processedBy?: string;
    notes?: string;
}
export interface BankAccount {
    id: string;
    ownerId: string;
    ownerType: 'operator' | 'host';
    bankName: string;
    accountNumber: string;
    accountName: string;
    routingNumber?: string;
    swiftCode?: string;
    isVerified: boolean;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RevenueShare {
    id: string;
    transactionId: string;
    operatorId?: string;
    hostId?: string;
    totalAmount: number;
    parkAngelShare: number;
    operatorShare?: number;
    hostShare?: number;
    sharePercentage: number;
    calculatedAt: Date;
}
export interface PaymentProcessor {
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;
    confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentTransaction>;
    refundPayment(transactionId: string, amount?: number, reason?: string): Promise<PaymentTransaction>;
    createCustomer(userId: string, email: string): Promise<string>;
    attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
    detachPaymentMethod(paymentMethodId: string): Promise<void>;
}
export interface CreatePaymentIntentParams {
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethodId?: string;
    metadata?: Record<string, any>;
}
export interface PayoutProcessor {
    createPayout(params: CreatePayoutParams): Promise<Payout>;
    processPayout(payoutId: string): Promise<Payout>;
    cancelPayout(payoutId: string): Promise<Payout>;
    getPayoutStatus(payoutId: string): Promise<PayoutStatus>;
}
export interface CreatePayoutParams {
    recipientId: string;
    recipientType: 'operator' | 'host';
    amount: number;
    currency: string;
    bankAccountId: string;
    transactionIds: string[];
    metadata?: Record<string, any>;
}
export interface RevenueShareConfig {
    parkingType: 'hosted' | 'street' | 'facility';
    parkAngelPercentage: number;
    operatorPercentage?: number;
    hostPercentage?: number;
}
export declare const DEFAULT_REVENUE_SHARE_CONFIG: Record<string, RevenueShareConfig>;
