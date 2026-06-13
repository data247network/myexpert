import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { Eye, EyeOff } from 'lucide-react'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  const [mode,     setMode]     = useState<Mode>('password')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [stuck,    setStuck]    = useState(false)

  // ── Password sign-in ────────────────────────────────────────────────────────
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    setStuck(false)
    const stuckTimer = setTimeout(() => setStuck(true), 6000)

    const withTimeout = <T,>(p: PromiseLike<T>, ms: number) =>
      new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), ms)
        Promise.resolve(p).then(v => { clearTimeout(t); resolve(v) }, e => { clearTimeout(t); reject(e) })
      })

    try {
      const { data, error: err } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }), 10000,
      )
      if (err) { setError(err.message); setLoading(false); return }

      // Verify admin role via SECURITY DEFINER RPC (bypasses RLS timing issues)
      const { data: role } = await withTimeout(
        supabase.rpc('get_my_role', { user_id: data.user.id }), 8000,
      )

      if (role !== 'admin') {
        await supabase.auth.signOut()
        setError('Access denied — admin accounts only.')
        setLoading(false)
        return
      }
      setLoading(false)
      // Hard navigate so AdminGuard re-evaluates with the fresh session
      window.location.replace('/overview')
    } catch {
      // Sign-in or role check hung — a fresh reload re-fetches the latest
      // bundle and clears whatever caused the stall (e.g. stale cache).
      window.location.reload()
    } finally {
      clearTimeout(stuckTimer)
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

  // ── Magic sent ──────────────────────────────────────────────────────────────
  if (magicSent) return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">📬</p>
        <p className="font-bold text-gray-900 text-lg mb-1">Check your email</p>
        <p className="text-sm text-gray-500 mb-4">
          Magic link sent to <strong>{email}</strong>.<br />
          Tap it to sign in — expires in 1 hour.
        </p>
        <button onClick={() => setMagicSent(false)}
          className="text-purple-600 text-sm font-medium hover:underline">
          ← Try different email
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-lg">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">Mx</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">MyExpert · Ops</p>
            <p className="text-[11px] text-gray-400">Admin dashboard</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-5">Ops team only.</p>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {(['password', 'magic'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m === 'password' ? '🔑 Password' : '✉️ Magic link'}
            </button>
          ))}
        </div>

        {/* ── Password form ── */}
        {mode === 'password' && (
          <form onSubmit={handlePassword} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ops@myexpert.ng"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-purple-600 font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 pr-12" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50 mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {stuck && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm text-gray-400 underline mt-1 text-center">
                Taking longer than usual — tap to refresh and try again
              </button>
            )}
          </form>
        )}

        {/* ── Magic link form ── */}
        {mode === 'magic' && (
          <form onSubmit={handleMagic} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ops@myexpert.ng"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50">
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
