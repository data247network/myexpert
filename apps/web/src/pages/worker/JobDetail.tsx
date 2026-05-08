import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, MapPin, Clock, Zap, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'

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
  promo_code:       string | null
  created_at:       string
  category_name:    string | null
  worker_id:        string | null
}

interface ExistingBid {
  id:     string
  amount: number
  status: string
  message: string | null
}

export default function WorkerJobDetail() {
  const { jobId }    = useParams<{ jobId: string }>()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [job,       setJob]      = useState<JobDetail | null>(null)
  const [existing,  setExisting] = useState<ExistingBid | null>(null)
  const [loading,   setLoading]  = useState(true)
  const [amount,    setAmount]   = useState('')
  const [message,   setMessage]  = useState('')
  const [submitting,   setSubmitting]    = useState(false)
  const [error,        setError]         = useState('')
  const [success,      setSuccess]       = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError,   setActionError]   = useState('')

  useEffect(() => {
    if (!jobId || !user) return
    Promise.all([
      // Job details
      supabase
        .from('jobs')
        .select('*, categories(name)')
        .eq('id', jobId)
        .single(),
      // Any existing bid from this worker
      supabase
        .from('bids')
        .select('id, amount, status, message')
        .eq('job_id', jobId)
        .eq('worker_id', user.id)
        .maybeSingle(),
    ]).then(([{ data: jobData }, { data: bidData }]) => {
      if (jobData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const j = jobData as any
        setJob({ ...j, category_name: j.categories?.name ?? null })
        setAmount(j.customer_quote ? String(j.customer_quote) : '')
      }
      if (bidData) setExisting(bidData as ExistingBid)
      setLoading(false)
    })
  }, [jobId, user])

  const submitBid = async () => {
    if (!jobId || !user || !amount) return
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase.from('bids').insert({
      job_id:    jobId,
      worker_id: user.id,
      amount:    Number(amount),
      message:   message.trim() || null,
      status:    'pending',
    })

    // Also update job status to 'bidding' if still 'open'
    if (!insertError) {
      await supabase
        .from('jobs')
        .update({ status: 'bidding' })
        .eq('id', jobId)
        .eq('status', 'open')
    }

    setSubmitting(false)
    if (insertError) { setError(insertError.message); return }
    setSuccess(true)
    // Reload bid
    const { data } = await supabase
      .from('bids')
      .select('id, amount, status, message')
      .eq('job_id', jobId)
      .eq('worker_id', user.id)
      .single()
    if (data) setExisting(data as ExistingBid)
  }

  const withdrawBid = async () => {
    if (!existing) return
    await supabase
      .from('bids')
      .update({ status: 'withdrawn' })
      .eq('id', existing.id)
    setExisting({ ...existing, status: 'withdrawn' })
  }

  const runAction = async (fn: string, params: Record<string, unknown>) => {
    setActionLoading(true)
    setActionError('')
    const { data, error: rpcErr } = await supabase.rpc(fn, params)
    setActionLoading(false)
    if (rpcErr || data?.error) {
      setActionError(rpcErr?.message ?? data?.error ?? 'Something went wrong.')
      return
    }
    // Reload job
    if (!jobId || !user) return
    const { data: jd } = await supabase
      .from('jobs').select('*, categories(name)').eq('id', jobId).single()
    if (jd) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const j = jd as any
      setJob({ ...j, category_name: j.categories?.name ?? null })
    }
  }

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

  const isClosed   = !['open', 'bidding'].includes(job.status)
  const hasBid     = !!existing && existing.status !== 'withdrawn'
  const isAccepted = existing?.status === 'accepted'
  const isRejected = existing?.status === 'rejected'

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
        {job.urgency === 'urgent' && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            <Zap size={10} /> URGENT
          </span>
        )}
      </div>

      <div className="px-4 pt-5">
        {/* Category + Title */}
        {job.category_name && (
          <p className="section-label mb-1">{job.category_name}</p>
        )}
        <h1 className="text-xl font-extrabold text-ink mb-4">{job.title}</h1>

        {/* Details */}
        <div className="card mb-4 flex flex-col gap-3">
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
                       ? new Date(job.scheduled_for).toLocaleDateString('en-NG', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
                       : 'Flexible timing'}
                   </span></>
              }
            </div>
            {job.customer_quote && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-tertiary font-semibold">₦</span>
                <span className="font-semibold text-ink">
                  Customer budget: ₦{job.customer_quote.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bid status banners */}
        {isAccepted && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
              <CheckCircle size={20} className="text-green-500 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Your bid was accepted! 🎉</p>
                <p className="text-sm text-green-700">
                  Agreed price: ₦{existing!.amount.toLocaleString()}. The customer will contact you soon.
                </p>
              </div>
            </div>
            {/* Chat button — available once bid is accepted */}
            <Link
              to={`/worker/chat/${jobId}`}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold transition-colors hover:bg-brand-100">
              <MessageCircle size={16} /> Message customer
            </Link>
          </div>
        )}

        {/* ── Job progress actions (when bid accepted and job active) ── */}
        {isAccepted && (
          <div className="flex flex-col gap-2 mb-4">
            {/* Payment received — start job */}
            {job.status === 'accepted' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl p-3">
                  <CheckCircle size={18} className="text-brand-500 shrink-0" />
                  <p className="text-sm font-medium text-brand-800">
                    💰 Customer paid ₦{job.final_price?.toLocaleString()} — ready to start!
                  </p>
                </div>
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <button
                  onClick={() => runAction('start_job', { p_job_id: jobId })}
                  disabled={actionLoading}
                  className="btn-primary py-3 text-sm">
                  {actionLoading ? 'Updating…' : '🔧 Start job →'}
                </button>
              </div>
            )}

            {/* In progress — mark complete */}
            {job.status === 'in_progress' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0" />
                  <p className="text-sm font-medium text-orange-800">Job in progress</p>
                </div>
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <button
                  onClick={() => runAction('complete_job', { p_job_id: jobId })}
                  disabled={actionLoading}
                  className="btn-primary py-3 text-sm">
                  {actionLoading ? 'Updating…' : '✅ Mark job as complete →'}
                </button>
              </div>
            )}

            {/* Done — awaiting confirmation */}
            {job.status === 'done' && (
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <CheckCircle size={20} className="text-yellow-500 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Waiting for confirmation</p>
                  <p className="text-sm text-yellow-700">
                    The customer needs to confirm completion to release your payment.
                  </p>
                </div>
              </div>
            )}

            {/* Confirmed — payment released */}
            {job.status === 'confirmed' && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                <CheckCircle size={20} className="text-green-500 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Payment released! 💸</p>
                  <p className="text-sm text-green-700">
                    ₦{job.final_price ? (job.final_price * 0.9).toLocaleString() : '—'} added to your balance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isRejected && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Bid not selected</p>
              <p className="text-sm text-red-700">
                The customer chose another worker for this job.
              </p>
            </div>
          </div>
        )}

        {success && !isAccepted && !isRejected && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
            <CheckCircle size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Bid sent!</p>
              <p className="text-sm text-green-700">
                ₦{Number(amount).toLocaleString()} · waiting for customer's response.
              </p>
            </div>
          </div>
        )}

        {/* Existing pending bid */}
        {hasBid && existing.status === 'pending' && !success && (
          <div className="card border-2 border-brand-200 mb-4">
            <p className="font-semibold text-sm text-ink mb-1">Your bid</p>
            <p className="text-brand-600 font-bold text-lg">₦{existing.amount.toLocaleString()}</p>
            {existing.message && (
              <p className="text-sm text-ink-secondary mt-1">"{existing.message}"</p>
            )}
            <button onClick={withdrawBid}
              className="mt-3 text-xs text-red-500 font-medium hover:text-red-700">
              Withdraw bid
            </button>
          </div>
        )}

        {/* Bid form — show if: no existing bid, job is open/bidding, not accepted/rejected */}
        {!hasBid && !isClosed && !success && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">
                Your quote (₦) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-secondary font-semibold">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 12000"
                  min="0"
                  className="input-field pl-8"
                />
              </div>
              {job.customer_quote && (
                <p className="text-xs text-ink-tertiary mt-1">
                  Customer's budget: ₦{job.customer_quote.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">
                Message <span className="text-ink-tertiary font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Introduce yourself, describe your approach, or ask a question…"
                rows={3}
                maxLength={300}
                className="input-field resize-none"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="bg-surface-secondary rounded-xl p-3 text-xs text-ink-secondary">
              💡 MyExpert charges a 10% fee on your earnings. Your take-home on ₦{amount ? Number(amount).toLocaleString() : '...'} would be
              {amount
                ? ` ₦${(Number(amount) * 0.9).toLocaleString()}`
                : ' 90% of your bid'}.
            </div>

            <button
              onClick={submitBid}
              disabled={!amount || submitting}
              className="btn-primary">
              {submitting ? 'Sending bid…' : 'Send bid →'}
            </button>
          </div>
        )}

        {isClosed && !hasBid && (
          <div className="card text-center py-6">
            <p className="text-ink-tertiary text-sm">This job is no longer accepting bids.</p>
          </div>
        )}
      </div>
    </div>
  )
}
