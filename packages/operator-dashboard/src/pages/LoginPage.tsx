import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { signIn, verifyOTP, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await signIn(email, password);
      
      // Check if we need OTP verification (user won't be authenticated yet if OTP is required)
      if (!isAuthenticated) {
        setShowOTP(true);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      // If it's a first-time user, we might still need to show OTP
      if (error instanceof Error && error.message.includes('OTP')) {
        setShowOTP(true);
      }
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await verifyOTP(email, otp);
    } catch (error) {
      console.error('OTP verification error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">PA</span>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Park Angel Operator
          </h1>
          <p className="text-secondary-600">
            Sign in to manage your parking operations
          </p>
        </div>

        <Card padding="lg">
          {!showOTP ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerification} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                  Verify Your Account
                </h2>
                <p className="text-secondary-600 text-sm">
                  We've sent a verification code to {email}
                </p>
              </div>

              <Input
                label="Verification Code"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                required
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowOTP(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="flex-1"
                >
                  Verify
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};