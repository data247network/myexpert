/**
 * AuthCallback — handles magic-link, invite, and OAuth redirects.
 *
 * Supabase puts the session (or error) in the URL hash.
 * We check for errors first, then wait for AuthContext, then redirect.
 */
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

function parseHashError(): string | null {
  const hash = window.location.hash.substring(1)   // strip leading #
  if (!hash.includes('error=')) return null
  const params = new URLSearchParams(hash)
  const desc = params.get('error_description') ?? params.get('error') ?? 'Authentication failed'
  return decodeURIComponent(desc.replace(/\+/g, ' '))
}

export default function AuthCallback() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [hashError, setHashError] = useState<string | null>(null)

  // Check for error in URL hash immediately on mount
  useEffect(() => {
    const err = parseHashError()
    if (err) setHashError(err)
  }, [])

  // Redirect on successful session
  useEffect(() => {
    if (hashError) return           // show error, don't redirect
    if (loading)   return           // still resolving
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (role === 'customer') navigate('/home',             { replace: true })
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
          ? 'Magic links expire after 1 hour. Request a fresh one below.'
          : hashError}
      </p>
      <Link to="/login"
        className="mt-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl text-sm">
        Request new link →
      </Link>
    </div>
  )

  // ── Loading state ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4">
      <Spinner />
      <p className="text-sm text-ink-secondary">Signing you in…</p>
    </div>
  )
}
