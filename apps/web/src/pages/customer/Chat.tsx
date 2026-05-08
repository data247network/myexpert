import { BottomNav } from '@/components/layout/BottomNav'
import { MessageCircle } from 'lucide-react'

export default function CustomerChat() {
  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Messages</h1>
      </div>

      <div className="flex flex-col items-center px-8 pt-16 gap-4 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
          <MessageCircle size={28} className="text-brand-400" />
        </div>
        <h2 className="font-bold text-ink text-lg">No messages yet</h2>
        <p className="text-ink-secondary text-sm">
          Once you book a job, you can chat with your pro right here.
        </p>
        <p className="text-xs text-ink-tertiary mt-1">
          Real-time chat arrives in the next update.
        </p>
      </div>

      <BottomNav variant="customer" />
    </div>
  )
}
