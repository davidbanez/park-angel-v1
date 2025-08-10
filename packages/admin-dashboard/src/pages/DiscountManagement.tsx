import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { 
  DiscountVATManagementService,
  DiscountVerificationDocument,
  VATConfig
} from '@park-angel/shared/src/services/discount-vat-management'
import { DiscountRule, CreateDiscountRuleData } from '@park-angel/shared/src/models/discount'
import { supabase } from '@park-angel/shared/src/lib/supabase'

type TabType = 'rules' | 'vat' | 'verification' | 'analytics'

interface DiscountRuleFormData extends CreateDiscountRuleData {
  operatorId?: string
}

interface VATConfigFormData {
  name: string
  rate: number
  isDefault: boolean
  operatorId?: string
}

export const DiscountManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('rules')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Services
  const [discountService] = useState(() => new DiscountVATManagementService(supabase))

  // Data states
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([])
  const [vatConfigs, setVATConfigs] = useState<VATConfig[]>([])
  const [verificationDocs, setVerificationDocs] = useState<DiscountVerificationDocument[]>([])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<TabType>('rules')

  // Form states
  const [discountRuleForm, setDiscountRuleForm] = useState<DiscountRuleFormData>({
    name: '',
    type: 'custom',
    percentage: 0,
    isVATExempt: false,
    conditions: [],
    isActive: true
  })
  const [vatConfigForm, setVATConfigForm] = useState<VATConfigFormData>({
    name: '',
    rate: 12,
    isDefault: false
  })

  const tabs = [
    { id: 'rules' as TabType, name: 'Discount Rules', count: discountRules.length },
    { id: 'vat' as TabType, name: 'VAT Configuration', count: vatConfigs.length },
    { id: 'verification' as TabType, name: 'Document Verification', count: verificationDocs.filter(d => d.status === 'pending').length },
    { id: 'analytics' as TabType, name: 'Analytics', count: 0 },
  ]

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      switch (activeTab) {
        case 'rules': {
          const rules = await discountService.getDiscountRules()
          setDiscountRules(rules)
          break
        }
        case 'vat': {
          const configs = await discountService.getVATConfigs()
          setVATConfigs(configs)
          break
        }
        case 'verification': {
          const docs = await discountService.getPendingVerificationDocuments()
          setVerificationDocs(docs)
          break
        }
        case 'analytics':
          // Load analytics data
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: TabType, item?: any) => {
    setModalType(type)
    setEditingItem(item)
    
    // Reset forms
    setDiscountRuleForm({
      name: '',
      type: 'custom',
      percentage: 0,
      isVATExempt: false,
      conditions: [],
      isActive: true
    })
    setVATConfigForm({
      name: '',
      rate: 12,
      isDefault: false
    })

    // Populate form if editing
    if (item) {
      switch (type) {
        case 'rules':
          setDiscountRuleForm({
            name: item.name,
            type: item.type,
            percentage: item.percentage.value,
            isVATExempt: item.isVATExempt,
            conditions: item.conditions,
            isActive: item.isActive
          })
          break
        case 'vat':
          setVATConfigForm({
            name: item.name,
            rate: item.rate,
            isDefault: item.isDefault,
            operatorId: item.operatorId
          })
          break
      }
    }

    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setModalType('rules')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      switch (modalType) {
        case 'rules':
          if (editingItem) {
            await discountService.updateDiscountRule(editingItem.id, discountRuleForm, 'admin')
          } else {
            await discountService.createDiscountRule({
              ...discountRuleForm,
              createdBy: 'admin' // In real app, get from auth context
            })
          }
          break
        case 'vat':
          if (editingItem) {
            await discountService.updateVATConfig(editingItem.id, vatConfigForm)
          } else {
            await discountService.createVATConfig(vatConfigForm)
          }
          break
      }

      closeModal()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (type: TabType, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setLoading(true)
    setError(null)

    try {
      switch (type) {
        case 'rules':
          await discountService.deleteDiscountRule(id)
          break
      }

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyDocument = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    setLoading(true)
    setError(null)

    try {
      await discountService.verifyDiscountDocument(documentId, 'admin', status, notes)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document')
    } finally {
      setLoading(false)
    }
  }

  const renderDiscountRulesTable = () => {
    const columns = [
      {
        key: 'name',
        label: 'Rule Name',
        render: (rule: DiscountRule) => (
          <div className="font-medium text-gray-900">{rule.name}</div>
        )
      },
      {
        key: 'type',
        label: 'Type',
        render: (rule: DiscountRule) => (
          <div className="text-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              rule.type === 'senior' ? 'bg-blue-100 text-blue-800' :
              rule.type === 'pwd' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {rule.type.toUpperCase()}
            </span>
          </div>
        )
      },
      {
        key: 'percentage',
        label: 'Discount %',
        render: (rule: DiscountRule) => (
          <div className="text-sm text-gray-900">{rule.percentage.value}%</div>
        )
      },
      {
        key: 'vatExempt',
        label: 'VAT Exempt',
        render: (rule: DiscountRule) => (
          <div className="text-sm">
            {rule.isVATExempt ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Yes
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                No
              </span>
            )}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Status',
        render: (rule: DiscountRule) => (
          <div className="text-sm">
            {rule.isActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (rule: DiscountRule) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('rules', rule)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete('rules', rule.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ]

    return <DataTable data={discountRules} columns={columns} />
  }

  const renderVATConfigTable = () => {
    const columns = [
      {
        key: 'name',
        label: 'Configuration Name',
        render: (config: VATConfig) => (
          <div className="font-medium text-gray-900">{config.name}</div>
        )
      },
      {
        key: 'rate',
        label: 'VAT Rate',
        render: (config: VATConfig) => (
          <div className="text-sm text-gray-900">{config.rate}%</div>
        )
      },
      {
        key: 'isDefault',
        label: 'Default',
        render: (config: VATConfig) => (
          <div className="text-sm">
            {config.isDefault ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Default
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                -
              </span>
            )}
          </div>
        )
      },
      {
        key: 'scope',
        label: 'Scope',
        render: (config: VATConfig) => (
          <div className="text-sm text-gray-600">
            {config.operatorId ? 'Operator Specific' : 'System Wide'}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (config: VATConfig) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('vat', config)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ]

    return <DataTable data={vatConfigs} columns={columns} />
  }

  const renderVerificationTable = () => {
    const columns = [
      {
        key: 'user',
        label: 'User',
        render: (doc: DiscountVerificationDocument) => (
          <div className="text-sm text-gray-900">{doc.userId}</div>
        )
      },
      {
        key: 'discountType',
        label: 'Discount Type',
        render: (doc: DiscountVerificationDocument) => (
          <div className="text-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              doc.discountType === 'senior' ? 'bg-blue-100 text-blue-800' :
              doc.discountType === 'pwd' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {doc.discountType.toUpperCase()}
            </span>
          </div>
        )
      },
      {
        key: 'documentType',
        label: 'Document Type',
        render: (doc: DiscountVerificationDocument) => (
          <div className="text-sm text-gray-600 capitalize">
            {doc.documentType.replace('_', ' ')}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Status',
        render: (doc: DiscountVerificationDocument) => (
          <div className="text-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              doc.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {doc.status}
            </span>
          </div>
        )
      },
      {
        key: 'submittedAt',
        label: 'Submitted',
        render: (doc: DiscountVerificationDocument) => (
          <div className="text-sm text-gray-600">
            {doc.createdAt.toLocaleDateString()}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (doc: DiscountVerificationDocument) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(doc.documentUrl, '_blank')}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            {doc.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVerifyDocument(doc.id, 'approved')}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVerifyDocument(doc.id, 'rejected')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      }
    ]

    return <DataTable data={verificationDocs} columns={columns} />
  }

  const renderModalContent = () => {
    switch (modalType) {
      case 'rules':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Rule Name"
              value={discountRuleForm.name}
              onChange={(e) => setDiscountRuleForm({ ...discountRuleForm, name: e.target.value })}
              required
              placeholder="e.g., Senior Citizen Discount"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type
              </label>
              <select
                value={discountRuleForm.type}
                onChange={(e) => setDiscountRuleForm({ ...discountRuleForm, type: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="senior">Senior Citizen</option>
                <option value="pwd">Person with Disability (PWD)</option>
                <option value="custom">Custom Discount</option>
              </select>
            </div>

            <Input
              label="Discount Percentage"
              type="number"
              value={discountRuleForm.percentage}
              onChange={(e) => setDiscountRuleForm({ ...discountRuleForm, percentage: parseFloat(e.target.value) || 0 })}
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="e.g., 20"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="vatExempt"
                checked={discountRuleForm.isVATExempt}
                onChange={(e) => setDiscountRuleForm({ ...discountRuleForm, isVATExempt: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="vatExempt" className="ml-2 block text-sm text-gray-900">
                VAT Exempt
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={discountRuleForm.isActive}
                onChange={(e) => setDiscountRuleForm({ ...discountRuleForm, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingItem ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </form>
        )

      case 'vat':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Configuration Name"
              value={vatConfigForm.name}
              onChange={(e) => setVATConfigForm({ ...vatConfigForm, name: e.target.value })}
              required
              placeholder="e.g., Standard VAT, Zero VAT"
            />

            <Input
              label="VAT Rate (%)"
              type="number"
              value={vatConfigForm.rate}
              onChange={(e) => setVATConfigForm({ ...vatConfigForm, rate: parseFloat(e.target.value) || 0 })}
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="e.g., 12"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={vatConfigForm.isDefault}
                onChange={(e) => setVATConfigForm({ ...vatConfigForm, isDefault: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                Set as Default
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingItem ? 'Update' : 'Create'} Configuration
              </Button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    switch (activeTab) {
      case 'rules':
        return renderDiscountRulesTable()
      case 'vat':
        return renderVATConfigTable()
      case 'verification':
        return renderVerificationTable()
      case 'analytics':
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Analytics dashboard coming soon...</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount & VAT Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage discount rules, VAT configuration, and document verification
          </p>
        </div>
        {(activeTab === 'rules' || activeTab === 'vat') && (
          <Button onClick={() => openModal(activeTab)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add {activeTab === 'rules' ? 'Discount Rule' : 'VAT Config'}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        {renderTabContent()}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType === 'rules' ? 'Discount Rule' : 'VAT Configuration'}`}
      >
        {renderModalContent()}
      </Modal>
    </div>
  )
}