import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const navigate  = useNavigate()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="flex flex-col h-dvh px-6 pt-14 items-center justify-center gap-4 text-center">
      <div className="text-5xl mb-2">📬</div>
      <h2 className="text-xl font-bold text-ink">Check your email</h2>
      <p className="text-ink-secondary text-sm">
        We sent a magic link to <strong>{email}</strong>.<br />
        Tap it to sign in.
      </p>
      <button onClick={() => setSent(false)} className="text-brand-600 text-sm font-medium mt-4">
        Try a different email
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-dvh px-6 pt-4">
      <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Sign in</h1>
        <p className="text-ink-secondary text-sm">We'll send a magic link to your email.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
          <input type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary mt-6">
        Don't have an account?{' '}
        <Link to="/onboarding" className="text-brand-600 font-medium">Sign up</Link>
      </p>
    </div>
  )
}
