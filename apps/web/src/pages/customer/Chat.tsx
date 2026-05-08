import { BottomNav } from '@/components/layout/BottomNav'
export default function CustomerChat() {
  return (
    <div className="page-with-nav px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Chat</h1>
      <p className="text-ink-secondary text-sm">Coming in Session 7 — real-time messaging.</p>
      <BottomNav variant="customer" />
    </div>
  )
}
