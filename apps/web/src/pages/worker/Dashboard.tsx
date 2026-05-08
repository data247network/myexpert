import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import type { WorkerProfile } from '@myexpert/shared'
import { Bell, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WorkerDashboard() {
  const { user, profile } = useAuth()
  const [worker,   setWorker]   = useState<WorkerProfile | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [toggling, setToggling] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  useEffect(() => {
    if (!user) return
    supabase
      .from('worker_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setWorker(data as WorkerProfile)
      })

    // Sync online status from profiles table
    supabase
      .from('profiles')
      .select('is_online')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setIsOnline(data.is_online)
      })
  }, [user])

  const toggleOnline = async () => {
    if (!user || toggling) return
    setToggling(true)
    const next = !isOnline
    await supabase
      .from('profiles')
      .update({ is_online: next })
      .eq('id', user.id)
    setIsOnline(next)
    setToggling(false)
  }

  const isVerified   = worker?.is_verified ?? false
  const verifySteps  = worker?.verification_status ?? 'pending'

  return (
    <div className="page-with-nav">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 text-lg">
            {firstName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-ink leading-tight">{profile?.full_name}</p>
            <p className="text-xs text-ink-tertiary">
              {profile?.state_lga ?? 'Nigeria'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Online toggle */}
          <button onClick={toggleOnline} disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </button>
          <Bell size={20} className="text-ink-secondary" />
        </div>
      </div>

      {/* Verification banner */}
      {!isVerified && (
        <Link to="/worker/verify"
          className="mx-4 mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-3">
          <AlertCircle size={18} className="text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">Complete verification</p>
            <p className="text-xs text-orange-600">Finish 5 steps to start receiving jobs.</p>
          </div>
          <span className="text-xs font-semibold text-orange-700">Go →</span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-5">
        {[
          ['₦' + (worker?.available_balance ?? 0).toLocaleString(), 'THIS WEEK'],
          [(worker?.total_jobs ?? 0).toString(), 'JOBS DONE'],
          [worker?.rating ? worker.rating.toFixed(1) + '★' : '—', 'RATING'],
        ].map(([val, label]) => (
          <div key={label} className="card text-center">
            <p className="font-bold text-lg text-ink">{val}</p>
            <p className="text-[10px] font-semibold text-ink-tertiary uppercase leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent jobs empty state */}
      <div className="mx-4">
        <p className="section-label mb-3">RECENT JOBS</p>
        <div className="card text-center py-8">
          <p className="text-ink-tertiary text-sm">No jobs yet.</p>
          {!isVerified && (
            <p className="text-xs text-ink-tertiary mt-1">
              Complete verification to appear in job feeds.
            </p>
          )}
        </div>
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
