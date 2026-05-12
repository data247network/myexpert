/**
 * ResetPassword — landed here from a password-reset email link.
 * Supabase sets a temporary session from the URL hash automatically.
 * We just call updateUser({ password }) to commit the new password.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const navigate  = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [hashError, setHashError] = useState('')

  useEffect(() => {
    // Check for error in URL hash (e.g. expired link)
    const hash = window.location.hash.substring(1)
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash)
      const desc = params.get('error_description') ?? 'Reset link is invalid.'
      setHashError(decodeURIComponent(desc.replace(/\+/g, ' ')))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  // ── Link expired ─────────────────────────────────────────────────────────────
  if (hashError) return (
    <div className="flex flex-col h-dvh px-6 items-center justify-center gap-4 text-center">
      <div className="text-5xl">⏱️</div>
      <h2 className="text-xl font-bold text-ink">Link expired</h2>
      <p className="text-ink-secondary text-sm max-w-xs">{hashError}</p>
      <button onClick={() => navigate('/forgot-password')}
        className="mt-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl text-sm">
        Request new reset link
      </button>
    </div>
  )

  // ── Success ───────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="flex flex-col h-dvh px-6 items-center justify-center gap-4 text-center">
      <div className="text-5xl mb-2">✅</div>
      <h2 className="text-xl font-bold text-ink">Password updated!</h2>
      <p className="text-ink-secondary text-sm">You can now sign in with your new password.</p>
      <button onClick={() => navigate('/login', { replace: true })}
        className="mt-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl text-sm">
        Sign in now →
      </button>
    </div>
  )

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh px-6 pt-16 pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Set new password</h1>
        <p className="text-ink-secondary text-sm">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">New password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="input-field pr-12" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Confirm new password</label>
          <input
            type={showPw ? 'text' : 'password'} required value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="input-field" />
        </div>

        {/* Strength hint */}
        {password.length > 0 && (
          <div className="flex gap-1">
            {[8, 12, 16].map(len => (
              <div key={len}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  password.length >= len ? 'bg-brand-600' : 'bg-gray-200'
                }`} />
            ))}
            <span className="text-xs text-ink-tertiary ml-1">
              {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
