import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
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

// ── Admin-only guard ──────────────────────────────────────────────────────────

function AdminGuard() {
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setState('denied'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      setState(profile?.role === 'admin' ? 'ok' : 'denied')
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check())
    return () => subscription.unsubscribe()
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
      <Routes>
        {/* Public */}
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

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
