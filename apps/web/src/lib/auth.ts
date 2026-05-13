/**
 * Shared auth utility — role-based redirect after sign-in or password reset.
 *
 * Uses the get_my_role SECURITY DEFINER RPC instead of querying the profiles
 * table directly. Direct table queries can hang after signInWithPassword due
 * to a Supabase v2 session/RLS propagation race on the PostgREST connection.
 */
import { supabase } from '@myexpert/shared'
import type { NavigateFunction } from 'react-router-dom'

export async function redirectByRole(navigate: NavigateFunction) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { navigate('/login', { replace: true }); return }

  // RPC runs as SECURITY DEFINER (postgres role) — bypasses RLS entirely
  const { data: role } = await supabase.rpc('get_my_role', { user_id: session.user.id })

  if      (role === 'customer') navigate('/home',               { replace: true })
  else if (role === 'worker')   navigate('/worker/dashboard',   { replace: true })
  else if (role === 'admin')    navigate('/admin',              { replace: true })
  else                          navigate('/onboarding',         { replace: true })
}
