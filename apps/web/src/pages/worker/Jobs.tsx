import { useEffect, useState, useCallback } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import { Briefcase, Zap, Clock, MapPin, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Types ────────────────────────────────────────────────────────────────────

interface JobRow {
  id:              string
  title:           string
  description:     string | null
  urgency:         'normal' | 'urgent'
  customer_quote:  number | null
  location_address: string | null
  state_lga:       string | null
  status:          string
  created_at:      string
  category_name:   string | null
}

interface BidRow {
  job_id: string
  status: string
  amount: number
  jobs: {
    id:     string
    title:  string
    status: string
    customer_quote: number | null
    location_address: string | null
  }
}

// ── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job, to }: { job: JobRow; to: string }) {
  const isUrgent = job.urgency === 'urgent'
  const age = Math.round((Date.now() - new Date(job.created_at).getTime()) / 60000)
  const ageLabel = age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`

  return (
    <Link to={to} className="card flex flex-col gap-2 hover:border hover:border-brand-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-ink flex-1">{job.title}</p>
        {isUrgent && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">
            <Zap size={9} /> URGENT
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-xs text-ink-secondary line-clamp-2">{job.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-ink-tertiary">
        {job.location_address && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {job.location_address.split(',').slice(-2).join(',').trim()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={11} /> {ageLabel}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-sm font-bold text-brand-600">
          {job.customer_quote
            ? `₦${job.customer_quote.toLocaleString()}`
            : 'Open quote'}
        </span>
        <span className="text-xs font-semibold text-brand-600 flex items-center gap-0.5">
          Bid <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  )
}

// ── Bid card (My Bids tab) ────────────────────────────────────────────────────

function BidCard({ bid }: { bid: BidRow }) {
  const statusColors: Record<string, string> = {
    pending:  'bg-yellow-50 text-yellow-700',
    accepted: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  }
  return (
    <Link to={`/worker/jobs/${bid.job_id}`} className="card flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-ink truncate">{bid.jobs?.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[bid.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {bid.status}
          </span>
          <span className="text-xs text-ink-secondary">
            Your bid: ₦{bid.amount.toLocaleString()}
          </span>
        </div>
      </div>
      <ChevronRight size={16} className="text-ink-tertiary shrink-0" />
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkerJobs() {
  const { user, profile } = useAuth()
  const [tab,       setTab]       = useState(0)
  const [available, setAvailable] = useState<JobRow[]>([])
  const [myBids,    setMyBids]    = useState<BidRow[]>([])
  const [active,    setActive]    = useState<JobRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [skill,     setSkill]     = useState<string>('')

  // Get worker's primary skill
  useEffect(() => {
    if (!user) return
    supabase
      .from('worker_profiles')
      .select('primary_skill')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setSkill(data.primary_skill) })
  }, [user])

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // 1. Available jobs: open/bidding, matching worker skill + state
    const jobQuery = supabase
      .from('jobs')
      .select('*, categories(name)')
      .in('status', ['open', 'bidding'])
      .order('created_at', { ascending: false })
      .limit(30)

    // 2. My bids
    const bidsQuery = supabase
      .from('bids')
      .select('job_id, status, amount, jobs(id, title, status, customer_quote, location_address)')
      .eq('worker_id', user.id)
      .order('created_at', { ascending: false })

    // 3. Active jobs (assigned)
    const activeQuery = supabase
      .from('jobs')
      .select('*, categories(name)')
      .eq('worker_id', user.id)
      .in('status', ['booked', 'accepted', 'en_route', 'arrived', 'in_progress'])
      .order('updated_at', { ascending: false })

    const [{ data: jobData }, { data: bidData }, { data: activeData }] =
      await Promise.all([jobQuery, bidsQuery, activeQuery])

    if (jobData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rows: JobRow[] = jobData.map((j: any) => ({
        ...j,
        category_name: j.categories?.name ?? null,
      }))
      // Prefer matching skill, then same state
      if (skill)               rows = rows.filter(j => j.category_name === skill)
      if (profile?.state_lga)  rows = [
        ...rows.filter(j => j.state_lga === profile.state_lga),
        ...rows.filter(j => j.state_lga !== profile.state_lga),
      ]
      setAvailable(rows)
    }

    if (bidData) setMyBids(bidData as unknown as BidRow[])

    if (activeData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActive(activeData.map((j: any) => ({ ...j, category_name: j.categories?.name ?? null })))
    }

    setLoading(false)
  }, [user, skill, profile?.state_lga])

  useEffect(() => { if (skill !== undefined) fetchAll() }, [fetchAll, skill])

  const tabs = [
    { label: 'Available', count: available.length },
    { label: 'My Bids',   count: myBids.length    },
    { label: 'Active',    count: active.length     },
  ]

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Jobs</h1>
        {skill && <p className="text-xs text-ink-tertiary mt-0.5">Showing: {skill}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 bg-surface-secondary rounded-xl p-1">
        {tabs.map((t, i) => (
          <button key={t.label} onClick={() => setTab(i)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              tab === i ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === i ? 'bg-brand-100 text-brand-700' : 'bg-surface-tertiary text-ink-tertiary'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Available */}
            {tab === 0 && (
              available.length === 0 ? (
                <div className="flex flex-col items-center pt-12 gap-3 text-center">
                  <Briefcase size={32} className="text-ink-tertiary" />
                  <p className="font-semibold text-ink">No open jobs yet</p>
                  <p className="text-sm text-ink-secondary">
                    Open jobs matching your skill ({skill || 'all'}) will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {available.map(j => (
                    <JobCard key={j.id} job={j} to={`/worker/jobs/${j.id}`} />
                  ))}
                </div>
              )
            )}

            {/* My Bids */}
            {tab === 1 && (
              myBids.length === 0 ? (
                <div className="flex flex-col items-center pt-12 gap-3 text-center">
                  <p className="text-3xl">📋</p>
                  <p className="font-semibold text-ink">No bids yet</p>
                  <p className="text-sm text-ink-secondary">
                    Bids you send will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {myBids.map(b => <BidCard key={b.job_id} bid={b} />)}
                </div>
              )
            )}

            {/* Active */}
            {tab === 2 && (
              active.length === 0 ? (
                <div className="flex flex-col items-center pt-12 gap-3 text-center">
                  <p className="text-3xl">🛠️</p>
                  <p className="font-semibold text-ink">No active jobs</p>
                  <p className="text-sm text-ink-secondary">
                    Jobs you're booked for appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {active.map(j => (
                    <JobCard key={j.id} job={j} to={`/worker/jobs/${j.id}`} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
