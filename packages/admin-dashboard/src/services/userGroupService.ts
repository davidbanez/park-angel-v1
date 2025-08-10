import { supabase } from '../../../shared/src/lib/supabase'

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
  value: string | number
}

export interface CreateUserGroupData {
  name: string
  description: string
  permissions: Permission[]
  operatorId?: string
}

export interface UpdateUserGroupData {
  name?: string
  description?: string
  permissions?: Permission[]
}

export interface UserGroup {
  id: string
  name: string
  description: string
  permissions: Permission[]
  operatorId?: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface UserGroupMember {
  userId: string
  userEmail: string
  userName: string
  joinedAt: string
}

export class UserGroupService {
  /**
   * Get all user groups with member counts
   */
  static async getUserGroups(operatorId?: string): Promise<UserGroup[]> {
    try {
      let query = supabase
        .from('user_groups')
        .select(`
          id,
          name,
          description,
          permissions,
          operator_id,
          created_at,
          updated_at,
          user_group_memberships (
            count
          )
        `)
        .order('created_at', { ascending: false })

      if (operatorId) {
        query = query.eq('operator_id', operatorId)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        permissions: group.permissions || [],
        operatorId: group.operator_id,
        memberCount: group.user_group_memberships?.length || 0,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      }))
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  /**
   * Get a single user group by ID
   */
  static async getUserGroup(groupId: string): Promise<UserGroup | null> {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select(`
          id,
          name,
          description,
          permissions,
          operator_id,
          created_at,
          updated_at,
          user_group_memberships (
            count
          )
        `)
        .eq('id', groupId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        operatorId: data.operator_id,
        memberCount: data.user_group_memberships?.length || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error fetching user group:', error)
      return null
    }
  }

  /**
   * Create a new user group
   */
  static async createUserGroup(groupData: CreateUserGroupData): Promise<UserGroup> {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          permissions: groupData.permissions,
          operator_id: groupData.operatorId
        })
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await this.logAuditEvent('user_group_created', 'user_groups', data.id, null, groupData)

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        operatorId: data.operator_id,
        memberCount: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error creating user group:', error)
      throw error
    }
  }

  /**
   * Update an existing user group
   */
  static async updateUserGroup(groupId: string, groupData: UpdateUserGroupData): Promise<UserGroup> {
    try {
      const oldGroup = await this.getUserGroup(groupId)
      if (!oldGroup) throw new Error('User group not found')

      const updateData: any = {}
      if (groupData.name) updateData.name = groupData.name
      if (groupData.description) updateData.description = groupData.description
      if (groupData.permissions) updateData.permissions = groupData.permissions

      const { data, error } = await supabase
        .from('user_groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await this.logAuditEvent('user_group_updated', 'user_groups', groupId, oldGroup, groupData)

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        operatorId: data.operator_id,
        memberCount: oldGroup.memberCount, // Keep existing count
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error updating user group:', error)
      throw error
    }
  }

  /**
   * Delete a user group
   */
  static async deleteUserGroup(groupId: string): Promise<void> {
    try {
      const group = await this.getUserGroup(groupId)
      if (!group) throw new Error('User group not found')

      // Remove all members from the group first
      await supabase
        .from('user_group_memberships')
        .delete()
        .eq('group_id', groupId)

      // Delete the group
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      // Log audit event
      await this.logAuditEvent('user_group_deleted', 'user_groups', groupId, group, null)
    } catch (error) {
      console.error('Error deleting user group:', error)
      throw error
    }
  }

  /**
   * Get members of a user group
   */
  static async getUserGroupMembers(groupId: string): Promise<UserGroupMember[]> {
    try {
      const { data, error } = await supabase
        .from('user_group_memberships')
        .select(`
          user_id,
          created_at,
          users (
            email,
            user_profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map((membership: any) => ({
        userId: membership.user_id,
        userEmail: membership.users.email,
        userName: `${membership.users.user_profiles?.first_name || ''} ${membership.users.user_profiles?.last_name || ''}`.trim(),
        joinedAt: membership.created_at
      }))
    } catch (error) {
      console.error('Error fetching group members:', error)
      throw error
    }
  }

  /**
   * Add a user to a group
   */
  static async addUserToGroup(userId: string, groupId: string): Promise<void> {
    try {
      // Check if user is already in the group
      const { data: existing } = await supabase
        .from('user_group_memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .single()

      if (existing) {
        throw new Error('User is already a member of this group')
      }

      const { error } = await supabase
        .from('user_group_memberships')
        .insert({
          user_id: userId,
          group_id: groupId
        })

      if (error) throw error

      // Log audit event
      await this.logAuditEvent('user_added_to_group', 'user_group_memberships', null, null, {
        userId,
        groupId
      })
    } catch (error) {
      console.error('Error adding user to group:', error)
      throw error
    }
  }

  /**
   * Remove a user from a group
   */
  static async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_group_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId)

      if (error) throw error

      // Log audit event
      await this.logAuditEvent('user_removed_from_group', 'user_group_memberships', null, null, {
        userId,
        groupId
      })
    } catch (error) {
      console.error('Error removing user from group:', error)
      throw error
    }
  }

  /**
   * Get user's group memberships
   */
  static async getUserGroupsForUser(userId: string): Promise<UserGroup[]> {
    try {
      const { data, error } = await supabase
        .from('user_group_memberships')
        .select(`
          user_groups (
            id,
            name,
            description,
            permissions,
            operator_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)

      if (error) throw error

      return data.map((membership: any) => ({
        id: membership.user_groups.id,
        name: membership.user_groups.name,
        description: membership.user_groups.description,
        permissions: membership.user_groups.permissions || [],
        operatorId: membership.user_groups.operator_id,
        memberCount: 0, // Not needed for this context
        createdAt: membership.user_groups.created_at,
        updatedAt: membership.user_groups.updated_at
      }))
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(
    userId: string,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete',
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const userGroups = await this.getUserGroupsForUser(userId)

      for (const group of userGroups) {
        for (const permission of group.permissions) {
          if (permission.resource === resource && permission.actions.includes(action)) {
            // Check conditions if provided
            if (permission.conditions && context) {
              const conditionsMet = permission.conditions.every(condition => {
                const contextValue = context[condition.field]
                switch (condition.operator) {
                  case 'equals':
                    return contextValue === condition.value
                  case 'greater_than':
                    return Number(contextValue) > Number(condition.value)
                  case 'less_than':
                    return Number(contextValue) < Number(condition.value)
                  case 'contains':
                    return String(contextValue).includes(String(condition.value))
                  default:
                    return false
                }
              })
              
              if (conditionsMet) return true
            } else {
              return true
            }
          }
        }
      }

      return false
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false
    }
  }

  /**
   * Get all available resources and actions for permission configuration
   */
  static getAvailablePermissions(): { resource: string; actions: string[]; description: string }[] {
    return [
      {
        resource: 'users',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage admin and staff users'
      },
      {
        resource: 'operators',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage parking operators'
      },
      {
        resource: 'locations',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage parking locations and hierarchy'
      },
      {
        resource: 'bookings',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage parking bookings and sessions'
      },
      {
        resource: 'payments',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage payments and financial transactions'
      },
      {
        resource: 'reports',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Generate and manage reports'
      },
      {
        resource: 'advertisements',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage advertisement system'
      },
      {
        resource: 'api_management',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage third-party API integrations'
      },
      {
        resource: 'settings',
        actions: ['create', 'read', 'update', 'delete'],
        description: 'Manage system settings and configuration'
      },
      {
        resource: 'audit_logs',
        actions: ['read'],
        description: 'View audit logs and system events'
      }
    ]
  }

  /**
   * Validate permission structure
   */
  static validatePermissions(permissions: Permission[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const availablePermissions = this.getAvailablePermissions()
    const availableResources = availablePermissions.map(p => p.resource)

    for (const permission of permissions) {
      // Check if resource exists
      if (!availableResources.includes(permission.resource)) {
        errors.push(`Invalid resource: ${permission.resource}`)
        continue
      }

      // Check if actions are valid for this resource
      const resourcePermission = availablePermissions.find(p => p.resource === permission.resource)
      if (resourcePermission) {
        const invalidActions = permission.actions.filter(action => 
          !resourcePermission.actions.includes(action)
        )
        if (invalidActions.length > 0) {
          errors.push(`Invalid actions for ${permission.resource}: ${invalidActions.join(', ')}`)
        }
      }

      // Validate conditions if present
      if (permission.conditions) {
        for (const condition of permission.conditions) {
          if (!['equals', 'greater_than', 'less_than', 'contains'].includes(condition.operator)) {
            errors.push(`Invalid condition operator: ${condition.operator}`)
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Log audit event
   */
  private static async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string | null,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('audit_logs').insert({
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues
      })
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }
}