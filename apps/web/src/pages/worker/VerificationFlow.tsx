import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, VERIFICATION_STEPS } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeft, CheckCircle, Clock, Circle, AlertCircle,
  ChevronDown, ChevronUp, Upload, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StepRow {
  step_number: number
  step_name:   string
  status:      'pending' | 'submitted' | 'under_review' | 'passed' | 'failed'
  data:        Record<string, unknown>
  admin_notes: string | null
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:      '',
  submitted:    'Submitted',
  under_review: 'Under review',
  passed:       'Approved ✓',
  failed:       'Needs resubmission',
}

const STATUS_COLORS: Record<string, string> = {
  submitted:    'bg-brand-50 text-brand-700',
  under_review: 'bg-yellow-50 text-yellow-700',
  passed:       'bg-green-50 text-green-700',
  failed:       'bg-red-50 text-red-700',
}

function StepIcon({ status }: { status: string }) {
  if (status === 'passed')       return <CheckCircle size={22} className="text-green-500 shrink-0" />
  if (status === 'submitted' ||
      status === 'under_review') return <Clock size={22} className="text-brand-500 shrink-0" />
  if (status === 'failed')       return <AlertCircle size={22} className="text-red-400 shrink-0" />
  return <Circle size={22} className="text-ink-tertiary shrink-0" />
}

// ── File upload helper ─────────────────────────────────────────────────────────

async function uploadFile(
  file: File,
  userId: string,
  folder: string
): Promise<string | null> {
  const ext  = file.name.split('.').pop()
  const path = `${userId}/${folder}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('verification-docs')
    .upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('verification-docs').getPublicUrl(path)
  return data.publicUrl
}

// ── Step forms ────────────────────────────────────────────────────────────────

function Step1Form({ onSubmit, saving }: {
  onSubmit: (data: Record<string, unknown>) => void
  saving:   boolean
}) {
  const [nin, setNin] = useState('')
  const valid = /^\d{11}$/.test(nin)
  return (
    <div className="flex flex-col gap-4 pt-3">
      <div>
        <label className="text-sm font-medium text-ink mb-1.5 block">
          NIN (11 digits) <span className="text-red-500">*</span>
        </label>
        <input
          value={nin}
          onChange={e => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="e.g. 12345678901"
          className="input-field font-mono tracking-widest text-center text-lg"
          inputMode="numeric"
        />
        <p className="text-xs text-ink-tertiary mt-1">
          Your NIN is on your NIN slip or NIMC mobile app.
        </p>
      </div>
      <button onClick={() => onSubmit({ nin })} disabled={!valid || saving} className="btn-primary py-3 text-sm">
        {saving ? 'Submitting…' : 'Submit NIN →'}
      </button>
    </div>
  )
}

function Step2Form({ onSubmit, saving, userId }: {
  onSubmit: (data: Record<string, unknown>) => void
  saving:   boolean
  userId:   string
}) {
  const [file,    setFile]    = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }
  const clear = () => { setFile(null); setPreview(null) }

  const handleSubmit = async () => {
    if (!file) return
    const url = await uploadFile(file, userId, 'selfie')
    if (url) onSubmit({ selfie_url: url })
  }

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="bg-brand-50 rounded-xl p-3 text-xs text-brand-700 flex flex-col gap-1">
        <p className="font-semibold">Tips for a good selfie:</p>
        <p>• Look directly at the camera in good lighting</p>
        <p>• No sunglasses or hats — face fully visible</p>
        <p>• Plain background preferred</p>
      </div>

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 py-8 border-2 border-dashed border-brand-200 rounded-2xl text-brand-600 hover:bg-brand-50 transition-colors">
          <Upload size={24} />
          <span className="text-sm font-medium">Tap to upload selfie</span>
          <span className="text-xs text-ink-tertiary">JPG, PNG or WEBP · max 5 MB</span>
        </button>
      ) : (
        <div className="relative">
          <img src={preview} alt="Selfie preview" className="w-full rounded-2xl object-cover" style={{ maxHeight: 280 }} />
          <button onClick={clear}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />

      <button onClick={handleSubmit} disabled={!file || saving} className="btn-primary py-3 text-sm">
        {saving ? 'Uploading…' : 'Submit selfie →'}
      </button>
    </div>
  )
}

function Step3Form({ onSubmit, saving }: {
  onSubmit: (data: Record<string, unknown>) => void
  saving:   boolean
}) {
  const [addr, setAddr] = useState('')
  const [lga,  setLga]  = useState('')
  const valid = addr.trim().length >= 10 && lga.trim().length >= 2
  return (
    <div className="flex flex-col gap-4 pt-3">
      <div>
        <label className="text-sm font-medium text-ink mb-1.5 block">
          Street address <span className="text-red-500">*</span>
        </label>
        <textarea
          value={addr}
          onChange={e => setAddr(e.target.value)}
          placeholder="e.g. 15 Broad Street, Apapa, Lagos"
          rows={3}
          className="input-field resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink mb-1.5 block">
          LGA / Area <span className="text-red-500">*</span>
        </label>
        <input
          value={lga}
          onChange={e => setLga(e.target.value)}
          placeholder="e.g. Apapa, Lagos"
          className="input-field"
        />
      </div>
      <button onClick={() => onSubmit({ address: addr.trim(), lga: lga.trim() })} disabled={!valid || saving} className="btn-primary py-3 text-sm">
        {saving ? 'Submitting…' : 'Submit address →'}
      </button>
    </div>
  )
}

function Step4Form({ onSubmit, saving, userId }: {
  onSubmit: (data: Record<string, unknown>) => void
  saving:   boolean
  userId:   string
}) {
  const [file,    setFile]    = useState<File | null>(null)
  const [certName, setCertName] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isImage  = file?.type?.startsWith('image/')

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }
  const clear = () => { setFile(null); setPreview(null) }

  const handleSubmit = async () => {
    if (!file) return
    const url = await uploadFile(file, userId, 'cert')
    if (url) onSubmit({ cert_url: url, cert_name: certName.trim() || file.name })
  }

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div>
        <label className="text-sm font-medium text-ink mb-1.5 block">
          Certificate / qualification name
        </label>
        <input
          value={certName}
          onChange={e => setCertName(e.target.value)}
          placeholder="e.g. City & Guilds Electrical Installation"
          className="input-field"
          maxLength={80}
        />
      </div>

      {!file ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 py-8 border-2 border-dashed border-brand-200 rounded-2xl text-brand-600 hover:bg-brand-50 transition-colors">
          <Upload size={24} />
          <span className="text-sm font-medium">Tap to upload certificate</span>
          <span className="text-xs text-ink-tertiary">JPG, PNG, WEBP or PDF · max 5 MB</span>
        </button>
      ) : (
        <div className="relative flex items-center gap-3 bg-surface-secondary rounded-2xl p-4">
          {isImage && preview
            ? <img src={preview} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            : <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 text-2xl">📄</div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{file.name}</p>
            <p className="text-xs text-ink-tertiary">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={clear}><X size={16} className="text-ink-tertiary" /></button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={pick} />

      <button onClick={handleSubmit} disabled={!file || saving} className="btn-primary py-3 text-sm">
        {saving ? 'Uploading…' : 'Submit certificate →'}
      </button>
    </div>
  )
}

interface Ref3 { name: string; relationship: string; phone: string }

function Step5Form({ onSubmit, saving }: {
  onSubmit: (data: Record<string, unknown>) => void
  saving:   boolean
}) {
  const [refs, setRefs] = useState<Ref3[]>([
    { name: '', relationship: '', phone: '' },
    { name: '', relationship: '', phone: '' },
    { name: '', relationship: '', phone: '' },
  ])

  const setRef = (i: number, k: keyof Ref3, v: string) =>
    setRefs(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r))

  const valid = refs.every(r => r.name.trim() && r.phone.trim().length >= 8)

  return (
    <div className="flex flex-col gap-4 pt-3">
      {refs.map((r, i) => (
        <div key={i} className="bg-surface-secondary rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-ink-tertiary uppercase">Reference {i + 1}</p>
          <input
            value={r.name}
            onChange={e => setRef(i, 'name', e.target.value)}
            placeholder="Full name *"
            className="input-field py-3"
          />
          <input
            value={r.relationship}
            onChange={e => setRef(i, 'relationship', e.target.value)}
            placeholder="Relationship (e.g. Former employer, colleague)"
            className="input-field py-3"
          />
          <input
            value={r.phone}
            onChange={e => setRef(i, 'phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="Phone number *"
            className="input-field py-3"
            inputMode="tel"
          />
        </div>
      ))}
      <button
        onClick={() => onSubmit({ references: refs })}
        disabled={!valid || saving}
        className="btn-primary py-3 text-sm">
        {saving ? 'Submitting…' : 'Submit references →'}
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VerificationFlow() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [steps,    setSteps]    = useState<StepRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [openStep, setOpenStep] = useState<number | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const fetchSteps = () => {
    if (!user) return
    supabase
      .from('verification_steps')
      .select('step_number, step_name, status, data, admin_notes')
      .eq('worker_id', user.id)
      .order('step_number')
      .then(({ data }) => {
        if (data) setSteps(data as StepRow[])
        setLoading(false)
      })
  }

  useEffect(() => { fetchSteps() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const getStep = (n: number) =>
    steps.find(s => s.step_number === n) ??
    { step_number: n, step_name: '', status: 'pending' as const, data: {}, admin_notes: null }

  const passedCount = steps.filter(s => s.status === 'passed').length
  const allDone     = passedCount === 5

  const submitStep = async (stepNumber: number, data: Record<string, unknown>) => {
    if (!user) return
    setSaving(true)
    setError('')

    const { error: dbError } = await supabase
      .from('verification_steps')
      .update({ data, status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('worker_id', user.id)
      .eq('step_number', stepNumber)

    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    setOpenStep(null)
    fetchSteps()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-dvh">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-dvh bg-surface-secondary pb-10">
      {/* Header */}
      <div className="bg-surface px-4 pt-4 pb-5 border-b border-surface-tertiary">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-ink-secondary mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-extrabold text-ink mb-1">Get Verified</h1>
        <p className="text-ink-secondary text-sm">Complete 5 steps to start receiving paid jobs.</p>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-ink-secondary">
              {passedCount} of 5 steps complete
            </p>
            <p className="text-xs font-bold text-brand-600">{Math.round((passedCount / 5) * 100)}%</p>
          </div>
          <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${(passedCount / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {allDone && (
        <div className="mx-4 mt-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <CheckCircle size={24} className="text-green-500 shrink-0" />
          <div>
            <p className="font-bold text-green-800">All steps complete! 🎉</p>
            <p className="text-sm text-green-700">You are now a verified MyExpert pro.</p>
          </div>
        </div>
      )}

      {error && (
        <p className="mx-4 mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}

      {/* Steps */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {VERIFICATION_STEPS.map(meta => {
          const row      = getStep(meta.number)
          const canOpen  = ['pending', 'failed'].includes(row.status)
          const isOpen   = openStep === meta.number
          // A step is locked if any previous step isn't at least submitted
          const isLocked = meta.number > 1 &&
            steps.filter(s => s.step_number < meta.number && s.status !== 'passed').length > 0 &&
            row.status === 'pending'

          return (
            <div key={meta.number}
              className={`card overflow-hidden transition-all ${
                isOpen ? 'border-2 border-brand-400' :
                row.status === 'failed' ? 'border-2 border-red-200' :
                row.status === 'passed' ? 'border border-green-100' : ''
              } ${isLocked ? 'opacity-50' : ''}`}>

              {/* Step header — tap to expand */}
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => !isLocked && canOpen && setOpenStep(isOpen ? null : meta.number)}
                disabled={isLocked || !canOpen}>

                <StepIcon status={row.status} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-ink">{meta.icon} {meta.name}</p>
                    {STATUS_LABEL[row.status] && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status] ?? ''}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    )}
                    {canOpen && !isLocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white">
                        {row.status === 'failed' ? 'resubmit' : 'start'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">{meta.description}</p>
                  {row.admin_notes && row.status === 'failed' && (
                    <p className="text-xs text-red-600 mt-1">⚠ {row.admin_notes}</p>
                  )}
                </div>

                {canOpen && !isLocked && (
                  isOpen
                    ? <ChevronUp size={16} className="text-ink-tertiary shrink-0" />
                    : <ChevronDown size={16} className="text-ink-tertiary shrink-0" />
                )}
              </button>

              {/* Expandable form */}
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-surface-tertiary">
                  {meta.number === 1 && (
                    <Step1Form onSubmit={d => submitStep(1, d)} saving={saving} />
                  )}
                  {meta.number === 2 && user && (
                    <Step2Form onSubmit={d => submitStep(2, d)} saving={saving} userId={user.id} />
                  )}
                  {meta.number === 3 && (
                    <Step3Form onSubmit={d => submitStep(3, d)} saving={saving} />
                  )}
                  {meta.number === 4 && user && (
                    <Step4Form onSubmit={d => submitStep(4, d)} saving={saving} userId={user.id} />
                  )}
                  {meta.number === 5 && (
                    <Step5Form onSubmit={d => submitStep(5, d)} saving={saving} />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-ink-tertiary mt-6 px-8">
        Each step is reviewed within 24–48 hours. You'll be notified once approved.
      </p>
    </div>
  )
}
