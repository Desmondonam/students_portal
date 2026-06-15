import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Grades from './pages/Grades'
import LMS from './pages/LMS'
import Attendance from './pages/Attendance'
import Finance from './pages/Finance'
import Documents from './pages/Documents'
import Messages from './pages/Messages'
import Forums from './pages/Forums'
import Events from './pages/Events'
import LoadingSpinner from './components/ui/LoadingSpinner'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/onboarding"
          element={
            profile?.is_profile_complete
              ? <Navigate to="/dashboard" replace />
              : <Onboarding />
          }
        />
        <Route
          path="/"
          element={
            profile && !profile.is_profile_complete
              ? <Navigate to="/onboarding" replace />
              : <Layout />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="grades" element={<Grades />} />
          <Route path="courses" element={<LMS />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="finance" element={<Finance />} />
          <Route path="documents" element={<Documents />} />
          <Route path="messages" element={<Messages />} />
          <Route path="forums" element={<Forums />} />
          <Route path="events" element={<Events />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
