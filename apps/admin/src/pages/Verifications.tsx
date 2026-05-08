import { useEffect, useState } from 'react'
import { supabase } from '@myexpert/shared'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkerSummary {
  id:                  string
  full_name:           string
  primary_skill:       string
  is_verified:         boolean
  verification_status: string
  steps:               StepRow[]
  pendingCount:        number
}

interface StepRow {
  step_number: number
  step_name:   string
  status:      string
  data:        Record<string, unknown>
  admin_notes: string | null
  submitted_at: string | null
}

// ── Step meta ─────────────────────────────────────────────────────────────────

const STEP_META: Record<number, { icon: string; name: string }> = {
  1: { icon: '🪪', name: 'NIN'           },
  2: { icon: '🤳', name: 'Selfie'        },
  3: { icon: '🏠', name: 'Address'       },
  4: { icon: '📜', name: 'Certificate'   },
  5: { icon: '👥', name: 'References'    },
}

const STATUS_CHIP: Record<string, string> = {
  pending:      'bg-gray-100 text-gray-500',
  submitted:    'bg-blue-50 text-blue-700',
  under_review: 'bg-yellow-50 text-yellow-700',
  passed:       'bg-green-50 text-green-700',
  failed:       'bg-red-50 text-red-700',
}

// ── Review modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  workerId,
  step,
  onClose,
  onDone,
}: {
  workerId: string
  step:     StepRow
  onClose:  () => void
  onDone:   () => void
}) {
  const [notes,   setNotes]   = useState(step.admin_notes ?? '')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const meta = STEP_META[step.step_number]

  const review = async (outcome: 'passed' | 'failed') => {
    setSaving(true)
    setError('')
    const { data, error: rpcErr } = await supabase.rpc('review_verification_step', {
      p_worker_id:   workerId,
      p_step_number: step.step_number,
      p_outcome:     outcome,
      p_notes:       notes.trim() || null,
    })
    setSaving(false)
    if (rpcErr || data?.error) {
      setError(rpcErr?.message ?? data?.error)
      return
    }
    onDone()
    onClose()
  }

  // Render submitted data nicely
  const renderData = () => {
    const d = step.data
    if (!d || Object.keys(d).length === 0) return <p className="text-sm text-gray-400">No data submitted.</p>

    return (
      <div className="flex flex-col gap-2">
        {Object.entries(d).map(([k, v]) => {
          const isUrl = typeof v === 'string' && v.startsWith('http')
          const isArr = Array.isArray(v)
          return (
            <div key={k} className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{k.replace(/_/g, ' ')}</p>
              {isUrl ? (
                <a href={v as string} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  View file <ExternalLink size={12} />
                </a>
              ) : isArr ? (
                <div className="flex flex-col gap-2">
                  {(v as Record<string, string>[]).map((ref, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="font-medium">{ref.name}</p>
                      <p className="text-gray-500">{ref.relationship} · {ref.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{String(v)}</p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg">{meta.icon} Step {step.step_number}: {meta.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Submitted {step.submitted_at
              ? new Date(step.submitted_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
              : 'N/A'}
          </p>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {renderData()}

          {/* Admin notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Notes to worker <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for failure, what to resubmit, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => review('failed')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 disabled:opacity-50">
              <XCircle size={16} /> Reject
            </button>
            <button
              onClick={() => review('passed')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50">
              <CheckCircle size={16} /> {saving ? 'Saving…' : 'Approve'}
            </button>
          </div>

          <button onClick={onClose} className="text-sm text-center text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Worker row ────────────────────────────────────────────────────────────────

function WorkerRow({ worker, onRefresh }: { worker: WorkerSummary; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [reviewing, setReviewing] = useState<StepRow | null>(null)

  const submittedSteps = worker.steps.filter(s => s.status === 'submitted' || s.status === 'under_review')

  return (
    <>
      {reviewing && (
        <ReviewModal
          workerId={worker.id}
          step={reviewing}
          onClose={() => setReviewing(null)}
          onDone={onRefresh}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header row */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">

          {/* Avatar */}
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
            <span className="font-bold text-purple-700">{worker.full_name.charAt(0)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{worker.full_name}</p>
              {worker.is_verified && (
                <CheckCircle size={14} className="text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500">{worker.primary_skill}</p>
          </div>

          {/* Step chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {worker.steps.map(s => (
              <span
                key={s.step_number}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CHIP[s.status] ?? ''}`}>
                {STEP_META[s.step_number]?.icon}
              </span>
            ))}
          </div>

          {/* Pending badge */}
          {worker.pendingCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
              {worker.pendingCount} to review
            </span>
          )}

          {expanded
            ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
        </button>

        {/* Expanded step list */}
        {expanded && (
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {worker.steps.map(step => (
              <div key={step.step_number} className="flex items-center gap-4 px-5 py-3">
                <p className="text-sm font-medium text-gray-700 w-36 shrink-0">
                  {STEP_META[step.step_number]?.icon} {STEP_META[step.step_number]?.name}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CHIP[step.status] ?? ''}`}>
                  {step.status.replace('_', ' ')}
                </span>
                {step.submitted_at && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(step.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {(step.status === 'submitted' || step.status === 'under_review') && (
                  <button
                    onClick={() => setReviewing(step)}
                    className="ml-auto text-xs font-semibold text-blue-600 hover:underline">
                    Review →
                  </button>
                )}
                {step.status === 'failed' && step.admin_notes && (
                  <p className="ml-auto text-xs text-red-500 truncate max-w-[180px]">{step.admin_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick review buttons for submitted steps when collapsed */}
      {!expanded && submittedSteps.length > 0 && (
        <div className="mt-1 flex gap-2">
          {submittedSteps.map(s => (
            <button
              key={s.step_number}
              onClick={() => { setExpanded(true); setReviewing(s) }}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
              Review {STEP_META[s.step_number]?.name} →
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VerificationsPage() {
  const [workers,  setWorkers]  = useState<WorkerSummary[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | 'pending' | 'verified'>('pending')

  const fetchWorkers = async () => {
    setLoading(true)

    // Get all worker profiles with their steps
    const { data: wpData } = await supabase
      .from('worker_profiles')
      .select(`
        id, primary_skill, is_verified, verification_status,
        profiles!inner ( full_name ),
        verification_steps ( step_number, step_name, status, data, admin_notes, submitted_at )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (wpData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: WorkerSummary[] = (wpData as any[]).map(w => {
        const steps: StepRow[] = (w.verification_steps ?? []).sort(
          (a: StepRow, b: StepRow) => a.step_number - b.step_number
        )
        return {
          id:                  w.id,
          full_name:           w.profiles?.full_name ?? 'Unknown',
          primary_skill:       w.primary_skill,
          is_verified:         w.is_verified,
          verification_status: w.verification_status,
          steps,
          pendingCount:        steps.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
        }
      })
      setWorkers(mapped)
    }

    setLoading(false)
  }

  useEffect(() => { fetchWorkers() }, [])

  const filtered = workers.filter(w => {
    if (filter === 'pending')  return w.pendingCount > 0
    if (filter === 'verified') return w.is_verified
    return true
  })

  const totalPending = workers.reduce((sum, w) => sum + w.pendingCount, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review worker identity and skill submissions</p>
        </div>
        {totalPending > 0 && (
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            {totalPending} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(['pending', 'all', 'verified'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
              filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f === 'pending' ? `To review${totalPending > 0 ? ` (${totalPending})` : ''}` : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-12">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {filter === 'pending' ? 'No pending submissions right now.' : 'No workers found.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(w => (
            <WorkerRow key={w.id} worker={w} onRefresh={fetchWorkers} />
          ))}
        </div>
      )}
    </div>
  )
}
