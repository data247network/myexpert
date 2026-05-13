/**
 * Shared auth utility — role-based redirect after sign-in or password reset.
 * Fetches the profile directly so we don't depend on AuthContext timing.
 */
import { supabase } from '@myexpert/shared'
import type { NavigateFunction } from 'react-router-dom'

export async function redirectByRole(navigate: NavigateFunction) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { navigate('/login', { replace: true }); return }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role
  if      (role === 'customer') navigate('/home',               { replace: true })
  else if (role === 'worker')   navigate('/worker/dashboard',   { replace: true })
  else if (role === 'admin')    navigate('/admin',              { replace: true })
  else                          navigate('/onboarding',         { replace: true })
}
