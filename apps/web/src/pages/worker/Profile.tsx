import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import type { WorkerProfile } from '@myexpert/shared'
import { Phone, Mail, Star, Briefcase, Shield, ChevronRight, LogOut, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WorkerProfilePage() {
  const { user, profile, signOut } = useAuth()
  const [worker, setWorker] = useState<WorkerProfile | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('worker_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setWorker(data as WorkerProfile) })
  }, [user])

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="page-with-nav">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="relative">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-3xl font-extrabold text-brand-600">{initial}</span>
          </div>
          {worker?.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle size={14} className="text-white" />
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold text-ink mt-1">{profile?.full_name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full">
            {worker?.primary_skill ?? 'Pro'}
          </span>
          {worker?.is_verified && (
            <span className="badge-verified">
              <CheckCircle size={10} /> NIN verified
            </span>
          )}
        </div>

        {/* Stats row */}
        {worker && (
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold text-ink">{worker.rating > 0 ? worker.rating.toFixed(1) : '—'}</p>
              <p className="text-[10px] text-ink-tertiary flex items-center gap-0.5">
                <Star size={9} /> Rating
              </p>
            </div>
            <div className="text-center">
              <p className="font-bold text-ink">{worker.total_jobs}</p>
              <p className="text-[10px] text-ink-tertiary flex items-center gap-0.5">
                <Briefcase size={9} /> Jobs
              </p>
            </div>
            <div className="text-center">
              <p className="font-bold text-ink">{worker.years_experience}y</p>
              <p className="text-[10px] text-ink-tertiary">Exp.</p>
            </div>
          </div>
        )}
      </div>

      {/* Info rows */}
      <div className="mx-4 card mb-4">
        {[
          { icon: Mail,  label: 'Email', value: profile?.email ?? '—' },
          { icon: Phone, label: 'Phone', value: profile?.phone ?? '—' },
        ].map(({ icon: Icon, label, value }, i, arr) => (
          <div key={label}
            className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? 'border-b border-surface-tertiary' : ''}`}>
            <Icon size={16} className="text-ink-tertiary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-ink-tertiary">{label}</p>
              <p className="text-sm font-medium text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mx-4 flex flex-col gap-2">
        {!worker?.is_verified && (
          <Link to="/worker/verify"
            className="card flex items-center gap-3 text-left w-full border-2 border-orange-200">
            <Shield size={16} className="text-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Complete verification</p>
              <p className="text-xs text-ink-tertiary">Required to receive jobs</p>
            </div>
            <ChevronRight size={16} className="text-ink-tertiary" />
          </Link>
        )}

        <button onClick={signOut}
          className="card flex items-center gap-3 text-left w-full text-red-600">
          <LogOut size={16} />
          <span className="flex-1 text-sm font-medium">Sign out</span>
        </button>
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
