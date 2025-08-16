import { ResourcePermission } from '../services/authorization';
import { PermissionAction, UserType } from '../types/common';
export interface PermissionState {
    permissions: ResourcePermission[];
    loading: boolean;
    error: Error | null;
}
export interface PermissionActions {
    hasPermission: (resource: string, action: PermissionAction, context?: Record<string, unknown>) => Promise<boolean>;
    checkMultiplePermissions: (checks: Array<{
        resource: string;
        action: PermissionAction;
        context?: Record<string, unknown>;
    }>) => Promise<Record<string, boolean>>;
    refreshPermissions: () => Promise<void>;
}
export declare function usePermissions(): PermissionState & PermissionActions;
export declare function usePermission(resource: string, action: PermissionAction, context?: Record<string, unknown>): {
    hasPermission: boolean;
    loading: boolean;
    error: Error | null;
};
export declare function useRole(): {
    userType: UserType | null;
    isAdmin: boolean;
    isOperator: boolean;
    isPOS: boolean;
    isHost: boolean;
    isClient: boolean;
    hasRole: (roles: UserType[]) => boolean;
};
export default usePermissions;
