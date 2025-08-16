// Report filters component for advanced filtering and sorting

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import {
  ReportQueryOptions,
  OperatorReportFilters,
} from '../../../../shared/src/types/operator-reporting';

interface ReportFiltersProps {
  filters: ReportQueryOptions;
  onChange: (filters: ReportQueryOptions) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<OperatorReportFilters>(
    filters.filters || {}
  );
  const [sortBy, setSortBy] = useState(filters.sort?.field || 'generated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort?.order || 'desc');



  const vehicleTypes = [
    'Car',
    'SUV',
    'Truck',
    'Van',
    'Motorcycle',
    'Bus',
  ];

  const userTypes = [
    { value: 'regular', label: 'Regular' },
    { value: 'vip', label: 'VIP' },
    { value: 'vvip', label: 'VVIP' },
    { value: 'flex_vip', label: 'Flex VIP' },
    { value: 'flex_vvip', label: 'Flex VVIP' },
  ];

  const paymentMethods = [
    'Credit Card',
    'Debit Card',
    'PayPal',
    'GCash',
    'PayMaya',
    'Cash',
  ];

  const discountTypes = [
    'Senior Citizen',
    'PWD',
    'Student',
    'Employee',
    'Bulk',
    'Promotional',
  ];

  const violationTypes = [
    'Overstay',
    'No Payment',
    'Wrong Spot',
    'Blocking',
    'Unauthorized Parking',
  ];

  const sortOptions = [
    { value: 'generated_at', label: 'Generated Date' },
    { value: 'title', label: 'Title' },
    { value: 'type', label: 'Report Type' },
    { value: 'record_count', label: 'Record Count' },
    { value: 'total_amount', label: 'Total Amount' },
  ];

  const handleApplyFilters = () => {
    onChange({
      ...filters,
      filters: localFilters,
      sort: {
        field: sortBy,
        order: sortOrder,
        type: 'string',
      },
    });
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setLocalFilters({});
    setSortBy('generated_at');
    setSortOrder('desc');
    onChange({
      ...filters,
      filters: {},
      sort: {
        field: 'generated_at',
        order: 'desc',
        type: 'string',
      },
    });
    setShowFilters(false);
  };

  const getActiveFilterCount = (): number => {
    return Object.keys(localFilters).filter(key => {
      const value = localFilters[key as keyof OperatorReportFilters];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowFilters(true)}
        className="relative"
      >
        Filters & Sort
        {getActiveFilterCount() > 0 && (
          <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getActiveFilterCount()}
          </span>
        )}
      </Button>

      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter & Sort Reports"
        size="lg"
      >
        <div className="space-y-6">
          {/* Sorting */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Sorting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Amount Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Minimum Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Maximum Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Types */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Vehicle Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {vehicleTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.vehicleTypes?.includes(type) || false}
                    onChange={(e) => {
                      const current = localFilters.vehicleTypes || [];
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          vehicleTypes: [...current, type]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          vehicleTypes: current.filter(t => t !== type)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* User Types */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">User Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {userTypes.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.userTypes?.includes(type.value as any) || false}
                    onChange={(e) => {
                      const current = localFilters.userTypes || [];
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          userTypes: [...current, type.value as any]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          userTypes: current.filter(t => t !== type.value)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Payment Methods</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <label key={method} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.paymentMethods?.includes(method) || false}
                    onChange={(e) => {
                      const current = localFilters.paymentMethods || [];
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          paymentMethods: [...current, method]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          paymentMethods: current.filter(m => m !== method)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Discount Types */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Discount Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {discountTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.discountTypes?.includes(type) || false}
                    onChange={(e) => {
                      const current = localFilters.discountTypes || [];
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          discountTypes: [...current, type]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          discountTypes: current.filter(t => t !== type)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Violation Types */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Violation Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {violationTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.violationTypes?.includes(type) || false}
                    onChange={(e) => {
                      const current = localFilters.violationTypes || [];
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          violationTypes: [...current, type]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          violationTypes: current.filter(t => t !== type)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
            <Button
              variant="outline"
              onClick={handleResetFilters}
            >
              Reset All
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};