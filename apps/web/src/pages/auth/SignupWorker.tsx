import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, CATEGORIES } from '@myexpert/shared'
import { ArrowLeft } from 'lucide-react'

export default function SignupWorker() {
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)
  const [sentTo,  setSentTo]  = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    primary_skill: '', years_experience: '1', password: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // DB trigger handle_new_user() reads these to create
        // profiles + worker_profiles + verification_steps rows
        data: {
          full_name:        form.full_name,
          role:             'worker',
          phone:            form.phone,
          primary_skill:    form.primary_skill,
          years_experience: form.years_experience,
        },
        emailRedirectTo: `${window.location.origin}/worker/verify`,
      },
    })

    setLoading(false)

    if (signUpError) { setError(signUpError.message); return }

    // Session present = auto-confirm enabled → go straight to verify
    if (authData.session) {
      navigate('/worker/verify')
      return
    }

    // No session = email confirmation required
    setSentTo(form.email)
    setDone(true)
  }

  if (done) return (
    <div className="flex flex-col h-dvh px-6 pt-14 items-center justify-center gap-4 text-center">
      <div className="text-5xl mb-2">📬</div>
      <h2 className="text-xl font-bold text-ink">Check your email</h2>
      <p className="text-ink-secondary text-sm">
        We sent a confirmation link to<br />
        <strong>{sentTo}</strong>
      </p>
      <p className="text-xs text-ink-tertiary mt-2 max-w-xs">
        Tap the link to confirm your account, then come back to sign in and complete your verification.
      </p>
      <button onClick={() => navigate('/login')}
        className="mt-4 px-6 py-3 bg-brand-600 text-white font-semibold rounded-2xl text-sm">
        Go to sign in
      </button>
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-4 pb-8">
      <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-6 mb-2">
        <p className="text-xs font-semibold text-ink-tertiary uppercase mb-1">PRO · SIGN UP</p>
        <h1 className="text-2xl font-extrabold text-ink mb-1">Earn with your skills</h1>
        <p className="text-ink-secondary text-sm">~10 mins to set up. Verified in 24–48h.</p>
      </div>

      {/* What you'll need */}
      <div className="bg-orange-50 rounded-2xl p-4 my-4">
        <p className="text-xs font-semibold text-orange-700 mb-2">WHAT YOU'LL NEED</p>
        {[
          'Your NIN (11 digits)',
          'A clear selfie',
          'Address & 3 reference contacts',
          'Skill certificate (optional but boosts trust)',
        ].map(i => (
          <p key={i} className="text-sm text-orange-800">• {i}</p>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Full name (as on NIN)</label>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
            required minLength={2} placeholder="Tunde Adeyemi" className="input-field" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
          <input value={form.email} onChange={e => set('email', e.target.value)}
            type="email" required placeholder="tunde@example.com" className="input-field" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            type="tel" required placeholder="08031234567" className="input-field" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Primary skill</label>
          <select value={form.primary_skill} onChange={e => set('primary_skill', e.target.value)}
            required className="input-field">
            <option value="">Select your primary skill</option>
            {CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Years of experience</label>
          <input value={form.years_experience} onChange={e => set('years_experience', e.target.value)}
            type="number" min="0" max="50" required className="input-field" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Password</label>
          <input value={form.password} onChange={e => set('password', e.target.value)}
            type="password" required minLength={8} placeholder="Min 8 characters" className="input-field" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account…' : 'Continue to verification'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary mt-4">
        Have an account?{' '}
        <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
      </p>
    </div>
  )
}
