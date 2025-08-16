// Payment system types for Park Angel
export var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CREDIT_CARD"] = "credit_card";
    PaymentMethodType["DEBIT_CARD"] = "debit_card";
    PaymentMethodType["DIGITAL_WALLET"] = "digital_wallet";
    PaymentMethodType["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethodType || (PaymentMethodType = {}));
export var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["PAYPAL"] = "paypal";
    PaymentProvider["GCASH"] = "gcash";
    PaymentProvider["PAYMAYA"] = "paymaya";
    PaymentProvider["PARK_ANGEL"] = "park_angel";
})(PaymentProvider || (PaymentProvider = {}));
export var PaymentTransactionStatus;
(function (PaymentTransactionStatus) {
    PaymentTransactionStatus["PENDING"] = "pending";
    PaymentTransactionStatus["PROCESSING"] = "processing";
    PaymentTransactionStatus["SUCCEEDED"] = "succeeded";
    PaymentTransactionStatus["FAILED"] = "failed";
    PaymentTransactionStatus["CANCELLED"] = "cancelled";
    PaymentTransactionStatus["REFUNDED"] = "refunded";
    PaymentTransactionStatus["PARTIALLY_REFUNDED"] = "partially_refunded";
})(PaymentTransactionStatus || (PaymentTransactionStatus = {}));
export var PaymentIntentStatus;
(function (PaymentIntentStatus) {
    PaymentIntentStatus["REQUIRES_PAYMENT_METHOD"] = "requires_payment_method";
    PaymentIntentStatus["REQUIRES_CONFIRMATION"] = "requires_confirmation";
    PaymentIntentStatus["REQUIRES_ACTION"] = "requires_action";
    PaymentIntentStatus["PROCESSING"] = "processing";
    PaymentIntentStatus["SUCCEEDED"] = "succeeded";
    PaymentIntentStatus["CANCELLED"] = "cancelled";
})(PaymentIntentStatus || (PaymentIntentStatus = {}));
export var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "pending";
    PayoutStatus["PROCESSING"] = "processing";
    PayoutStatus["PAID"] = "paid";
    PayoutStatus["FAILED"] = "failed";
    PayoutStatus["CANCELLED"] = "cancelled";
})(PayoutStatus || (PayoutStatus = {}));
export const DEFAULT_REVENUE_SHARE_CONFIG = {
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
