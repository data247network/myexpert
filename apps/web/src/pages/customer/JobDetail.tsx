import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeft, MapPin, Clock, Zap, CheckCircle, AlertCircle,
  Star, User
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface JobDetail {
  id:               string
  title:            string
  description:      string | null
  urgency:          'normal' | 'urgent'
  customer_quote:   number | null
  final_price:      number | null
  location_address: string | null
  status:           string
  scheduled_for:    string | null
  created_at:       string
  category_name:    string | null
  worker_id:        string | null
}

interface BidItem {
  id:         string
  amount:     number
  status:     string
  message:    string | null
  created_at: string
  worker: {
    id:               string
    full_name:        string
    primary_skill:    string
    years_experience: number
    is_verified:      boolean
    rating:           number
    total_jobs:       number
    state_lga:        string | null
  } | null
}

interface BookedWorker {
  full_name:     string
  primary_skill: string
  is_verified:   boolean
  rating:        number
  state_lga:     string | null
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: 'Open',        color: 'bg-blue-50 text-blue-700'     },
  bidding:     { label: 'Bidding',     color: 'bg-yellow-50 text-yellow-700' },
  booked:      { label: 'Booked',      color: 'bg-brand-50 text-brand-700'   },
  accepted:    { label: 'Accepted',    color: 'bg-brand-50 text-brand-700'   },
  en_route:    { label: 'En route',    color: 'bg-orange-50 text-orange-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-50 text-orange-700' },
  done:        { label: 'Done',        color: 'bg-green-50 text-green-700'   },
  confirmed:   { label: 'Confirmed',   color: 'bg-green-50 text-green-700'   },
  cancelled:   { label: 'Cancelled',   color: 'bg-gray-100 text-gray-500'    },
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CustomerJobDetail() {
  const { jobId }  = useParams<{ jobId: string }>()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [job,          setJob]         = useState<JobDetail | null>(null)
  const [bids,         setBids]        = useState<BidItem[]>([])
  const [bookedWorker, setBookedWorker] = useState<BookedWorker | null>(null)
  const [loading,      setLoading]     = useState(true)
  const [accepting,    setAccepting]   = useState<string | null>(null) // bid id being accepted
  const [error,        setError]       = useState('')

  const fetchData = async () => {
    if (!jobId || !user) return
    setLoading(true)

    const [{ data: jobData }, { data: bidsData }] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, categories(name)')
        .eq('id', jobId)
        .eq('customer_id', user.id)
        .single(),
      supabase
        .from('bids')
        .select(`
          id, amount, status, message, created_at,
          worker_profiles!inner (
            id,
            primary_skill,
            years_experience,
            is_verified,
            rating,
            total_jobs,
            profiles!inner ( full_name, state_lga )
          )
        `)
        .eq('job_id', jobId)
        .order('amount', { ascending: true }),
    ])

    if (jobData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const j = jobData as any
      setJob({ ...j, category_name: j.categories?.name ?? null })

      // If job is booked+ fetch the booked worker's info
      if (j.worker_id) {
        const { data: wp } = await supabase
          .from('worker_profiles')
          .select('primary_skill, is_verified, rating, profiles(full_name, state_lga)')
          .eq('id', j.worker_id)
          .single()
        if (wp) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const w = wp as any
          setBookedWorker({
            full_name:     w.profiles?.full_name ?? 'Worker',
            primary_skill: w.primary_skill,
            is_verified:   w.is_verified,
            rating:        w.rating,
            state_lga:     w.profiles?.state_lga ?? null,
          })
        }
      }
    }

    if (bidsData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: BidItem[] = (bidsData as any[]).map(b => ({
        id:         b.id,
        amount:     b.amount,
        status:     b.status,
        message:    b.message,
        created_at: b.created_at,
        worker: b.worker_profiles ? {
          id:               b.worker_profiles.id,
          full_name:        b.worker_profiles.profiles?.full_name ?? 'Worker',
          primary_skill:    b.worker_profiles.primary_skill,
          years_experience: b.worker_profiles.years_experience,
          is_verified:      b.worker_profiles.is_verified,
          rating:           b.worker_profiles.rating,
          total_jobs:       b.worker_profiles.total_jobs,
          state_lga:        b.worker_profiles.profiles?.state_lga ?? null,
        } : null,
      }))
      setBids(mapped)
    }

    setLoading(false)
  }

  useEffect(() => { fetchData() }, [jobId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (bidId: string) => {
    setAccepting(bidId)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('accept_bid', { p_bid_id: bidId })
    if (rpcError || data?.error) {
      setError(rpcError?.message ?? data?.error ?? 'Something went wrong.')
      setAccepting(null)
      return
    }
    // Refresh data to show booked state
    await fetchData()
    setAccepting(null)
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-dvh">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="flex flex-col items-center justify-center h-dvh gap-3">
      <AlertCircle size={32} className="text-ink-tertiary" />
      <p className="text-ink-secondary">Job not found.</p>
      <button onClick={() => navigate(-1)} className="text-brand-600 text-sm font-medium">Go back</button>
    </div>
  )

  const statusCfg   = STATUS_CONFIG[job.status] ?? { label: job.status, color: 'bg-gray-100 text-gray-500' }
  const isBooked    = !['open', 'bidding'].includes(job.status)
  const pendingBids = bids.filter(b => b.status === 'pending')
  const acceptedBid = bids.find(b => b.status === 'accepted')

  return (
    <div className="min-h-dvh pb-8">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-surface-tertiary">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-ink-tertiary font-semibold uppercase">Job detail</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="px-4 pt-5 flex flex-col gap-4">

        {/* Category + Title */}
        {job.category_name && (
          <p className="section-label -mb-2">{job.category_name}</p>
        )}
        <h1 className="text-xl font-extrabold text-ink">{job.title}</h1>

        {/* Job details card */}
        <div className="card flex flex-col gap-3">
          {job.description && (
            <p className="text-sm text-ink-secondary">{job.description}</p>
          )}
          <div className="flex flex-col gap-2 pt-2 border-t border-surface-tertiary">
            {job.location_address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={15} className="text-ink-tertiary shrink-0 mt-0.5" />
                <span className="text-ink-secondary">{job.location_address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              {job.urgency === 'urgent'
                ? <><Zap size={14} className="text-orange-500" /><span className="text-orange-700">ASAP</span></>
                : <><Clock size={14} className="text-ink-tertiary" />
                   <span className="text-ink-secondary">
                     {job.scheduled_for
                       ? new Date(job.scheduled_for).toLocaleDateString('en-NG', {
                           weekday: 'short', month: 'short', day: 'numeric',
                           hour: '2-digit', minute: '2-digit',
                         })
                       : 'Flexible timing'}
                   </span></>
              }
            </div>
            {job.customer_quote && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-tertiary font-semibold">₦</span>
                <span className="font-semibold text-ink">
                  Budget: ₦{job.customer_quote.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── BOOKED STATE ─────────────────────────────────────── */}
        {isBooked && bookedWorker && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-800">
                {job.status === 'booked' || job.status === 'accepted'
                  ? 'Worker booked! 🎉'
                  : job.status === 'in_progress' || job.status === 'en_route'
                  ? 'Job in progress…'
                  : 'Job complete!'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="font-bold text-brand-700 text-base">
                    {bookedWorker.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm text-ink truncate">{bookedWorker.full_name}</p>
                    {bookedWorker.is_verified && (
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary">
                    {bookedWorker.primary_skill}
                    {bookedWorker.rating > 0 && ` · ★ ${bookedWorker.rating.toFixed(1)}`}
                    {bookedWorker.state_lga && ` · ${bookedWorker.state_lga}`}
                  </p>
                </div>
              </div>
              {job.final_price && (
                <p className="text-sm text-green-700 mt-2 font-medium">
                  Agreed price: ₦{job.final_price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {isBooked && !bookedWorker && job.final_price && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <CheckCircle size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Worker booked!</p>
              <p className="text-sm text-green-700">Agreed price: ₦{job.final_price.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── BIDS LIST ─────────────────────────────────────────── */}
        {!isBooked && (
          <>
            <div className="flex items-center justify-between">
              <p className="section-label">
                {pendingBids.length === 0 ? 'Bids' : `Bids (${pendingBids.length})`}
              </p>
              {pendingBids.length > 0 && (
                <p className="text-xs text-ink-tertiary">Sorted by price ↑</p>
              )}
            </div>

            {pendingBids.length === 0 ? (
              <div className="card text-center py-8 flex flex-col items-center gap-2">
                <User size={28} className="text-ink-tertiary" />
                <p className="font-semibold text-ink">Waiting for bids</p>
                <p className="text-sm text-ink-secondary">
                  Workers will see your job and send quotes shortly.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingBids.map(bid => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    onAccept={handleAccept}
                    accepting={accepting === bid.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Accepted bid shown below when booked */}
        {isBooked && acceptedBid && (
          <>
            <p className="section-label">Accepted bid</p>
            <BidCard bid={acceptedBid} onAccept={() => {}} accepting={false} readonly />
          </>
        )}

      </div>
    </div>
  )
}

// ── Bid card ─────────────────────────────────────────────────────────────────

function BidCard({
  bid,
  onAccept,
  accepting,
  readonly = false,
}: {
  bid:       BidItem
  onAccept:  (id: string) => void
  accepting: boolean
  readonly?: boolean
}) {
  const w = bid.worker
  if (!w) return null

  const initial = w.full_name.charAt(0).toUpperCase()

  return (
    <div className="card flex flex-col gap-3">
      {/* Worker info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
          <span className="font-bold text-brand-700">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-ink truncate">{w.full_name}</p>
            {w.is_verified && (
              <CheckCircle size={13} className="text-green-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-ink-secondary">
            {w.primary_skill} · {w.years_experience}y exp
            {w.state_lga ? ` · ${w.state_lga}` : ''}
          </p>
          {w.rating > 0 && (
            <div className="flex items-center gap-0.5 mt-0.5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-ink-secondary">
                {w.rating.toFixed(1)} ({w.total_jobs} jobs)
              </span>
            </div>
          )}
        </div>
        <p className="font-extrabold text-brand-600 text-lg shrink-0">
          ₦{bid.amount.toLocaleString()}
        </p>
      </div>

      {/* Message */}
      {bid.message && (
        <p className="text-sm text-ink-secondary bg-surface-secondary rounded-xl p-3 italic">
          "{bid.message}"
        </p>
      )}

      {/* Accept button */}
      {!readonly && (
        <button
          onClick={() => onAccept(bid.id)}
          disabled={accepting}
          className="btn-primary py-3 text-sm">
          {accepting ? 'Booking…' : `Accept · ₦${bid.amount.toLocaleString()}`}
        </button>
      )}

      {readonly && (
        <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1 self-start">
          ✓ Accepted
        </span>
      )}
    </div>
  )
}
