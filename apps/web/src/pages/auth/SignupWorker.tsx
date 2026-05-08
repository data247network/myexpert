import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, CATEGORIES, VERIFICATION_STEPS } from '@myexpert/shared'
import { ArrowLeft } from 'lucide-react'

export default function SignupWorker() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
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
      options: { data: { full_name: form.full_name, role: 'worker' } },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (authData.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: authData.user.id, role: 'worker',
        full_name: form.full_name, email: form.email, phone: form.phone,
      })
      // Create worker profile
      await supabase.from('worker_profiles').insert({
        id: authData.user.id,
        primary_skill: form.primary_skill,
        years_experience: Number(form.years_experience),
      })
      // Scaffold verification steps 1–5
      await supabase.from('verification_steps').insert(
        VERIFICATION_STEPS.slice(0, 5).map(step => ({
          worker_id:   authData.user!.id,
          step_number: step.number,
          step_name:   step.name,
          status:      'pending',
        }))
      )
    }

    navigate('/worker/verify')
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-4 pb-8">
      <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-6 mb-2">
        <p className="text-xs font-semibold text-ink-tertiary uppercase mb-1">← PRO · SIGN UP</p>
        <h1 className="text-2xl font-extrabold text-ink mb-1">Earn with your skills</h1>
        <p className="text-ink-secondary text-sm">It takes ~10 mins. We'll verify you in 24–48h.</p>
      </div>

      {/* What you'll need */}
      <div className="bg-orange-50 rounded-2xl p-4 my-4">
        <p className="text-xs font-semibold text-orange-700 mb-2">WHAT YOU'LL NEED</p>
        {['Your NIN (11 digits)','A clear selfie','Address & 3 reference contacts','Skill certificate (optional but boosts trust)'].map(i => (
          <p key={i} className="text-sm text-orange-800">• {i}</p>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Full name (as on NIN)</label>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
            required placeholder="Tunde Adeyemi" className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
          <input value={form.email} onChange={e => set('email', e.target.value)}
            type="email" required placeholder="tunde@example.com" className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            required placeholder="+234 803 555 0142" className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Primary skill</label>
          <select value={form.primary_skill} onChange={e => set('primary_skill', e.target.value)}
            required className="input-field">
            <option value="">Select your primary skill</option>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
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
            type="password" required placeholder="••••••••" className="input-field" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account…' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary mt-4">
        Have an account?{' '}
        <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
      </p>
    </div>
  )
}
