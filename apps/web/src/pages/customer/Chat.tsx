import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Types ────────────────────────────────────────────────────────────────────

interface Thread {
  jobId:        string
  jobTitle:     string
  jobStatus:    string
  workerName:   string
  lastMessage:  string | null
  lastAt:       string | null
  unreadCount:  number
}

// ── Status colour helper ─────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  booked:      'bg-brand-50 text-brand-700',
  accepted:    'bg-brand-50 text-brand-700',
  en_route:    'bg-orange-50 text-orange-700',
  in_progress: 'bg-orange-50 text-orange-700',
  done:        'bg-green-50 text-green-700',
  confirmed:   'bg-green-50 text-green-700',
  disputed:    'bg-red-50 text-red-700',
}

function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CustomerChat() {
  const { user }  = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchThreads = async () => {
      // Get all jobs that have a worker assigned (booked or beyond)
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id, title, status, worker_id,
          worker_profiles (
            profiles ( full_name )
          )
        `)
        .eq('customer_id', user.id)
        .not('worker_id', 'is', null)
        .order('updated_at', { ascending: false })

      if (!jobs || jobs.length === 0) { setLoading(false); return }

      // For each job, get the last message + unread count
      const enriched = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jobs.map(async (j: any) => {
          const [{ data: last }, { count }] = await Promise.all([
            supabase
              .from('messages')
              .select('content, created_at')
              .eq('job_id', j.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('job_id', j.id)
              .eq('is_read', false)
              .neq('sender_id', user.id),
          ])

          return {
            jobId:       j.id,
            jobTitle:    j.title,
            jobStatus:   j.status,
            workerName:  j.worker_profiles?.profiles?.full_name ?? 'Worker',
            lastMessage: last?.content ?? null,
            lastAt:      last?.created_at ?? null,
            unreadCount: count ?? 0,
          } as Thread
        })
      )

      setThreads(enriched)
      setLoading(false)
    }

    fetchThreads()
  }, [user])

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Messages</h1>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center px-8 pt-16 gap-4 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
            <MessageCircle size={28} className="text-brand-400" />
          </div>
          <h2 className="font-bold text-ink text-lg">No messages yet</h2>
          <p className="text-ink-secondary text-sm">
            Once a worker is booked for your job, you can chat with them here.
          </p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-0.5">
          {threads.map(t => (
            <Link
              key={t.jobId}
              to={`/chat/${t.jobId}`}
              className="flex items-center gap-3 bg-surface rounded-2xl p-4 hover:bg-surface-secondary transition-colors">

              {/* Avatar initial */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-brand-700 text-lg">
                    {t.workerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                {t.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {t.unreadCount > 9 ? '9+' : t.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-semibold text-sm truncate ${t.unreadCount > 0 ? 'text-ink' : 'text-ink-secondary'}`}>
                    {t.workerName}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[t.jobStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                      {t.jobStatus.replace('_', ' ')}
                    </span>
                    {t.lastAt && (
                      <span className="text-[10px] text-ink-tertiary">{formatRelative(t.lastAt)}</span>
                    )}
                  </div>
                </div>
                <p className={`text-xs truncate mt-0.5 ${t.unreadCount > 0 ? 'text-ink font-medium' : 'text-ink-tertiary'}`}>
                  {t.lastMessage ?? t.jobTitle}
                </p>
              </div>

              <ChevronRight size={15} className="text-ink-tertiary shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <BottomNav variant="customer" />
    </div>
  )
}
