import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { 
  vehicleService, 
  VehicleType, 
  VehicleBrand, 
  VehicleModel, 
  VehicleColor,
  Vehicle,
  CreateVehicleTypeData,
  CreateVehicleBrandData,
  CreateVehicleModelData,
  CreateVehicleColorData
} from '../services/vehicleService'

type TabType = 'types' | 'brands' | 'models' | 'colors' | 'vehicles'

interface VehicleTypeFormData extends CreateVehicleTypeData {}
interface VehicleBrandFormData extends CreateVehicleBrandData {}
interface VehicleModelFormData extends CreateVehicleModelData {}
interface VehicleColorFormData extends CreateVehicleColorData {}

export const VehicleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('types')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([])
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [vehicleColors, setVehicleColors] = useState<VehicleColor[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<TabType>('types')

  // Form states
  const [vehicleTypeForm, setVehicleTypeForm] = useState<VehicleTypeFormData>({ name: '', description: '' })
  const [vehicleBrandForm, setVehicleBrandForm] = useState<VehicleBrandFormData>({ name: '' })
  const [vehicleModelForm, setVehicleModelForm] = useState<VehicleModelFormData>({ brandId: '', name: '', year: undefined })
  const [vehicleColorForm, setVehicleColorForm] = useState<VehicleColorFormData>({ name: '', hexCode: '' })

  const tabs = [
    { id: 'types' as TabType, name: 'Vehicle Types', count: vehicleTypes.length },
    { id: 'brands' as TabType, name: 'Brands', count: vehicleBrands.length },
    { id: 'models' as TabType, name: 'Models', count: vehicleModels.length },
    { id: 'colors' as TabType, name: 'Colors', count: vehicleColors.length },
    { id: 'vehicles' as TabType, name: 'User Vehicles', count: vehicles.length },
  ]

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      switch (activeTab) {
        case 'types': {
          const types = await vehicleService.getVehicleTypes()
          setVehicleTypes(types)
          break
        }
        case 'brands': {
          const brands = await vehicleService.getVehicleBrands()
          setVehicleBrands(brands)
          break
        }
        case 'models': {
          const models = await vehicleService.getVehicleModels()
          setVehicleModels(models)
          break
        }
        case 'colors': {
          const colors = await vehicleService.getVehicleColors()
          setVehicleColors(colors)
          break
        }
        case 'vehicles': {
          const userVehicles = await vehicleService.getUserVehicles()
          setVehicles(userVehicles)
          break
        }
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
    setVehicleTypeForm({ name: '', description: '' })
    setVehicleBrandForm({ name: '' })
    setVehicleModelForm({ brandId: '', name: '', year: undefined })
    setVehicleColorForm({ name: '', hexCode: '' })

    // Populate form if editing
    if (item) {
      switch (type) {
        case 'types':
          setVehicleTypeForm({ name: item.name, description: item.description || '' })
          break
        case 'brands':
          setVehicleBrandForm({ name: item.name })
          break
        case 'models':
          setVehicleModelForm({ brandId: item.brandId, name: item.name, year: item.year })
          break
        case 'colors':
          setVehicleColorForm({ name: item.name, hexCode: item.hexCode || '' })
          break
      }
    }

    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setModalType('types')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      switch (modalType) {
        case 'types':
          if (editingItem) {
            await vehicleService.updateVehicleType(editingItem.id, vehicleTypeForm)
          } else {
            await vehicleService.createVehicleType(vehicleTypeForm)
          }
          break
        case 'brands':
          if (editingItem) {
            await vehicleService.updateVehicleBrand(editingItem.id, vehicleBrandForm)
          } else {
            await vehicleService.createVehicleBrand(vehicleBrandForm)
          }
          break
        case 'models':
          if (editingItem) {
            await vehicleService.updateVehicleModel(editingItem.id, vehicleModelForm)
          } else {
            await vehicleService.createVehicleModel(vehicleModelForm)
          }
          break
        case 'colors':
          if (editingItem) {
            await vehicleService.updateVehicleColor(editingItem.id, vehicleColorForm)
          } else {
            await vehicleService.createVehicleColor(vehicleColorForm)
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
        case 'types':
          await vehicleService.deleteVehicleType(id)
          break
        case 'brands':
          await vehicleService.deleteVehicleBrand(id)
          break
        case 'models':
          await vehicleService.deleteVehicleModel(id)
          break
        case 'colors':
          await vehicleService.deleteVehicleColor(id)
          break
      }

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const renderVehicleTypesTable = () => {
    const columns = [
      {
        key: 'name',
        label: 'Name',
        render: (type: VehicleType) => (
          <div className="font-medium text-gray-900">{type.name}</div>
        )
      },
      {
        key: 'description',
        label: 'Description',
        render: (type: VehicleType) => (
          <div className="text-sm text-gray-600">{type.description || '-'}</div>
        )
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (type: VehicleType) => (
          <div className="text-sm text-gray-600">
            {type.createdAt.toLocaleDateString()}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (type: VehicleType) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('types', type)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete('types', type.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ]

    return <DataTable data={vehicleTypes} columns={columns} />
  }

  const renderVehicleBrandsTable = () => {
    const columns = [
      {
        key: 'name',
        label: 'Brand Name',
        render: (brand: VehicleBrand) => (
          <div className="font-medium text-gray-900">{brand.name}</div>
        )
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (brand: VehicleBrand) => (
          <div className="text-sm text-gray-600">
            {brand.createdAt.toLocaleDateString()}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (brand: VehicleBrand) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('brands', brand)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete('brands', brand.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ]

    return <DataTable data={vehicleBrands} columns={columns} />
  }

  const renderVehicleModelsTable = () => {
    const columns = [
      {
        key: 'name',
        label: 'Model Name',
        render: (model: VehicleModel) => (
          <div className="font-medium text-gray-900">{model.name}</div>
        )
      },
      {
        key: 'brand',
        label: 'Brand',
        render: (model: VehicleModel) => {
          const brand = vehicleBrands.find(b => b.id === model.brandId)
          return (
            <div className="text-sm text-gray-600">{brand?.name || 'Unknown'}</div>
          )
        }
      },
      {
        key: 'year',
        label: 'Year',
        render: (model: VehicleModel) => (
          <div className="text-sm text-gray-600">{model.year || '-'}</div>
        )
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (model: VehicleModel) => (
          <div className="text-sm text-gray-600">
            {model.createdAt.toLocaleDateString()}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (model: VehicleModel) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('models', model)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete('models', model.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ]

    return <DataTable data={vehicleModels} columns={columns} />
  }

  const renderVehicleColorsTable = () => {
    const columns = [
      {
        key: 'name',
        label: 'Color Name',
        render: (color: VehicleColor) => (
          <div className="flex items-center space-x-3">
            {color.hexCode && (
              <div 
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hexCode }}
              />
            )}
            <div className="font-medium text-gray-900">{color.name}</div>
          </div>
        )
      },
      {
        key: 'hexCode',
        label: 'Hex Code',
        render: (color: VehicleColor) => (
          <div className="text-sm text-gray-600 font-mono">{color.hexCode || '-'}</div>
        )
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (color: VehicleColor) => (
          <div className="text-sm text-gray-600">
            {color.createdAt.toLocaleDateString()}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (color: VehicleColor) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('colors', color)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete('colors', color.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ]

    return <DataTable data={vehicleColors} columns={columns} />
  }

  const renderVehiclesTable = () => {
    const columns = [
      {
        key: 'plateNumber',
        label: 'Plate Number',
        render: (vehicle: Vehicle) => (
          <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
        )
      },
      {
        key: 'details',
        label: 'Vehicle Details',
        render: (vehicle: Vehicle) => (
          <div className="text-sm text-gray-600">
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </div>
        )
      },
      {
        key: 'type',
        label: 'Type',
        render: (vehicle: Vehicle) => (
          <div className="text-sm text-gray-600 capitalize">{vehicle.type}</div>
        )
      },
      {
        key: 'color',
        label: 'Color',
        render: (vehicle: Vehicle) => (
          <div className="text-sm text-gray-600 capitalize">{vehicle.color}</div>
        )
      },
      {
        key: 'isPrimary',
        label: 'Primary',
        render: (vehicle: Vehicle) => (
          <div className="text-sm">
            {vehicle.isPrimary ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Secondary
              </span>
            )}
          </div>
        )
      },
      {
        key: 'createdAt',
        label: 'Registered',
        render: (vehicle: Vehicle) => (
          <div className="text-sm text-gray-600">
            {vehicle.createdAt.toLocaleDateString()}
          </div>
        )
      }
    ]

    return <DataTable data={vehicles} columns={columns} />
  }

  const renderModalContent = () => {
    switch (modalType) {
      case 'types':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Type Name"
              value={vehicleTypeForm.name}
              onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, name: e.target.value })}
              required
              placeholder="e.g., Car, Motorcycle, Truck"
            />
            <Input
              label="Description"
              value={vehicleTypeForm.description}
              onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, description: e.target.value })}
              placeholder="Optional description"
            />
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingItem ? 'Update' : 'Create'} Type
              </Button>
            </div>
          </form>
        )

      case 'brands':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Brand Name"
              value={vehicleBrandForm.name}
              onChange={(e) => setVehicleBrandForm({ ...vehicleBrandForm, name: e.target.value })}
              required
              placeholder="e.g., Toyota, Honda, Ford"
            />
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingItem ? 'Update' : 'Create'} Brand
              </Button>
            </div>
          </form>
        )

      case 'models':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={vehicleModelForm.brandId}
                onChange={(e) => setVehicleModelForm({ ...vehicleModelForm, brandId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a brand</option>
                {vehicleBrands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Model Name"
              value={vehicleModelForm.name}
              onChange={(e) => setVehicleModelForm({ ...vehicleModelForm, name: e.target.value })}
              required
              placeholder="e.g., Camry, Civic, F-150"
            />
            <Input
              label="Year (Optional)"
              type="number"
              value={vehicleModelForm.year || ''}
              onChange={(e) => setVehicleModelForm({ ...vehicleModelForm, year: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 2023"
              min="1900"
              max={new Date().getFullYear() + 1}
            />
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingItem ? 'Update' : 'Create'} Model
              </Button>
            </div>
          </form>
        )

      case 'colors':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Color Name"
              value={vehicleColorForm.name}
              onChange={(e) => setVehicleColorForm({ ...vehicleColorForm, name: e.target.value })}
              required
              placeholder="e.g., Red, Blue, White"
            />
            <Input
              label="Hex Code (Optional)"
              value={vehicleColorForm.hexCode}
              onChange={(e) => setVehicleColorForm({ ...vehicleColorForm, hexCode: e.target.value })}
              placeholder="e.g., #FF0000"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
            {vehicleColorForm.hexCode && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Preview:</span>
                <div 
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: vehicleColorForm.hexCode }}
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingItem ? 'Update' : 'Create'} Color
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
      case 'types':
        return renderVehicleTypesTable()
      case 'brands':
        return renderVehicleBrandsTable()
      case 'models':
        return renderVehicleModelsTable()
      case 'colors':
        return renderVehicleColorsTable()
      case 'vehicles':
        return renderVehiclesTable()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage vehicle types, brands, models, colors, and user vehicles
          </p>
        </div>
        {activeTab !== 'vehicles' && (
          <Button onClick={() => openModal(activeTab)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add {activeTab.slice(0, -1)}
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
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
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
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType.slice(0, -1)}`}
      >
        {renderModalContent()}
      </Modal>
    </div>
  )
}