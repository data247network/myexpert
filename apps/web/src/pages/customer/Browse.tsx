import { useEffect, useState, useCallback } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, CATEGORIES } from '@myexpert/shared'
import { Search, Star, CheckCircle, SlidersHorizontal, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

interface WorkerCard {
  id:             string
  full_name:      string
  state_lga:      string | null
  avatar_url:     string | null
  primary_skill:  string
  years_experience: number
  is_verified:    boolean
  rating:         number
  total_jobs:     number
  is_online:      boolean
}

function WorkerTile({ w }: { w: WorkerCard }) {
  const initial = w.full_name.charAt(0).toUpperCase()
  return (
    <Link to={`/jobs/new?category=${encodeURIComponent(w.primary_skill)}`}
      className="card flex items-center gap-3 hover:border hover:border-brand-200 transition-colors">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
          <span className="font-bold text-brand-700 text-lg">{initial}</span>
        </div>
        {w.is_online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-ink truncate">{w.full_name}</p>
          {w.is_verified && (
            <CheckCircle size={13} className="text-green-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-ink-secondary">{w.primary_skill} · {w.years_experience}y exp</p>
        <div className="flex items-center gap-3 mt-0.5">
          {w.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-ink-secondary">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              {w.rating.toFixed(1)} ({w.total_jobs})
            </span>
          )}
          {w.state_lga && (
            <span className="text-xs text-ink-tertiary">📍 {w.state_lga}</span>
          )}
        </div>
      </div>

      <span className="text-brand-600 text-sm shrink-0">Hire →</span>
    </Link>
  )
}

export default function CustomerBrowse() {
  const { profile }   = useAuth()
  const [params, setParams] = useSearchParams()

  const [workers,    setWorkers]    = useState<WorkerCard[]>([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [activeCategory, setActiveCategory] = useState(params.get('category') ?? '')
  const [showOnline, setShowOnline] = useState(false)

  const fetchWorkers = useCallback(async () => {
    setLoading(true)

    let qb = supabase
      .from('worker_profiles')
      .select(`
        id,
        primary_skill,
        years_experience,
        is_verified,
        rating,
        total_jobs,
        profiles!inner (
          full_name,
          state_lga,
          avatar_url,
          is_online
        )
      `)
      .order('rating', { ascending: false })
      .limit(40)

    if (activeCategory) {
      qb = qb.eq('primary_skill', activeCategory)
    }

    const { data } = await qb

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: WorkerCard[] = data.map((r: any) => ({
        id:               r.id,
        full_name:        r.profiles?.full_name ?? 'Worker',
        state_lga:        r.profiles?.state_lga ?? null,
        avatar_url:       r.profiles?.avatar_url ?? null,
        is_online:        r.profiles?.is_online ?? false,
        primary_skill:    r.primary_skill,
        years_experience: r.years_experience,
        is_verified:      r.is_verified,
        rating:           r.rating,
        total_jobs:       r.total_jobs,
      }))

      let filtered = mapped

      // Client-side filters
      if (profile?.state_lga) {
        // Prefer workers in same state, but show all
        filtered = [
          ...mapped.filter(w => w.state_lga === profile.state_lga),
          ...mapped.filter(w => w.state_lga !== profile.state_lga),
        ]
      }
      if (showOnline)  filtered = filtered.filter(w => w.is_online)
      if (query.trim()) {
        const q = query.toLowerCase()
        filtered = filtered.filter(w =>
          w.full_name.toLowerCase().includes(q) ||
          w.primary_skill.toLowerCase().includes(q)
        )
      }

      setWorkers(filtered)
    }

    setLoading(false)
  }, [activeCategory, showOnline, query, profile?.state_lga])

  useEffect(() => { fetchWorkers() }, [fetchWorkers])

  const selectCategory = (name: string) => {
    const next = activeCategory === name ? '' : name
    setActiveCategory(next)
    setParams(next ? { category: next } : {})
  }

  return (
    <div className="page-with-nav">
      {/* Search header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold text-ink mb-3">Browse Workers</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or skill…"
              className="input-field pl-9 py-3 text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-ink-tertiary" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowOnline(v => !v)}
            className={`px-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
              showOnline
                ? 'border-green-400 bg-green-50 text-green-700'
                : 'border-surface-tertiary bg-surface text-ink-secondary'
            }`}>
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {showOnline && (
          <p className="text-xs text-green-700 mt-1.5 ml-1">● Showing online workers only</p>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(c => (
          <button key={c.name}
            onClick={() => selectCategory(c.name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === c.name
                ? 'bg-brand-600 text-white'
                : 'bg-surface-secondary text-ink-secondary hover:bg-brand-50'
            }`}>
            <span>{c.icon}</span> {c.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center pt-12 gap-3 text-center">
            <p className="text-2xl">🔍</p>
            <p className="font-semibold text-ink">No workers found</p>
            <p className="text-sm text-ink-secondary">
              {activeCategory
                ? `No verified ${activeCategory}s yet in your area.`
                : 'Try removing filters or check back soon.'}
            </p>
            {activeCategory && (
              <button onClick={() => selectCategory(activeCategory)}
                className="text-brand-600 text-sm font-medium">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-ink-tertiary mb-1">
              {workers.length} worker{workers.length !== 1 ? 's' : ''} found
              {activeCategory ? ` · ${activeCategory}` : ''}
              {profile?.state_lga ? ` · ${profile.state_lga} first` : ''}
            </p>
            {workers.map(w => <WorkerTile key={w.id} w={w} />)}
          </div>
        )}
      </div>

      <BottomNav variant="customer" />
    </div>
  )
}
