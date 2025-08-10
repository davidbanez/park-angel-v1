import { supabase } from '../../../shared/src/lib/supabase'

export interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  userType: 'admin' | 'staff' | 'operator'
  status: 'active' | 'inactive' | 'suspended'
  groups: string[]
  password: string
  requireMFA: boolean
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  userType?: 'admin' | 'staff' | 'operator'
  status?: 'active' | 'inactive' | 'suspended'
  groups?: string[]
  requireMFA?: boolean
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'admin' | 'staff' | 'operator'
  status: 'active' | 'inactive' | 'suspended'
  groups: string[]
  createdAt: string
  lastLogin?: string
  mfaEnabled: boolean
}

export class UserService {
  /**
   * Get all users with their profiles and group memberships
   */
  static async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          user_type,
          status,
          created_at,
          last_login,
          user_profiles (
            first_name,
            last_name
          ),
          user_group_memberships (
            user_groups (
              name
            )
          )
        `)
        .in('user_type', ['admin', 'staff', 'operator'])
        .order('created_at', { ascending: false })

      if (error) throw error

      // Check MFA status for each user
      const usersWithMFA = await Promise.all(
        data.map(async (user: any) => {
          // Get MFA factors for user
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
          const mfaEnabled = (authUser?.user?.factors?.length || 0) > 0

          return {
            id: user.id,
            email: user.email,
            firstName: user.user_profiles?.first_name || '',
            lastName: user.user_profiles?.last_name || '',
            userType: user.user_type,
            status: user.status,
            groups: user.user_group_memberships?.map((membership: any) => 
              membership.user_groups.name
            ) || [],
            createdAt: user.created_at,
            lastLogin: user.last_login,
            mfaEnabled: mfaEnabled || false
          }
        })
      )

      return usersWithMFA
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          user_type,
          status,
          created_at,
          last_login,
          user_profiles (
            first_name,
            last_name
          ),
          user_group_memberships (
            user_groups (
              name
            )
          )
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      // Check MFA status
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      const mfaEnabled = (authUser?.user?.factors?.length || 0) > 0

      return {
        id: data.id,
        email: data.email,
        firstName: (data.user_profiles as any)?.first_name || '',
        lastName: (data.user_profiles as any)?.last_name || '',
        userType: data.user_type,
        status: data.status,
        groups: data.user_group_memberships?.map((membership: any) => 
          membership.user_groups.name
        ) || [],
        createdAt: data.created_at,
        lastLogin: data.last_login,
        mfaEnabled: mfaEnabled || false
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_type: userData.userType
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Create user record in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          user_type: userData.userType,
          status: userData.status
        })

      if (userError) throw userError

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName
        })

      if (profileError) throw profileError

      // Add user to groups
      if (userData.groups.length > 0) {
        await this.updateUserGroups(authData.user.id, userData.groups)
      }

      // Enable MFA if required
      if (userData.requireMFA) {
        // This would typically be done by the user themselves
        // For now, we just mark it as required in the user metadata
        await supabase.auth.admin.updateUserById(authData.user.id, {
          user_metadata: {
            ...authData.user.user_metadata,
            mfa_required: true
          }
        })
      }

      // Log audit event
      await this.logAuditEvent('user_created', 'users', authData.user.id, null, {
        email: userData.email,
        userType: userData.userType,
        groups: userData.groups
      })

      return {
        id: authData.user.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        status: userData.status,
        groups: userData.groups,
        createdAt: authData.user.created_at,
        mfaEnabled: userData.requireMFA
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      const oldUser = await this.getUser(userId)
      if (!oldUser) throw new Error('User not found')

      // Update user record
      const updateData: any = {}
      if (userData.userType) updateData.user_type = userData.userType
      if (userData.status) updateData.status = userData.status

      if (Object.keys(updateData).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)

        if (userError) throw userError
      }

      // Update user profile
      const profileUpdateData: any = {}
      if (userData.firstName) profileUpdateData.first_name = userData.firstName
      if (userData.lastName) profileUpdateData.last_name = userData.lastName

      if (Object.keys(profileUpdateData).length > 0) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdateData)
          .eq('user_id', userId)

        if (profileError) throw profileError
      }

      // Update user groups
      if (userData.groups) {
        await this.updateUserGroups(userId, userData.groups)
      }

      // Update MFA requirement
      if (userData.requireMFA !== undefined) {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        if (authUser?.user) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...authUser.user.user_metadata,
              mfa_required: userData.requireMFA
            }
          })
        }
      }

      // Log audit event
      await this.logAuditEvent('user_updated', 'users', userId, oldUser, userData)

      // Return updated user
      const updatedUser = await this.getUser(userId)
      if (!updatedUser) throw new Error('Failed to fetch updated user')

      return updatedUser
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId)
      if (!user) throw new Error('User not found')

      // Remove user from all groups
      await supabase
        .from('user_group_memberships')
        .delete()
        .eq('user_id', userId)

      // Delete user profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)

      // Delete user record
      await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      // Delete from Supabase Auth
      await supabase.auth.admin.deleteUser(userId)

      // Log audit event
      await this.logAuditEvent('user_deleted', 'users', userId, user, null)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  /**
   * Update user's group memberships
   */
  private static async updateUserGroups(userId: string, groupNames: string[]): Promise<void> {
    try {
      // Remove existing group memberships
      await supabase
        .from('user_group_memberships')
        .delete()
        .eq('user_id', userId)

      if (groupNames.length === 0) return

      // Get group IDs
      const { data: groups, error: groupError } = await supabase
        .from('user_groups')
        .select('id, name')
        .in('name', groupNames)

      if (groupError) throw groupError

      // Add new group memberships
      const memberships = groups.map(group => ({
        user_id: userId,
        group_id: group.id
      }))

      const { error: membershipError } = await supabase
        .from('user_group_memberships')
        .insert(memberships)

      if (membershipError) throw membershipError
    } catch (error) {
      console.error('Error updating user groups:', error)
      throw error
    }
  }

  /**
   * Suspend a user
   */
  static async suspendUser(userId: string, reason?: string): Promise<void> {
    try {
      await this.updateUser(userId, { status: 'suspended' })

      // Log audit event with reason
      await this.logAuditEvent('user_suspended', 'users', userId, null, { reason })
    } catch (error) {
      console.error('Error suspending user:', error)
      throw error
    }
  }

  /**
   * Activate a user
   */
  static async activateUser(userId: string): Promise<void> {
    try {
      await this.updateUser(userId, { status: 'active' })

      // Log audit event
      await this.logAuditEvent('user_activated', 'users', userId, null, null)
    } catch (error) {
      console.error('Error activating user:', error)
      throw error
    }
  }

  /**
   * Reset user password
   */
  static async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) throw error

      // Log audit event
      await this.logAuditEvent('password_reset', 'users', userId, null, null)
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  /**
   * Get user's login history
   */
  static async getUserLoginHistory(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('action', 'user_signin')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching login history:', error)
      return []
    }
  }

  /**
   * Log audit event
   */
  private static async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
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