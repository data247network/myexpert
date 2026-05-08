import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import ChatRoom, { type ChatJobMeta } from '@/components/chat/ChatRoom'
import { AlertCircle } from 'lucide-react'

export default function WorkerChatRoom() {
  const { jobId }  = useParams<{ jobId: string }>()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [job,     setJob]     = useState<ChatJobMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!jobId || !user) return

    supabase
      .from('jobs')
      .select(`
        id, title, status, customer_id, worker_id,
        profiles!jobs_customer_id_fkey ( full_name )
      `)
      .eq('id', jobId)
      .eq('worker_id', user.id)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => {
        if (data) {
          setJob({
            id:          data.id,
            title:       data.title,
            status:      data.status,
            customer_id: data.customer_id,
            worker_id:   data.worker_id,
            other_name:  data.profiles?.full_name ?? 'Customer',
          })
        }
        setLoading(false)
      })
  }, [jobId, user])

  if (loading) return (
    <div className="flex items-center justify-center h-dvh">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="flex flex-col items-center justify-center h-dvh gap-3">
      <AlertCircle size={32} className="text-ink-tertiary" />
      <p className="text-ink-secondary">Chat not available for this job.</p>
      <button onClick={() => navigate(-1)} className="text-brand-600 text-sm font-medium">Go back</button>
    </div>
  )

  return <ChatRoom job={job} />
}
