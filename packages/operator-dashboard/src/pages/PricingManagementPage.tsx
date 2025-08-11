import React from 'react';
import { Card } from '../components/shared/Card';

export const PricingManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Pricing Management</h1>
          <p className="text-secondary-600 mt-1">
            Configure hierarchical pricing and dynamic pricing rules
          </p>
        </div>
      </div>

      <Card>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Pricing Management
          </h3>
          <p className="text-secondary-600 mb-4">
            This feature will be implemented in the next task. It will include:
          </p>
          <ul className="text-left text-secondary-600 space-y-2 max-w-md mx-auto">
            <li>• Hierarchical pricing configuration (Location/Section/Zone/Spot)</li>
            <li>• Dynamic pricing engine with occupancy-based adjustments</li>
            <li>• Vehicle type-specific pricing</li>
            <li>• Time-based and holiday pricing rules</li>
            <li>• Pricing inheritance and override system</li>
            <li>• Discount configuration for operators</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};