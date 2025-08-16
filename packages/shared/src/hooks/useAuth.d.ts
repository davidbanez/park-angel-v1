import { User, Session } from '@supabase/supabase-js';
import { UserType, PermissionAction } from '../models/user';
export interface AuthState {
    user: User | null;
    session: Session | null;
    userType: UserType | null;
    profile: unknown | null;
    loading: boolean;
    error: Error | null;
}
export interface AuthActions {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        userType: UserType;
    }) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithFacebook: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    refreshSession: () => Promise<void>;
    hasPermission: (resource: string, action: PermissionAction, context?: Record<string, unknown>) => Promise<boolean>;
}
export declare function useAuth(): AuthState & AuthActions;
export default useAuth;
