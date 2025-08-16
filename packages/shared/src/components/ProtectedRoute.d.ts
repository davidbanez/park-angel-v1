import React, { ReactNode } from 'react';
import { UserType, PermissionAction } from '../types/common';
export interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
    allowedRoles?: UserType[];
    requiredPermission?: {
        resource: string;
        action: PermissionAction;
        context?: Record<string, unknown>;
    };
    customAuth?: (user: unknown, userType: UserType | null) => boolean;
    loadingComponent?: ReactNode;
    unauthorizedComponent?: ReactNode;
    unauthenticatedComponent?: ReactNode;
    redirectTo?: string;
    loginRedirect?: string;
}
export declare const ProtectedRoute: React.FC<ProtectedRouteProps>;
export declare function withProtectedRoute<P extends object>(Component: React.ComponentType<P>, protection: Omit<ProtectedRouteProps, 'children'>): (props: P) => import("react/jsx-runtime").JSX.Element;
export declare const AdminOnly: React.FC<{
    children: ReactNode;
}>;
export declare const OperatorOnly: React.FC<{
    children: ReactNode;
}>;
export declare const POSOnly: React.FC<{
    children: ReactNode;
}>;
export declare const HostOnly: React.FC<{
    children: ReactNode;
}>;
export declare const AuthenticatedOnly: React.FC<{
    children: ReactNode;
}>;
export default ProtectedRoute;
