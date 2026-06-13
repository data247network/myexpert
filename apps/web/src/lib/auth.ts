/**
 * Shared auth utility — role-based redirect after sign-in or password reset.
 *
 * Uses the get_my_role SECURITY DEFINER RPC instead of querying the profiles
 * table directly. Direct table queries can hang after signInWithPassword due
 * to a Supabase v2 session/RLS propagation race on the PostgREST connection.
 *
 * Hardened with a timeout: if getSession() or the RPC call doesn't resolve
 * within 8 seconds (e.g. a stale service worker intercepting requests, or a
 * dropped connection), fall back to a hard page reload to '/'. A full reload
 * re-fetches the current bundle and re-evaluates auth state from scratch,
 * which clears whatever caused the hang — far better than leaving the user
 * stuck on "Signing in...".
 */
import { supabase } from '@myexpert/shared'
import type { NavigateFunction } from 'react-router-dom'

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    Promise.resolve(promise).then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

export async function redirectByRole(navigate: NavigateFunction) {
  try {
    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000)
    if (!session) { navigate('/login', { replace: true }); return }

    // RPC runs as SECURITY DEFINER (postgres role) — bypasses RLS entirely
    const { data: role } = await withTimeout(
      supabase.rpc('get_my_role', { user_id: session.user.id }),
      8000,
    )

    if      (role === 'customer') navigate('/home',               { replace: true })
    else if (role === 'worker')   navigate('/worker/dashboard',   { replace: true })
    else if (role === 'admin')    navigate('/admin',              { replace: true })
    else                          navigate('/onboarding',         { replace: true })
  } catch {
    // getSession()/RPC hung or failed unexpectedly — a fresh hard reload
    // re-fetches the latest bundle and lets AuthContext + routing re-evaluate
    // cleanly from a known-good state.
    window.location.href = '/'
  }
}
