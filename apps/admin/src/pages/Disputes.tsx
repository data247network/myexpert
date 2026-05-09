import { useEffect, useState } from 'react'
import { supabase } from '@myexpert/shared'
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Dispute {
  id:                    string
  job_id:                string
  status:                string
  customer_claim:        string | null
  worker_response:       string | null
  admin_notes:           string | null
  outcome:               string | null
  outcome_amount_worker: number | null
  outcome_amount_customer: number | null
  created_at:            string
  resolved_at:           string | null
  job_title:             string
  customer_name:         string
  worker_name:           string
  final_price:           number | null
}

const STATUS_STYLE: Record<string, string> = {
  open:     'bg-red-50 text-red-700',
  resolved: 'bg-green-50 text-green-700',
  closed:   'bg-gray-100 text-gray-500',
}

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ResolveModal({
  dispute,
  onClose,
  onResolved,
}: {
  dispute:    Dispute
  onClose:    () => void
  onResolved: () => void
}) {
  const [outcome,       setOutcome]       = useState<'refund_customer' | 'pay_worker' | 'split' | 'no_action'>('pay_worker')
  const [adminNotes,    setAdminNotes]    = useState(dispute.admin_notes ?? '')
  const [workerAmount,  setWorkerAmount]  = useState(String(dispute.final_price ?? 0))
  const [customerAmount, setCustomerAmount] = useState('0')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  const handleResolve = async () => {
    setSaving(true)
    setError('')
    const { error: e } = await supabase
      .from('disputes')
      .update({
        status:                  'resolved',
        outcome,
        admin_notes:             adminNotes.trim() || null,
        outcome_amount_worker:   Number(workerAmount),
        outcome_amount_customer: Number(customerAmount),
        resolved_at:             new Date().toISOString(),
      })
      .eq('id', dispute.id)
    if (e) { setError(e.message); setSaving(false); return }

    // Update job status to cancelled (dispute resolved)
    await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', dispute.job_id)

    setSaving(false)
    onResolved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Resolve dispute</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm flex flex-col gap-2">
          <p><span className="font-semibold">Job:</span> {dispute.job_title}</p>
          <p><span className="font-semibold">Customer:</span> {dispute.customer_name}</p>
          <p><span className="font-semibold">Worker:</span> {dispute.worker_name}</p>
          {dispute.final_price && (
            <p><span className="font-semibold">Escrow amount:</span> ₦{dispute.final_price.toLocaleString()}</p>
          )}
          {dispute.customer_claim && (
            <div>
              <p className="font-semibold">Claim:</p>
              <p className="text-gray-600 italic">"{dispute.customer_claim}"</p>
            </div>
          )}
          {dispute.worker_response && (
            <div>
              <p className="font-semibold">Worker response:</p>
              <p className="text-gray-600 italic">"{dispute.worker_response}"</p>
            </div>
          )}
        </div>

        {/* Outcome */}
        <div>
          <p className="text-sm font-semibold mb-2">Outcome</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['pay_worker',       'Pay worker in full'],
              ['refund_customer',  'Refund customer'],
              ['split',            'Split payment'],
              ['no_action',        'No action'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setOutcome(val)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                  outcome === val
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Amounts (show when split) */}
        {outcome === 'split' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Worker gets (₦)</label>
              <input
                type="number" value={workerAmount}
                onChange={e => setWorkerAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Customer gets (₦)</label>
              <input
                type="number" value={customerAmount}
                onChange={e => setCustomerAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {/* Admin notes */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Admin notes (internal)</label>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Internal notes about this resolution…"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : 'Resolve dispute'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DisputeRow({ dispute, onResolved }: { dispute: Dispute; onResolved: () => void }) {
  const [expanded, setExpanded]       = useState(false)
  const [showModal, setShowModal]     = useState(false)

  return (
    <>
      {showModal && (
        <ResolveModal
          dispute={dispute}
          onClose={() => setShowModal(false)}
          onResolved={() => { setShowModal(false); onResolved() }}
        />
      )}

      <div className="admin-card">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => setExpanded(p => !p)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[dispute.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {dispute.status.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400">{timeAgo(dispute.created_at)}</span>
            </div>
            <p className="font-semibold text-sm text-gray-900 truncate">{dispute.job_title}</p>
            <p className="text-xs text-gray-500">
              {dispute.customer_name} → {dispute.worker_name}
              {dispute.final_price && ` · ₦${dispute.final_price.toLocaleString()}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dispute.status === 'open' && (
              <button
                onClick={e => { e.stopPropagation(); setShowModal(true) }}
                className="px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700">
                Resolve
              </button>
            )}
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2 text-sm">
            {dispute.customer_claim && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Customer claim</p>
                <p className="text-gray-700 italic">"{dispute.customer_claim}"</p>
              </div>
            )}
            {dispute.worker_response && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Worker response</p>
                <p className="text-gray-700 italic">"{dispute.worker_response}"</p>
              </div>
            )}
            {dispute.outcome && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Outcome</p>
                <p className="font-medium text-gray-900">{dispute.outcome.replace(/_/g, ' ')}</p>
              </div>
            )}
            {dispute.admin_notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Admin notes</p>
                <p className="text-gray-600">{dispute.admin_notes}</p>
              </div>
            )}
            {dispute.resolved_at && (
              <p className="text-xs text-gray-400">Resolved {timeAgo(dispute.resolved_at)}</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'open' | 'resolved' | 'all'>('open')

  const load = async () => {
    setLoading(true)
    let q = supabase
      .from('disputes')
      .select('*, jobs(title, final_price, customer_id, worker_id)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') q = q.eq('status', filter)

    const { data } = await q

    if (!data) { setLoading(false); return }

    // Collect all user IDs to fetch names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = [...new Set((data as any[]).flatMap(d => [d.jobs?.customer_id, d.jobs?.worker_id].filter(Boolean)))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    const nameMap: Record<string, string> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profiles?.forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Unknown' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDisputes((data as any[]).map(d => ({
      id:                      d.id,
      job_id:                  d.job_id,
      status:                  d.status,
      customer_claim:          d.customer_claim,
      worker_response:         d.worker_response,
      admin_notes:             d.admin_notes,
      outcome:                 d.outcome,
      outcome_amount_worker:   d.outcome_amount_worker,
      outcome_amount_customer: d.outcome_amount_customer,
      created_at:              d.created_at,
      resolved_at:             d.resolved_at,
      job_title:               d.jobs?.title         ?? 'Untitled job',
      final_price:             d.jobs?.final_price   ?? null,
      customer_name:           nameMap[d.jobs?.customer_id] ?? 'Customer',
      worker_name:             nameMap[d.jobs?.worker_id]   ?? 'Worker',
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCount = disputes.filter(d => d.status === 'open').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Disputes
            {openCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {openCount} open
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500">Review claims and release or refund escrow funds</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        {(['open', 'resolved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="admin-card flex flex-col items-center gap-2 py-16 text-center">
          <CheckCircle size={32} className="text-green-400" />
          <p className="font-semibold text-gray-700">No {filter !== 'all' ? filter : ''} disputes</p>
          <p className="text-sm text-gray-400">All clear!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map(d => (
            <DisputeRow key={d.id} dispute={d} onResolved={load} />
          ))}
        </div>
      )}

      {/* Summary bar */}
      {!loading && disputes.length > 0 && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <AlertTriangle size={14} className="text-red-400" />
            {disputes.filter(d => d.status === 'open').length} open
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle size={14} className="text-green-400" />
            {disputes.filter(d => d.status === 'resolved').length} resolved
          </span>
        </div>
      )}
    </div>
  )
}
