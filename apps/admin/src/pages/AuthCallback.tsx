/**
 * Admin AuthCallback — handles magic-link redirects for the ops dashboard.
 * Supabase sets the session from the URL hash automatically.
 * We wait, then check the role is 'admin' before allowing entry.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      // Give Supabase client time to process the URL hash
      await new Promise(r => setTimeout(r, 800))

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/login', { replace: true })
        return
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        navigate('/overview', { replace: true })
      } else {
        setError('Access denied — admin accounts only.')
        await supabase.auth.signOut()
      }
    }
    check()
  }, [navigate])

  if (error) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">🚫</p>
        <p className="font-bold text-gray-900 mb-1">Access denied</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <a href="/login" className="text-purple-600 text-sm font-medium hover:underline">← Back to login</a>
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
