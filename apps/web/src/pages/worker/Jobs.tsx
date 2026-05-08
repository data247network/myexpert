import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WorkerJobs() {
  const { profile } = useAuth()

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Jobs</h1>
      </div>

      {/* Tabs — stubbed, full bidding in Session 3/4 */}
      <div className="flex gap-1 mx-4 mb-4 bg-surface-secondary rounded-xl p-1">
        {['Available', 'My Bids', 'Active'].map((tab, i) => (
          <button key={tab}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              i === 0 ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center px-8 pt-12 gap-4 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
          <Briefcase size={28} className="text-brand-400" />
        </div>
        <h2 className="font-bold text-ink text-lg">No jobs nearby yet</h2>
        <p className="text-ink-secondary text-sm">
          {profile ? (
            <>Jobs in <strong>{profile.state_lga ?? 'your area'}</strong> will appear here once you're verified.</>
          ) : (
            'Jobs in your area will appear here once you\'re verified.'
          )}
        </p>
        <Link to="/worker/verify"
          className="mt-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl">
          Complete verification →
        </Link>
        <p className="text-xs text-ink-tertiary">
          Job feed with bidding arrives in the next update.
        </p>
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
