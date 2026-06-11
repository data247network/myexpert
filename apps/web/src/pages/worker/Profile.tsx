import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import type { WorkerProfile } from '@myexpert/shared'
import { Phone, Mail, Star, Briefcase, Shield, ChevronRight, LogOut, CheckCircle, Eye, EyeOff, Lock, X } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Privacy & Security modal (shared pattern) ─────────────────────────────────
function PrivacyModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw,     setNewPw]       = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showCur,   setShowCur]     = useState(false)
  const [showNew,   setShowNew]     = useState(false)
  const [saving,    setSaving]      = useState(false)
  const [msg,       setMsg]         = useState<{ type: 'ok'|'err'; text: string } | null>(null)

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 8) { setMsg({ type:'err', text:'New password must be at least 8 characters.' }); return }
    if (newPw !== confirmPw)         { setMsg({ type:'err', text:'Passwords do not match.' }); return }
    setSaving(true); setMsg(null)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user?.email ?? '', password: currentPw })
    if (signInErr) { setSaving(false); setMsg({ type:'err', text:'Current password is incorrect.' }); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (error) { setMsg({ type:'err', text: error.message }); return }
    setMsg({ type:'ok', text:'Password updated successfully!' })
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2"><Shield size={18} className="text-brand-600" /> Privacy &amp; Security</h2>
          <button onClick={onClose}><X size={20} className="text-ink-tertiary" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ink-secondary font-semibold uppercase">Change Password</p>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input type={showCur ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className="input-field pl-9 pr-10" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" onClick={() => setShowCur(s => !s)}>{showCur ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 8 chars)" className="input-field pl-9 pr-10" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" onClick={() => setShowNew(s => !s)}>{showNew ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
          </div>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" className="input-field" />
          {msg && <p className={`text-sm rounded-xl px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>}
          <button onClick={handleChangePassword} disabled={saving || !currentPw || !newPw || !confirmPw} className="btn-primary">
            {saving ? 'Updating…' : 'Update Password'}
          </button>
          <div className="border-t border-surface-tertiary pt-4">
            <p className="text-xs text-ink-secondary font-semibold uppercase mb-2">Account Info</p>
            <p className="text-sm text-ink-secondary">Signed in as <span className="font-semibold text-ink">{user?.email}</span></p>
            <p className="text-xs text-ink-tertiary mt-1">To delete your account, contact <a href="mailto:support@myexpert.ng" className="text-brand-600 underline">support@myexpert.ng</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Review {
  id:         string
  rating:     number
  tags:       string[]
  comment:    string | null
  created_at: string
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-tertiary'}
        />
      ))}
    </div>
  )
}

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
}

export default function WorkerProfilePage() {
  const { user, profile, signOut } = useAuth()
  const [worker,  setWorker]  = useState<WorkerProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingR, setLoadingR] = useState(true)
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    if (!user) return

    supabase
      .from('worker_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setWorker(data as WorkerProfile) })

    supabase
      .from('reviews')
      .select('id, rating, tags, comment, created_at')
      .eq('worker_id', user.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setReviews(data as Review[])
        setLoadingR(false)
      })
  }, [user])

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="page-with-nav">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="relative">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-3xl font-extrabold text-brand-600">{initial}</span>
          </div>
          {worker?.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle size={14} className="text-white" />
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold text-ink mt-1">{profile?.full_name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full">
            {worker?.primary_skill ?? 'Pro'}
          </span>
          {worker?.is_verified && (
            <span className="badge-verified">
              <CheckCircle size={10} /> NIN verified
            </span>
          )}
        </div>

        {/* Stats row */}
        {worker && (
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold text-ink">{worker.rating > 0 ? worker.rating.toFixed(1) : '—'}</p>
              <p className="text-[10px] text-ink-tertiary flex items-center gap-0.5">
                <Star size={9} className={worker.rating > 0 ? 'text-yellow-400 fill-yellow-400' : ''} /> Rating
              </p>
            </div>
            <div className="text-center">
              <p className="font-bold text-ink">{worker.total_reviews ?? 0}</p>
              <p className="text-[10px] text-ink-tertiary">Reviews</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-ink">{worker.total_jobs}</p>
              <p className="text-[10px] text-ink-tertiary flex items-center gap-0.5">
                <Briefcase size={9} /> Jobs
              </p>
            </div>
            <div className="text-center">
              <p className="font-bold text-ink">{worker.years_experience}y</p>
              <p className="text-[10px] text-ink-tertiary">Exp.</p>
            </div>
          </div>
        )}
      </div>

      {/* Info rows */}
      <div className="mx-4 card mb-4">
        {[
          { icon: Mail,  label: 'Email', value: profile?.email ?? '—' },
          { icon: Phone, label: 'Phone', value: profile?.phone ?? '—' },
        ].map(({ icon: Icon, label, value }, i, arr) => (
          <div key={label}
            className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? 'border-b border-surface-tertiary' : ''}`}>
            <Icon size={16} className="text-ink-tertiary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-ink-tertiary">{label}</p>
              <p className="text-sm font-medium text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div className="mx-4 mb-4">
        <p className="section-label mb-3">
          REVIEWS {worker && worker.total_reviews > 0 && `(${worker.total_reviews})`}
        </p>

        {loadingR ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-ink-tertiary text-sm">No reviews yet.</p>
            <p className="text-xs text-ink-tertiary mt-1">
              Reviews appear here after customers confirm completed jobs.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map(r => (
              <div key={r.id} className="card flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <StarRow rating={r.rating} size={14} />
                  <span className="text-xs text-ink-tertiary">{timeAgo(r.created_at)}</span>
                </div>

                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map(t => (
                      <span key={t}
                        className="text-[10px] font-semibold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {r.comment && (
                  <p className="text-sm text-ink-secondary italic">"{r.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mx-4 flex flex-col gap-2 mb-4">
        {!worker?.is_verified && (
          <Link to="/worker/verify"
            className="card flex items-center gap-3 text-left w-full border-2 border-orange-200">
            <Shield size={16} className="text-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Complete verification</p>
              <p className="text-xs text-ink-tertiary">Required to receive jobs</p>
            </div>
            <ChevronRight size={16} className="text-ink-tertiary" />
          </Link>
        )}

        <button onClick={() => setShowPrivacy(true)} className="card flex items-center gap-3 text-left w-full">
          <Shield size={16} className="text-ink-tertiary" />
          <span className="flex-1 text-sm font-medium text-ink">Privacy &amp; Security</span>
          <ChevronRight size={16} className="text-ink-tertiary" />
        </button>

        <button onClick={signOut}
          className="card flex items-center gap-3 text-left w-full text-red-600">
          <LogOut size={16} />
          <span className="flex-1 text-sm font-medium">Sign out</span>
        </button>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      <BottomNav variant="worker" />
    </div>
  )
}
