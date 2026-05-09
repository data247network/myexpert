import { useEffect, useState } from 'react'
import { supabase } from '@myexpert/shared'
import { Wallet2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface WorkerPayout {
  id:                string
  full_name:         string
  primary_skill:     string
  phone:             string | null
  available_balance: number
  total_jobs:        number
  pending_payout:    PayoutRecord | null
}

interface PayoutRecord {
  id:          string
  amount:      number
  fee:         number
  net_amount:  number
  bank_name:   string | null
  account_number: string | null
  account_name:   string | null
  status:      string
  reference:   string | null
  notes:       string | null
  created_at:  string
  processed_at: string | null
}

const WITHDRAWAL_FEE = 100

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PayoutModal({
  worker,
  onClose,
  onProcessed,
}: {
  worker:      WorkerPayout
  onClose:     () => void
  onProcessed: () => void
}) {
  const [bankName,   setBankName]   = useState('')
  const [accountNo,  setAccountNo]  = useState('')
  const [accountNm,  setAccountNm]  = useState('')
  const [reference,  setReference]  = useState(`PAY-${Date.now()}`)
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const amount    = worker.available_balance
  const netAmount = amount - WITHDRAWAL_FEE

  const handleProcess = async () => {
    if (!bankName || !accountNo) { setError('Bank name and account number are required.'); return }
    setSaving(true)
    setError('')

    // Create payout record
    const { error: insertErr } = await supabase.from('payouts').insert({
      worker_id:      worker.id,
      amount,
      fee:            WITHDRAWAL_FEE,
      net_amount:     netAmount,
      bank_name:      bankName,
      account_number: accountNo,
      account_name:   accountNm || null,
      status:         'processed',
      reference,
      notes:          notes.trim() || null,
      processed_at:   new Date().toISOString(),
    })
    if (insertErr) { setError(insertErr.message); setSaving(false); return }

    // Deduct from worker balance
    const { error: updateErr } = await supabase
      .from('worker_profiles')
      .update({ available_balance: 0 })
      .eq('id', worker.id)
    if (updateErr) { setError(updateErr.message); setSaving(false); return }

    setSaving(false)
    onProcessed()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Process payout</h2>
          <button onClick={onClose}><XCircle size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm flex flex-col gap-1.5">
          <p><span className="font-semibold">Worker:</span> {worker.full_name}</p>
          {worker.phone && <p><span className="font-semibold">Phone:</span> {worker.phone}</p>}
          <div className="border-t border-gray-200 pt-1.5 mt-1 flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Balance</span>
              <span className="font-semibold">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Withdrawal fee</span>
              <span>– ₦{WITHDRAWAL_FEE}</span>
            </div>
            <div className="flex justify-between font-bold text-brand-700 pt-1 border-t border-gray-200">
              <span>Worker receives</span>
              <span>₦{netAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Bank name <span className="text-red-500">*</span></label>
            <input value={bankName} onChange={e => setBankName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Guaranty Trust Bank" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Account number <span className="text-red-500">*</span></label>
            <input value={accountNo} onChange={e => setAccountNo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="0123456789" maxLength={10} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Account name</label>
            <input value={accountNm} onChange={e => setAccountNm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="As shown on bank" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Reference</label>
            <input value={reference} onChange={e => setReference(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Processing…' : '✓ Mark as paid'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkerRow({ worker, onProcessed }: { worker: WorkerPayout; onProcessed: () => void }) {
  const [expanded,  setExpanded]  = useState(false)
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && (
        <PayoutModal
          worker={worker}
          onClose={() => setShowModal(false)}
          onProcessed={() => { setShowModal(false); onProcessed() }}
        />
      )}

      <div className="admin-card">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(p => !p)}>
          {/* Avatar */}
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
            <span className="font-bold text-brand-700">{worker.full_name.charAt(0).toUpperCase()}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{worker.full_name}</p>
            <p className="text-xs text-gray-500">{worker.primary_skill} · {worker.total_jobs} jobs</p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-bold text-brand-700">₦{worker.available_balance.toLocaleString()}</p>
            <p className="text-xs text-gray-400">available</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {worker.available_balance >= 1000 && (
              <button
                onClick={e => { e.stopPropagation(); setShowModal(true) }}
                className="px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700">
                Pay out
              </button>
            )}
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>

        {/* Expanded: payout history */}
        {expanded && worker.pending_payout && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Latest payout</p>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                worker.pending_payout.status === 'processed' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {worker.pending_payout.status === 'processed'
                  ? <CheckCircle size={14} className="text-green-600" />
                  : <Clock size={14} className="text-yellow-600" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">₦{worker.pending_payout.net_amount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  {worker.pending_payout.bank_name ?? '—'} · {worker.pending_payout.account_number ?? '—'}
                  {worker.pending_payout.processed_at && ` · ${timeAgo(worker.pending_payout.processed_at)}`}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                worker.pending_payout.status === 'processed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {worker.pending_payout.status}
              </span>
            </div>
          </div>
        )}
        {expanded && !worker.pending_payout && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">No payout history.</p>
          </div>
        )}
      </div>
    </>
  )
}

export default function PayoutsPage() {
  const [workers,  setWorkers]  = useState<WorkerPayout[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'ready' | 'all'>('ready')

  const load = async () => {
    setLoading(true)

    let q = supabase
      .from('worker_profiles')
      .select('id, primary_skill, available_balance, total_jobs, profiles(full_name, phone)')
      .order('available_balance', { ascending: false })

    if (filter === 'ready') q = q.gte('available_balance', 1000)

    const { data: wpData } = await q
    if (!wpData) { setLoading(false); return }

    // Fetch most recent payout per worker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workerIds = (wpData as any[]).map(w => w.id)
    const { data: payoutData } = await supabase
      .from('payouts')
      .select('*')
      .in('worker_id', workerIds)
      .order('created_at', { ascending: false })

    // Build latest payout map
    const latestPayout: Record<string, PayoutRecord> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(payoutData ?? []).forEach((p: any) => {
      if (!latestPayout[p.worker_id]) latestPayout[p.worker_id] = p as PayoutRecord
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setWorkers((wpData as any[]).map(w => ({
      id:                w.id,
      full_name:         w.profiles?.full_name  ?? 'Unknown',
      primary_skill:     w.primary_skill         ?? '—',
      phone:             w.profiles?.phone       ?? null,
      available_balance: Number(w.available_balance ?? 0),
      total_jobs:        w.total_jobs            ?? 0,
      pending_payout:    latestPayout[w.id]      ?? null,
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalOwed = workers.reduce((s, w) => s + w.available_balance, 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Payouts</h1>
          <p className="text-sm text-gray-500">Process worker withdrawals from available balance</p>
        </div>
        {!loading && totalOwed > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Total owed</p>
            <p className="text-lg font-bold text-brand-700">₦{totalOwed.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        {(['ready', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f === 'ready' ? 'Ready to pay (≥ ₦1k)' : 'All workers'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workers.length === 0 ? (
        <div className="admin-card flex flex-col items-center gap-2 py-16 text-center">
          <Wallet2 size={32} className="text-gray-300" />
          <p className="font-semibold text-gray-600">No workers ready for payout</p>
          <p className="text-sm text-gray-400">Workers need at least ₦1,000 available balance.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workers.map(w => (
            <WorkerRow key={w.id} worker={w} onProcessed={load} />
          ))}
        </div>
      )}
    </div>
  )
}
