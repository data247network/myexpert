import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase, NIGERIAN_STATES } from '@myexpert/shared'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email:     z.string().email('Enter a valid email'),
  phone:     z.string().min(11, 'Enter a valid Nigerian phone number'),
  state_lga: z.string().min(1, 'Select your state'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function SignupCustomer() {
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)
  const [sentTo,  setSentTo]  = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // Trigger handle_new_user() reads these to create the profile row
        data: {
          full_name: data.full_name,
          role:      'customer',
          phone:     data.phone,
          state_lga: data.state_lga,
        },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    })

    setLoading(false)

    if (signUpError) { setError(signUpError.message); return }

    // Session present = auto-confirm enabled (dev) → go straight in
    if (authData.session) {
      navigate('/home')
      return
    }

    // No session = email confirmation required → show check-email screen
    setSentTo(data.email)
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
      <p className="text-xs text-ink-tertiary mt-2">
        Tap the link to confirm your account, then come back to sign in.
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

      <div className="mt-6 mb-6">
        <p className="text-xs font-semibold text-ink-tertiary uppercase mb-1">CUSTOMER · SIGN UP</p>
        <h1 className="text-2xl font-extrabold text-ink mb-1">Create account</h1>
        <p className="text-ink-secondary text-sm">Takes 2 minutes. No card needed.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Full name</label>
          <input {...register('full_name')} placeholder="Adaeze Okeke" className="input-field" />
          {errors.full_name && <p className="text-xs text-danger mt-1">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Phone</label>
          <input {...register('phone')} type="tel" placeholder="08031234567" className="input-field" />
          {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">State</label>
          <select {...register('state_lga')} className="input-field">
            <option value="">Select your state</option>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state_lga && <p className="text-xs text-danger mt-1">{errors.state_lga.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Password</label>
          <input {...register('password')} type="password" placeholder="Min 8 characters" className="input-field" />
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>

        <p className="text-xs text-ink-tertiary">
          By signing up you agree to our{' '}
          <a href="#" className="underline">Terms & Privacy</a>.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary mt-4">
        Have an account?{' '}
        <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
      </p>
    </div>
  )
}
