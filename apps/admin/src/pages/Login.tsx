import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl mb-2">📬</p>
        <p className="font-semibold">Check your email</p>
        <p className="text-sm text-gray-500 mt-1">Magic link sent to {email}</p>
        <button onClick={() => navigate('/overview')} className="btn-admin mt-4">
          I've signed in
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-secondary">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Mx</span>
          </div>
          <span className="font-bold">MyExpert · Ops</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Admin sign in</h1>
        <p className="text-sm text-gray-500 mb-6">Ops team only.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="ops@myexpert.ng" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500" />
          <button type="submit" disabled={loading} className="btn-admin w-full py-3">
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}
