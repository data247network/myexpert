import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useEffect } from 'react'

// Pages — Landing & Auth
import LandingPage      from './pages/landing/LandingPage'
import OnboardingPage   from './pages/auth/OnboardingPage'
import LoginPage        from './pages/auth/LoginPage'
import AuthCallback     from './pages/auth/AuthCallback'
import ForgotPassword   from './pages/auth/ForgotPassword'
import ResetPassword    from './pages/auth/ResetPassword'
import SignupCustomer   from './pages/auth/SignupCustomer'
import SignupWorker     from './pages/auth/SignupWorker'

// Pages — Customer
import CustomerHome      from './pages/customer/Home'
import CustomerBrowse    from './pages/customer/Browse'
import CustomerJobs      from './pages/customer/Jobs'
import CustomerJobDetail from './pages/customer/JobDetail'
import PostJob           from './pages/customer/PostJob'
import CustomerChat      from './pages/customer/Chat'
import CustomerChatRoom  from './pages/customer/ChatRoom'
import CustomerProfile   from './pages/customer/Profile'

// Pages — Worker
import WorkerDashboard  from './pages/worker/Dashboard'
import WorkerJobs       from './pages/worker/Jobs'
import WorkerJobDetail  from './pages/worker/JobDetail'
import WorkerChatRoom   from './pages/worker/ChatRoom'
import WorkerEarnings   from './pages/worker/Earnings'
import WorkerMapView    from './pages/worker/MapView'
import WorkerProfilePage from './pages/worker/Profile'
import VerificationFlow from './pages/worker/VerificationFlow'

// Shared UI
import { Spinner } from './components/ui/Spinner'

// ── Hash redirect safety net ─────────────────────────────────────────────────
// Supabase can redirect to the Site URL root (/) with token/error in the hash.
// This bounces those hashes to /auth/callback which knows how to handle them.
function HashRedirect() {
  const navigate  = useNavigate()
  const location  = useLocation()
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (!hash) return
    const p = new URLSearchParams(hash)
    const hasToken = p.get('access_token') || p.get('error') || p.get('type')
    const onAuthPage = location.pathname.startsWith('/auth/') ||
                       location.pathname === '/reset-password'
    if (hasToken && !onAuthPage) {
      navigate(`/auth/callback${window.location.hash}`, { replace: true })
    }
  }, [navigate, location.pathname])
  return null
}

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
    <>
    <HashRedirect />
    <Routes>
      {/* ── Full-width (no mobile shell) ──── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Mobile shell ─────────────────── */}
      <Route element={<MobileLayout />}>

        {/* Auth — public routes */}
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
        <Route path="/chat"           element={<ProtectedRoute allowedRoles={['customer']}><CustomerChat /></ProtectedRoute>} />
        <Route path="/chat/:jobId"   element={<ProtectedRoute allowedRoles={['customer']}><CustomerChatRoom /></ProtectedRoute>} />
        <Route path="/me"     element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />

        {/* Worker */}
        <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/jobs"           element={<ProtectedRoute allowedRoles={['worker']}><WorkerJobs /></ProtectedRoute>} />
        <Route path="/worker/jobs/:jobId"     element={<ProtectedRoute allowedRoles={['worker']}><WorkerJobDetail /></ProtectedRoute>} />
        <Route path="/worker/chat/:jobId"    element={<ProtectedRoute allowedRoles={['worker']}><WorkerChatRoom /></ProtectedRoute>} />
        <Route path="/worker/map"       element={<ProtectedRoute allowedRoles={['worker']}><WorkerMapView /></ProtectedRoute>} />
        <Route path="/worker/earnings"  element={<ProtectedRoute allowedRoles={['worker']}><WorkerEarnings /></ProtectedRoute>} />
        <Route path="/worker/profile"   element={<ProtectedRoute allowedRoles={['worker']}><WorkerProfilePage /></ProtectedRoute>} />
        <Route path="/worker/verify"    element={<ProtectedRoute allowedRoles={['worker']}><VerificationFlow /></ProtectedRoute>} />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
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
