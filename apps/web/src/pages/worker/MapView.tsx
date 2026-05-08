import { BottomNav } from '@/components/layout/BottomNav'
export default function WorkerMapView() {
  return (
    <div className="page-with-nav px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Map</h1>
      <p className="text-ink-secondary text-sm">Coming in Session 8 — live jobs map.</p>
      <BottomNav variant="worker" />
    </div>
  )
}
