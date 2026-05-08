import { useEffect, useState, useRef } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import { MapPin, Navigation, ChevronRight, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Nigeria default center ──────────────────────────────────────────────────
const NIGERIA_CENTER: [number, number] = [9.082, 8.6753]
const NIGERIA_ZOOM = 6

// ── Types ───────────────────────────────────────────────────────────────────
interface MapJob {
  id:              string
  title:           string
  status:          string
  urgency:         'normal' | 'urgent'
  customer_quote:  number | null
  location_address: string | null
  location_lat:    number | null
  location_lng:    number | null
  created_at:      string
  category_name:   string | null
}

// ── Haversine distance (km) ─────────────────────────────────────────────────
function distKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

// ── Custom pin icons ────────────────────────────────────────────────────────
const jobIcon = (urgent: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${urgent ? '#ea580c' : '#7c3aed'};
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 28],
    popupAnchor:[0, -28],
  })

const meIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:#22c55e;
      width:16px;height:16px;border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 0 4px rgba(34,197,94,0.3);
    "></div>`,
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  })

// ── Main component ───────────────────────────────────────────────────────────

export default function WorkerMapView() {
  const { profile, user } = useAuth()
  const mapRef    = useRef<L.Map | null>(null)
  const mapDivRef = useRef<HTMLDivElement | null>(null)

  const [jobs,      setJobs]     = useState<MapJob[]>([])
  const [myPos,     setMyPos]    = useState<[number, number] | null>(null)
  const [locating,  setLocating] = useState(false)
  const [skill,     setSkill]    = useState<string>('')

  // Fetch primary skill
  useEffect(() => {
    if (!user) return
    supabase
      .from('worker_profiles')
      .select('primary_skill')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setSkill(data.primary_skill) })
  }, [user])

  // Fetch open jobs with coordinates
  useEffect(() => {
    if (!user) return
    let q = supabase
      .from('jobs')
      .select('id, title, status, urgency, customer_quote, location_address, location_lat, location_lng, created_at, categories(name)')
      .in('status', ['open', 'bidding'])
      .not('location_lat', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    q.then(({ data }) => {
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rows: MapJob[] = (data as any[]).map(j => ({
          ...j,
          category_name: j.categories?.name ?? null,
        }))
        if (skill) rows = rows.filter(j => j.category_name === skill)
        setJobs(rows)
      }
    })
  }, [user, skill])

  // Initialise Leaflet map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return

    const map = L.map(mapDivRef.current, {
      center:  NIGERIA_CENTER,
      zoom:    NIGERIA_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add job pins whenever jobs change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker && !(layer as unknown as { _isMe?: boolean })._isMe) {
        map.removeLayer(layer)
      }
    })

    jobs.forEach(job => {
      if (!job.location_lat || !job.location_lng) return
      const marker = L.marker([job.location_lat, job.location_lng], {
        icon: jobIcon(job.urgency === 'urgent'),
      })
      marker.addTo(map)
      marker.bindPopup(`
        <div style="min-width:160px;font-family:system-ui">
          <p style="font-weight:700;font-size:13px;margin:0 0 4px">${job.title}</p>
          ${job.urgency === 'urgent' ? '<span style="color:#ea580c;font-size:11px;font-weight:700">⚡ URGENT</span>' : ''}
          ${job.customer_quote ? `<p style="color:#7c3aed;font-weight:700;font-size:14px;margin:4px 0">₦${job.customer_quote.toLocaleString()}</p>` : ''}
          <a href="/worker/jobs/${job.id}"
            style="display:block;margin-top:6px;background:#7c3aed;color:white;
                   text-align:center;padding:6px;border-radius:8px;font-size:12px;
                   font-weight:600;text-decoration:none;">
            View &amp; Bid →
          </a>
        </div>
      `, { maxWidth: 200 })
    })
  }, [jobs])

  // Update my-position marker when myPos changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !myPos) return

    // Remove old me-markers
    map.eachLayer(layer => {
      if ((layer as unknown as { _isMe?: boolean })._isMe) {
        map.removeLayer(layer)
      }
    })

    const me = L.marker(myPos, { icon: meIcon() }) as unknown as L.Marker & { _isMe: boolean }
    me._isMe = true
    me.addTo(map)
    me.bindPopup('<p style="font-size:12px;margin:0">📍 You are here</p>')
    map.setView(myPos, 13, { animate: true })
  }, [myPos])

  const locateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMyPos([lat, lng])

        // Update worker's last known location in DB
        if (user) {
          await supabase
            .from('worker_profiles')
            .update({ current_lat: lat, current_lng: lng, last_location_update: new Date().toISOString() })
            .eq('id', user.id)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  // Jobs sorted by distance (closest first) if we have myPos
  const sortedJobs = [...jobs].sort((a, b) => {
    if (!myPos || !a.location_lat || !b.location_lat) return 0
    return (
      distKm(myPos[0], myPos[1], a.location_lat, a.location_lng!) -
      distKm(myPos[0], myPos[1], b.location_lat, b.location_lng!)
    )
  })

  const jobsOnMap   = jobs.filter(j => j.location_lat && j.location_lng)
  const jobsNoCoord = jobs.filter(j => !j.location_lat || !j.location_lng)

  return (
    <div className="page-with-nav">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Job Map</h1>
          {profile?.state_lga && (
            <p className="text-xs text-ink-tertiary mt-0.5 flex items-center gap-1">
              <MapPin size={11} /> {profile.state_lga}
              {skill && <> · {skill}</>}
            </p>
          )}
        </div>
        <button
          onClick={locateMe}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-xl border border-brand-200 disabled:opacity-60">
          {locating
            ? <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            : <Navigation size={13} />}
          {locating ? 'Locating…' : 'Find me'}
        </button>
      </div>

      {/* Map */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-surface-tertiary shadow-card"
        style={{ height: 340 }}>
        {jobs.length === 0 && jobsOnMap.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 bg-surface-secondary">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
              <MapPin size={26} className="text-brand-400" />
            </div>
            <p className="font-semibold text-ink">No mapped jobs yet</p>
            <p className="text-sm text-ink-secondary">
              Jobs with GPS coordinates will appear as pins here.
            </p>
          </div>
        ) : (
          <div ref={mapDivRef} className="w-full h-full" />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="w-3 h-3 rounded-full bg-brand-600 inline-block" /> Normal job
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Urgent job
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> You
        </span>
      </div>

      {/* Nearby jobs list */}
      <div className="px-4 mt-4">
        <p className="section-label mb-3">
          {sortedJobs.length > 0 ? `NEARBY JOBS (${sortedJobs.length})` : 'NEARBY JOBS'}
        </p>

        {sortedJobs.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-ink-tertiary text-sm">
              No open jobs right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedJobs.map(job => {
              const dist = myPos && job.location_lat
                ? distKm(myPos[0], myPos[1], job.location_lat, job.location_lng!)
                : null

              return (
                <Link key={job.id} to={`/worker/jobs/${job.id}`}
                  className="card flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    job.urgency === 'urgent' ? 'bg-orange-100' : 'bg-brand-100'
                  }`}>
                    {job.urgency === 'urgent'
                      ? <Zap size={18} className="text-orange-500" />
                      : <MapPin size={18} className="text-brand-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">{job.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {job.customer_quote && (
                        <span className="text-xs font-bold text-brand-600">
                          ₦{job.customer_quote.toLocaleString()}
                        </span>
                      )}
                      {dist !== null && (
                        <span className="text-xs text-ink-tertiary flex items-center gap-0.5">
                          <Navigation size={9} /> {formatDist(dist)}
                        </span>
                      )}
                      {job.location_address && !dist && (
                        <span className="text-xs text-ink-tertiary truncate">
                          {job.location_address.split(',').slice(-2).join(',').trim()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-tertiary shrink-0" />
                </Link>
              )
            })}

            {/* Jobs without GPS coords */}
            {jobsNoCoord.length > 0 && (
              <p className="text-xs text-ink-tertiary text-center mt-1">
                +{jobsNoCoord.length} job{jobsNoCoord.length !== 1 ? 's' : ''} without GPS — visible in{' '}
                <Link to="/worker/jobs" className="text-brand-600 font-medium">Jobs tab</Link>
              </p>
            )}
          </div>
        )}
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
