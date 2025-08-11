import React from 'react';
import { Card } from '../components/shared/Card';

export const ParkingManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Parking Management</h1>
          <p className="text-secondary-600 mt-1">
            Manage your parking locations, sections, zones, and spots
          </p>
        </div>
      </div>

      <Card>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-600 text-2xl">🅿️</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Parking Management
          </h3>
          <p className="text-secondary-600 mb-4">
            This feature will be implemented in the next task. It will include:
          </p>
          <ul className="text-left text-secondary-600 space-y-2 max-w-md mx-auto">
            <li>• Location hierarchy management (Location → Section → Zone → Spot)</li>
            <li>• GPS coordinate tagging for spots</li>
            <li>• Facility layout designer with drag-and-drop interface</li>
            <li>• Real-time occupancy tracking</li>
            <li>• Spot status management</li>
            <li>• Search and filtering capabilities</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};