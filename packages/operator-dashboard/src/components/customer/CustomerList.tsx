import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { customerManagementService } from '../../../../shared/src/services/customer-management';
import type { CustomerProfile, VIPType } from '../../../../shared/src/types/user';

interface CustomerListProps {
  operatorId: string;
  onCustomerSelect?: (customer: CustomerProfile) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ operatorId, onCustomerSelect }) => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vipFilter, setVipFilter] = useState<VIPType | 'all'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [operatorId, searchTerm, statusFilter, vipFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        limit: 50,
        offset: 0
      };

      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (vipFilter !== 'all') filters.vipType = vipFilter;

      const { customers: fetchedCustomers } = await customerManagementService.getCustomers(operatorId, filters);
      setCustomers(fetchedCustomers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (customerId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await customerManagementService.updateCustomerStatus(customerId, newStatus);
      await loadCustomers(); // Reload the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVIPBadge = (vipAssignments: any[]) => {
    const activeVIP = vipAssignments?.find(vip => vip.isActive);
    if (!activeVIP) return null;

    const vipColors = {
      vvip: 'bg-purple-100 text-purple-800',
      flex_vvip: 'bg-blue-100 text-blue-800',
      spot_vip: 'bg-yellow-100 text-yellow-800',
      spot_flex_vip: 'bg-orange-100 text-orange-800'
    };

    const vipLabels = {
      vvip: 'VVIP',
      flex_vvip: 'Flex VVIP',
      spot_vip: 'Spot VIP',
      spot_flex_vip: 'Spot Flex VIP'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${vipColors[activeVIP.vipType as keyof typeof vipColors]}`}>
        {vipLabels[activeVIP.vipType as keyof typeof vipLabels]}
      </span>
    );
  };

  const openCustomerModal = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-secondary-600">Loading customers...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error loading customers</p>
          <p className="text-secondary-600 mt-1">{error}</p>
          <Button onClick={loadCustomers} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value as VIPType | 'all')}
                className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All VIP Types</option>
                <option value="vvip">VVIP</option>
                <option value="flex_vvip">Flex VVIP</option>
                <option value="spot_vip">Spot VIP</option>
                <option value="spot_flex_vip">Spot Flex VIP</option>
              </select>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-secondary-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No customers found</h3>
              <p className="text-secondary-600">
                {searchTerm || statusFilter !== 'all' || vipFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No customers have been registered yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      VIP Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {customer.profile.firstName.charAt(0)}{customer.profile.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {customer.profile.firstName} {customer.profile.lastName}
                            </div>
                            <div className="text-sm text-secondary-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVIPBadge(customer.vipAssignments || [])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {customer.analytics?.totalBookings || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        ${customer.analytics?.totalSpent?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openCustomerModal(customer)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            View
                          </button>
                          {onCustomerSelect && (
                            <button
                              onClick={() => onCustomerSelect(customer)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Select
                            </button>
                          )}
                          <select
                            value={customer.status}
                            onChange={(e) => handleStatusChange(customer.id, e.target.value as any)}
                            className="text-sm border-none bg-transparent text-secondary-600 hover:text-secondary-900 focus:outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Detail Modal */}
      {showCustomerModal && selectedCustomer && (
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title={`${selectedCustomer.profile.firstName} ${selectedCustomer.profile.lastName}`}
        >
          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-medium text-secondary-900 mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary-500">Email:</span>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <span className="text-secondary-500">Phone:</span>
                  <p className="font-medium">{selectedCustomer.profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-secondary-500">Status:</span>
                  <p className="font-medium">{getStatusBadge(selectedCustomer.status)}</p>
                </div>
                <div>
                  <span className="text-secondary-500">Member Since:</span>
                  <p className="font-medium">{selectedCustomer.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* VIP Status */}
            {selectedCustomer.vipAssignments && selectedCustomer.vipAssignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-secondary-900 mb-3">VIP Status</h4>
                <div className="space-y-2">
                  {selectedCustomer.vipAssignments.map((vip) => (
                    <div key={vip.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div>
                        {getVIPBadge([vip])}
                        {vip.notes && <p className="text-sm text-secondary-600 mt-1">{vip.notes}</p>}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {vip.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics */}
            {selectedCustomer.analytics && (
              <div>
                <h4 className="text-sm font-medium text-secondary-900 mb-3">Customer Analytics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-500">Total Bookings:</span>
                    <p className="font-medium">{selectedCustomer.analytics.totalBookings}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Total Spent:</span>
                    <p className="font-medium">${selectedCustomer.analytics.totalSpent.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Loyalty Score:</span>
                    <p className="font-medium">{selectedCustomer.analytics.loyaltyScore}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Last Booking:</span>
                    <p className="font-medium">
                      {selectedCustomer.analytics.lastBookingDate?.toLocaleDateString() || 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};