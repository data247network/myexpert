import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Pages — Landing & Auth
import LandingPage      from './pages/landing/LandingPage'
import OnboardingPage   from './pages/auth/OnboardingPage'
import LoginPage        from './pages/auth/LoginPage'
import SignupCustomer   from './pages/auth/SignupCustomer'
import SignupWorker     from './pages/auth/SignupWorker'

// Pages — Customer
import CustomerHome      from './pages/customer/Home'
import CustomerBrowse    from './pages/customer/Browse'
import CustomerJobs      from './pages/customer/Jobs'
import CustomerJobDetail from './pages/customer/JobDetail'
import PostJob           from './pages/customer/PostJob'
import CustomerChat      from './pages/customer/Chat'
import CustomerProfile   from './pages/customer/Profile'

// Pages — Worker
import WorkerDashboard  from './pages/worker/Dashboard'
import WorkerJobs       from './pages/worker/Jobs'
import WorkerJobDetail  from './pages/worker/JobDetail'
import WorkerEarnings   from './pages/worker/Earnings'
import WorkerMapView    from './pages/worker/MapView'
import WorkerProfilePage from './pages/worker/Profile'
import VerificationFlow from './pages/worker/VerificationFlow'

// Shared UI
import { Spinner } from './components/ui/Spinner'

// ── Layouts ─────────────────────────────────────────────────────────────────

/** Wraps all non-landing pages in the 430px mobile shell */
function MobileLayout() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  )
}

// ── Route guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children, allowedRoles }: {
  children: JSX.Element
  allowedRoles: string[]
}) {
  const { user, role, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-dvh"><Spinner /></div>
  if (!user)   return <Navigate to="/onboarding" replace />
  if (!allowedRoles.includes(role ?? '')) return <Navigate to="/onboarding" replace />
  return children
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, role, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-dvh"><Spinner /></div>
  if (user && role === 'customer') return <Navigate to="/home" replace />
  if (user && role === 'worker')   return <Navigate to="/worker/dashboard" replace />
  if (user && role === 'admin')    return <Navigate to="/admin" replace />
  return children
}

// ── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* ── Full-width (no mobile shell) ──── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Mobile shell ─────────────────── */}
      <Route element={<MobileLayout />}>

        {/* Auth */}
        <Route path="/onboarding"      element={<PublicRoute><OnboardingPage /></PublicRoute>} />
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup/customer" element={<PublicRoute><SignupCustomer /></PublicRoute>} />
        <Route path="/signup/worker"   element={<PublicRoute><SignupWorker /></PublicRoute>} />

        {/* Customer */}
        <Route path="/home"   element={<ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute allowedRoles={['customer']}><CustomerBrowse /></ProtectedRoute>} />
        <Route path="/jobs"         element={<ProtectedRoute allowedRoles={['customer']}><CustomerJobs /></ProtectedRoute>} />
        <Route path="/jobs/new"     element={<ProtectedRoute allowedRoles={['customer']}><PostJob /></ProtectedRoute>} />
        <Route path="/jobs/:jobId"  element={<ProtectedRoute allowedRoles={['customer']}><CustomerJobDetail /></ProtectedRoute>} />
        <Route path="/chat"   element={<ProtectedRoute allowedRoles={['customer']}><CustomerChat /></ProtectedRoute>} />
        <Route path="/me"     element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />

        {/* Worker */}
        <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/jobs"           element={<ProtectedRoute allowedRoles={['worker']}><WorkerJobs /></ProtectedRoute>} />
        <Route path="/worker/jobs/:jobId"    element={<ProtectedRoute allowedRoles={['worker']}><WorkerJobDetail /></ProtectedRoute>} />
        <Route path="/worker/map"       element={<ProtectedRoute allowedRoles={['worker']}><WorkerMapView /></ProtectedRoute>} />
        <Route path="/worker/earnings"  element={<ProtectedRoute allowedRoles={['worker']}><WorkerEarnings /></ProtectedRoute>} />
        <Route path="/worker/profile"   element={<ProtectedRoute allowedRoles={['worker']}><WorkerProfilePage /></ProtectedRoute>} />
        <Route path="/worker/verify"    element={<ProtectedRoute allowedRoles={['worker']}><VerificationFlow /></ProtectedRoute>} />

      </Route>

      {/* Fallback */}
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
