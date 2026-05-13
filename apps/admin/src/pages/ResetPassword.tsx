import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const navigate   = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [hashError, setHashError] = useState('')

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash)
      const desc = params.get('error_description') ?? 'Reset link is invalid.'
      setHashError(decodeURIComponent(desc.replace(/\+/g, ' ')))
    }
  }, [])

  // After showing success for 1.5 s, go to /overview (admin is already signed in)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => navigate('/overview', { replace: true }), 1500)
    return () => clearTimeout(t)
  }, [done, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Minimum 8 characters required.'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) { setError(err.message); return }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Link expired ─────────────────────────────────────────────────────────────
  if (hashError) return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">⏱️</p>
        <p className="font-bold text-gray-900 text-lg mb-1">Link expired</p>
        <p className="text-sm text-gray-500 mb-5">{hashError}</p>
        <button onClick={() => navigate('/forgot-password')}
          className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700">
          Request new link
        </button>
      </div>
    </div>
  )

  // ── Success ───────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">✅</p>
        <p className="font-bold text-gray-900 text-lg mb-1">Password updated!</p>
        <p className="text-sm text-gray-500 mb-4">Taking you to the dashboard…</p>
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Set new password</h1>
        <p className="text-sm text-gray-500 mb-6">Choose a strong password for your admin account.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">New password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 pr-12" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm password</label>
            <input
              type={showPw ? 'text' : 'password'} required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="flex items-center gap-1">
              {[8, 12, 16].map(len => (
                <div key={len}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    password.length >= len ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
              ))}
              <span className="text-xs text-gray-400 ml-1 w-10">
                {password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50 mt-1">
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
