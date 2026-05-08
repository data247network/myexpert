import { BottomNav } from '@/components/layout/BottomNav'
// Full browse + map — built in Session 4
export default function CustomerBrowse() {
  return (
    <div className="page-with-nav px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Browse Workers</h1>
      <p className="text-ink-secondary text-sm">Coming in Session 4 — browse list, map view & filters.</p>
      <BottomNav variant="customer" />
    </div>
  )
}
