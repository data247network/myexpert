import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) return (
    <div className="flex flex-col h-dvh px-6 items-center justify-center gap-4 text-center">
      <div className="text-5xl mb-2">📩</div>
      <h2 className="text-xl font-bold text-ink">Reset link sent</h2>
      <p className="text-ink-secondary text-sm max-w-xs">
        We emailed a password reset link to <strong>{email}</strong>.<br />
        Check your inbox and tap the link — it expires in 1 hour.
      </p>
      <Link to="/login"
        className="mt-4 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl text-sm">
        Back to sign in
      </Link>
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-4 pb-10">
      <Link to="/login" className="w-9 h-9 flex items-center justify-center">
        <ArrowLeft size={20} />
      </Link>

      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Forgot password?</h1>
        <p className="text-ink-secondary text-sm">
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Email address</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary mt-6">
        Remembered it?{' '}
        <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
      </p>
    </div>
  )
}
