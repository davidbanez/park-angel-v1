import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { UserType } from '../models/user';
import { useAuth } from '../hooks/useAuth';
import { usePermission, useRole } from '../hooks/usePermissions';
export const ProtectedRoute = ({ children, requireAuth = true, allowedRoles, requiredPermission, customAuth, loadingComponent, unauthorizedComponent, unauthenticatedComponent, redirectTo, loginRedirect, }) => {
    const { user, userType, loading: authLoading } = useAuth();
    const { hasRole } = useRole();
    const { hasPermission, loading: permissionLoading, error: permissionError, } = usePermission(requiredPermission?.resource || '', requiredPermission?.action || 'read', requiredPermission?.context);
    // Show loading state
    if (authLoading || (requiredPermission && permissionLoading)) {
        return (_jsx(_Fragment, { children: loadingComponent || (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsx("div", { className: 'animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600' }) })) }));
    }
    // Check authentication
    if (requireAuth && !user) {
        if (loginRedirect && typeof window !== 'undefined') {
            window.location.href = loginRedirect;
            return null;
        }
        return (_jsx(_Fragment, { children: unauthenticatedComponent || (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsxs("div", { className: 'text-center', children: [_jsx("h2", { className: 'text-2xl font-bold text-gray-900 mb-4', children: "Authentication Required" }), _jsx("p", { className: 'text-gray-600 mb-6', children: "Please sign in to access this page." }), _jsx("button", { onClick: () => (window.location.href = loginRedirect || '/login'), className: 'bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700', children: "Sign In" })] }) })) }));
    }
    // Check role-based access
    if (allowedRoles && !hasRole(allowedRoles)) {
        if (redirectTo && typeof window !== 'undefined') {
            window.location.href = redirectTo;
            return null;
        }
        return (_jsx(_Fragment, { children: unauthorizedComponent || (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsxs("div", { className: 'text-center', children: [_jsx("h2", { className: 'text-2xl font-bold text-gray-900 mb-4', children: "Access Denied" }), _jsx("p", { className: 'text-gray-600 mb-6', children: "You don't have permission to access this page." }), _jsxs("p", { className: 'text-sm text-gray-500', children: ["Required roles: ", allowedRoles.join(', ')] })] }) })) }));
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
        return (_jsx(_Fragment, { children: unauthorizedComponent || (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsxs("div", { className: 'text-center', children: [_jsx("h2", { className: 'text-2xl font-bold text-gray-900 mb-4', children: "Access Denied" }), _jsx("p", { className: 'text-gray-600 mb-6', children: "You don't have permission to perform this action." }), _jsxs("p", { className: 'text-sm text-gray-500', children: ["Required permission: ", requiredPermission.action, " on", ' ', requiredPermission.resource] })] }) })) }));
    }
    // Check custom authorization
    if (customAuth && !customAuth(user, userType)) {
        if (redirectTo && typeof window !== 'undefined') {
            window.location.href = redirectTo;
            return null;
        }
        return (_jsx(_Fragment, { children: unauthorizedComponent || (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsxs("div", { className: 'text-center', children: [_jsx("h2", { className: 'text-2xl font-bold text-gray-900 mb-4', children: "Access Denied" }), _jsx("p", { className: 'text-gray-600', children: "You don't have permission to access this page." })] }) })) }));
    }
    // All checks passed, render children
    return _jsx(_Fragment, { children: children });
};
// Higher-order component version
export function withProtectedRoute(Component, protection) {
    return function ProtectedComponent(props) {
        return (_jsx(ProtectedRoute, { ...protection, children: _jsx(Component, { ...props }) }));
    };
}
// Utility components for common protection patterns
export const AdminOnly = ({ children }) => (_jsx(ProtectedRoute, { allowedRoles: [UserType.ADMIN], children: children }));
export const OperatorOnly = ({ children, }) => (_jsx(ProtectedRoute, { allowedRoles: [UserType.OPERATOR, UserType.ADMIN], children: children }));
export const POSOnly = ({ children }) => (_jsx(ProtectedRoute, { allowedRoles: [UserType.POS, UserType.OPERATOR, UserType.ADMIN], children: children }));
export const HostOnly = ({ children }) => (_jsx(ProtectedRoute, { allowedRoles: [UserType.HOST, UserType.ADMIN], children: children }));
export const AuthenticatedOnly = ({ children, }) => _jsx(ProtectedRoute, { requireAuth: true, children: children });
export default ProtectedRoute;
