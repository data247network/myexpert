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
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">📩</p>
        <p className="font-bold text-gray-900 text-lg mb-1">Reset link sent</p>
        <p className="text-sm text-gray-500 mb-5">
          Check <strong>{email}</strong> — tap the link to set a new password.
          It expires in 1 hour.
        </p>
        <Link to="/login"
          className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700">
          Back to sign in
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <Link to="/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your admin email and we'll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email address</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ops@myexpert.ng"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}
