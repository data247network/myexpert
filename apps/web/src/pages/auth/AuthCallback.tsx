/**
 * AuthCallback — handles magic-link and OAuth redirects.
 *
 * Supabase puts the session in the URL hash/query string.
 * The JS client picks it up automatically via detectSessionInUrl.
 * We just wait for AuthContext to resolve, then redirect to the right dashboard.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

export default function AuthCallback() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return            // still resolving session
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    // Redirect based on role
    if (role === 'customer') navigate('/home',              { replace: true })
    else if (role === 'worker')   navigate('/worker/dashboard', { replace: true })
    else if (role === 'admin')    navigate('/admin',            { replace: true })
    else                          navigate('/onboarding',       { replace: true })
  }, [loading, user, role, navigate])

  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4">
      <Spinner />
      <p className="text-sm text-ink-secondary">Signing you in…</p>
    </div>
  )
}
