import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Plus } from 'lucide-react'
import { CATEGORIES } from '@myexpert/shared'
import { Link } from 'react-router-dom'

export default function CustomerHome() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="page-with-nav">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-ink">Hi, {firstName} 👋</h1>
            <p className="text-sm text-ink-secondary flex items-center gap-1 mt-0.5">
              📍 {profile?.state_lga ?? 'Nigeria'}
            </p>
          </div>
          <button className="relative w-9 h-9 flex items-center justify-center">
            <Bell size={20} className="text-ink-secondary" />
          </button>
        </div>

        {/* Post a job CTA — taps straight into the wizard */}
        <Link to="/jobs/new"
          className="flex items-center gap-3 px-4 py-3.5 bg-brand-600 rounded-2xl">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">Post a job</p>
            <p className="text-white/70 text-xs">Get quotes from verified pros nearby</p>
          </div>
          <span className="text-white/80 text-sm">→</span>
        </Link>
      </div>

      {/* Promo banner */}
      <div className="mx-4 mb-5 bg-ink rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">PROMO</p>
        <p className="text-white font-bold text-lg">₦2,000 off your first booking</p>
        <p className="text-gray-400 text-sm">Code: <span className="font-mono">WELCOME2K</span> · auto-applied</p>
      </div>

      {/* Categories */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink">What do you need done?</h2>
          <Link to="/browse" className="text-sm text-brand-600">See all</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.slice(0, 9).map(c => (
            <Link key={c.name}
              to={`/jobs/new?category=${encodeURIComponent(c.name)}`}
              className="flex flex-col items-center gap-1.5 p-3 bg-surface-secondary rounded-2xl hover:bg-brand-50 transition-colors">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-medium text-ink-secondary text-center leading-tight">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Browse workers */}
      <div className="px-4 mb-4">
        <Link to="/browse"
          className="flex items-center justify-between card border border-brand-100">
          <div>
            <p className="font-semibold text-ink text-sm">Browse verified workers</p>
            <p className="text-xs text-ink-secondary mt-0.5">
              See profiles, ratings &amp; hire directly
            </p>
          </div>
          <span className="text-brand-600 text-lg">→</span>
        </Link>
      </div>

      <BottomNav variant="customer" />
    </div>
  )
}
