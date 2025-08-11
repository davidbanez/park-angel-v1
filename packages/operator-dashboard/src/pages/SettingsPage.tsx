import React from 'react';
import { Card } from '../components/shared/Card';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Settings</h1>
          <p className="text-secondary-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Card>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-secondary-600 text-2xl">⚙️</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Settings
          </h3>
          <p className="text-secondary-600 mb-4">
            This feature will be implemented in future tasks. It will include:
          </p>
          <ul className="text-left text-secondary-600 space-y-2 max-w-md mx-auto">
            <li>• Company information management</li>
            <li>• Bank account details</li>
            <li>• User group management with permissions</li>
            <li>• Notification preferences</li>
            <li>• Security settings</li>
            <li>• API configuration</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};