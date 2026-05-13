/**
 * Admin AuthCallback — handles magic-link and invite redirects.
 * Shows a friendly expired-link message instead of hanging spinner.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'

function parseHashError(): string | null {
  const hash = window.location.hash.substring(1)
  if (!hash.includes('error=')) return null
  const params = new URLSearchParams(hash)
  const desc = params.get('error_description') ?? params.get('error') ?? 'Authentication failed'
  return decodeURIComponent(desc.replace(/\+/g, ' '))
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    // Password reset link → redirect to reset page
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    if (hashParams.get('type') === 'recovery') {
      navigate('/reset-password', { replace: true })
      return
    }

    // Check for error in hash immediately
    const hashErr = parseHashError()
    if (hashErr) {
      setError(
        hashErr.includes('expired') || hashErr.includes('invalid')
          ? 'This link has expired. Please request a new magic link from the login page.'
          : hashErr
      )
      return
    }

    const check = async () => {
      // Give Supabase client time to process the URL hash
      await new Promise(r => setTimeout(r, 800))

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/login', { replace: true })
        return
      }

      // Verify admin role via SECURITY DEFINER RPC (bypasses RLS)
      const { data: role } = await supabase.rpc('get_my_role', { user_id: session.user.id })

      if (role === 'admin') {
        navigate('/overview', { replace: true })
      } else {
        setError('Access denied — this dashboard is for admin accounts only.')
        await supabase.auth.signOut()
      }
    }
    check()
  }, [navigate])

  if (error) return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-4">
          {error.includes('expired') ? '⏱️' : '🚫'}
        </p>
        <p className="font-bold text-gray-900 text-lg mb-2">
          {error.includes('expired') ? 'Link expired' : 'Access denied'}
        </p>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <a href="/login"
          className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700">
          Back to login →
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Verifying access…</p>
    </div>
  )
}
