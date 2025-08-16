import { useState, useEffect, useCallback } from 'react';
import { AuthorizationService, } from '../services/authorization';
import { UserType } from '../models/user';
import { useAuth } from './useAuth';
export function usePermissions() {
    const { user } = useAuth();
    const [state, setState] = useState({
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
                const permissions = await AuthorizationService.getUserPermissions(user.id);
                if (mounted) {
                    setState({
                        permissions,
                        loading: false,
                        error: null,
                    });
                }
            }
            catch (error) {
                if (mounted) {
                    setState({
                        permissions: [],
                        loading: false,
                        error: error,
                    });
                }
            }
        };
        loadPermissions();
        return () => {
            mounted = false;
        };
    }, [user]);
    const hasPermission = useCallback(async (resource, action, context) => {
        if (!user)
            return false;
        try {
            const authContext = await AuthorizationService.createAuthorizationContext(user.id);
            return await AuthorizationService.hasPermission(authContext, resource, action, context);
        }
        catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }, [user]);
    const checkMultiplePermissions = useCallback(async (checks) => {
        if (!user) {
            return checks.reduce((acc, check) => {
                acc[`${check.resource}:${check.action}`] = false;
                return acc;
            }, {});
        }
        try {
            const authContext = await AuthorizationService.createAuthorizationContext(user.id);
            const formattedChecks = checks.map(check => ({
                resource: check.resource,
                action: check.action,
                resourceData: check.context,
            }));
            return await AuthorizationService.checkMultiplePermissions(authContext, formattedChecks);
        }
        catch (error) {
            console.error('Error checking multiple permissions:', error);
            return checks.reduce((acc, check) => {
                acc[`${check.resource}:${check.action}`] = false;
                return acc;
            }, {});
        }
    }, [user]);
    const refreshPermissions = useCallback(async () => {
        if (!user)
            return;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const permissions = await AuthorizationService.getUserPermissions(user.id);
            setState({
                permissions,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error,
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
export function usePermission(resource, action, context) {
    const { user } = useAuth();
    const [state, setState] = useState({
        hasPermission: false,
        loading: true,
        error: null,
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
                const authContext = await AuthorizationService.createAuthorizationContext(user.id);
                const hasPermission = await AuthorizationService.hasPermission(authContext, resource, action, context);
                if (mounted) {
                    setState({
                        hasPermission,
                        loading: false,
                        error: null,
                    });
                }
            }
            catch (error) {
                if (mounted) {
                    setState({
                        hasPermission: false,
                        loading: false,
                        error: error,
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
export function useRole() {
    const { userType } = useAuth();
    const hasRole = useCallback((roles) => {
        return userType ? roles.includes(userType) : false;
    }, [userType]);
    return {
        userType,
        isAdmin: userType === UserType.ADMIN,
        isOperator: userType === UserType.OPERATOR,
        isPOS: userType === UserType.POS,
        isHost: userType === UserType.HOST,
        isClient: userType === UserType.CLIENT,
        hasRole,
    };
}
export default usePermissions;
