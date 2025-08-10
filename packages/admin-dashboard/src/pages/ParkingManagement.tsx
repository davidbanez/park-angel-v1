import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable } from '../components/ui/DataTable'

interface Location {
  id: string
  name: string
  type: 'hosted' | 'street' | 'facility'
  operatorId: string
  operatorName: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  totalSpots: number
  occupiedSpots: number
  occupancyRate: number
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: Date
}

interface Section {
  id: string
  locationId: string
  name: string
  totalSpots: number
  occupiedSpots: number
  occupancyRate: number
  createdAt: Date
}

interface Zone {
  id: string
  sectionId: string
  name: string
  totalSpots: number
  occupiedSpots: number
  occupancyRate: number
  createdAt: Date
}

interface ParkingSpot {
  id: string
  zoneId: string
  number: string
  type: 'car' | 'motorcycle' | 'truck' | 'van' | 'suv'
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  coordinates: {
    latitude: number
    longitude: number
  }
  amenities: string[]
  createdAt: Date
}

export const ParkingManagement: React.FC = () => {
  const [activeView, setActiveView] = useState<'locations' | 'sections' | 'zones' | 'spots'>('locations')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  
  const [locations, setLocations] = useState<Location[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to get locations
      // Mock data for now
      setLocations([
        {
          id: '1',
          name: 'Downtown Parking Facility',
          type: 'facility',
          operatorId: '1',
          operatorName: 'Metro Parking Solutions',
          address: {
            street: '123 Main St',
            city: 'Manila',
            state: 'NCR',
            country: 'Philippines',
            postalCode: '1000',
          },
          coordinates: {
            latitude: 14.5995,
            longitude: 120.9842,
          },
          totalSpots: 150,
          occupiedSpots: 112,
          occupancyRate: 74.7,
          status: 'active',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Ayala Avenue Street Parking',
          type: 'street',
          operatorId: '1',
          operatorName: 'Metro Parking Solutions',
          address: {
            street: 'Ayala Avenue',
            city: 'Makati',
            state: 'NCR',
            country: 'Philippines',
            postalCode: '1226',
          },
          coordinates: {
            latitude: 14.5547,
            longitude: 121.0244,
          },
          totalSpots: 50,
          occupiedSpots: 35,
          occupancyRate: 70.0,
          status: 'active',
          createdAt: new Date('2024-02-01'),
        },
      ])
    } catch (error) {
      console.error('Error loading locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async (locationId: string) => {
    try {
      // TODO: Implement API call to get sections
      // Mock data for now
      setSections([
        {
          id: '1',
          locationId: locationId,
          name: 'Ground Floor',
          totalSpots: 75,
          occupiedSpots: 56,
          occupancyRate: 74.7,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          locationId: locationId,
          name: 'Second Floor',
          totalSpots: 75,
          occupiedSpots: 56,
          occupancyRate: 74.7,
          createdAt: new Date('2024-01-15'),
        },
      ])
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadZones = async (sectionId: string) => {
    try {
      // TODO: Implement API call to get zones
      // Mock data for now
      setZones([
        {
          id: '1',
          sectionId: sectionId,
          name: 'Zone A',
          totalSpots: 25,
          occupiedSpots: 18,
          occupancyRate: 72.0,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          sectionId: sectionId,
          name: 'Zone B',
          totalSpots: 25,
          occupiedSpots: 19,
          occupancyRate: 76.0,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '3',
          sectionId: sectionId,
          name: 'Zone C',
          totalSpots: 25,
          occupiedSpots: 19,
          occupancyRate: 76.0,
          createdAt: new Date('2024-01-15'),
        },
      ])
    } catch (error) {
      console.error('Error loading zones:', error)
    }
  }

  const loadSpots = async (zoneId: string) => {
    try {
      // TODO: Implement API call to get spots
      // Mock data for now
      const mockSpots: ParkingSpot[] = []
      for (let i = 1; i <= 25; i++) {
        mockSpots.push({
          id: `spot-${i}`,
          zoneId: zoneId,
          number: `A${i.toString().padStart(2, '0')}`,
          type: 'car',
          status: Math.random() > 0.3 ? 'occupied' : 'available',
          coordinates: {
            latitude: 14.5995 + (Math.random() - 0.5) * 0.001,
            longitude: 120.9842 + (Math.random() - 0.5) * 0.001,
          },
          amenities: ['covered', 'security'],
          createdAt: new Date('2024-01-15'),
        })
      }
      setSpots(mockSpots)
    } catch (error) {
      console.error('Error loading spots:', error)
    }
  }

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location)
    setSelectedSection(null)
    setSelectedZone(null)
    await loadSections(location.id)
    setActiveView('sections')
  }

  const handleSectionSelect = async (section: Section) => {
    setSelectedSection(section)
    setSelectedZone(null)
    await loadZones(section.id)
    setActiveView('zones')
  }

  const handleZoneSelect = async (zone: Zone) => {
    setSelectedZone(zone)
    await loadSpots(zone.id)
    setActiveView('spots')
  }

  const handleBackNavigation = () => {
    if (activeView === 'spots') {
      setActiveView('zones')
      setSelectedZone(null)
    } else if (activeView === 'zones') {
      setActiveView('sections')
      setSelectedSection(null)
    } else if (activeView === 'sections') {
      setActiveView('locations')
      setSelectedLocation(null)
    }
  }

  const getBreadcrumb = () => {
    const breadcrumbs = ['Locations']
    if (selectedLocation) {
      breadcrumbs.push(selectedLocation.name)
    }
    if (selectedSection) {
      breadcrumbs.push(selectedSection.name)
    }
    if (selectedZone) {
      breadcrumbs.push(selectedZone.name)
    }
    return breadcrumbs.join(' > ')
  }

  const getFilteredData = () => {
    switch (activeView) {
      case 'locations':
        return locations.filter(location =>
          location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.operatorName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      case 'sections':
        return sections.filter(section =>
          section.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      case 'zones':
        return zones.filter(zone =>
          zone.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      case 'spots':
        return spots.filter(spot =>
          spot.number.toLowerCase().includes(searchTerm.toLowerCase())
        )
      default:
        return []
    }
  }

  const getColumns = (): any[] => {
    switch (activeView) {
      case 'locations':
        return [
          {
            key: 'name',
            label: 'Location Name',
            render: (location: Location) => (
              <div>
                <div className="font-medium text-gray-900">{location.name}</div>
                <div className="text-sm text-gray-500 capitalize">{location.type} parking</div>
              </div>
            ),
          },
          {
            key: 'operator',
            label: 'Operator',
            render: (location: Location) => (
              <div className="text-sm text-gray-900">{location.operatorName}</div>
            ),
          },
          {
            key: 'address',
            label: 'Address',
            render: (location: Location) => (
              <div className="text-sm text-gray-900">
                {location.address.city}, {location.address.state}
              </div>
            ),
          },
          {
            key: 'occupancy',
            label: 'Occupancy',
            render: (location: Location) => (
              <div className="text-sm">
                <div>{location.occupiedSpots}/{location.totalSpots} spots</div>
                <div className="text-gray-500">{location.occupancyRate.toFixed(1)}% occupied</div>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (location: Location) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                location.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : location.status === 'maintenance'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {location.status}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (location: Location) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLocationSelect(location)}
                >
                  View Sections
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  Configure
                </Button>
              </div>
            ),
          },
        ]

      case 'sections':
        return [
          {
            key: 'name',
            label: 'Section Name',
            render: (section: Section) => (
              <div className="font-medium text-gray-900">{section.name}</div>
            ),
          },
          {
            key: 'occupancy',
            label: 'Occupancy',
            render: (section: Section) => (
              <div className="text-sm">
                <div>{section.occupiedSpots}/{section.totalSpots} spots</div>
                <div className="text-gray-500">{section.occupancyRate.toFixed(1)}% occupied</div>
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (section: Section) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionSelect(section)}
                >
                  View Zones
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  Configure
                </Button>
              </div>
            ),
          },
        ]

      case 'zones':
        return [
          {
            key: 'name',
            label: 'Zone Name',
            render: (zone: Zone) => (
              <div className="font-medium text-gray-900">{zone.name}</div>
            ),
          },
          {
            key: 'occupancy',
            label: 'Occupancy',
            render: (zone: Zone) => (
              <div className="text-sm">
                <div>{zone.occupiedSpots}/{zone.totalSpots} spots</div>
                <div className="text-gray-500">{zone.occupancyRate.toFixed(1)}% occupied</div>
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (zone: Zone) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoneSelect(zone)}
                >
                  View Spots
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  Configure
                </Button>
              </div>
            ),
          },
        ]

      case 'spots':
        return [
          {
            key: 'number',
            label: 'Spot Number',
            render: (spot: ParkingSpot) => (
              <div className="font-medium text-gray-900">{spot.number}</div>
            ),
          },
          {
            key: 'type',
            label: 'Vehicle Type',
            render: (spot: ParkingSpot) => (
              <div className="text-sm text-gray-900 capitalize">{spot.type}</div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (spot: ParkingSpot) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                spot.status === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : spot.status === 'occupied'
                  ? 'bg-red-100 text-red-800'
                  : spot.status === 'reserved'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {spot.status}
              </span>
            ),
          },
          {
            key: 'amenities',
            label: 'Amenities',
            render: (spot: ParkingSpot) => (
              <div className="text-sm text-gray-900">
                {spot.amenities.join(', ') || 'None'}
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (spot: ParkingSpot) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  Configure
                </Button>
                {spot.status === 'maintenance' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Mark Available
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  >
                    Mark Maintenance
                  </Button>
                )}
              </div>
            ),
          },
        ]

      default:
        return []
    }
  }

  const getCreateButtonText = () => {
    switch (activeView) {
      case 'locations':
        return 'Add Location'
      case 'sections':
        return 'Add Section'
      case 'zones':
        return 'Add Zone'
      case 'spots':
        return 'Add Spot'
      default:
        return 'Add'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parking Management</h1>
          <p className="mt-2 text-gray-600">
            Manage parking hierarchy and configurations
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          {getCreateButtonText()}
        </Button>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-4">
        <nav className="text-sm text-gray-500">
          {getBreadcrumb()}
        </nav>
        {activeView !== 'locations' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackNavigation}
          >
            ← Back
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeView === 'locations' && 'Locations'}
            {activeView === 'sections' && `Sections - ${selectedLocation?.name}`}
            {activeView === 'zones' && `Zones - ${selectedSection?.name}`}
            {activeView === 'spots' && `Parking Spots - ${selectedZone?.name}`}
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Input
              placeholder={`Search ${activeView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={getFilteredData() as any[]}
            columns={getColumns()}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={getCreateButtonText()}
        size="lg"
      >
        <div className="p-4">
          <p className="text-gray-600">Create form for {activeView} will be implemented here.</p>
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configuration"
        size="lg"
      >
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-4">Parking Type Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-purple-600">Hosted Parking</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    AirBnb-style private parking spaces with host management
                  </p>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
                    <Input placeholder="40%" className="mt-1" />
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-purple-600">Street Parking</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    On-street public parking with enforcement
                  </p>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                    <Input placeholder="₱50" className="mt-1" />
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-purple-600">Facility Parking</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Off-street parking garages with access control
                  </p>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Base Rate</label>
                    <Input placeholder="₱30" className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Save Configuration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}