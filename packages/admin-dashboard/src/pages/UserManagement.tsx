import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { UserService } from '../services/userService'
import { UserGroupService } from '../services/userGroupService'
import { AuditLogService } from '../services/auditLogService'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'admin' | 'staff' | 'operator'
  status: 'active' | 'inactive' | 'suspended'
  groups: string[]
  createdAt: string
  lastLogin?: string
}

interface UserGroup {
  id: string
  name: string
  description: string
  permissions: Permission[]
  memberCount: number
}

interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

interface AuditLog {
  id: string
  userId: string
  userEmail: string
  action: string
  resourceType: string
  resourceId: string | null
  timestamp: string
  details: Record<string, any>
}

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'audit'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'users': {
          const usersData = await UserService.getUsers()
          setUsers(usersData)
          break
        }
        case 'groups': {
          const groupsData = await UserGroupService.getUserGroups()
          setGroups(groupsData)
          break
        }
        case 'audit': {
          const auditData = await AuditLogService.getAuditLogs({ limit: 100 })
          setAuditLogs(auditData)
          break
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowUserModal(true)
  }

  const handleCreateGroup = () => {
    setEditingGroup(null)
    setShowGroupModal(true)
  }

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group)
    setShowGroupModal(true)
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAuditLogs = auditLogs.filter(log =>
    log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const userColumns = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name', render: (user: User) => `${user.firstName} ${user.lastName}` },
    { key: 'userType', label: 'Type' },
    { key: 'status', label: 'Status', render: (user: User) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.status === 'active' ? 'bg-green-100 text-green-800' :
        user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
        'bg-red-100 text-red-800'
      }`}>
        {user.status}
      </span>
    )},
    { key: 'groups', label: 'Groups', render: (user: User) => user.groups.join(', ') },
    { key: 'lastLogin', label: 'Last Login', render: (user: User) => 
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never' 
    },
    { key: 'actions', label: 'Actions', render: (user: User) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
          Edit
        </Button>
        <Button size="sm" variant="outline" color="red">
          {user.status === 'active' ? 'Suspend' : 'Activate'}
        </Button>
      </div>
    )}
  ]

  const groupColumns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'memberCount', label: 'Members' },
    { key: 'permissions', label: 'Permissions', render: (group: UserGroup) => 
      `${group.permissions.length} permissions`
    },
    { key: 'actions', label: 'Actions', render: (group: UserGroup) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={() => handleEditGroup(group)}>
          Edit
        </Button>
        <Button size="sm" variant="outline" color="red">
          Delete
        </Button>
      </div>
    )}
  ]

  const auditColumns = [
    { key: 'timestamp', label: 'Time', render: (log: AuditLog) => 
      new Date(log.timestamp).toLocaleString()
    },
    { key: 'userEmail', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'resourceType', label: 'Resource' },
    { key: 'details', label: 'Details', render: (log: AuditLog) => 
      JSON.stringify(log.details).substring(0, 50) + '...'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage admin users, staff users, and user groups
          </p>
        </div>
        
        <div className="flex space-x-3">
          {activeTab === 'users' && (
            <Button onClick={handleCreateUser}>
              Add User
            </Button>
          )}
          {activeTab === 'groups' && (
            <Button onClick={handleCreateGroup}>
              Create Group
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'users', label: 'Users' },
            { key: 'groups', label: 'User Groups' },
            { key: 'audit', label: 'Audit Logs' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Content */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <DataTable
                  data={filteredUsers}
                  columns={userColumns}
                  emptyMessage="No users found"
                />
              )}
              
              {activeTab === 'groups' && (
                <DataTable
                  data={filteredGroups}
                  columns={groupColumns}
                  emptyMessage="No user groups found"
                />
              )}
              
              {activeTab === 'audit' && (
                <DataTable
                  data={filteredAuditLogs}
                  columns={auditColumns}
                  emptyMessage="No audit logs found"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          groups={groups}
          onSave={async (userData) => {
            if (editingUser) {
              await UserService.updateUser(editingUser.id, userData)
            } else {
              await UserService.createUser(userData)
            }
            setShowUserModal(false)
            loadData()
          }}
          onClose={() => setShowUserModal(false)}
        />
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          onSave={async (groupData) => {
            if (editingGroup) {
              await UserGroupService.updateUserGroup(editingGroup.id, groupData)
            } else {
              await UserGroupService.createUserGroup(groupData)
            }
            setShowGroupModal(false)
            loadData()
          }}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  )
}

// User Modal Component
interface UserModalProps {
  user: User | null
  groups: UserGroup[]
  onSave: (userData: any) => Promise<void>
  onClose: () => void
}

const UserModal: React.FC<UserModalProps> = ({ user, groups, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    userType: user?.userType || 'staff',
    status: user?.status || 'active',
    groups: user?.groups || [],
    password: '',
    requireMFA: false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? 'Edit User' : 'Create User'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        {!user && (
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="operator">Operator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Groups
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {groups.map(group => (
              <label key={group.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.groups.includes(group.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, groups: [...formData.groups, group.name] })
                    } else {
                      setFormData({ ...formData, groups: formData.groups.filter(g => g !== group.name) })
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{group.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireMFA"
            checked={formData.requireMFA}
            onChange={(e) => setFormData({ ...formData, requireMFA: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="requireMFA" className="text-sm font-medium text-gray-700">
            Require Two-Factor Authentication
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {user ? 'Update' : 'Create'} User
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Group Modal Component
interface GroupModalProps {
  group: UserGroup | null
  onSave: (groupData: any) => Promise<void>
  onClose: () => void
}

const GroupModal: React.FC<GroupModalProps> = ({ group, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    permissions: group?.permissions || []
  })
  const [loading, setLoading] = useState(false)

  const availableResources = [
    'users', 'operators', 'locations', 'bookings', 'payments', 
    'reports', 'advertisements', 'api_management', 'settings'
  ]

  const availableActions = ['create', 'read', 'update', 'delete']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving group:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePermission = (resource: string, actions: string[]) => {
    const newPermissions = formData.permissions.filter(p => p.resource !== resource)
    if (actions.length > 0) {
      newPermissions.push({ resource, actions: actions as any })
    }
    setFormData({ ...formData, permissions: newPermissions })
  }

  const getPermissionActions = (resource: string): string[] => {
    const permission = formData.permissions.find(p => p.resource === resource)
    return permission ? permission.actions : []
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={group ? 'Edit User Group' : 'Create User Group'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permissions
          </label>
          <div className="space-y-4">
            {availableResources.map(resource => (
              <div key={resource} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 capitalize">
                  {resource.replace('_', ' ')}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {availableActions.map(action => (
                    <label key={action} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={getPermissionActions(resource).includes(action)}
                        onChange={(e) => {
                          const currentActions = getPermissionActions(resource)
                          const newActions = e.target.checked
                            ? [...currentActions, action]
                            : currentActions.filter(a => a !== action)
                          updatePermission(resource, newActions)
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {group ? 'Update' : 'Create'} Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}