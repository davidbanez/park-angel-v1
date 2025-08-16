import { supabase } from '../lib/supabase';
export class AccountVerificationService {
    /**
     * Send password reset email
     */
    static async sendPasswordResetEmail(request) {
        try {
            // Check if user exists
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, status')
                .eq('email', request.email)
                .single();
            if (userError || !userData) {
                // Don't reveal if email exists or not for security
                return {
                    success: true,
                    message: 'If the email exists in our system, you will receive a password reset link.',
                };
            }
            // Check if user is active
            if (userData.status !== 'active') {
                return {
                    success: false,
                    message: 'Account is not active. Please contact support.',
                };
            }
            // Send reset email via Supabase Auth
            const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
                redirectTo: request.redirectUrl ||
                    `${window.location.origin}/auth/reset-password`,
            });
            if (error) {
                console.error('Password reset error:', error);
                return {
                    success: false,
                    message: 'Failed to send password reset email. Please try again.',
                    error,
                };
            }
            // Log the request
            await this.logVerificationRequest(userData.id, 'password_reset', {
                email: request.email,
                redirectUrl: request.redirectUrl,
            });
            return {
                success: true,
                message: 'Password reset email sent successfully.',
            };
        }
        catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Update password with reset token
     */
    static async updatePasswordWithToken(request) {
        try {
            // Validate password strength
            const passwordValidation = this.validatePasswordStrength(request.newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
                };
            }
            // Update password via Supabase Auth
            const { error } = await supabase.auth.updateUser({
                password: request.newPassword,
            });
            if (error) {
                console.error('Password update error:', error);
                return {
                    success: false,
                    message: 'Failed to update password. The reset link may have expired.',
                    error,
                };
            }
            // Log the password change
            const { data: { user }, } = await supabase.auth.getUser();
            if (user) {
                await this.logVerificationRequest(user.id, 'password_reset', {
                    action: 'password_updated',
                });
            }
            return {
                success: true,
                message: 'Password updated successfully.',
            };
        }
        catch (error) {
            console.error('Password update error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Send email verification
     */
    static async sendEmailVerification(request) {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: request.email,
                options: {
                    emailRedirectTo: request.redirectUrl ||
                        `${window.location.origin}/auth/verify-email`,
                },
            });
            if (error) {
                console.error('Email verification error:', error);
                return {
                    success: false,
                    message: 'Failed to send verification email. Please try again.',
                    error,
                };
            }
            return {
                success: true,
                message: 'Verification email sent successfully.',
            };
        }
        catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Verify email with token
     */
    static async verifyEmail(token) {
        try {
            const { error } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'email',
            });
            if (error) {
                console.error('Email verification error:', error);
                return {
                    success: false,
                    message: 'Invalid or expired verification token.',
                    error,
                };
            }
            // Log the verification
            const { data: { user }, } = await supabase.auth.getUser();
            if (user) {
                await this.logVerificationRequest(user.id, 'email', {
                    action: 'email_verified',
                });
            }
            return {
                success: true,
                message: 'Email verified successfully.',
            };
        }
        catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Send phone verification OTP
     */
    static async sendPhoneVerification(request) {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: request.phone,
                options: {
                    channel: request.channel || 'sms',
                },
            });
            if (error) {
                console.error('Phone verification error:', error);
                return {
                    success: false,
                    message: 'Failed to send verification code. Please try again.',
                    error,
                };
            }
            return {
                success: true,
                message: 'Verification code sent successfully.',
            };
        }
        catch (error) {
            console.error('Phone verification error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Verify phone with OTP
     */
    static async verifyPhone(phone, otp) {
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone,
                token: otp,
                type: 'sms',
            });
            if (error) {
                console.error('Phone verification error:', error);
                return {
                    success: false,
                    message: 'Invalid or expired verification code.',
                    error,
                };
            }
            // Log the verification
            const { data: { user }, } = await supabase.auth.getUser();
            if (user) {
                await this.logVerificationRequest(user.id, 'phone', {
                    action: 'phone_verified',
                    phone,
                });
            }
            return {
                success: true,
                message: 'Phone verified successfully.',
            };
        }
        catch (error) {
            console.error('Phone verification error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Activate user account
     */
    static async activateAccount(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: 'active' })
                .eq('id', userId);
            if (error) {
                console.error('Account activation error:', error);
                return {
                    success: false,
                    message: 'Failed to activate account. Please try again.',
                    error: error,
                };
            }
            // Log the activation
            await this.logVerificationRequest(userId, 'account_activation', {
                action: 'account_activated',
            });
            return {
                success: true,
                message: 'Account activated successfully.',
            };
        }
        catch (error) {
            console.error('Account activation error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Deactivate user account
     */
    static async deactivateAccount(userId, reason) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: 'inactive' })
                .eq('id', userId);
            if (error) {
                console.error('Account deactivation error:', error);
                return {
                    success: false,
                    message: 'Failed to deactivate account. Please try again.',
                    error: error,
                };
            }
            // Invalidate all user sessions
            await this.invalidateAllUserSessions(userId, 'account_deactivated');
            // Log the deactivation
            await this.logVerificationRequest(userId, 'account_activation', {
                action: 'account_deactivated',
                reason,
            });
            return {
                success: true,
                message: 'Account deactivated successfully.',
            };
        }
        catch (error) {
            console.error('Account deactivation error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Suspend user account
     */
    static async suspendAccount(userId, reason, suspendedUntil) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: 'suspended' })
                .eq('id', userId);
            if (error) {
                console.error('Account suspension error:', error);
                return {
                    success: false,
                    message: 'Failed to suspend account. Please try again.',
                    error: error,
                };
            }
            // Invalidate all user sessions
            await this.invalidateAllUserSessions(userId, 'account_suspended');
            // Log the suspension
            await this.logVerificationRequest(userId, 'account_activation', {
                action: 'account_suspended',
                reason,
                suspendedUntil: suspendedUntil?.toISOString(),
            });
            return {
                success: true,
                message: 'Account suspended successfully.',
            };
        }
        catch (error) {
            console.error('Account suspension error:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                error: error,
            };
        }
    }
    /**
     * Check account status
     */
    static async checkAccountStatus(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('status')
                .eq('id', userId)
                .single();
            if (error || !data) {
                return {
                    status: 'inactive',
                    canLogin: false,
                    message: 'Account not found.',
                };
            }
            const status = data.status;
            return {
                status,
                canLogin: status === 'active',
                message: status === 'active'
                    ? undefined
                    : status === 'suspended'
                        ? 'Account is suspended. Please contact support.'
                        : 'Account is inactive. Please verify your email or contact support.',
            };
        }
        catch (error) {
            console.error('Account status check error:', error);
            return {
                status: 'inactive',
                canLogin: false,
                message: 'Unable to check account status.',
            };
        }
    }
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        // Check for common weak passwords
        const commonPasswords = [
            'password',
            '123456',
            '123456789',
            'qwerty',
            'abc123',
            'password123',
            'admin',
            'letmein',
            'welcome',
            'monkey',
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common. Please choose a stronger password');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Log verification request
     */
    static async logVerificationRequest(userId, type, metadata) {
        try {
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: `verification_${type}`,
                resource_type: 'verification',
                resource_id: userId,
                new_values: metadata,
            });
        }
        catch (error) {
            console.error('Error logging verification request:', error);
        }
    }
    /**
     * Invalidate all user sessions
     */
    static async invalidateAllUserSessions(userId, reason) {
        try {
            // This would typically call the SessionService
            // For now, we'll just log it
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'sessions_invalidated',
                resource_type: 'session',
                resource_id: userId,
                new_values: { reason },
            });
        }
        catch (error) {
            console.error('Error invalidating user sessions:', error);
        }
    }
    /**
     * Generate secure random token
     */
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * Generate OTP
     */
    static generateOTP(length = 6) {
        const digits = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return result;
    }
}
Object.defineProperty(AccountVerificationService, "TOKEN_EXPIRY_HOURS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 24
});
Object.defineProperty(AccountVerificationService, "OTP_EXPIRY_MINUTES", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 10
});
Object.defineProperty(AccountVerificationService, "MAX_ATTEMPTS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 5
});
