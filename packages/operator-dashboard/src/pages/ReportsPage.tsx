import React from 'react';
import { Card } from '../components/shared/Card';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Reports & Analytics</h1>
          <p className="text-secondary-600 mt-1">
            Comprehensive reporting with advanced filtering and export capabilities
          </p>
        </div>
      </div>

      <Card>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-orange-600 text-2xl">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Reports & Analytics
          </h3>
          <p className="text-secondary-600 mb-4">
            This feature will be implemented in the next task. It will include:
          </p>
          <ul className="text-left text-secondary-600 space-y-2 max-w-md mx-auto">
            <li>• Revenue, occupancy, and user behavior reports</li>
            <li>• Violation and VIP usage statistics</li>
            <li>• Zone performance analytics</li>
            <li>• Advanced filtering, sorting, and live search</li>
            <li>• Export functionality (PDF, Excel)</li>
            <li>• Real-time dashboard metrics</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};