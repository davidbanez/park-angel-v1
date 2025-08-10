import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Settings functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}