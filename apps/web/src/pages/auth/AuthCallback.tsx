/**
 * AuthCallback — handles magic-link, invite, OAuth and password-reset redirects.
 *
 * URL hash cases:
 *   type=recovery  → send to /reset-password
 *   error=*        → show expired/denied message
 *   (none / success) → redirect by role
 */
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

function parseHash(): { type: string | null; error: string | null } {
  const params = new URLSearchParams(window.location.hash.substring(1))
  const error  = params.get('error_description') ?? params.get('error')
  const type   = params.get('type')
  return {
    type,
    error: error ? decodeURIComponent(error.replace(/\+/g, ' ')) : null,
  }
}

export default function AuthCallback() {
  const { user, role, loading } = useAuth()
  const navigate  = useNavigate()
  const [hashError, setHashError] = useState<string | null>(null)

  useEffect(() => {
    const { type, error } = parseHash()

    // Password reset link → go to reset page (Supabase sets a recovery session)
    if (type === 'recovery') {
      navigate('/reset-password', { replace: true })
      return
    }
    // Supabase error in hash
    if (error) setHashError(error)
  }, [navigate])

  // Redirect on successful session
  useEffect(() => {
    if (hashError || loading) return
    if (!user) { navigate('/login', { replace: true }); return }

    if (role === 'customer') navigate('/home',              { replace: true })
    else if (role === 'worker')  navigate('/worker/dashboard', { replace: true })
    else if (role === 'admin')   navigate('/admin',            { replace: true })
    else                         navigate('/onboarding',       { replace: true })
  }, [hashError, loading, user, role, navigate])

  // ── Error state ──────────────────────────────────────────────────────────────
  if (hashError) return (
    <div className="flex flex-col items-center justify-center h-dvh px-6 text-center gap-4">
      <div className="text-5xl">⏱️</div>
      <h2 className="text-xl font-bold text-ink">Link expired</h2>
      <p className="text-sm text-ink-secondary max-w-xs">
        {hashError.includes('expired') || hashError.includes('invalid')
          ? 'This link has expired. Request a fresh one below.'
          : hashError}
      </p>
      <Link to="/login"
        className="mt-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl text-sm">
        Back to sign in →
      </Link>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4">
      <Spinner />
      <p className="text-sm text-ink-secondary">Signing you in…</p>
    </div>
  )
}
