import { UserId, Money, TimeRange } from './value-objects';
export class Booking {
    constructor(id, userId, spotId, vehicleId, timeRange, status, paymentStatus, amount, discounts, vatAmount, totalAmount, createdAt = new Date(), updatedAt = new Date(), confirmedAt, startedAt, completedAt, cancelledAt, cancellationReason) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "userId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userId
        });
        Object.defineProperty(this, "spotId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: spotId
        });
        Object.defineProperty(this, "vehicleId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vehicleId
        });
        Object.defineProperty(this, "timeRange", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: timeRange
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "paymentStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: paymentStatus
        });
        Object.defineProperty(this, "amount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: amount
        });
        Object.defineProperty(this, "discounts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: discounts
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
        Object.defineProperty(this, "confirmedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: confirmedAt
        });
        Object.defineProperty(this, "startedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: startedAt
        });
        Object.defineProperty(this, "completedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: completedAt
        });
        Object.defineProperty(this, "cancelledAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cancelledAt
        });
        Object.defineProperty(this, "cancellationReason", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cancellationReason
        });
    }
    static create(data) {
        const timeRange = new TimeRange(data.startTime, data.endTime);
        const amount = new Money(data.amount);
        const vatAmount = new Money(data.vatAmount || 0);
        const totalAmount = new Money(data.totalAmount);
        return new Booking(UserId.generate().value, data.userId, data.spotId, data.vehicleId, timeRange, BookingStatus.PENDING, PaymentStatus.PENDING, amount, data.discounts || [], vatAmount, totalAmount, new Date(), new Date());
    }
    confirm() {
        if (this.status !== BookingStatus.PENDING) {
            throw new Error('Only pending bookings can be confirmed');
        }
        this.status = BookingStatus.CONFIRMED;
        this.confirmedAt = new Date();
        this.updatedAt = new Date();
    }
    start() {
        if (this.status !== BookingStatus.CONFIRMED) {
            throw new Error('Only confirmed bookings can be started');
        }
        this.status = BookingStatus.ACTIVE;
        this.startedAt = new Date();
        this.updatedAt = new Date();
    }
    complete() {
        if (this.status !== BookingStatus.ACTIVE) {
            throw new Error('Only active bookings can be completed');
        }
        this.status = BookingStatus.COMPLETED;
        this.completedAt = new Date();
        this.updatedAt = new Date();
    }
    cancel(reason) {
        if (this.status === BookingStatus.COMPLETED ||
            this.status === BookingStatus.CANCELLED) {
            throw new Error('Cannot cancel completed or already cancelled bookings');
        }
        this.status = BookingStatus.CANCELLED;
        this.cancelledAt = new Date();
        this.cancellationReason = reason;
        this.updatedAt = new Date();
    }
    markPaymentPaid() {
        if (this.paymentStatus === PaymentStatus.PAID) {
            throw new Error('Payment is already marked as paid');
        }
        this.paymentStatus = PaymentStatus.PAID;
        this.updatedAt = new Date();
        // Auto-confirm booking when payment is received
        if (this.status === BookingStatus.PENDING) {
            this.confirm();
        }
    }
    markPaymentRefunded() {
        if (this.paymentStatus !== PaymentStatus.PAID) {
            throw new Error('Can only refund paid payments');
        }
        this.paymentStatus = PaymentStatus.REFUNDED;
        this.updatedAt = new Date();
        // Auto-cancel booking when payment is refunded
        if (this.status !== BookingStatus.CANCELLED) {
            this.cancel('Payment refunded');
        }
    }
    extendTime(newEndTime) {
        if (this.status !== BookingStatus.ACTIVE &&
            this.status !== BookingStatus.CONFIRMED) {
            throw new Error('Can only extend active or confirmed bookings');
        }
        if (newEndTime <= this.timeRange.end) {
            throw new Error('New end time must be after current end time');
        }
        this.timeRange = new TimeRange(this.timeRange.start, newEndTime);
        this.updatedAt = new Date();
    }
    addDiscount(discount) {
        // Check if discount type already exists
        const existingIndex = this.discounts.findIndex(d => d.type === discount.type);
        if (existingIndex >= 0) {
            this.discounts[existingIndex] = discount;
        }
        else {
            this.discounts.push(discount);
        }
        this.recalculateAmounts();
    }
    removeDiscount(discountType) {
        this.discounts = this.discounts.filter(d => d.type !== discountType);
        this.recalculateAmounts();
    }
    recalculateAmounts() {
        // Recalculate total discount amount
        const totalDiscountAmount = this.discounts.reduce((sum, discount) => sum + discount.amount.value, 0);
        // Calculate discounted amount
        const discountedAmount = Math.max(0, this.amount.value - totalDiscountAmount);
        // Calculate VAT (only if not VAT exempt)
        const hasVATExemptDiscount = this.discounts.some(d => d.isVATExempt);
        const vatRate = hasVATExemptDiscount ? 0 : 0.12; // 12% VAT in Philippines
        const vatAmount = discountedAmount * vatRate;
        this.vatAmount = new Money(Math.round(vatAmount * 100) / 100);
        this.totalAmount = new Money(Math.round((discountedAmount + vatAmount) * 100) / 100);
        this.updatedAt = new Date();
    }
    getDurationInMinutes() {
        return this.timeRange.getDurationInMinutes();
    }
    getDurationInHours() {
        return this.timeRange.getDurationInHours();
    }
    isActive() {
        return this.status === BookingStatus.ACTIVE;
    }
    isPending() {
        return this.status === BookingStatus.PENDING;
    }
    isConfirmed() {
        return this.status === BookingStatus.CONFIRMED;
    }
    isCompleted() {
        return this.status === BookingStatus.COMPLETED;
    }
    isCancelled() {
        return this.status === BookingStatus.CANCELLED;
    }
    isPaid() {
        return this.paymentStatus === PaymentStatus.PAID;
    }
    isRefunded() {
        return this.paymentStatus === PaymentStatus.REFUNDED;
    }
    hasStarted() {
        const now = new Date();
        return now >= this.timeRange.start;
    }
    hasExpired() {
        const now = new Date();
        return now > this.timeRange.end;
    }
    isCurrentlyActive() {
        const now = new Date();
        return this.isActive() && this.timeRange.contains(now);
    }
    canBeCancelled() {
        return (this.status !== BookingStatus.COMPLETED &&
            this.status !== BookingStatus.CANCELLED);
    }
    canBeExtended() {
        return ((this.status === BookingStatus.ACTIVE ||
            this.status === BookingStatus.CONFIRMED) &&
            !this.hasExpired());
    }
    getRefundAmount() {
        if (!this.isPaid()) {
            return new Money(0);
        }
        // Simple refund logic - can be made more sophisticated
        if (this.hasStarted()) {
            // No refund if booking has started
            return new Money(0);
        }
        // Full refund if cancelled before start time
        return this.totalAmount;
    }
    toJSON() {
        return {
            id: this.id,
            userId: this.userId.value,
            spotId: this.spotId,
            vehicleId: this.vehicleId,
            startTime: this.timeRange.start,
            endTime: this.timeRange.end,
            status: this.status,
            paymentStatus: this.paymentStatus,
            amount: this.amount.toJSON(),
            discounts: this.discounts.map(d => d.toJSON()),
            vatAmount: this.vatAmount.toJSON(),
            totalAmount: this.totalAmount.toJSON(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            confirmedAt: this.confirmedAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            cancelledAt: this.cancelledAt,
            cancellationReason: this.cancellationReason,
        };
    }
}
export class BookingExtension {
    constructor(id, bookingId, originalEndTime, newEndTime, additionalAmount, additionalVAT, totalAdditionalAmount, createdAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "bookingId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: bookingId
        });
        Object.defineProperty(this, "originalEndTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: originalEndTime
        });
        Object.defineProperty(this, "newEndTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: newEndTime
        });
        Object.defineProperty(this, "additionalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: additionalAmount
        });
        Object.defineProperty(this, "additionalVAT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: additionalVAT
        });
        Object.defineProperty(this, "totalAdditionalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: totalAdditionalAmount
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
    }
    static create(data) {
        return new BookingExtension(UserId.generate().value, data.bookingId, data.originalEndTime, data.newEndTime, new Money(data.additionalAmount), new Money(data.additionalVAT || 0), new Money(data.totalAdditionalAmount), new Date());
    }
    getExtensionDurationInMinutes() {
        return ((this.newEndTime.getTime() - this.originalEndTime.getTime()) / (1000 * 60));
    }
    getExtensionDurationInHours() {
        return this.getExtensionDurationInMinutes() / 60;
    }
    toJSON() {
        return {
            id: this.id,
            bookingId: this.bookingId,
            originalEndTime: this.originalEndTime,
            newEndTime: this.newEndTime,
            additionalAmount: this.additionalAmount.toJSON(),
            additionalVAT: this.additionalVAT.toJSON(),
            totalAdditionalAmount: this.totalAdditionalAmount.toJSON(),
            createdAt: this.createdAt,
        };
    }
}
export class Vehicle {
    constructor(id, userId, type, brand, model, year, color, plateNumber, isDefault = false, createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "userId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userId
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "brand", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: brand
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: model
        });
        Object.defineProperty(this, "year", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: year
        });
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: color
        });
        Object.defineProperty(this, "plateNumber", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: plateNumber
        });
        Object.defineProperty(this, "isDefault", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isDefault
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
        return new Vehicle(UserId.generate().value, data.userId, data.type, data.brand, data.model, data.year, data.color, data.plateNumber.toUpperCase(), data.isDefault || false, new Date(), new Date());
    }
    update(data) {
        if (data.type !== undefined)
            this.type = data.type;
        if (data.brand !== undefined)
            this.brand = data.brand;
        if (data.model !== undefined)
            this.model = data.model;
        if (data.year !== undefined)
            this.year = data.year;
        if (data.color !== undefined)
            this.color = data.color;
        if (data.plateNumber !== undefined)
            this.plateNumber = data.plateNumber.toUpperCase();
        if (data.isDefault !== undefined)
            this.isDefault = data.isDefault;
        this.updatedAt = new Date();
    }
    setAsDefault() {
        this.isDefault = true;
        this.updatedAt = new Date();
    }
    unsetAsDefault() {
        this.isDefault = false;
        this.updatedAt = new Date();
    }
    getDisplayName() {
        return `${this.year} ${this.brand} ${this.model}`;
    }
    toJSON() {
        return {
            id: this.id,
            userId: this.userId.value,
            type: this.type,
            brand: this.brand,
            model: this.model,
            year: this.year,
            color: this.color,
            plateNumber: this.plateNumber,
            isDefault: this.isDefault,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
// Enums
export var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["ACTIVE"] = "active";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELLED"] = "cancelled";
})(BookingStatus || (BookingStatus = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (PaymentStatus = {}));
