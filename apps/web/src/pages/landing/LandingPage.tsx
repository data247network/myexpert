import { Link } from 'react-router-dom'
import { CheckCircle, MapPin, Shield, Star } from 'lucide-react'
import { CATEGORIES } from '@myexpert/shared'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-xl text-brand-600">MyExpert</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-secondary hover:text-ink">Sign in</Link>
            <Link to="/onboarding" className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl">
              Get the app
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Now in Lagos · Abuja next
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-ink leading-tight mb-4">
          Skilled hands you can <br className="hidden md:block" />
          <span className="text-brand-600">actually trust.</span>
        </h1>
        <p className="text-lg text-ink-secondary max-w-xl mb-8">
          Plumbers, tailors, mechanics, AC techs and more — every worker is NIN-verified.
          You pay in escrow; they get paid only when you say it's done.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link to="/onboarding" className="px-6 py-3.5 bg-brand-600 text-white font-semibold rounded-2xl hover:bg-brand-700 transition-colors">
            Find a worker
          </Link>
          <Link to="/signup/worker" className="px-6 py-3.5 border-2 border-brand-200 text-brand-600 font-semibold rounded-2xl hover:border-brand-400 transition-colors">
            Earn with your skill →
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-10">
          {[['1,420+','verified workers'],['4.8★','avg rating'],['10k+','jobs done']].map(([val, label]) => (
            <div key={label}>
              <div className="font-bold text-xl text-ink">{val}</div>
              <div className="text-sm text-ink-secondary">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="section-label mb-3">HOW IT WORKS</p>
          <h2 className="text-2xl font-bold text-ink mb-8">
            From "I need help" to "Done" in 4 steps
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['1.', 'Post or pick', 'Describe your job, or browse verified pros near you.'],
              ['2.', 'Compare & book', 'See ratings, NIN-verified badges, fixed quotes or live bids.'],
              ['3.', 'Pay to escrow', 'Money is held safely by MyExpert until the work is done.'],
              ['4.', 'Confirm & rate', 'Mark the job done — we release payment to the worker.'],
            ].map(([num, title, desc]) => (
              <div key={title} className="card">
                <div className="text-2xl font-black text-brand-200 mb-2">{num}</div>
                <div className="font-semibold text-ink mb-1">{title}</div>
                <div className="text-sm text-ink-secondary">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="section-label mb-3">WHY WE'RE DIFFERENT</p>
          <h2 className="text-2xl font-bold text-ink mb-8">Real verification. Real escrow.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              [Shield,      'NIN-verified',       "Every pro's ID is matched with NIMC. No fake names."],
              [MapPin,      'Address checked',    'Workers prove where they live so you book locally.'],
              [CheckCircle, 'Real references',    'We call 3 past clients before approving any worker.'],
              [Star,        'Skill certified',    'NABTEB / trade school certs verified where applicable.'],
              [CheckCircle, 'Escrow payments',    'You pay us — we pay them only when you confirm done.'],
              [Shield,      'Real disputes team', 'A human reviews every dispute within 24 hours.'],
            ].map(([Icon, title, desc]) => (
              <div key={title as string} className="card flex gap-3">
                <div className="shrink-0 w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-ink mb-0.5">{title as string}</div>
                  <div className="text-xs text-ink-secondary">{desc as string}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-ink mb-2">
            Anyone you'd hire — verified.
          </h2>
          <div className="flex flex-wrap gap-2 mt-6">
            {CATEGORIES.map(c => (
              <Link key={c.name} to="/onboarding"
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-ink hover:border-brand-400 transition-colors">
                {c.icon} {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4 text-sm text-ink-secondary">
          <span className="font-bold text-brand-600">MyExpert</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink">How it works</a>
            <a href="#" className="hover:text-ink">For workers</a>
            <a href="#" className="hover:text-ink">Trust & safety</a>
            <a href="#" className="hover:text-ink">Help</a>
          </div>
          <span>© 2026 MyExpert · Nigeria</span>
        </div>
      </footer>
    </div>
  )
}
