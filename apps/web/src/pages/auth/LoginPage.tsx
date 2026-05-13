import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { redirectByRole } from '@/lib/auth'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  const navigate  = useNavigate()
  const [mode,     setMode]     = useState<Mode>('password')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [magicSent, setMagicSent] = useState(false)

  // ── Password sign-in ────────────────────────────────────────────────────────
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); return }
      // Fetch role directly — don't rely on AuthContext timing
      await redirectByRole(navigate)
    } catch {
      setError('Sign-in failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Magic link ──────────────────────────────────────────────────────────────
  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setMagicSent(true)
  }

  // ── Magic sent state ────────────────────────────────────────────────────────
  if (magicSent) return (
    <div className="flex flex-col h-dvh px-6 items-center justify-center gap-4 text-center">
      <div className="text-5xl mb-2">📬</div>
      <h2 className="text-xl font-bold text-ink">Check your email</h2>
      <p className="text-ink-secondary text-sm">
        Magic link sent to <strong>{email}</strong>.<br />
        Tap it to sign in — expires in 1 hour.
      </p>
      <button onClick={() => setMagicSent(false)}
        className="text-brand-600 text-sm font-medium mt-2">
        ← Try different email
      </button>
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-4 pb-10">
      <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Welcome back</h1>
        <p className="text-ink-secondary text-sm">Sign in to your MyExpert account.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-surface-secondary rounded-xl p-1 mb-6">
        {(['password', 'magic'] as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m ? 'bg-white shadow text-ink' : 'text-ink-secondary hover:text-ink'
            }`}>
            {m === 'password' ? '🔑 Password' : '✉️ Magic link'}
          </button>
        ))}
      </div>

      {/* ── Password form ── */}
      {mode === 'password' && (
        <form onSubmit={handlePassword} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-ink">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand-600 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="input-field pr-12" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      {/* ── Magic link form ── */}
      {mode === 'magic' && (
        <form onSubmit={handleMagic} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field" />
          </div>
          <p className="text-xs text-ink-tertiary">
            We'll send a one-click sign-in link to your email. No password needed.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-ink-secondary mt-6">
        Don't have an account?{' '}
        <Link to="/onboarding" className="text-brand-600 font-medium">Sign up</Link>
      </p>
    </div>
  )
}
