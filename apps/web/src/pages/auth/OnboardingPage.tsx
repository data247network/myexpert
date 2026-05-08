import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Shield, MapPin, CreditCard, CheckCircle } from 'lucide-react'

const slides = [
  {
    // Screen A — Illustrated
    id: 'A',
    bg: 'bg-white',
    content: (
      <div className="flex flex-col flex-1 px-6 pt-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Hero illustration placeholder */}
          <div className="w-full h-52 bg-surface-secondary rounded-3xl flex items-center justify-center mb-8">
            <span className="text-ink-tertiary text-sm">hero illustration · workers in action</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink text-center leading-tight mb-3">
            Find <span className="underline decoration-brand-400">trusted hands</span> near you.
          </h1>
          <p className="text-ink-secondary text-center text-sm leading-relaxed">
            Verified plumbers, tailors, mechanics & more —<br />
            booked in minutes, paid only when the job is done.
          </p>
        </div>
      </div>
    ),
  },
  {
    // Screen B — Trust-led (dark)
    id: 'B',
    bg: 'bg-ink',
    content: (
      <div className="flex flex-col flex-1 px-6 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Mx</span>
          </div>
          <span className="text-white font-bold text-lg">MyExpert</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Real workers.<br />
          Verified by <span className="underline decoration-brand-400">NIN</span>.<br />
          Paid through escrow.
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Every artisan on MyExpert passes ID, address & skill checks.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            [Shield,      'TRUST',    'NIN-verified',   'Government ID match'],
            [CreditCard,  'SAFE PAY', 'Escrow held',    'Released on completion'],
            [CheckCircle, 'SKILL',    'Certified',      'Certs + references'],
            [MapPin,      'LOCAL',    'In your LGA',    'Address-checked'],
          ].map(([Icon, label, title, sub]) => (
            <div key={title as string} className="bg-white/10 rounded-2xl p-3">
              <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1">{label as string}</p>
              <p className="text-white font-semibold text-sm">{title as string}</p>
              <p className="text-gray-400 text-xs">{sub as string}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    // Screen C — Role-pick
    id: 'C',
    bg: 'bg-white',
    content: null, // handled separately (role pick)
  },
]

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()

  const isLast = slide === slides.length - 1

  return (
    <div className={`flex flex-col h-dvh ${slides[slide].bg} transition-colors duration-300`}>
      {/* Skip */}
      <div className="flex justify-end px-6 pt-4">
        <button onClick={() => setSlide(slides.length - 1)}
          className={`text-sm font-medium ${slides[slide].bg === 'bg-ink' ? 'text-gray-400' : 'text-ink-secondary'}`}>
          Skip
        </button>
      </div>

      {/* Slide content */}
      {slide < 2 ? (
        <div className="flex flex-col flex-1">
          {slides[slide].content}
        </div>
      ) : (
        /* Screen C — Role picker */
        <div className="flex flex-col flex-1 px-6 pt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Mx</span>
            </div>
            <span className="font-bold text-lg text-ink">MyExpert</span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink mb-1">Welcome 👋</h2>
          <p className="text-ink-secondary text-sm mb-8">How will you use MyExpert today?</p>

          <div className="flex flex-col gap-4">
            <button onClick={() => navigate('/signup/customer')}
              className="card border-2 border-transparent hover:border-brand-300 transition-colors text-left">
              <p className="text-[10px] font-semibold text-ink-tertiary uppercase mb-1">I NEED HELP</p>
              <p className="font-bold text-ink text-lg mb-1">Hire a worker</p>
              <p className="text-ink-secondary text-sm mb-3">Post a job, browse verified pros, pay safely.</p>
              <button className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl">
                Continue →
              </button>
            </button>

            <button onClick={() => navigate('/signup/worker')}
              className="card border-2 border-transparent hover:border-brand-300 transition-colors text-left">
              <p className="text-[10px] font-semibold text-ink-tertiary uppercase mb-1">I HAVE SKILLS</p>
              <p className="font-bold text-ink text-lg mb-1">Get jobs as a pro</p>
              <p className="text-ink-secondary text-sm mb-3">List your skills, get verified, earn weekly.</p>
              <button className="px-4 py-2 border border-brand-300 text-brand-600 text-sm font-semibold rounded-xl">
                Continue →
              </button>
            </button>
          </div>

          <p className="text-center text-xs text-ink-tertiary mt-auto mb-6">
            By continuing you agree to our{' '}
            <a href="#" className="underline">Terms & Privacy</a>.
          </p>
        </div>
      )}

      {/* Dots + next */}
      {!isLast && (
        <div className="flex items-center justify-between px-6 pb-10">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div key={i}
                className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-brand-600' : 'w-2 bg-gray-300'}`}
              />
            ))}
          </div>
          <button onClick={() => setSlide(s => s + 1)}
            className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shadow-lg">
            <ChevronRight className="text-white" size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
