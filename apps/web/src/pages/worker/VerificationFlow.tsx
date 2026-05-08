import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, VERIFICATION_STEPS } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, Clock, Circle } from 'lucide-react'

export default function VerificationFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [steps, setSteps] = useState<Array<{ step_number: number; status: string }>>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('verification_steps')
      .select('step_number, status')
      .eq('worker_id', user.id)
      .then(({ data }) => { if (data) setSteps(data) })
  }, [user])

  const getStatus = (n: number) => steps.find(s => s.step_number === n)?.status ?? 'pending'

  const statusIcon = (status: string) => {
    if (status === 'passed') return <CheckCircle size={20} className="text-green-500" />
    if (status === 'submitted' || status === 'under_review') return <Clock size={20} className="text-brand-500" />
    return <Circle size={20} className="text-ink-tertiary" />
  }

  const statusLabel: Record<string, string> = {
    pending: '', submitted: 'submitted', under_review: 'reviewing', passed: 'done', failed: 'failed',
  }

  return (
    <div className="min-h-dvh px-4 pt-6 pb-10">
      <button onClick={() => navigate(-1)} className="text-sm text-ink-secondary mb-6">← Back</button>
      <h1 className="text-2xl font-extrabold text-ink mb-1">Verification</h1>
      <p className="text-ink-secondary text-sm mb-6">Complete to start receiving jobs</p>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-tertiary rounded-full mb-6">
        <div className="h-full bg-brand-600 rounded-full transition-all"
          style={{ width: `${(steps.filter(s => s.status === 'passed').length / 5) * 100}%` }} />
      </div>

      <div className="flex flex-col gap-3">
        {VERIFICATION_STEPS.slice(0, 5).map(step => {
          const status = getStatus(step.number)
          const isNext = status === 'pending' && !steps.slice(0, step.number - 1).some(s => s.status !== 'passed')
          return (
            <div key={step.number}
              className={`card flex items-center gap-3 ${isNext ? 'border-2 border-brand-300' : ''}`}>
              {statusIcon(status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-ink">{step.name}</p>
                  {statusLabel[status] && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      status === 'passed' ? 'bg-green-50 text-green-700' : 'bg-brand-50 text-brand-700'
                    }`}>{statusLabel[status]}</span>
                  )}
                  {isNext && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-600 text-white">now</span>}
                </div>
                <p className="text-xs text-ink-secondary">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {steps.filter(s => s.status === 'passed').length === 5 ? (
        <button onClick={() => navigate('/worker/dashboard')} className="btn-primary mt-6">
          Go to dashboard →
        </button>
      ) : (
        <p className="text-center text-xs text-ink-tertiary mt-8">
          We'll notify you within 24–48h after each step.
        </p>
      )}
    </div>
  )
}
