import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable } from '../components/ui/DataTable'
import { OperatorSummary, CreateOperatorProfileData, OperatorProfile, OperatorBankDetails, OperatorRevenueConfig, VIPAssignment } from '../../../shared/src/types/operator'

interface OperatorManagementProps {}

export const OperatorManagement: React.FC<OperatorManagementProps> = () => {
  const [operators, setOperators] = useState<OperatorSummary[]>([])
  const [selectedOperator, setSelectedOperator] = useState<OperatorSummary | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Operator details state
  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile | null>(null)
  const [bankDetails, setBankDetails] = useState<OperatorBankDetails[]>([])
  const [revenueConfigs, setRevenueConfigs] = useState<OperatorRevenueConfig[]>([])
  const [vipAssignments, setVipAssignments] = useState<VIPAssignment[]>([])

  useEffect(() => {
    loadOperators()
  }, [])

  const loadOperators = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to get operators
      // const operatorService = new OperatorManagementServiceImpl(supabase)
      // const data = await operatorService.getAllOperators()
      // setOperators(data)
      
      // Mock data for now
      setOperators([
        {
          id: '1',
          companyName: 'Metro Parking Solutions',
          contactPerson: 'John Doe',
          contactEmail: 'john@metroparking.com',
          isVerified: true,
          totalLocations: 5,
          totalSpots: 250,
          currentOccupancyRate: 75.5,
          monthlyRevenue: 125000,
          status: 'active',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          companyName: 'City Center Parking',
          contactPerson: 'Jane Smith',
          contactEmail: 'jane@citycenter.com',
          isVerified: false,
          totalLocations: 3,
          totalSpots: 180,
          currentOccupancyRate: 68.2,
          monthlyRevenue: 89000,
          status: 'active',
          createdAt: new Date('2024-02-20'),
        },
      ])
    } catch (error) {
      console.error('Error loading operators:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOperatorDetails = async (operatorId: string) => {
    try {
      // TODO: Implement API calls to get operator details
      // const operatorService = new OperatorManagementServiceImpl(supabase)
      // const profile = await operatorService.getOperatorProfile(operatorId)
      // const banks = await operatorService.getBankDetails(operatorId)
      // const configs = await operatorService.getRevenueConfigs(operatorId)
      // const vips = await operatorService.getVIPAssignments(operatorId)
      
      // Mock data for now
      setOperatorProfile({
        id: '1',
        operatorId: operatorId,
        companyName: 'Metro Parking Solutions',
        businessRegistrationNumber: 'BRN-123456789',
        taxIdentificationNumber: 'TIN-987654321',
        businessAddress: {
          street: '123 Business Ave',
          city: 'Manila',
          state: 'NCR',
          country: 'Philippines',
          postalCode: '1000',
        },
        contactPerson: 'John Doe',
        contactPhone: '+63-912-345-6789',
        contactEmail: 'john@metroparking.com',
        websiteUrl: 'https://metroparking.com',
        businessType: 'corporation',
        licenseNumber: 'LIC-2024-001',
        licenseExpiryDate: new Date('2025-12-31'),
        isVerified: true,
        verificationDocuments: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      })

      setBankDetails([
        {
          id: '1',
          operatorId: operatorId,
          bankName: 'BPI',
          accountHolderName: 'Metro Parking Solutions Inc.',
          accountNumber: '1234-5678-90',
          routingNumber: '010230001',
          swiftCode: 'BOPIPHMM',
          branchName: 'Makati Branch',
          branchAddress: 'Ayala Avenue, Makati City',
          accountType: 'checking',
          isPrimary: true,
          isVerified: true,
          verificationDocuments: [],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ])

      setRevenueConfigs([
        {
          id: '1',
          operatorId: operatorId,
          parkingType: 'street',
          operatorPercentage: 70,
          parkAngelPercentage: 30,
          isActive: true,
          effectiveDate: new Date('2024-01-01'),
          createdBy: 'admin',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          operatorId: operatorId,
          parkingType: 'facility',
          operatorPercentage: 75,
          parkAngelPercentage: 25,
          isActive: true,
          effectiveDate: new Date('2024-01-01'),
          createdBy: 'admin',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ])

      setVipAssignments([
        {
          id: '1',
          userId: 'user-1',
          operatorId: operatorId,
          vipType: 'VVIP',
          locationId: 'loc-1',
          spotIds: [],
          isActive: true,
          validFrom: new Date('2024-01-01'),
          assignedBy: 'admin',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ])
    } catch (error) {
      console.error('Error loading operator details:', error)
    }
  }

  const handleViewOperator = async (operator: OperatorSummary) => {
    setSelectedOperator(operator)
    await loadOperatorDetails(operator.id)
    setShowDetailsModal(true)
  }

  const handleCreateOperator = () => {
    setShowCreateModal(true)
  }

  const handleVerifyOperator = async (operatorId: string) => {
    try {
      // TODO: Implement API call to verify operator
      console.log('Verifying operator:', operatorId)
      await loadOperators() // Refresh the list
    } catch (error) {
      console.error('Error verifying operator:', error)
    }
  }

  const filteredOperators = operators.filter(operator =>
    operator.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const operatorColumns = [
    {
      key: 'companyName',
      label: 'Company Name',
      render: (operator: OperatorSummary) => (
        <div>
          <div className="font-medium text-gray-900">{operator.companyName}</div>
          <div className="text-sm text-gray-500">{operator.contactPerson}</div>
        </div>
      ),
    },
    {
      key: 'contactEmail',
      label: 'Contact',
      render: (operator: OperatorSummary) => (
        <div className="text-sm text-gray-900">{operator.contactEmail}</div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (operator: OperatorSummary) => (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            operator.isVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {operator.isVerified ? 'Verified' : 'Pending'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            operator.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {operator.status}
          </span>
        </div>
      ),
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (operator: OperatorSummary) => (
        <div className="text-sm">
          <div>{operator.totalLocations} locations</div>
          <div>{operator.totalSpots} spots</div>
          <div>{operator.currentOccupancyRate.toFixed(1)}% occupied</div>
        </div>
      ),
    },
    {
      key: 'revenue',
      label: 'Monthly Revenue',
      render: (operator: OperatorSummary) => (
        <div className="text-sm font-medium text-gray-900">
          ₱{operator.monthlyRevenue.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (operator: OperatorSummary) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOperator(operator)}
          >
            View Details
          </Button>
          {!operator.isVerified && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerifyOperator(operator.id)}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              Verify
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operator Management</h1>
          <p className="mt-2 text-gray-600">
            Manage parking operators and their configurations
          </p>
        </div>
        <Button onClick={handleCreateOperator} className="bg-purple-600 hover:bg-purple-700">
          Add New Operator
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operators</CardTitle>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOperators}
            columns={operatorColumns}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Create Operator Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Operator"
        size="lg"
      >
        <CreateOperatorForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadOperators()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Operator Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Operator Details - ${selectedOperator?.companyName}`}
        size="xl"
      >
        {selectedOperator && (
          <OperatorDetailsView
            operator={selectedOperator}
            profile={operatorProfile}
            bankDetails={bankDetails}
            revenueConfigs={revenueConfigs}
            vipAssignments={vipAssignments}
            onUpdate={() => {
              loadOperatorDetails(selectedOperator.id)
              loadOperators()
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// Create Operator Form Component
interface CreateOperatorFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const CreateOperatorForm: React.FC<CreateOperatorFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Partial<CreateOperatorProfileData>>({
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      country: 'Philippines',
      postalCode: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // TODO: Implement API call to create operator
      console.log('Creating operator:', formData)
      onSuccess()
    } catch (error) {
      console.error('Error creating operator:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <Input
            required
            value={formData.companyName || ''}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Person</label>
          <Input
            required
            value={formData.contactPerson || ''}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Email</label>
          <Input
            type="email"
            required
            value={formData.contactEmail || ''}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
          <Input
            required
            value={formData.contactPhone || ''}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Business Address</label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Input
            placeholder="Street"
            value={formData.businessAddress?.street || ''}
            onChange={(e) => setFormData({
              ...formData,
              businessAddress: { ...formData.businessAddress!, street: e.target.value }
            })}
          />
          <Input
            placeholder="City"
            value={formData.businessAddress?.city || ''}
            onChange={(e) => setFormData({
              ...formData,
              businessAddress: { ...formData.businessAddress!, city: e.target.value }
            })}
          />
          <Input
            placeholder="State"
            value={formData.businessAddress?.state || ''}
            onChange={(e) => setFormData({
              ...formData,
              businessAddress: { ...formData.businessAddress!, state: e.target.value }
            })}
          />
          <Input
            placeholder="Postal Code"
            value={formData.businessAddress?.postalCode || ''}
            onChange={(e) => setFormData({
              ...formData,
              businessAddress: { ...formData.businessAddress!, postalCode: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
          Create Operator
        </Button>
      </div>
    </form>
  )
}

// Operator Details View Component
interface OperatorDetailsViewProps {
  operator: OperatorSummary
  profile: OperatorProfile | null
  bankDetails: OperatorBankDetails[]
  revenueConfigs: OperatorRevenueConfig[]
  vipAssignments: VIPAssignment[]
  onUpdate: () => void
}

const OperatorDetailsView: React.FC<OperatorDetailsViewProps> = ({
  profile,
  bankDetails,
  revenueConfigs,
  vipAssignments,
}) => {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'banking', label: 'Banking' },
    { id: 'revenue', label: 'Revenue Sharing' },
    { id: 'vip', label: 'VIP Users' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Operator Profile</h3>
          {profile ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <p className="mt-1 text-sm text-gray-900">{profile.companyName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <p className="mt-1 text-sm text-gray-900">{profile.contactPerson}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{profile.contactEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{profile.contactPhone}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Business Address</label>
                <p className="mt-1 text-sm text-gray-900">
                  {profile.businessAddress.street}, {profile.businessAddress.city}, {profile.businessAddress.state} {profile.businessAddress.postalCode}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{profile.businessType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No profile information available</p>
          )}
        </div>
      )}

      {activeTab === 'banking' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bank Details</h3>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Add Bank Account
            </Button>
          </div>
          {bankDetails.length > 0 ? (
            <div className="space-y-4">
              {bankDetails.map((bank) => (
                <Card key={bank.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                          <p className="mt-1 text-sm text-gray-900">{bank.bankName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Account Holder</label>
                          <p className="mt-1 text-sm text-gray-900">{bank.accountHolderName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Account Number</label>
                          <p className="mt-1 text-sm text-gray-900">****{bank.accountNumber.slice(-4)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Account Type</label>
                          <p className="mt-1 text-sm text-gray-900 capitalize">{bank.accountType}</p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {bank.isPrimary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bank.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bank.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No bank details available</p>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Revenue Sharing Configuration</h3>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Update Configuration
            </Button>
          </div>
          {revenueConfigs.length > 0 ? (
            <div className="space-y-4">
              {revenueConfigs.map((config) => (
                <Card key={config.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parking Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{config.parkingType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Operator Share</label>
                        <p className="mt-1 text-sm text-gray-900">{config.operatorPercentage}%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Park Angel Share</label>
                        <p className="mt-1 text-sm text-gray-900">{config.parkAngelPercentage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No revenue sharing configuration available</p>
          )}
        </div>
      )}

      {activeTab === 'vip' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">VIP User Assignments</h3>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Assign VIP User
            </Button>
          </div>
          {vipAssignments.length > 0 ? (
            <div className="space-y-4">
              {vipAssignments.map((vip) => (
                <Card key={vip.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">VIP Type</label>
                        <p className="mt-1 text-sm text-gray-900">{vip.vipType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valid From</label>
                        <p className="mt-1 text-sm text-gray-900">{vip.validFrom.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vip.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vip.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No VIP assignments available</p>
          )}
        </div>
      )}
    </div>
  )
}