import type { AuthError } from '@supabase/supabase-js';
export interface VerificationRequest {
    id: string;
    userId: string;
    type: 'email' | 'phone' | 'password_reset' | 'account_activation';
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    metadata?: Record<string, unknown>;
}
export interface PasswordResetRequest {
    email: string;
    redirectUrl?: string;
}
export interface PasswordUpdateRequest {
    token: string;
    newPassword: string;
}
export interface EmailVerificationRequest {
    email: string;
    redirectUrl?: string;
}
export interface PhoneVerificationRequest {
    phone: string;
    channel?: 'sms' | 'whatsapp';
}
export interface VerificationResponse {
    success: boolean;
    message: string;
    error?: AuthError | Error;
}
export declare class AccountVerificationService {
    private static readonly TOKEN_EXPIRY_HOURS;
    private static readonly OTP_EXPIRY_MINUTES;
    private static readonly MAX_ATTEMPTS;
    /**
     * Send password reset email
     */
    static sendPasswordResetEmail(request: PasswordResetRequest): Promise<VerificationResponse>;
    /**
     * Update password with reset token
     */
    static updatePasswordWithToken(request: PasswordUpdateRequest): Promise<VerificationResponse>;
    /**
     * Send email verification
     */
    static sendEmailVerification(request: EmailVerificationRequest): Promise<VerificationResponse>;
    /**
     * Verify email with token
     */
    static verifyEmail(token: string): Promise<VerificationResponse>;
    /**
     * Send phone verification OTP
     */
    static sendPhoneVerification(request: PhoneVerificationRequest): Promise<VerificationResponse>;
    /**
     * Verify phone with OTP
     */
    static verifyPhone(phone: string, otp: string): Promise<VerificationResponse>;
    /**
     * Activate user account
     */
    static activateAccount(userId: string): Promise<VerificationResponse>;
    /**
     * Deactivate user account
     */
    static deactivateAccount(userId: string, reason?: string): Promise<VerificationResponse>;
    /**
     * Suspend user account
     */
    static suspendAccount(userId: string, reason: string, suspendedUntil?: Date): Promise<VerificationResponse>;
    /**
     * Check account status
     */
    static checkAccountStatus(userId: string): Promise<{
        status: 'active' | 'inactive' | 'suspended';
        canLogin: boolean;
        message?: string;
    }>;
    /**
     * Validate password strength
     */
    private static validatePasswordStrength;
    /**
     * Log verification request
     */
    private static logVerificationRequest;
    /**
     * Invalidate all user sessions
     */
    private static invalidateAllUserSessions;
    /**
     * Generate secure random token
     */
    private static generateSecureToken;
    /**
     * Generate OTP
     */
    private static generateOTP;
}
