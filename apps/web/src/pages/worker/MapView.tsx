import { BottomNav } from '@/components/layout/BottomNav'
import { MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function WorkerMapView() {
  const { profile } = useAuth()

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Job Map</h1>
        {profile?.state_lga && (
          <p className="text-sm text-ink-secondary mt-0.5 flex items-center gap-1">
            <MapPin size={13} /> {profile.state_lga}
          </p>
        )}
      </div>

      {/* Map placeholder — Google Maps integration in Session 5 */}
      <div className="mx-4 rounded-2xl overflow-hidden bg-surface-secondary border border-surface-tertiary"
        style={{ height: 320 }}>
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
            <MapPin size={26} className="text-brand-500" />
          </div>
          <p className="font-semibold text-ink">Live job map</p>
          <p className="text-sm text-ink-secondary">
            See open jobs near you on a real-time map.
          </p>
          <p className="text-xs text-ink-tertiary">
            Full Google Maps integration arrives in the next update.
          </p>
        </div>
      </div>

      {/* Nearby jobs list placeholder */}
      <div className="mx-4 mt-4">
        <p className="section-label mb-3">NEARBY JOBS</p>
        <div className="card text-center py-6">
          <p className="text-ink-tertiary text-sm">No open jobs nearby right now.</p>
        </div>
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
