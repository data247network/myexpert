import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Shield, MapPin, CreditCard, CheckCircle } from 'lucide-react'

/** Artistic illustration of 3 verified Nigerian skilled workers */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 375 208" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full rounded-3xl" aria-hidden="true">
      <defs>
        <linearGradient id="heroBg" x1="0" y1="0" x2="375" y2="208" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5f3ff"/>
          <stop offset="1" stopColor="#ddd6fe"/>
        </linearGradient>
        <filter id="cardShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#7c3aed" floodOpacity="0.13"/>
        </filter>
        <filter id="featuredShadow" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#7c3aed" floodOpacity="0.22"/>
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect width="375" height="208" rx="24" fill="url(#heroBg)"/>
      <circle cx="330" cy="28"  r="52" fill="#8b5cf6" fillOpacity="0.07"/>
      <circle cx="42"  cy="175" r="44" fill="#6d28d9" fillOpacity="0.07"/>
      <circle cx="188" cy="8"   r="28" fill="#a78bfa" fillOpacity="0.10"/>

      {/* ═══════════════════════════════════════════
          CARD 1 — PLUMBER (blue)
      ═══════════════════════════════════════════ */}
      <rect x="12" y="18" width="98" height="178" rx="18" fill="white" filter="url(#cardShadow)"/>
      {/* Blue top bar */}
      <path d="M12 18 h98 a18 18 0 0 1 0 0 v10 h-98 v-10 a18 18 0 0 1 0 0Z" fill="#2563eb"/>
      <rect x="12" y="18" width="98" height="6" rx="3" fill="#2563eb"/>

      {/* Head */}
      <circle cx="61" cy="66" r="15" fill="#c8864a"/>
      {/* Hard hat */}
      <ellipse cx="61" cy="54" rx="13" ry="5"   fill="#fbbf24"/>
      <rect    x="48" y="52"  width="26" height="5" rx="2" fill="#f59e0b"/>
      <rect    x="45" y="55"  width="32" height="4" rx="2" fill="#fbbf24"/>
      {/* Face */}
      <circle cx="56" cy="68" r="1.5" fill="#7a4f2a"/>
      <circle cx="66" cy="68" r="1.5" fill="#7a4f2a"/>
      <path d="M57 73 Q61 76 65 73" stroke="#7a4f2a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Neck */}
      <rect x="56" y="80" width="10" height="8" rx="4" fill="#c8864a"/>
      {/* Overalls body */}
      <rect x="44" y="86" width="34" height="36" rx="8" fill="#1d4ed8"/>
      {/* Bib */}
      <rect x="52" y="86" width="18" height="14" rx="4" fill="#3b82f6"/>
      {/* Belt */}
      <rect x="44" y="114" width="34" height="5" rx="2.5" fill="#92400e"/>
      {/* Left arm → pipe */}
      <rect x="28" y="90" width="18" height="9" rx="4.5" fill="#c8864a"/>
      <rect x="14" y="92" width="20" height="6" rx="3"   fill="#94a3b8"/>
      <rect x="14" y="90" width="6"  height="10" rx="3"  fill="#64748b"/>
      {/* Right arm → wrench */}
      <rect x="80" y="90" width="18" height="9" rx="4.5" fill="#c8864a"/>
      <rect x="95" y="89" width="14" height="5" rx="2.5" fill="#64748b"/>
      <circle cx="97" cy="91" r="4" fill="none" stroke="#4b5563" strokeWidth="2.5"/>
      {/* Legs */}
      <rect x="44" y="120" width="13" height="32" rx="5" fill="#1e3a8a"/>
      <rect x="63" y="120" width="13" height="32" rx="5" fill="#1e3a8a"/>
      {/* Boots */}
      <rect x="41" y="148" width="17" height="11" rx="5" fill="#1c1917"/>
      <rect x="60" y="148" width="17" height="11" rx="5" fill="#1c1917"/>
      {/* Verified chip */}
      <rect x="22" y="166" width="76" height="18" rx="9" fill="#eff6ff"/>
      <circle cx="34" cy="175" r="7" fill="#2563eb"/>
      <text x="34"  y="179" textAnchor="middle" fontSize="8"  fill="white"   fontWeight="bold"  fontFamily="Inter,sans-serif">✓</text>
      <text x="72"  y="179" textAnchor="middle" fontSize="9"  fill="#2563eb" fontWeight="600"   fontFamily="Inter,sans-serif">Verified</text>
      {/* Label */}
      <text x="61"  y="200" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight="700"   fontFamily="Inter,sans-serif">Plumber</text>

      {/* ═══════════════════════════════════════════
          CARD 2 — TAILOR (purple, featured / taller)
      ═══════════════════════════════════════════ */}
      <rect x="136" y="8" width="103" height="192" rx="20" fill="white" filter="url(#featuredShadow)"/>
      {/* Purple top bar */}
      <rect x="136" y="8"  width="103" height="8" rx="4" fill="#7c3aed"/>
      {/* TOP RATED chip */}
      <rect x="152" y="20" width="70" height="16" rx="8" fill="#7c3aed"/>
      <text x="187"  y="32" textAnchor="middle" fontSize="8" fill="white" fontWeight="700" fontFamily="Inter,sans-serif">⭐ TOP RATED</text>

      {/* Head */}
      <circle cx="187" cy="74" r="16" fill="#b5762a"/>
      {/* Gele (headwrap) */}
      <path d="M171 70 Q187 52 203 70 L203 74 Q187 58 171 74 Z" fill="#7c3aed"/>
      <ellipse cx="187" cy="70" rx="16" ry="5.5" fill="#6d28d9"/>
      {/* Face */}
      <circle cx="181" cy="76" r="1.8" fill="#7a4d10"/>
      <circle cx="193" cy="76" r="1.8" fill="#7a4d10"/>
      <path d="M182 82 Q187 86 192 82" stroke="#7a4d10" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Gold earrings */}
      <circle cx="171" cy="77" r="3" fill="#fbbf24"/>
      <circle cx="203" cy="77" r="3" fill="#fbbf24"/>
      {/* Ankara dress */}
      <path d="M173 92 L201 92 L207 132 L167 132 Z" fill="#7c3aed"/>
      {/* Ankara dot pattern */}
      <circle cx="179" cy="103" r="3.5" fill="#a78bfa"/>
      <circle cx="187" cy="109" r="3.5" fill="#ddd6fe"/>
      <circle cx="195" cy="103" r="3.5" fill="#a78bfa"/>
      <circle cx="179" cy="117" r="3.5" fill="#ddd6fe"/>
      <circle cx="195" cy="117" r="3.5" fill="#ddd6fe"/>
      {/* Arms → sewing machine */}
      <rect x="153" y="96" width="20" height="9" rx="4.5" fill="#b5762a"/>
      <rect x="201" y="96" width="20" height="9" rx="4.5" fill="#b5762a"/>
      {/* Sewing machine */}
      <rect x="152" y="120" width="70" height="26" rx="8" fill="#e2e8f0"/>
      <rect x="162" y="113" width="50" height="18" rx="6" fill="#cbd5e1"/>
      <circle cx="205" cy="126" r="9"  fill="#94a3b8"/>
      <circle cx="205" cy="126" r="4"  fill="#e2e8f0"/>
      <rect   cx="168" cy="123" width="24" height="6" rx="3" fill="#a8b8c8"/>
      {/* Thread spool */}
      <rect x="167" y="122" width="22" height="5" rx="2.5" fill="#9ca3af"/>
      {/* Fabric thread line */}
      <path d="M183 120 Q180 112 183 106" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2,2" fill="none"/>
      {/* Legs */}
      <rect x="175" y="132" width="11" height="22" rx="4" fill="#6d28d9"/>
      <rect x="191" y="132" width="11" height="22" rx="4" fill="#6d28d9"/>
      {/* Verified chip */}
      <rect x="144" y="162" width="86" height="18" rx="9" fill="#f5f3ff"/>
      <circle cx="158" cy="171" r="7" fill="#7c3aed"/>
      <text x="158"  y="175" textAnchor="middle" fontSize="8"  fill="white"   fontWeight="bold"  fontFamily="Inter,sans-serif">✓</text>
      <text x="198"  y="175" textAnchor="middle" fontSize="9"  fill="#7c3aed" fontWeight="600"   fontFamily="Inter,sans-serif">NIN Verified</text>
      {/* Label + rating */}
      <text x="187"  y="196" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="800"   fontFamily="Inter,sans-serif">Tailor · 4.9 ★</text>

      {/* ═══════════════════════════════════════════
          CARD 3 — MECHANIC (orange-red)
      ═══════════════════════════════════════════ */}
      <rect x="265" y="18" width="98" height="178" rx="18" fill="white" filter="url(#cardShadow)"/>
      {/* Red top bar */}
      <rect x="265" y="18" width="98" height="6" rx="3" fill="#dc2626"/>

      {/* Head */}
      <circle cx="314" cy="66" r="15" fill="#8d4b1d"/>
      {/* Safety helmet */}
      <ellipse cx="314" cy="54" rx="14" ry="5.5" fill="#dc2626"/>
      <rect    x="300" y="52"  width="28" height="5"  rx="2"   fill="#b91c1c"/>
      <rect    x="298" y="56"  width="32" height="4"  rx="2"   fill="#dc2626"/>
      {/* Brim */}
      <rect    x="296" y="59"  width="36" height="4"  rx="2"   fill="#991b1b"/>
      {/* Face */}
      <circle cx="309" cy="68" r="1.5" fill="#4a2008"/>
      <circle cx="319" cy="68" r="1.5" fill="#4a2008"/>
      <path d="M310 73 Q314 76 318 73" stroke="#4a2008" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Neck */}
      <rect x="309" y="80" width="10" height="8" rx="4" fill="#8d4b1d"/>
      {/* Gray overalls */}
      <rect x="300" y="86" width="28" height="36" rx="8" fill="#374151"/>
      {/* Orange safety vest */}
      <path d="M300 86 L314 94 L328 86 L328 106 L321 106 L314 98 L307 106 L300 106 Z" fill="#f97316" fillOpacity="0.75"/>
      {/* Left arm → holding big spanner */}
      <rect x="280" y="90" width="22" height="9" rx="4.5" fill="#8d4b1d"/>
      <rect x="264" y="92" width="22" height="6" rx="3"   fill="#4b5563"/>
      <circle cx="268" cy="95" r="5"  fill="none" stroke="#374151" strokeWidth="2.5"/>
      {/* Right arm → pointing/checking */}
      <rect x="326" y="90" width="22" height="9" rx="4.5" fill="#8d4b1d"/>
      {/* Grease rag */}
      <path d="M345 90 Q354 87 352 100 Q343 105 345 95Z" fill="#6b7280" fillOpacity="0.5"/>
      {/* Legs */}
      <rect x="300" y="120" width="13" height="32" rx="5" fill="#1f2937"/>
      <rect x="315" y="120" width="13" height="32" rx="5" fill="#1f2937"/>
      {/* Boots */}
      <rect x="297" y="148" width="17" height="11" rx="5" fill="#1c1917"/>
      <rect x="316" y="148" width="17" height="11" rx="5" fill="#1c1917"/>
      {/* Verified chip */}
      <rect x="275" y="166" width="78" height="18" rx="9" fill="#fff7ed"/>
      <circle cx="287" cy="175" r="7" fill="#dc2626"/>
      <text x="287"  y="179" textAnchor="middle" fontSize="8"  fill="white"   fontWeight="bold"  fontFamily="Inter,sans-serif">✓</text>
      <text x="326"  y="179" textAnchor="middle" fontSize="9"  fill="#dc2626" fontWeight="600"   fontFamily="Inter,sans-serif">Verified</text>
      {/* Label */}
      <text x="314"  y="200" textAnchor="middle" fontSize="12" fill="#b91c1c" fontWeight="700"   fontFamily="Inter,sans-serif">Mechanic</text>
    </svg>
  )
}

const slides = [
  {
    // Screen A — Illustrated
    id: 'A',
    bg: 'bg-white',
    content: (
      <div className="flex flex-col flex-1 px-6 pt-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Hero illustration */}
          <div className="w-full h-52 mb-8">
            <HeroIllustration />
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
