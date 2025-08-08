import React, { ReactNode } from 'react';
import { UserType, PermissionAction } from '../models/user';
import { useAuth } from '../hooks/useAuth';
import { usePermission, useRole } from '../hooks/usePermissions';

export interface ProtectedRouteProps {
  children: ReactNode;

  // Authentication requirements
  requireAuth?: boolean;

  // Role-based access
  allowedRoles?: UserType[];

  // Permission-based access
  requiredPermission?: {
    resource: string;
    action: PermissionAction;
    context?: Record<string, unknown>;
  };

  // Custom authorization function
  customAuth?: (user: unknown, userType: UserType | null) => boolean;

  // Fallback components
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
  unauthenticatedComponent?: ReactNode;

  // Redirect URLs (if using with router)
  redirectTo?: string;
  loginRedirect?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
  requiredPermission,
  customAuth,
  loadingComponent,
  unauthorizedComponent,
  unauthenticatedComponent,
  redirectTo,
  loginRedirect,
}) => {
  const { user, userType, loading: authLoading } = useAuth();
  const { hasRole } = useRole();

  const {
    hasPermission,
    loading: permissionLoading,
    error: permissionError,
  } = usePermission(
    requiredPermission?.resource || '',
    requiredPermission?.action || 'read',
    requiredPermission?.context
  );

  // Show loading state
  if (authLoading || (requiredPermission && permissionLoading)) {
    return (
      <>
        {loadingComponent || (
          <div className='flex items-center justify-center min-h-screen'>
            <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600'></div>
          </div>
        )}
      </>
    );
  }

  // Check authentication
  if (requireAuth && !user) {
    if (loginRedirect && typeof window !== 'undefined') {
      window.location.href = loginRedirect;
      return null;
    }

    return (
      <>
        {unauthenticatedComponent || (
          <div className='flex items-center justify-center min-h-screen'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Authentication Required
              </h2>
              <p className='text-gray-600 mb-6'>
                Please sign in to access this page.
              </p>
              <button
                onClick={() =>
                  (window.location.href = loginRedirect || '/login')
                }
                className='bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700'
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Check role-based access
  if (allowedRoles && !hasRole(allowedRoles)) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    return (
      <>
        {unauthorizedComponent || (
          <div className='flex items-center justify-center min-h-screen'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Access Denied
              </h2>
              <p className='text-gray-600 mb-6'>
                You don't have permission to access this page.
              </p>
              <p className='text-sm text-gray-500'>
                Required roles: {allowedRoles.join(', ')}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission) {
    if (permissionError) {
      console.error('Permission check error:', permissionError);
    }

    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    return (
      <>
        {unauthorizedComponent || (
          <div className='flex items-center justify-center min-h-screen'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Access Denied
              </h2>
              <p className='text-gray-600 mb-6'>
                You don't have permission to perform this action.
              </p>
              <p className='text-sm text-gray-500'>
                Required permission: {requiredPermission.action} on{' '}
                {requiredPermission.resource}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Check custom authorization
  if (customAuth && !customAuth(user, userType)) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    return (
      <>
        {unauthorizedComponent || (
          <div className='flex items-center justify-center min-h-screen'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Access Denied
              </h2>
              <p className='text-gray-600'>
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  protection: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protection}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Utility components for common protection patterns
export const AdminOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserType.ADMIN]}>{children}</ProtectedRoute>
);

export const OperatorOnly: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute allowedRoles={[UserType.OPERATOR, UserType.ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const POSOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute
    allowedRoles={[UserType.POS, UserType.OPERATOR, UserType.ADMIN]}
  >
    {children}
  </ProtectedRoute>
);

export const HostOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserType.HOST, UserType.ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const AuthenticatedOnly: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ProtectedRoute requireAuth={true}>{children}</ProtectedRoute>;

export default ProtectedRoute;
