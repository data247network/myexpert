import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, CATEGORIES } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, ChevronRight, Zap, Clock, MapPin, Tag, CheckCircle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryRow { id: string; name: string }

interface Draft {
  categoryName: string
  categoryId:   string
  title:        string
  description:  string
  urgency:      'normal' | 'urgent'
  scheduledFor: string   // ISO string or ''
  budget:       string   // number as string
  location:     string
  locationLat:  number | null
  locationLng:  number | null
  promoCode:    string
}

const EMPTY: Draft = {
  categoryName: '', categoryId: '', title: '', description: '',
  urgency: 'normal', scheduledFor: '', budget: '', location: '',
  locationLat: null, locationLng: null, promoCode: '',
}

// ── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 px-6 mb-6">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
          n <= current ? 'bg-brand-600' : 'bg-surface-tertiary'
        }`} />
      ))}
    </div>
  )
}

// ── Step 1 — Pick category + title ───────────────────────────────────────────

function Step1({ draft, set, next }: {
  draft: Draft
  set: (k: keyof Draft, v: string) => void
  next: () => void
}) {
  const canContinue = draft.categoryId && draft.title.trim().length >= 3

  return (
    <div className="flex flex-col flex-1 px-6">
      <h2 className="text-xl font-extrabold text-ink mb-1">What do you need?</h2>
      <p className="text-ink-secondary text-sm mb-5">Choose a category, then describe the job.</p>

      {/* Category grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {CATEGORIES.map(c => (
          <button key={c.name}
            onClick={() => set('categoryName', c.name)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-colors ${
              draft.categoryName === c.name
                ? 'border-brand-500 bg-brand-50'
                : 'border-transparent bg-surface-secondary hover:bg-brand-50'
            }`}>
            <span className="text-2xl">{c.icon}</span>
            <span className="text-[11px] font-medium text-ink-secondary text-center leading-tight">
              {c.name}
            </span>
          </button>
        ))}
      </div>

      {/* Title */}
      {draft.categoryName && (
        <div className="mb-5">
          <label className="text-sm font-medium text-ink mb-1.5 block">
            Briefly describe the job
          </label>
          <input
            value={draft.title}
            onChange={e => set('title', e.target.value)}
            placeholder={`e.g. Fix leaking kitchen tap`}
            maxLength={80}
            className="input-field"
            autoFocus
          />
          <p className="text-xs text-ink-tertiary mt-1 text-right">
            {draft.title.length}/80
          </p>
        </div>
      )}

      <div className="mt-auto">
        <button onClick={next} disabled={!canContinue} className="btn-primary">
          Continue →
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — Description + urgency ───────────────────────────────────────────

function Step2({ draft, set, next, back }: {
  draft: Draft
  set: (k: keyof Draft, v: string) => void
  next: () => void
  back: () => void
}) {
  return (
    <div className="flex flex-col flex-1 px-6">
      <h2 className="text-xl font-extrabold text-ink mb-1">Tell us more</h2>
      <p className="text-ink-secondary text-sm mb-5">Add details to get better quotes.</p>

      {/* Description */}
      <div className="mb-5">
        <label className="text-sm font-medium text-ink mb-1.5 block">Details (optional)</label>
        <textarea
          value={draft.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Brand of item, what's wrong, access instructions, etc."
          rows={4}
          maxLength={500}
          className="input-field resize-none"
        />
        <p className="text-xs text-ink-tertiary mt-1 text-right">
          {draft.description.length}/500
        </p>
      </div>

      {/* Urgency */}
      <div className="mb-5">
        <label className="text-sm font-medium text-ink mb-2 block">When do you need this?</label>
        <div className="flex gap-3">
          <button
            onClick={() => { set('urgency', 'urgent'); set('scheduledFor', '') }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors ${
              draft.urgency === 'urgent'
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-transparent bg-surface-secondary text-ink-secondary'
            }`}>
            <Zap size={16} />
            ASAP
          </button>
          <button
            onClick={() => set('urgency', 'normal')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors ${
              draft.urgency === 'normal'
                ? 'border-brand-400 bg-brand-50 text-brand-700'
                : 'border-transparent bg-surface-secondary text-ink-secondary'
            }`}>
            <Clock size={16} />
            Schedule
          </button>
        </div>
      </div>

      {/* Date/time for scheduled */}
      {draft.urgency === 'normal' && (
        <div className="mb-5">
          <label className="text-sm font-medium text-ink mb-1.5 block">Preferred date &amp; time</label>
          <input
            type="datetime-local"
            value={draft.scheduledFor}
            onChange={e => set('scheduledFor', e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="input-field"
          />
        </div>
      )}

      <div className="mt-auto flex gap-3">
        <button onClick={back} className="btn-secondary w-auto px-5">←</button>
        <button onClick={next} className="btn-primary flex-1">Continue →</button>
      </div>
    </div>
  )
}

// ── Step 3 — Budget + location ────────────────────────────────────────────────

function Step3({ draft, set, setCoords, next, back }: {
  draft: Draft
  set: (k: keyof Draft, v: string) => void
  setCoords: (lat: number, lng: number, address: string) => void
  next: () => void
  back: () => void
}) {
  const canContinue = draft.location.trim().length >= 3
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser.')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setCoords(lat, lng, addr)
        } catch {
          setCoords(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
        setLocating(false)
      },
      err => {
        setLocError(
          err.code === 1
            ? 'Location permission denied. Please type your address.'
            : 'Could not detect location. Please type your address.'
        )
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col flex-1 px-6">
      <h2 className="text-xl font-extrabold text-ink mb-1">Budget & location</h2>
      <p className="text-ink-secondary text-sm mb-5">Workers will see your budget and send quotes.</p>

      {/* Budget */}
      <div className="mb-5">
        <label className="text-sm font-medium text-ink mb-1.5 block">
          Your budget (₦) <span className="text-ink-tertiary font-normal">— optional</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-secondary font-semibold">₦</span>
          <input
            type="number"
            value={draft.budget}
            onChange={e => set('budget', e.target.value)}
            placeholder="e.g. 15000"
            min="0"
            className="input-field pl-8"
          />
        </div>
        <p className="text-xs text-ink-tertiary mt-1">
          Leave blank to receive open quotes from workers.
        </p>
      </div>

      {/* Location */}
      <div className="mb-5">
        <label className="text-sm font-medium text-ink mb-1.5 block">
          Job location <span className="text-red-500">*</span>
        </label>

        {/* GPS button */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="w-full mb-2 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold transition-colors hover:bg-brand-100 disabled:opacity-60">
          {locating
            ? <><div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /> Detecting…</>
            : <><MapPin size={15} /> Use my current location</>}
        </button>

        {locError && (
          <p className="text-xs text-red-500 mb-2">{locError}</p>
        )}

        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            value={draft.location}
            onChange={e => {
              set('location', e.target.value)
              // Clear coords if user manually edits
            }}
            placeholder="Or type: 12 Bode Thomas, Surulere, Lagos"
            className="input-field pl-10"
            autoComplete="street-address"
          />
        </div>

        {draft.locationLat && (
          <p className="text-xs text-green-700 mt-1.5 flex items-center gap-1">
            <CheckCircle size={11} /> GPS coordinates captured
            <span className="text-ink-tertiary ml-1">
              ({draft.locationLat.toFixed(4)}, {draft.locationLng?.toFixed(4)})
            </span>
          </p>
        )}
      </div>

      <div className="mt-auto flex gap-3">
        <button onClick={back} className="btn-secondary w-auto px-5">←</button>
        <button onClick={next} disabled={!canContinue} className="btn-primary flex-1">
          Review job →
        </button>
      </div>
    </div>
  )
}

// ── Step 4 — Review + post ────────────────────────────────────────────────────

function Step4({ draft, set, onPost, back, loading }: {
  draft:   Draft
  set:     (k: keyof Draft, v: string) => void
  onPost:  () => void
  back:    () => void
  loading: boolean
}) {
  const catIcon = CATEGORIES.find(c => c.name === draft.categoryName)?.icon ?? '🔧'

  return (
    <div className="flex flex-col flex-1 px-6">
      <h2 className="text-xl font-extrabold text-ink mb-1">Review your job</h2>
      <p className="text-ink-secondary text-sm mb-5">
        Once posted, verified workers nearby will send you quotes.
      </p>

      {/* Summary card */}
      <div className="card mb-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{catIcon}</span>
          <div>
            <p className="text-xs text-ink-tertiary uppercase font-semibold">{draft.categoryName}</p>
            <p className="font-bold text-ink">{draft.title}</p>
          </div>
        </div>

        {draft.description && (
          <p className="text-sm text-ink-secondary border-t border-surface-tertiary pt-3">
            {draft.description}
          </p>
        )}

        <div className="border-t border-surface-tertiary pt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            {draft.urgency === 'urgent'
              ? <><Zap size={14} className="text-orange-500" /><span className="text-orange-700 font-medium">ASAP</span></>
              : <><Clock size={14} className="text-brand-500" /><span className="text-brand-700 font-medium">
                  {draft.scheduledFor
                    ? new Date(draft.scheduledFor).toLocaleDateString('en-NG', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
                    : 'Flexible'}
                </span></>
            }
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <MapPin size={14} className="text-ink-tertiary" />
            {draft.location}
          </div>
          {draft.budget && (
            <div className="flex items-center gap-2 text-sm text-ink-secondary">
              <span className="font-semibold text-ink-tertiary">₦</span>
              Budget: ₦{Number(draft.budget).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Promo code */}
      <div className="mb-5">
        <label className="text-sm font-medium text-ink mb-1.5 block flex items-center gap-1.5">
          <Tag size={14} /> Promo code <span className="text-ink-tertiary font-normal">(optional)</span>
        </label>
        <input
          value={draft.promoCode}
          onChange={e => set('promoCode', e.target.value.toUpperCase())}
          placeholder="e.g. WELCOME2K"
          className="input-field font-mono tracking-wider uppercase"
          maxLength={20}
        />
      </div>

      {/* Service fee note */}
      <div className="bg-surface-secondary rounded-xl p-3 mb-5 text-xs text-ink-secondary">
        💡 MyExpert charges a <strong>10% service fee</strong> deducted from the worker's payout.
        You pay the agreed price — no hidden charges.
      </div>

      <div className="mt-auto flex gap-3">
        <button onClick={back} className="btn-secondary w-auto px-5">←</button>
        <button onClick={onPost} disabled={loading} className="btn-primary flex-1">
          {loading ? 'Posting…' : '🚀 Post job'}
        </button>
      </div>
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ onView }: { onView: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-ink">Job posted!</h2>
      <p className="text-ink-secondary text-sm">
        Verified workers near you will see your job and send quotes.
        We'll notify you when bids come in.
      </p>
      <button onClick={onView} className="btn-primary mt-2">
        View my jobs →
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PostJob() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const { user }      = useAuth()

  const [step,    setStep]    = useState(1)
  const [draft,   setDraft]   = useState<Draft>({
    ...EMPTY,
    categoryName: params.get('category') ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [catMap,  setCatMap]  = useState<Record<string, string>>({})

  // Fetch category ID map (name → uuid) once
  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((r: CategoryRow) => { map[r.name] = r.id })
        setCatMap(map)
      }
    })
  }, [])

  // When category name changes, update the ID
  useEffect(() => {
    if (draft.categoryName) {
      setDraft(d => ({ ...d, categoryId: catMap[d.categoryName] ?? '' }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.categoryName, catMap])

  const set = (k: keyof Draft, v: string) => setDraft(d => ({ ...d, [k]: v }))

  const setCoords = (lat: number, lng: number, address: string) => {
    setDraft(d => ({ ...d, locationLat: lat, locationLng: lng, location: address }))
  }

  const post = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('jobs').insert({
      customer_id:      user.id,
      category_id:      draft.categoryId || null,
      title:            draft.title.trim(),
      description:      draft.description.trim() || null,
      urgency:          draft.urgency,
      scheduled_for:    draft.scheduledFor || null,
      customer_quote:   draft.budget ? Number(draft.budget) : null,
      location_address: draft.location.trim(),
      location_lat:     draft.locationLat,
      location_lng:     draft.locationLng,
      promo_code:       draft.promoCode.trim() || null,
      status:           'open',
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSuccess(true)
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-ink-tertiary font-semibold uppercase">Post a job</p>
        </div>
        <span className="text-xs text-ink-tertiary font-medium">{step}/4</span>
      </div>

      <Steps current={step} />

      {success ? (
        <SuccessScreen onView={() => navigate('/jobs')} />
      ) : (
        <div className="flex flex-col flex-1 pb-8">
          {error && (
            <p className="mx-6 mb-3 text-sm text-danger bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}
          {step === 1 && <Step1 draft={draft} set={set} next={() => setStep(2)} />}
          {step === 2 && <Step2 draft={draft} set={set} next={() => setStep(3)} back={() => setStep(1)} />}
          {step === 3 && <Step3 draft={draft} set={set} setCoords={setCoords} next={() => setStep(4)} back={() => setStep(2)} />}
          {step === 4 && <Step4 draft={draft} set={set} onPost={post} back={() => setStep(3)} loading={loading} />}
        </div>
      )}
    </div>
  )
}
