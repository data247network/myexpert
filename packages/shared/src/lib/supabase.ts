/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[MyExpert] Missing Supabase env vars — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // GoTrue v2 uses the Web Locks API (navigator.locks) to serialize auth
    // operations across tabs. If a previous tab/session leaves a lock held
    // (e.g. a closed tab mid-request, or repeated account-switching during
    // testing), getSession()/signInWithPassword() in a NEW tab can hang
    // indefinitely waiting for that lock — even with an external timeout,
    // since the underlying lock acquisition itself never settles.
    // A no-op lock removes this entire class of cross-tab deadlock; each
    // tab manages its own session independently, which is fine for this app
    // since we don't rely on cross-tab session synchronization.
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>) => fn(),
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export type { User, Session } from '@supabase/supabase-js'
