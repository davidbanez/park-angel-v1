import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { UserManagement } from './pages/UserManagement'
import { OperatorManagement } from './pages/OperatorManagement'
import { ParkingManagement } from './pages/ParkingManagement'
import { FinancialManagement } from './pages/FinancialManagement'
import { ReportsAnalytics } from './pages/ReportsAnalytics'
import { Settings } from './pages/Settings'
import { VehicleManagement } from './pages/VehicleManagement'
import { DiscountManagement } from './pages/DiscountManagement'
import { Login } from './pages/Login'
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  console.log('App render - isAuthenticated:', isAuthenticated, 'isInitializing:', isInitializing)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        await checkAuth()
        console.log('Auth initialized successfully')
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        console.log('Setting isInitializing to false')
        setIsInitializing(false)
      }
    }

    initializeAuth()
  }, [checkAuth])

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/operators" element={<OperatorManagement />} />
        <Route path="/parking" element={<ParkingManagement />} />
        <Route path="/financial" element={<FinancialManagement />} />
        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/discounts" element={<DiscountManagement />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App