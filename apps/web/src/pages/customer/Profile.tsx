import { useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, NIGERIAN_STATES } from '@myexpert/shared'
import { MapPin, Phone, Mail, ChevronRight, LogOut, Shield, Pencil, X, Check, Eye, EyeOff, Lock } from 'lucide-react'

// ── Privacy & Security modal ──────────────────────────────────────────────────
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
    setSaving(true)
    setMsg(null)
    // Re-authenticate with current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPw,
    })
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
            <input
              type={showCur ? 'text' : 'password'}
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="input-field pl-9 pr-10"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" onClick={() => setShowCur(s => !s)}>
              {showCur ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="input-field pl-9 pr-10"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" onClick={() => setShowNew(s => !s)}>
              {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>

          <input
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Confirm new password"
            className="input-field"
          />

          {msg && (
            <p className={`text-sm rounded-xl px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </p>
          )}

          <button onClick={handleChangePassword} disabled={saving || !currentPw || !newPw || !confirmPw} className="btn-primary">
            {saving ? 'Updating…' : 'Update Password'}
          </button>

          <div className="border-t border-surface-tertiary pt-4">
            <p className="text-xs text-ink-secondary font-semibold uppercase mb-2">Account Info</p>
            <p className="text-sm text-ink-secondary">Signed in as <span className="font-semibold text-ink">{user?.email}</span></p>
            <p className="text-xs text-ink-tertiary mt-1">
              To delete your account or for data requests, contact{' '}
              <a href="mailto:support@myexpert.ng" className="text-brand-600 underline">support@myexpert.ng</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Edit Profile modal ────────────────────────────────────────────────────────
function EditModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile, user } = useAuth()
  const [fullName,  setFullName]  = useState(profile?.full_name  ?? '')
  const [phone,     setPhone]     = useState(profile?.phone      ?? '')
  const [stateLga,  setStateLga]  = useState(profile?.state_lga  ?? '')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const save = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null, state_lga: stateLga || null, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink">Edit Profile</h2>
          <button onClick={onClose}><X size={20} className="text-ink-tertiary" /></button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-secondary uppercase mb-1 block">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="input-field" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-secondary uppercase mb-1 block">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 08012345678" type="tel" className="input-field" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-secondary uppercase mb-1 block">State</label>
            <select value={stateLga} onChange={e => setStateLga(e.target.value)} className="input-field">
              <option value="">Select state…</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <button onClick={save} disabled={saving || !fullName.trim()} className="btn-primary flex items-center justify-center gap-2">
            <Check size={16} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const { profile, signOut } = useAuth()
  const [showEdit,    setShowEdit]    = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [refreshKey,  setRefreshKey]  = useState(0)

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?'

  const rows = [
    { icon: Mail,   label: 'Email',    value: profile?.email     ?? '—' },
    { icon: Phone,  label: 'Phone',    value: profile?.phone     ?? '—' },
    { icon: MapPin, label: 'State',    value: profile?.state_lga ?? '—' },
  ]

  // Force re-render after saving (profile in context will also refresh on next auth change)
  const handleSaved = () => setRefreshKey(k => k + 1)

  return (
    <div className="page-with-nav" key={refreshKey}>
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="relative">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-3xl font-extrabold text-brand-600">{initial}</span>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center border-2 border-white shadow">
            <Pencil size={12} className="text-white" />
          </button>
        </div>
        <h1 className="text-xl font-bold text-ink mt-2">{profile?.full_name}</h1>
        <span className="mt-1 text-xs font-semibold px-2.5 py-1 bg-surface-secondary text-ink-secondary rounded-full">
          Customer
        </span>
      </div>

      {/* Info rows */}
      <div className="mx-4 card mb-4">
        {rows.map(({ icon: Icon, label, value }, i) => (
          <div key={label}
            className={`flex items-center gap-3 py-3 ${i < rows.length - 1 ? 'border-b border-surface-tertiary' : ''}`}>
            <Icon size={16} className="text-ink-tertiary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-ink-tertiary">{label}</p>
              <p className="text-sm font-medium text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mx-4 flex flex-col gap-2">
        <button onClick={() => setShowEdit(true)} className="card flex items-center gap-3 text-left w-full">
          <Pencil size={16} className="text-ink-tertiary" />
          <span className="flex-1 text-sm font-medium text-ink">Edit Profile</span>
          <ChevronRight size={16} className="text-ink-tertiary" />
        </button>

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

      {showEdit    && <EditModal    onClose={() => setShowEdit(false)}    onSaved={handleSaved} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      <BottomNav variant="customer" />
    </div>
  )
}
