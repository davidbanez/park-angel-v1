import { supabase } from '../../../shared/src/lib/supabase'

export interface AuditLog {
  id: string
  userId: string
  userEmail: string
  userName: string
  action: string
  resourceType: string
  resourceId: string | null
  oldValues: Record<string, any> | null
  newValues: Record<string, any> | null
  timestamp: string
  ipAddress?: string
  userAgent?: string
  details: Record<string, any>
}

export interface AuditLogFilters {
  userId?: string
  action?: string
  resourceType?: string
  resourceId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AuditLogSummary {
  totalLogs: number
  uniqueUsers: number
  topActions: { action: string; count: number }[]
  topResources: { resourceType: string; count: number }[]
  recentActivity: AuditLog[]
}

export class AuditLogService {
  /**
   * Get audit logs with optional filtering
   */
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          old_values,
          new_values,
          created_at,
          ip_address,
          user_agent,
          users (
            email,
            user_profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
      }

      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId)
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.users?.email || 'Unknown',
        userName: log.users?.user_profiles 
          ? `${log.users.user_profiles.first_name || ''} ${log.users.user_profiles.last_name || ''}`.trim()
          : 'Unknown',
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        oldValues: log.old_values,
        newValues: log.new_values,
        timestamp: log.created_at,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        details: {
          oldValues: log.old_values,
          newValues: log.new_values
        }
      }))
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }
  }

  /**
   * Get a single audit log by ID
   */
  static async getAuditLog(logId: string): Promise<AuditLog | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          old_values,
          new_values,
          created_at,
          ip_address,
          user_agent,
          users (
            email,
            user_profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('id', logId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        userEmail: (data.users as any)?.email || 'Unknown',
        userName: (data.users as any)?.user_profiles 
          ? `${(data.users as any).user_profiles.first_name || ''} ${(data.users as any).user_profiles.last_name || ''}`.trim()
          : 'Unknown',
        action: data.action,
        resourceType: data.resource_type,
        resourceId: data.resource_id,
        oldValues: data.old_values,
        newValues: data.new_values,
        timestamp: data.created_at,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        details: {
          oldValues: data.old_values,
          newValues: data.new_values
        }
      }
    } catch (error) {
      console.error('Error fetching audit log:', error)
      return null
    }
  }

  /**
   * Get audit log summary statistics
   */
  static async getAuditLogSummary(days = 30): Promise<AuditLogSummary> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get total count
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      // Get unique users count
      const { data: uniqueUsersData } = await supabase
        .from('audit_logs')
        .select('user_id')
        .gte('created_at', startDate.toISOString())

      const uniqueUsers = new Set(uniqueUsersData?.map(log => log.user_id) || []).size

      // Get top actions
      const { data: actionsData } = await supabase
        .from('audit_logs')
        .select('action')
        .gte('created_at', startDate.toISOString())

      const actionCounts = actionsData?.reduce((acc: Record<string, number>, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {}) || {}

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get top resources
      const { data: resourcesData } = await supabase
        .from('audit_logs')
        .select('resource_type')
        .gte('created_at', startDate.toISOString())

      const resourceCounts = resourcesData?.reduce((acc: Record<string, number>, log) => {
        acc[log.resource_type] = (acc[log.resource_type] || 0) + 1
        return acc
      }, {}) || {}

      const topResources = Object.entries(resourceCounts)
        .map(([resourceType, count]) => ({ resourceType, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get recent activity
      const recentActivity = await this.getAuditLogs({ limit: 10 })

      return {
        totalLogs: totalLogs || 0,
        uniqueUsers,
        topActions,
        topResources,
        recentActivity
      }
    } catch (error) {
      console.error('Error fetching audit log summary:', error)
      return {
        totalLogs: 0,
        uniqueUsers: 0,
        topActions: [],
        topResources: [],
        recentActivity: []
      }
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit })
  }

  /**
   * Get resource activity logs
   */
  static async getResourceActivity(resourceType: string, resourceId?: string, limit = 50): Promise<AuditLog[]> {
    const filters: AuditLogFilters = { resourceType, limit }
    if (resourceId) {
      filters.resourceId = resourceId
    }
    return this.getAuditLogs(filters)
  }

  /**
   * Search audit logs
   */
  static async searchAuditLogs(searchTerm: string, limit = 50): Promise<AuditLog[]> {
    try {
      // This is a simplified search - in production you might want to use full-text search
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          old_values,
          new_values,
          created_at,
          ip_address,
          user_agent,
          users (
            email,
            user_profiles (
              first_name,
              last_name
            )
          )
        `)
        .or(`action.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%,resource_id.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.users?.email || 'Unknown',
        userName: log.users?.user_profiles 
          ? `${log.users.user_profiles.first_name || ''} ${log.users.user_profiles.last_name || ''}`.trim()
          : 'Unknown',
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        oldValues: log.old_values,
        newValues: log.new_values,
        timestamp: log.created_at,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        details: {
          oldValues: log.old_values,
          newValues: log.new_values
        }
      }))
    } catch (error) {
      console.error('Error searching audit logs:', error)
      throw error
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogs(filters: AuditLogFilters = {}): Promise<string> {
    try {
      const logs = await this.getAuditLogs({ ...filters, limit: 10000 }) // Large limit for export

      const headers = [
        'Timestamp',
        'User Email',
        'User Name',
        'Action',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'Details'
      ]

      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp,
          log.userEmail,
          log.userName,
          log.action,
          log.resourceType,
          log.resourceId || '',
          log.ipAddress || '',
          JSON.stringify(log.details).replace(/"/g, '""') // Escape quotes for CSV
        ].map(field => `"${field}"`).join(','))
      ]

      return csvRows.join('\n')
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      throw error
    }
  }

  /**
   * Get available actions for filtering
   */
  static async getAvailableActions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .order('action')

      if (error) throw error

      const uniqueActions = [...new Set(data.map(log => log.action))]
      return uniqueActions.sort()
    } catch (error) {
      console.error('Error fetching available actions:', error)
      return []
    }
  }

  /**
   * Get available resource types for filtering
   */
  static async getAvailableResourceTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('resource_type')
        .order('resource_type')

      if (error) throw error

      const uniqueResourceTypes = [...new Set(data.map(log => log.resource_type))]
      return uniqueResourceTypes.sort()
    } catch (error) {
      console.error('Error fetching available resource types:', error)
      return []
    }
  }

  /**
   * Create an audit log entry
   */
  static async createAuditLog(
    action: string,
    resourceType: string,
    resourceId: string | null = null,
    oldValues: Record<string, any> | null = null,
    newValues: Record<string, any> | null = null,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('audit_logs').insert({
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: additionalData.ipAddress,
        user_agent: additionalData.userAgent
      })
    } catch (error) {
      console.error('Error creating audit log:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Clean up old audit logs (for maintenance)
   */
  static async cleanupOldLogs(daysToKeep = 365): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      if (error) throw error

      const deletedCount = data?.length || 0

      // Log the cleanup operation
      await this.createAuditLog(
        'audit_logs_cleanup',
        'system',
        null,
        null,
        { deletedCount, cutoffDate: cutoffDate.toISOString() }
      )

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error)
      throw error
    }
  }
}