import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@myexpert/shared'
import type { Profile, UserRole } from '@myexpert/shared'
import { subscribeUser, unsubscribeUser } from '@/lib/notifications'

interface AuthContextType {
  user:    User | null
  session: Session | null
  profile: Profile | null
  role:    UserRole | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, role: null,
  loading: true, signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (_userId: string) => {
    try {
      // Use SECURITY DEFINER RPC — bypasses RLS, no post-signIn timing race
      const { data } = await supabase.rpc('get_my_profile')
      // rpc returns an array for SETOF functions; take the first row
      setProfile(Array.isArray(data) ? (data[0] ?? null) : (data ?? null))
    } catch {
      // Network error — profile stays null, loading still clears via finally
      setProfile(null)
    }
  }

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth.
    // Supabase v2 fires INITIAL_SESSION immediately, replacing the need
    // for a separate getSession() call.
    // We always call setLoading(false) in a finally block so a failed
    // fetchProfile never leaves the spinner spinning forever.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        try {
          if (newSession?.user) {
            await fetchProfile(newSession.user.id)
            subscribeUser(newSession.user.id)
          } else {
            setProfile(null)
          }
        } finally {
          setLoading(false)   // ← always fires, even if fetchProfile throws
        }
      }
    )

    // Safety net: if onAuthStateChange never fires (offline / ad blocker),
    // clear the spinner after 5 s so users aren't stuck.
    const safety = setTimeout(() => setLoading(false), 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(safety)
    }
  }, [])

  const signOut = async () => {
    await unsubscribeUser()
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile,
      role: profile?.role ?? null,
      loading, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
