import React from 'react';
import { Card } from '../components/shared/Card';

export const CustomerManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Customer Management</h1>
          <p className="text-secondary-600 mt-1">
            Manage customers, VIP assignments, and customer support
          </p>
        </div>
      </div>

      <Card>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Customer Management
          </h3>
          <p className="text-secondary-600 mb-4">
            This feature will be implemented in the next task. It will include:
          </p>
          <ul className="text-left text-secondary-600 space-y-2 max-w-md mx-auto">
            <li>• Customer profile management interface</li>
            <li>• VIP assignment with four types (VVIP, Flex VVIP, Spot VIP, Spot Flex VIP)</li>
            <li>• Customer support messaging system</li>
            <li>• User account activation/deactivation</li>
            <li>• Customer search and filtering</li>
            <li>• Customer analytics and reporting</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};