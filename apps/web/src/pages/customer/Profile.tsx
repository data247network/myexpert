import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { MapPin, Phone, Mail, ChevronRight, LogOut, Shield } from 'lucide-react'

export default function CustomerProfile() {
  const { profile, signOut } = useAuth()

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?'

  const rows = [
    { icon: Mail,   label: 'Email',    value: profile?.email     ?? '—' },
    { icon: Phone,  label: 'Phone',    value: profile?.phone     ?? '—' },
    { icon: MapPin, label: 'State',    value: profile?.state_lga ?? '—' },
  ]

  return (
    <div className="page-with-nav">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-3xl font-extrabold text-brand-600">{initial}</span>
        </div>
        <h1 className="text-xl font-bold text-ink">{profile?.full_name}</h1>
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
        <button className="card flex items-center gap-3 text-left w-full">
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

      <BottomNav variant="customer" />
    </div>
  )
}
