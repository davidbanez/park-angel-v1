import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '../../../shared/src/services/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  role: string
  name?: string
  userType: string
  permissions: string[]
}

interface LoginResult {
  requiresMFA?: boolean
  factorId?: string
  challengeId?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<LoginResult | void>
  verifyMFA: (factorId: string, challengeId: string, code: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  checkAuth: () => Promise<void>
  completeLogin: (supabaseUser: SupabaseUser) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string): Promise<LoginResult | void> => {
        set({ isLoading: true })
        
        try {
          const result = await AuthService.signIn({ email, password })
          
          if (result.error) {
            throw new Error(result.error.message)
          }

          if (result.user && result.session) {
            // Check if MFA is required
            const factors = await AuthService.listMFAFactors()
            
            if (factors.factors.length > 0) {
              // Challenge the first MFA factor
              const challengeResult = await AuthService.challengeMFA(factors.factors[0].id)
              
              if (challengeResult.error) {
                throw new Error(challengeResult.error.message)
              }

              set({ isLoading: false })
              return {
                requiresMFA: true,
                factorId: factors.factors[0].id,
                challengeId: challengeResult.challengeId
              }
            }

            // No MFA required, complete login
            await get().completeLogin(result.user)
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      verifyMFA: async (factorId: string, challengeId: string, code: string) => {
        set({ isLoading: true })
        
        try {
          const result = await AuthService.verifyMFA(factorId, challengeId, code)
          
          if (result.error) {
            throw new Error(result.error.message)
          }

          // Get current user after MFA verification
          const { user } = await AuthService.getUser()
          if (user) {
            await get().completeLogin(user)
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      completeLogin: async (supabaseUser: SupabaseUser) => {
        try {
          // Get user profile and permissions
          const { user: userWithProfile, userType } = await AuthService.getCurrentUserWithProfile()
          const permissions = await AuthService.getUserPermissions(supabaseUser.id)

          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            role: userType || 'admin',
            name: userWithProfile?.user_metadata?.name || 
                  `${userWithProfile?.user_metadata?.first_name || ''} ${userWithProfile?.user_metadata?.last_name || ''}`.trim(),
            userType: userType || 'admin',
            permissions: permissions.permissions.map(p => `${p.resource}:${p.actions.join(',')}`),
          }
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await AuthService.signOut()
          set({ 
            user: null, 
            isAuthenticated: false 
          })
        } catch (error) {
          // Even if logout fails, clear local state
          set({ 
            user: null, 
            isAuthenticated: false 
          })
        }
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      checkAuth: async () => {
        try {
          const { session } = await AuthService.getSession()
          
          if (session?.user) {
            await get().completeLogin(session.user)
          } else {
            set({ 
              user: null, 
              isAuthenticated: false 
            })
          }
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false 
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)