import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@myexpert/shared'
import AdminLayout       from './components/layout/AdminLayout'
import OverviewPage      from './pages/Overview'
import VerificationsPage from './pages/Verifications'
import DisputesPage      from './pages/Disputes'
import PayoutsPage       from './pages/Payouts'
import UsersPage         from './pages/Users'
import LoginPage         from './pages/Login'
import AuthCallback      from './pages/AuthCallback'
import ForgotPassword    from './pages/ForgotPassword'
import ResetPassword     from './pages/ResetPassword'

// ── Hash redirect safety net ──────────────────────────────────────────────────
// If Supabase redirects to the admin root with a token/error hash,
// forward it to /auth/callback which handles all hash cases correctly.
function HashRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
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

// ── Admin-only guard ──────────────────────────────────────────────────────────

function AdminGuard() {
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    // Safety net: if nothing resolves in 6 s, redirect to login
    const safety = setTimeout(() => setState(s => s === 'loading' ? 'denied' : s), 6000)

    // onAuthStateChange fires INITIAL_SESSION immediately once the client
    // has read the persisted session from localStorage — more reliable than
    // calling getSession() on a fresh page load (which can race the init).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) { setState('denied'); return }
        try {
          const { data: role } = await supabase.rpc('get_my_role', { user_id: session.user.id })
          setState(role === 'admin' ? 'ok' : 'denied')
        } catch {
          setState('denied')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(safety)
    }
  }, [])

  if (state === 'loading') return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (state === 'denied') return <Navigate to="/login" replace />
  return <Outlet />
}

// ── Routes ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <HashRedirect />
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Protected admin routes */}
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/"              element={<Navigate to="/overview" replace />} />
            <Route path="/overview"      element={<OverviewPage />} />
            <Route path="/verifications" element={<VerificationsPage />} />
            <Route path="/disputes"      element={<DisputesPage />} />
            <Route path="/payouts"       element={<PayoutsPage />} />
            <Route path="/users"         element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
