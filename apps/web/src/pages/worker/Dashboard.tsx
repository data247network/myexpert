import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { Bell } from 'lucide-react'

export default function WorkerDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.full_name.split(' ')[0] ?? ''
  return (
    <div className="page-with-nav px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700">
            {firstName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-ink">{profile?.full_name}</p>
            <span className="text-xs text-green-600 font-medium">● online</span>
          </div>
        </div>
        <Bell size={20} className="text-ink-secondary" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[['₦0','THIS WEEK'],['0','JOBS'],['—','RATING']].map(([val, label]) => (
          <div key={label} className="card text-center">
            <p className="font-bold text-lg text-ink">{val}</p>
            <p className="text-[10px] font-semibold text-ink-tertiary uppercase">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="font-semibold text-ink mb-1">Complete your verification</p>
        <p className="text-sm text-ink-secondary">
          Finish 5 steps to start receiving jobs.
        </p>
        <a href="/worker/verify" className="btn-primary mt-3 inline-block text-center text-sm py-3">
          Continue verification →
        </a>
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
