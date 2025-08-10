import React, { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useAuthStore } from '../stores/authStore'

interface TwoFactorFormProps {
  onVerify: (code: string) => Promise<void>
  onBack: () => void
  isLoading: boolean
  error: string
}

const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onVerify, onBack, isLoading, error }) => {
  const [code, setCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onVerify(code)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <Input
          label="Authentication Code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          required
          autoComplete="one-time-code"
          className="text-center text-2xl tracking-widest"
        />

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isLoading}
            disabled={code.length !== 6}
          >
            Verify
          </Button>
        </div>
      </form>
    </Card>
  )
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const { login, verifyMFA, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const result = await login(email, password)
      
      // Check if 2FA is required
      if (result?.requiresMFA) {
        setMfaFactorId(result.factorId || '')
        setMfaChallengeId(result.challengeId || '')
        setShowTwoFactor(true)
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    }
  }

  const handleTwoFactorVerify = async (code: string) => {
    setError('')
    
    try {
      await verifyMFA(mfaFactorId, mfaChallengeId, code)
    } catch (err: any) {
      setError(err.message || 'Invalid authentication code')
    }
  }

  const handleBackToLogin = () => {
    setShowTwoFactor(false)
    setMfaFactorId('')
    setMfaChallengeId('')
    setError('')
  }

  if (showTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Park Angel Admin
            </h2>
          </div>

          <TwoFactorForm
            onVerify={handleTwoFactorVerify}
            onBack={handleBackToLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Park Angel Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}