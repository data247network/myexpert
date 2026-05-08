import { BottomNav } from '@/components/layout/BottomNav'
export default function WorkerEarnings() {
  return (
    <div className="page-with-nav px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Earnings</h1>
      <p className="text-ink-secondary text-sm">Coming in Session 9 — earnings & withdrawals.</p>
      <BottomNav variant="worker" />
    </div>
  )
}
