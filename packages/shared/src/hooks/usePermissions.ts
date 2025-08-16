import { useState, useEffect, useCallback } from 'react';
import {
  AuthorizationService,
  ResourcePermission,
} from '../services/authorization';
import { PermissionAction, UserType, USER_TYPE } from '../types/common';
import { useAuth } from './useAuth';

export interface PermissionState {
  permissions: ResourcePermission[];
  loading: boolean;
  error: Error | null;
}

export interface PermissionActions {
  hasPermission: (
    resource: string,
    action: PermissionAction,
    context?: Record<string, unknown>
  ) => Promise<boolean>;
  checkMultiplePermissions: (
    checks: Array<{
      resource: string;
      action: PermissionAction;
      context?: Record<string, unknown>;
    }>
  ) => Promise<Record<string, boolean>>;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): PermissionState & PermissionActions {
  const { user } = useAuth();
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    loading: true,
    error: null,
  });

  // Load user permissions
  useEffect(() => {
    let mounted = true;

    const loadPermissions = async () => {
      if (!user) {
        setState({
          permissions: [],
          loading: false,
          error: null,
        });
        return;
      }

      try {
        const permissions = await AuthorizationService.getUserPermissions(
          user.id
        );

        if (mounted) {
          setState({
            permissions,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            permissions: [],
            loading: false,
            error: error as Error,
          });
        }
      }
    };

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, [user]);

  const hasPermission = useCallback(
    async (
      resource: string,
      action: PermissionAction,
      context?: Record<string, unknown>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const authContext =
          await AuthorizationService.createAuthorizationContext(user.id);
        return await AuthorizationService.hasPermission(
          authContext,
          resource,
          action,
          context
        );
      } catch (error) {
        console.error('Error checking permission:', error);
        return false;
      }
    },
    [user]
  );

  const checkMultiplePermissions = useCallback(
    async (
      checks: Array<{
        resource: string;
        action: PermissionAction;
        context?: Record<string, unknown>;
      }>
    ): Promise<Record<string, boolean>> => {
      if (!user) {
        return checks.reduce(
          (acc, check) => {
            acc[`${check.resource}:${check.action}`] = false;
            return acc;
          },
          {} as Record<string, boolean>
        );
      }

      try {
        const authContext =
          await AuthorizationService.createAuthorizationContext(user.id);
        const formattedChecks = checks.map(check => ({
          resource: check.resource,
          action: check.action,
          resourceData: check.context,
        }));

        return await AuthorizationService.checkMultiplePermissions(
          authContext,
          formattedChecks
        );
      } catch (error) {
        console.error('Error checking multiple permissions:', error);
        return checks.reduce(
          (acc, check) => {
            acc[`${check.resource}:${check.action}`] = false;
            return acc;
          },
          {} as Record<string, boolean>
        );
      }
    },
    [user]
  );

  const refreshPermissions = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permissions = await AuthorizationService.getUserPermissions(
        user.id
      );
      setState({
        permissions,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [user]);

  return {
    ...state,
    hasPermission,
    checkMultiplePermissions,
    refreshPermissions,
  };
}

// Hook for checking a specific permission
export function usePermission(
  resource: string,
  action: PermissionAction,
  context?: Record<string, unknown>
): {
  hasPermission: boolean;
  loading: boolean;
  error: Error | null;
} {
  const { user } = useAuth();
  const [state, setState] = useState({
    hasPermission: false,
    loading: true,
    error: null as Error | null,
  });

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      if (!user) {
        setState({
          hasPermission: false,
          loading: false,
          error: null,
        });
        return;
      }

      try {
        const authContext =
          await AuthorizationService.createAuthorizationContext(user.id);
        const hasPermission = await AuthorizationService.hasPermission(
          authContext,
          resource,
          action,
          context
        );

        if (mounted) {
          setState({
            hasPermission,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            hasPermission: false,
            loading: false,
            error: error as Error,
          });
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [user, resource, action, context]);

  return state;
}

// Hook for role-based access
export function useRole(): {
  userType: UserType | null;
  isAdmin: boolean;
  isOperator: boolean;
  isPOS: boolean;
  isHost: boolean;
  isClient: boolean;
  hasRole: (roles: UserType[]) => boolean;
} {
  const { userType } = useAuth();

  const hasRole = useCallback(
    (roles: UserType[]): boolean => {
      return userType ? roles.includes(userType) : false;
    },
    [userType]
  );

  return {
    userType,
    isAdmin: userType === USER_TYPE.ADMIN,
    isOperator: userType === USER_TYPE.OPERATOR,
    isPOS: userType === USER_TYPE.POS,
    isHost: userType === USER_TYPE.HOST,
    isClient: userType === USER_TYPE.CLIENT,
    hasRole,
  };
}

export default usePermissions;
